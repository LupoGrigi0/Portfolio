/**
 * Video Processor Service
 * Handles video metadata extraction and thumbnail generation using ffmpeg/ffprobe
 *
 * Requirements:
 * - ffmpeg must be installed and available in PATH
 * - Gracefully degrades if ffmpeg not available
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import type { Logger } from '../utils/logger-wrapper.js';

const execAsync = promisify(exec);

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number; // in seconds
  aspectRatio: number;
  format: string;
  codec: string;
  bitrate?: number;
  fps?: number;
}

export class VideoProcessor {
  private logger: Logger;
  private ffmpegAvailable: boolean | null = null;
  private ffprobeAvailable: boolean | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Check if ffmpeg is available on the system
   */
  async checkFfmpegAvailable(): Promise<boolean> {
    if (this.ffmpegAvailable !== null) {
      return this.ffmpegAvailable;
    }

    try {
      await execAsync('ffmpeg -version');
      this.ffmpegAvailable = true;
      await this.logger.info('ffmpeg is available');
      return true;
    } catch (error) {
      this.ffmpegAvailable = false;
      await this.logger.warn('ffmpeg is not available - video thumbnail generation will be skipped', { error });
      return false;
    }
  }

  /**
   * Check if ffprobe is available on the system
   */
  async checkFfprobeAvailable(): Promise<boolean> {
    if (this.ffprobeAvailable !== null) {
      return this.ffprobeAvailable;
    }

    try {
      await execAsync('ffprobe -version');
      this.ffprobeAvailable = true;
      await this.logger.info('ffprobe is available');
      return true;
    } catch (error) {
      this.ffprobeAvailable = false;
      await this.logger.warn('ffprobe is not available - video metadata extraction will be limited', { error });
      return false;
    }
  }

  /**
   * Extract video metadata using ffprobe
   * Falls back to minimal metadata if ffprobe not available
   */
  async extractMetadata(videoPath: string): Promise<VideoMetadata> {
    const ffprobeAvailable = await this.checkFfprobeAvailable();

    if (!ffprobeAvailable) {
      // Fallback: return default metadata
      await this.logger.debug('Using fallback metadata for video', { videoPath });
      return {
        width: 1920,
        height: 1080,
        duration: 0,
        aspectRatio: 16 / 9,
        format: 'mp4',
        codec: 'unknown'
      };
    }

    try {
      // Use ffprobe to extract metadata
      const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,codec_name,bit_rate,r_frame_rate -of json "${videoPath}"`;

      const { stdout } = await execAsync(command);
      const data = JSON.parse(stdout);

      if (!data.streams || data.streams.length === 0) {
        throw new Error('No video stream found');
      }

      const stream = data.streams[0];
      const width = parseInt(stream.width) || 1920;
      const height = parseInt(stream.height) || 1080;
      const duration = parseFloat(stream.duration) || 0;
      const codec = stream.codec_name || 'unknown';
      const bitrate = parseInt(stream.bit_rate) || undefined;

      // Parse frame rate (e.g., "30/1" or "30000/1001")
      let fps: number | undefined;
      if (stream.r_frame_rate) {
        const [num, den] = stream.r_frame_rate.split('/').map(Number);
        if (den && den !== 0) {
          fps = num / den;
        }
      }

      return {
        width,
        height,
        duration,
        aspectRatio: width / height,
        format: 'mp4',
        codec,
        bitrate,
        fps
      };

    } catch (error) {
      await this.logger.error('Failed to extract video metadata with ffprobe', { videoPath, error });

      // Return fallback metadata
      return {
        width: 1920,
        height: 1080,
        duration: 0,
        aspectRatio: 16 / 9,
        format: 'mp4',
        codec: 'unknown'
      };
    }
  }

  /**
   * Generate thumbnail from video (first frame)
   * @param videoPath - Path to video file
   * @param outputPath - Path where thumbnail should be saved
   * @param timestamp - Timestamp to extract frame from (default: 0 = first frame)
   * @returns Path to generated thumbnail, or null if failed
   */
  async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timestamp: number = 0
  ): Promise<string | null> {
    const ffmpegAvailable = await this.checkFfmpegAvailable();

    if (!ffmpegAvailable) {
      await this.logger.debug('Skipping video thumbnail generation - ffmpeg not available', { videoPath });
      return null;
    }

    try {
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Check if thumbnail already exists
      try {
        await fs.access(outputPath);
        await this.logger.debug('Video thumbnail already exists', { outputPath });
        return outputPath;
      } catch {
        // Thumbnail doesn't exist, generate it
      }

      // Extract frame at specified timestamp
      // -ss: seek to timestamp
      // -i: input file
      // -vframes 1: extract 1 frame
      // -q:v 2: quality (2 is high quality for JPEG)
      const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`;

      await execAsync(command, { timeout: 30000 }); // 30 second timeout

      // Verify thumbnail was created
      await fs.access(outputPath);

      await this.logger.info('Video thumbnail generated', { videoPath, outputPath, timestamp });
      return outputPath;

    } catch (error) {
      await this.logger.error('Failed to generate video thumbnail', { videoPath, error });
      return null;
    }
  }

  /**
   * Generate multiple thumbnail sizes for a video
   * Similar to image thumbnail generation
   */
  async generateThumbnails(
    videoPath: string,
    thumbnailDir: string,
    sizes: number[] = [640, 1200, 1920],
    timestamp: number = 0
  ): Promise<Record<string, string>> {
    const thumbnails: Record<string, string> = {};

    for (const width of sizes) {
      const basename = path.basename(videoPath, path.extname(videoPath));
      const thumbPath = path.join(thumbnailDir, `${basename}_${width}w.jpg`);

      const result = await this.generateThumbnail(videoPath, thumbPath, timestamp);

      if (result) {
        thumbnails[`${width}w`] = result;
      }
    }

    return thumbnails;
  }

  /**
   * Get recommended thumbnail timestamp
   * For future use - can be configured per video or directory
   */
  getRecommendedTimestamp(duration: number, config?: any): number {
    // Check config for custom timestamp
    if (config?.video?.thumbnailTimestamp !== undefined) {
      return config.video.thumbnailTimestamp;
    }

    // Default: first frame
    // Future: could be 1 second, 10% into video, etc.
    return 0;
  }
}
