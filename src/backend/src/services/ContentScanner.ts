/**
 * Content Scanner Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-30
 *
 * Scans content directories, processes files, extracts metadata,
 * generates thumbnails, and manages database entries.
 */

import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createHash } from 'crypto';
import type { Logger } from '../utils/logger-wrapper.js';
import type { DatabaseManager } from './DatabaseManager.js';
import { VideoProcessor } from './VideoProcessor.js';

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
}

interface DirectoryConfig {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  status?: 'published' | 'draft' | 'archived';
  order?: number;
  isCarousel?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  metadata?: {
    theme?: string;
    style?: string;
    [key: string]: any;
  };
}

interface ScanResult {
  imagesProcessed: number;
  thumbnailsGenerated: number;
  directoriesCreated: number;
  configsApplied: number;
  orphansRemoved?: number;
  errors: string[];
}

type ScanMode = 'full' | 'incremental' | 'lightweight';

/**
 * System directories that should be excluded from collection scanning
 * These directories serve special purposes and should not appear in public collections
 */
const SYSTEM_DIRECTORIES = ['Branding', '.thumbnails', '.git', 'node_modules'];

export class ContentScanner {
  private logger: Logger;
  private db: DatabaseManager;
  private contentDir: string;
  private imageSizes: number[];
  private prioritySizes: number[];
  private supportedFormats: Set<string>;
  private processing = new Set<string>();
  private thumbnailWorkers = 5; // Parallel workers for thumbnail generation
  private videoProcessor: VideoProcessor;

  constructor(
    logger: Logger,
    db: DatabaseManager,
    contentDir: string,
    imageSizes: string = '640,750,828,1080,1200,1920,2048,3840',
    supportedFormats: string = 'jpg,jpeg,jfif,png,webp,avif,gif,tiff,bmp'
  ) {
    this.logger = logger;
    this.db = db;
    this.contentDir = contentDir;
    this.imageSizes = imageSizes.split(',').map(Number);
    // Priority sizes: large (1920w), medium (1200w), thumbnail (640w)
    this.prioritySizes = [1920, 1200, 640];
    this.supportedFormats = new Set(supportedFormats.split(',').map(f => f.toLowerCase()));
    this.videoProcessor = new VideoProcessor(logger);
  }

