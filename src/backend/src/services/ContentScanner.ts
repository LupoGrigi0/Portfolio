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
  errors: string[];
}

export class ContentScanner {
  private logger: Logger;
  private db: DatabaseManager;
  private contentDir: string;
  private imageSizes: number[];
  private supportedFormats: Set<string>;
  private processing = new Set<string>();

  constructor(
    logger: Logger,
    db: DatabaseManager,
    contentDir: string,
    imageSizes: string = '640,750,828,1080,1200,1920,2048,3840',
    supportedFormats: string = 'jpg,jpeg,png,webp,avif,gif,tiff,bmp'
  ) {
    this.logger = logger;
    this.db = db;
    this.contentDir = contentDir;
    this.imageSizes = imageSizes.split(',').map(Number);
    this.supportedFormats = new Set(supportedFormats.split(',').map(f => f.toLowerCase()));
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

      await this.logger.info('Content scan complete', result);
      return result;

    } catch (error) {
      await this.logger.error('Fatal error during content scan', { error });
      throw error;
    }
  }

  /**
   * Scan a specific directory and its subdirectories
   */
  async scanDirectory(dirPath: string): Promise<ScanResult> {
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
      let config: DirectoryConfig;

      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configData);
        result.configsApplied++;
        await this.logger.info('Found config.json', { dirPath });
      } catch {
        // No config.json, will auto-generate
        config = await this.generateDirectoryConfig(dirPath);
        await this.logger.info('Auto-generated directory config', { dirPath });
      }

      // Ensure directory exists in database
      const slug = config.slug;
      const dirId = await this.ensureDirectory(dirPath, config, slug);
      result.directoriesCreated++;

      // Process all files in directory
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively process subdirectories
          const subResult = await this.scanDirectory(fullPath);
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
   * Process a single image file
   */
  async processImage(imagePath: string, directoryId: string): Promise<void> {
    // Prevent duplicate processing
    if (this.processing.has(imagePath)) {
      return;
    }
    this.processing.add(imagePath);

    try {
      // Extract metadata
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

      // Generate thumbnails
      const thumbnailDir = path.join(path.dirname(imagePath), '.thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnails: Record<string, string> = {};
      for (const size of this.imageSizes) {
        if (size < metadata.width) {
          const thumbPath = await this.generateThumbnail(imagePath, thumbnailDir, size);
          thumbnails[`${size}w`] = thumbPath;
        }
      }

      // Store in database (using camelCase keys that DatabaseManager expects)
      const imageData = {
        id: hash,
        directoryId,
        filename: path.basename(imagePath),
        title: this.extractTitle(imagePath),
        caption: null,
        carouselId: null,
        position: 0,
        thumbnailUrl: thumbnails['640w'] || null,
        smallUrl: thumbnails['828w'] || null,
        mediumUrl: thumbnails['1200w'] || null,
        largeUrl: thumbnails['1920w'] || null,
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
          thumbnails,
          capturedAt: stats.birthtime,
          modifiedAt: stats.mtime
        }
      };

      if (existing && existing.id) {
        await this.db.updateImage(existing.id as string, imageData);
      } else {
        await this.db.createImage(imageData);
      }

      await this.logger.info('Image processed', {
        path: imagePath,
        thumbnails: Object.keys(thumbnails).length
      });

    } catch (error) {
      await this.logger.error('Failed to process image', { imagePath, error });
      throw error;
    } finally {
      this.processing.delete(imagePath);
    }
  }

  /**
   * Process a video file (metadata only, no thumbnail generation yet)
   */
  async processVideo(videoPath: string, directoryId: string): Promise<void> {
    try {
      const stats = await fs.stat(videoPath);
      const hash = await this.generateFileHash(videoPath);

      const videoData = {
        id: hash,
        directoryId,
        filename: path.basename(videoPath),
        title: this.extractTitle(videoPath),
        caption: null,
        carouselId: null,
        position: 0,
        thumbnailUrl: null,
        smallUrl: null,
        mediumUrl: null,
        largeUrl: null,
        originalUrl: videoPath,
        width: 0, // TODO: Extract video dimensions
        height: 0,
        aspectRatio: 16/9, // Default, should extract actual
        fileSize: stats.size,
        format: 'mp4',
        colorPalette: [],
        averageColor: null,
        status: 'published',
        altText: this.extractTitle(videoPath),
        exifData: {
          path: videoPath,
          hash,
          type: 'video',
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

      await this.logger.info('Video processed', { path: videoPath });

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
   */
  private async generateFileHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Ensure directory exists in database
   */
  private async ensureDirectory(
    dirPath: string,
    config: DirectoryConfig,
    slug: string
  ): Promise<string> {
    const dirId = config?.id || this.generateDirectoryId(dirPath);

    const existing = await this.db.getDirectoryBySlug(slug) as any;

    if (existing && existing.id) {
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
      parentCategory: null,
      tags: config?.tags || [],
      config: config?.metadata || {}
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
}