  /**
   * Scan entire content directory and process all files
   */
  async scanAll(): Promise<ScanResult> {
    const result: ScanResult = {
      imagesProcessed: 0,
      thumbnailsGenerated: 0,
      directoriesCreated: 0,
      configsApplied: 0,
      errors: []
    };

    try {
      await this.logger.info('Starting full content scan', { contentDir: this.contentDir });

      const entries = await fs.readdir(this.contentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Skip system directories
          if (SYSTEM_DIRECTORIES.includes(entry.name)) {
            await this.logger.debug('Skipping system directory', { name: entry.name });
            continue;
          }

          try {
            const dirResult = await this.scanDirectory(path.join(this.contentDir, entry.name));
            result.imagesProcessed += dirResult.imagesProcessed;
            result.thumbnailsGenerated += dirResult.thumbnailsGenerated;
            result.directoriesCreated += dirResult.directoriesCreated;
            result.configsApplied += dirResult.configsApplied;
            result.errors.push(...dirResult.errors);
          } catch (error) {
            const errMsg = `Failed to scan directory ${entry.name}: ${error}`;
            await this.logger.error(errMsg);
            result.errors.push(errMsg);
          }
        }
      }

      // Update directory image counts after scan completes
      await this.updateDirectoryImageCounts();

      await this.logger.info('Content scan complete', result);
      return result;

    } catch (error) {
      await this.logger.error('Fatal error during content scan', { error });
      throw error;
    }
  }

  /**
   * Scan a specific directory by slug
   * @param slug - Directory slug (e.g., "posted", "scientists")
   * @param mode - Scan mode: 'full' (purge & rebuild), 'incremental' (add/update/cleanup), 'lightweight' (filesystem-only)
   */
  async scanBySlug(slug: string, mode: ScanMode = 'incremental'): Promise<ScanResult> {
    const result: ScanResult = {
      imagesProcessed: 0,
      thumbnailsGenerated: 0,
      directoriesCreated: 0,
      configsApplied: 0,
      orphansRemoved: 0,
      errors: []
    };

    try {
      const dirPath = path.join(this.contentDir, slug);

      await this.logger.info('Starting directory scan', { slug, dirPath, mode });

      // Check if directory exists
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          const errMsg = `Path is not a directory: ${slug}`;
          await this.logger.error(errMsg);
          result.errors.push(errMsg);
          return result;
        }
      } catch (error) {
        const errMsg = `Directory not found: ${slug}`;
        await this.logger.error(errMsg, { error });
        result.errors.push(errMsg);
        return result;
      }

      // Get directory from database
      const directory = await this.db.getDirectoryBySlug(slug) as any;
      const directoryId = directory?.id;

      // Handle different scan modes
      if (mode === 'full') {
        // Full rescan: Recursively purge directory, subdirectories, and all images
        await this.logger.info('Full rescan mode: Recursively purging existing entries', { slug });
        const purged = await this.purgeDirectoryAndChildren(directoryId);
        result.orphansRemoved = purged;
      }

      // Scan the directory (works for all modes)
      const dirResult = await this.scanDirectory(dirPath);
      result.imagesProcessed = dirResult.imagesProcessed;
      result.thumbnailsGenerated = dirResult.thumbnailsGenerated;
      result.directoriesCreated = dirResult.directoriesCreated;
      result.configsApplied = dirResult.configsApplied;
      result.errors.push(...dirResult.errors);

      // Incremental mode: Clean up orphaned entries
      if (mode === 'incremental' && directoryId) {
        await this.logger.info('Incremental mode: Cleaning up orphaned entries', { slug });
        const orphans = await this.removeOrphanedImages(directoryId, dirPath);
        result.orphansRemoved = orphans;
      }

      // Update directory image counts
      await this.updateDirectoryImageCounts();

      // Auto-detect and set hero images
      await this.updateHeroImages();

      await this.logger.info('Directory scan complete', { slug, mode, result });
      return result;

    } catch (error) {
      const errMsg = `Fatal error during directory scan: ${error}`;
      await this.logger.error(errMsg, { error, slug });
      result.errors.push(errMsg);
      return result;
    }
  }

  /**
   * Purge all images for a directory (Full Rescan mode)
   */
  private async purgeDirectoryImages(directoryId: string): Promise<number> {
    if (!directoryId) return 0;

    try {
      const images = await this.db.getImagesByDirectory(directoryId);
      const count = images.length;

      // Delete all images for this directory
      for (const image of images as any[]) {
        await this.db.deleteImage(image.id);
      }

      await this.logger.info('Purged directory images', { directoryId, count });
      return count;
    } catch (error) {
      await this.logger.error('Failed to purge directory images', { directoryId, error });
      return 0;
    }
  }

  /**
   * Recursively purge a directory and all its children (Full Rescan mode)
   * Deletes images and subdirectories to prevent UNIQUE constraint errors
   */
  private async purgeDirectoryAndChildren(directoryId: string): Promise<number> {
    if (!directoryId) return 0;

    try {
      let totalPurged = 0;

      // Get all child directories first
      const children = await this.db.getSubdirectoriesByParentId(directoryId) as any[];

      // Recursively purge children first (depth-first)
      for (const child of children) {
        totalPurged += await this.purgeDirectoryAndChildren(child.id);
      }

      // Purge images in this directory
      const imageCount = await this.purgeDirectoryImages(directoryId);
      totalPurged += imageCount;

      // Delete the directory entry itself (but only for subdirectories)
      // We don't delete the top-level directory being scanned
      const directory = await this.db.getDirectoryById(directoryId) as any;
      if (directory && directory.parent_category) {
        await this.db.deleteDirectory(directoryId);
        await this.logger.info('Deleted subdirectory entry', {
          directoryId,
          slug: directory.slug
        });
      }

      return totalPurged;

    } catch (error) {
      await this.logger.error('Failed to purge directory and children', { directoryId, error });
      return 0;
    }
  }

  /**
   * Remove orphaned images (exist in database but not on filesystem)
   * Used in Incremental mode
   */
  private async removeOrphanedImages(directoryId: string, dirPath: string): Promise<number> {
    try {
      // Get all images from database for this directory
      const dbImages = await this.db.getImagesByDirectory(directoryId) as any[];

      let orphanCount = 0;

      for (const image of dbImages) {
        // Extract path from exif_data or use original_url
        const imagePath = image.exif_data
          ? JSON.parse(image.exif_data).path
          : image.original_url;

        if (!imagePath) {
          // No path stored, delete this entry
          await this.db.deleteImage(image.id);
          orphanCount++;
          await this.logger.debug('Removed orphaned image (no path)', { imageId: image.id });
          continue;
        }

        // Check if file exists on filesystem
        try {
          await fs.access(imagePath);
          // File exists, keep it
        } catch {
          // File doesn't exist, delete database entry
          await this.db.deleteImage(image.id);
          orphanCount++;
          await this.logger.debug('Removed orphaned image', {
            imageId: image.id,
            filename: image.filename,
            path: imagePath
          });
        }
      }

      await this.logger.info('Orphan cleanup complete', { directoryId, orphanCount });
      return orphanCount;

    } catch (error) {
      await this.logger.error('Failed to remove orphaned images', { directoryId, error });
      return 0;
    }
  }

  /**
   * Update image_count for all directories based on actual image count in database
   */
  private async updateDirectoryImageCounts(): Promise<void> {
    try {
      const directories = await this.db.getDirectories({}) as any[];

      for (const dir of directories) {
        const images = await this.db.getImagesByDirectory(dir.id);
        const imageCount = images.length;

        await this.db.updateDirectoryImageCount(dir.id, imageCount);

        await this.logger.debug('Updated directory counts', {
          directoryId: dir.id,
          slug: dir.slug,
          imageCount
        });
      }

      await this.logger.info('Directory image counts updated');
    } catch (error) {
      await this.logger.error('Failed to update directory image counts', { error });
    }
  }

  /**
   * Auto-detect and set hero images for directories
   * Looks for files named: hero.jpg, hero.png, hero.jfif, Hero-image.jpg, etc.
   * Queries images from database instead of building paths from slugs
   */
  private async updateHeroImages(): Promise<void> {
    try {
      const directories = await this.db.getDirectories({}) as any[];

      for (const dir of directories) {
        // Skip if directory already has a cover image set
        if (dir.cover_image) {
          continue;
        }

        // Get all images for this directory from database
        const images = await this.db.getImagesByDirectory(dir.id) as any[];

        if (!images || images.length === 0) {
          continue; // No images in directory
        }

        // Look for hero image files (case-insensitive)
        const heroPatterns = [
          /^hero\.jpg$/i,
          /^hero\.jpeg$/i,
          /^hero\.jfif$/i,
          /^hero\.png$/i,
          /^hero\.webp$/i,
          /^hero-image\.jpg$/i,
          /^hero-image\.jpeg$/i,
          /^hero-image\.jfif$/i,
          /^hero-image\.png$/i,
        ];

        // Find hero image by checking filenames
        for (const image of images) {
          const filename = image.filename;

          if (heroPatterns.some(pattern => pattern.test(filename))) {
            // Found a hero image - extract path from exif_data or use original_url
            const heroPath = image.exif_data
              ? JSON.parse(image.exif_data).path
              : image.original_url;

            if (heroPath) {
              // Verify file still exists
              try {
                await fs.access(heroPath);

                // Set this as the cover image
                await this.db.updateDirectoryCoverImage(dir.id, heroPath);

                await this.logger.info('Auto-detected hero image', {
                  slug: dir.slug,
                  heroImage: filename,
                  path: heroPath
                });

                break; // Found one, move to next directory
              } catch {
                await this.logger.debug('Hero image file not found on filesystem', {
                  slug: dir.slug,
                  filename,
                  path: heroPath
                });
              }
            }
          }
        }
      }

      await this.logger.info('Hero image detection complete');
    } catch (error) {
      await this.logger.error('Failed to update hero images', { error });
    }
  }

  /**
   * Scan a specific directory and its subdirectories
   * @param dirPath - Path to directory to scan
   * @param parentDirectoryId - Optional parent directory ID for subdirectories
   * @param parentSlug - Optional parent slug for hierarchical slug generation
   */
  async scanDirectory(dirPath: string, parentDirectoryId?: string, parentSlug?: string): Promise<ScanResult> {
    const result: ScanResult = {
      imagesProcessed: 0,
      thumbnailsGenerated: 0,
      directoriesCreated: 0,
      configsApplied: 0,
      errors: []
    };

    try {
      // Check for config.json
      const configPath = path.join(dirPath, 'config.json');
      let config: DirectoryConfig | null = null;
      let hasConfig = false;

      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configData);
        hasConfig = true;
        result.configsApplied++;
        await this.logger.info('Found config.json', { dirPath });
      } catch {
        // No config.json found
      }

      // Determine directory ID to use for images
      let dirId: string;

      if (parentDirectoryId) {
        // This is a subdirectory - use parent's directory ID unless it has its own config
        if (hasConfig && config) {
          // Subdirectory with config.json gets its own directory entry
          // Generate hierarchical slug: parent-slug + current-name
          const dirName = path.basename(dirPath);
          const hierarchicalSlug = config.slug || this.generateHierarchicalSlug(dirName, parentSlug);
          dirId = await this.ensureDirectory(dirPath, config, hierarchicalSlug, parentDirectoryId);
          result.directoriesCreated++;
          await this.logger.info('Subdirectory has config, creating separate directory entry', {
            dirPath,
            parentDirectoryId,
            slug: hierarchicalSlug
          });
        } else {
          // Subdirectory without config - link images to parent directory
          dirId = parentDirectoryId;
          await this.logger.info('Subdirectory without config, using parent directory ID', {
            dirPath,
            parentDirectoryId
          });
        }
      } else {
        // Top-level directory - always create directory entry
        if (!config) {
          config = await this.generateDirectoryConfig(dirPath);
        }
        const slug = config.slug || this.generateSlug(dirPath);
        dirId = await this.ensureDirectory(dirPath, config, slug, null);
        result.directoriesCreated++;
      }

      // Process all files in directory
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip hidden directories (like .thumbnails)
        if (entry.isDirectory() && entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively process subdirectories, passing current dirId and slug as parent
          // Get current directory's slug from database
          const currentDir = await this.db.getDirectoryById(dirId) as any;
          const currentSlug = currentDir?.slug || parentSlug || '';
          const subResult = await this.scanDirectory(fullPath, dirId, currentSlug);
          result.imagesProcessed += subResult.imagesProcessed;
          result.thumbnailsGenerated += subResult.thumbnailsGenerated;
          result.directoriesCreated += subResult.directoriesCreated;
          result.configsApplied += subResult.configsApplied;
          result.errors.push(...subResult.errors);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase().slice(1);

          if (this.supportedFormats.has(ext)) {
            // Process image file
            try {
              await this.processImage(fullPath, dirId);
              result.imagesProcessed++;
            } catch (error) {
              const errMsg = `Failed to process image ${entry.name}: ${error}`;
              await this.logger.error(errMsg);
              result.errors.push(errMsg);
            }
          } else if (ext === 'mp4') {
            // Process video file (metadata only for now)
            try {
              await this.processVideo(fullPath, dirId);
              result.imagesProcessed++; // Count videos too
            } catch (error) {
              const errMsg = `Failed to process video ${entry.name}: ${error}`;
              await this.logger.error(errMsg);
              result.errors.push(errMsg);
            }
          } else if (['md', 'txt'].includes(ext)) {
            // Process text/markdown files
            try {
              await this.processDocument(fullPath, dirId);
            } catch (error) {
              const errMsg = `Failed to process document ${entry.name}: ${error}`;
              await this.logger.error(errMsg);
              result.errors.push(errMsg);
            }
          }
        }
      }

      return result;

    } catch (error) {
      await this.logger.error('Error scanning directory', { dirPath, error });
      result.errors.push(`Directory scan failed: ${error}`);
      return result;
    }
  }

  /**
   * Process a single image file - METADATA ONLY (Phase 1)
   * Fast metadata extraction without thumbnail generation
   */
  async processImage(imagePath: string, directoryId: string): Promise<void> {
    // Prevent duplicate processing
    if (this.processing.has(imagePath)) {
      return;
    }
    this.processing.add(imagePath);

    try {
      // Extract metadata (fast - just reads file headers)
      const metadata = await this.extractImageMetadata(imagePath);
      const hash = await this.generateFileHash(imagePath);
      const stats = await fs.stat(imagePath);

      // Check if image already exists in database
      const existing = await this.db.getImageByPath(imagePath) as any;

      if (existing && existing.exif_data) {
        const exifData = JSON.parse(existing.exif_data);
        if (exifData.hash === hash) {
          // Image unchanged, skip processing
          this.processing.delete(imagePath);
          return;
        }
      }

      // Store in database WITHOUT thumbnails (Phase 1: Metadata only)
      // This makes image counts accurate immediately
      const imageData = {
        id: hash,
        directoryId,
        filename: path.basename(imagePath),
        title: this.extractTitle(imagePath),
        caption: null,
        carouselId: null,
        position: 0,
        thumbnailUrl: null, // Will be generated in Phase 2
        smallUrl: null,
        mediumUrl: null,
        largeUrl: null,
        originalUrl: imagePath,
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.aspectRatio,
        fileSize: metadata.size,
        format: metadata.format,
        colorPalette: [],
        averageColor: null,
        status: 'published',
        altText: this.extractTitle(imagePath),
        exifData: {
          path: imagePath,
          hash,
          thumbnails: {}, // Empty - thumbnails generated later
          capturedAt: stats.birthtime,
          modifiedAt: stats.mtime
        }
      };

      if (existing && existing.id) {
        await this.db.updateImage(existing.id as string, imageData);
      } else {
        await this.db.createImage(imageData);
      }

      await this.logger.debug('Image metadata indexed', { path: imagePath });

    } catch (error) {
      await this.logger.error('Failed to process image metadata', { imagePath, error });
      throw error;
    } finally {
      this.processing.delete(imagePath);
    }
  }

  /**
   * Generate thumbnails for images (Phase 2)
   * Can be run after metadata scan completes
   */
  async generateThumbnailsForDirectory(slug: string): Promise<ScanResult> {
    const result: ScanResult = {
      imagesProcessed: 0,
      thumbnailsGenerated: 0,
      directoriesCreated: 0,
      configsApplied: 0,
      errors: []
    };

    try {
      await this.logger.info('Starting thumbnail generation', { slug });

      // Get directory from database
      const directory = await this.db.getDirectoryBySlug(slug) as any;
      if (!directory || !directory.id) {
        const errMsg = `Directory not found: ${slug}`;
        result.errors.push(errMsg);
        return result;
      }

      // Get all images in directory
      const images = await this.db.getImagesByDirectory(directory.id);
      await this.logger.info('Found images to process', { count: images.length });

      // Process images in parallel batches
      const batchSize = this.thumbnailWorkers;
      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);

        // Process batch in parallel
        const batchPromises = batch.map(async (image: any) => {
          try {
            const thumbCount = await this.generateThumbnailsForImage(image);
            result.imagesProcessed++;
            result.thumbnailsGenerated += thumbCount;
          } catch (error) {
            const errMsg = `Failed to generate thumbnails for ${image.filename}: ${error}`;
            result.errors.push(errMsg);
            await this.logger.error(errMsg);
          }
        });

        await Promise.all(batchPromises);

        // Log progress
        const processed = Math.min(i + batchSize, images.length);
        await this.logger.info('Thumbnail generation progress', {
          processed,
          total: images.length,
          percentage: Math.round((processed / images.length) * 100)
        });
      }

      await this.logger.info('Thumbnail generation complete', result);
      return result;

    } catch (error) {
      const errMsg = `Fatal error during thumbnail generation: ${error}`;
      await this.logger.error(errMsg);
      result.errors.push(errMsg);
      return result;
    }
  }

  /**
   * Generate priority thumbnails for a single image
   * Only generates 3 sizes: 1920w, 1200w, 640w
   */
  private async generateThumbnailsForImage(image: any): Promise<number> {
    const imagePath = image.exif_data ? JSON.parse(image.exif_data).path : image.original_url;

    if (!imagePath) {
      throw new Error('Image path not found in database');
    }

    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const thumbnailDir = path.join(path.dirname(imagePath), '.thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });

    const thumbnails: Record<string, string> = {};
    let generatedCount = 0;

    // Generate only priority sizes
    for (const size of this.prioritySizes) {
      if (size < image.width) {
        const thumbPath = await this.generateThumbnail(imagePath, thumbnailDir, size);
        thumbnails[`${size}w`] = thumbPath;
        generatedCount++;
      }
    }

    // Update database with thumbnail URLs
    const updateData = {
      thumbnailUrl: thumbnails['640w'] || null,
      mediumUrl: thumbnails['1200w'] || null,
      largeUrl: thumbnails['1920w'] || null,
      exifData: {
        ...JSON.parse(image.exif_data || '{}'),
        thumbnails
      }
    };

    await this.db.updateImage(image.id, updateData);
    await this.logger.debug('Thumbnails generated', { imagePath, count: generatedCount });

    return generatedCount;
  }

  /**
   * Process a video file with metadata extraction and thumbnail generation
   */
  async processVideo(videoPath: string, directoryId: string): Promise<void> {
    try {
      const stats = await fs.stat(videoPath);
      const hash = await this.generateFileHash(videoPath);

      // Extract video metadata using ffprobe
      const metadata = await this.videoProcessor.extractMetadata(videoPath);

      // Generate thumbnail (first frame)
      // Use standard thumbnail naming (_640w) so media routes can serve them
      // Keep .jpg since ffmpeg generates JPEG, not WebP
      const thumbnailDir = path.join(path.dirname(videoPath), '.thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });

      const basename = path.basename(videoPath, path.extname(videoPath));
      const thumbnailPath = path.join(thumbnailDir, `${basename}_640w.jpg`);

      const thumbnail = await this.videoProcessor.generateThumbnail(
        videoPath,
        thumbnailPath,
        0 // First frame
      );

      const videoData = {
        id: hash,
        directoryId,
        filename: path.basename(videoPath),
        title: this.extractTitle(videoPath),
        caption: null,
        carouselId: null,
        position: 0,
        thumbnailUrl: thumbnail || null,
        smallUrl: null,
        mediumUrl: null,
        largeUrl: null,
        originalUrl: videoPath,
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.aspectRatio,
        fileSize: stats.size,
        format: metadata.format,
        colorPalette: [],
        averageColor: null,
        status: 'published',
        altText: this.extractTitle(videoPath),
        exifData: {
          path: videoPath,
          hash,
          type: 'video',
          duration: metadata.duration,
          codec: metadata.codec,
          bitrate: metadata.bitrate,
          fps: metadata.fps,
          thumbnail: thumbnail || null,
          capturedAt: stats.birthtime,
          modifiedAt: stats.mtime
        }
      };

      const existing = await this.db.getImageByPath(videoPath) as any;
      if (existing && existing.id) {
        await this.db.updateImage(existing.id as string, videoData);
      } else {
        await this.db.createImage(videoData);
      }

      await this.logger.info('Video processed', {
        path: videoPath,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        thumbnail: thumbnail ? 'generated' : 'skipped'
      });

    } catch (error) {
      await this.logger.error('Failed to process video', { videoPath, error });
      throw error;
    }
  }

  /**
   * Process document files (.md, .txt)
   */
  async processDocument(docPath: string, directoryId: string): Promise<void> {
    try {
      const content = await fs.readFile(docPath, 'utf-8');
      const stats = await fs.stat(docPath);

      // Store document content in directory metadata
      await this.db.updateDirectoryMetadata(directoryId, {
        documents: {
          [path.basename(docPath)]: {
            content,
            modifiedAt: stats.mtime
          }
        }
      });

      await this.logger.debug('Document processed', { path: docPath });

    } catch (error) {
      await this.logger.error('Failed to process document', { docPath, error });
      throw error;
    }
  }

  /**
   * Extract image metadata using Sharp
   */
  private async extractImageMetadata(imagePath: string): Promise<ImageMetadata> {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const stats = await fs.stat(imagePath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
      aspectRatio: metadata.width && metadata.height
        ? metadata.width / metadata.height
        : 1
    };
  }

  /**
   * Generate thumbnail at specified width
   */
  private async generateThumbnail(
    imagePath: string,
    thumbnailDir: string,
    width: number
  ): Promise<string> {
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const thumbPath = path.join(thumbnailDir, `${basename}_${width}w.webp`);

    // Skip if thumbnail already exists
    try {
      await fs.access(thumbPath);
      return thumbPath;
    } catch {
      // Thumbnail doesn't exist, generate it
    }

    await sharp(imagePath)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: parseInt(process.env.IMAGE_QUALITY_WEBP || '75') })
      .toFile(thumbPath);

    return thumbPath;
  }

  /**
   * Generate file hash for change detection
   * Uses file stats (path + size) for stable, deterministic hashing
   * Excludes mtime to avoid false changes from file copies/touches
   * Avoids reading entire file into memory
   *
   * IMPORTANT: mtime excluded for stability across:
   * - File copy operations (mtime changes even if content identical)
   * - Cross-platform differences (Linux vs Windows mtime behavior)
   * - File system operations (touch, metadata changes)
   */
  private async generateFileHash(filePath: string): Promise<string> {
    const stats = await fs.stat(filePath);
    // Hash based on path + size only - stable and deterministic
    // If file size changes, content changed (acceptable for our use case)
    const hashInput = `${filePath}:${stats.size}`;
    return createHash('md5').update(hashInput).digest('hex');
  }

  /**
   * Ensure directory exists in database
   */
  private async ensureDirectory(
    dirPath: string,
    config: DirectoryConfig,
    slug: string,
    parentDirectoryId: string | null = null
  ): Promise<string> {
    const dirId = config?.id || this.generateDirectoryId(dirPath);

    const existing = await this.db.getDirectoryBySlug(slug) as any;

    if (existing && existing.id) {
      // Directory exists - update it with latest config
      await this.db.updateDirectoryMetadata(existing.id, config || {});
      return existing.id as string;
    }

    const title = config?.title || this.extractTitle(dirPath);

    await this.db.createDirectory({
      id: dirId,
      title,
      subtitle: null,
      slug,
      description: config?.description || '',
      coverImage: config?.coverImage || null,
      imageCount: 0,
      lastModified: new Date().toISOString(),
      featured: config?.isFeatured || false,
      menuOrder: config?.order || 0,
      status: config?.status || 'published',
      parentCategory: parentDirectoryId,  // Set parent category for subcollections
      tags: config?.tags || [],
      config: config || {}  // Store entire config object, not just config.metadata
    });

    return dirId;
  }

  /**
   * Generate directory config from path
   */
  private async generateDirectoryConfig(dirPath: string): Promise<DirectoryConfig> {
    const dirName = path.basename(dirPath);
    const slug = this.generateSlug(dirPath);

    return {
      title: this.formatTitle(dirName),
      slug,
      description: `${this.formatTitle(dirName)} collection`,
      status: 'published',
      order: 0,
      isCarousel: false,
      isFeatured: false,
      tags: [],
      metadata: {}
    };
  }

  /**
   * Generate slug from directory path
   */
  private generateSlug(dirPath: string): string {
    const dirName = path.basename(dirPath);
    return dirName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate hierarchical slug combining parent and current directory
   */
  private generateHierarchicalSlug(dirName: string, parentSlug?: string): string {
    const currentSlug = dirName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (parentSlug) {
      return `${parentSlug}-${currentSlug}`;
    }
    return currentSlug;
  }

  /**
   * Generate directory ID from path
   */
  private generateDirectoryId(dirPath: string): string {
    return createHash('md5')
      .update(dirPath)
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * Extract title from filename/path
   */
  private extractTitle(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath));
    return this.formatTitle(basename);
  }

  /**
   * Format string as title
   */
  private formatTitle(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Build subcollections tree for a directory with depth limiting
   * @param parentId - Parent directory ID
   * @param maxDepth - Maximum depth to recurse (default 4)
   * @param currentDepth - Current recursion depth
   */
  async getSubcollectionsTree(parentId: string, maxDepth: number = 4, currentDepth: number = 0): Promise<any[]> {
    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
      return [];
    }

    try {
      const subdirectories = await this.db.getSubdirectoriesByParentId(parentId) as any[];

      // Build subcollection objects
      const subcollections = await Promise.all(
        subdirectories.map(async (subdir) => {
          // Recursively get nested subcollections
          const nestedSubcollections = await this.getSubcollectionsTree(
            subdir.id,
            maxDepth,
            currentDepth + 1
          );

          return {
            id: subdir.id,
            title: subdir.title,
            slug: subdir.slug,
            description: subdir.description,
            coverImage: subdir.cover_image,
            imageCount: subdir.image_count,
            featured: Boolean(subdir.featured),
            subcollections: nestedSubcollections
          };
        })
      );

      return subcollections;

    } catch (error) {
      await this.logger.error('Failed to build subcollections tree', { parentId, error });
      return [];
    }
  }
}