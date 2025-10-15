/**
 * Thumbnail Management Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-10-13
 *
 * Endpoints for regenerating thumbnails for individual images or entire collections.
 * Designed for diagnostic tools and manual fixes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createLogger } from '../utils/logger-wrapper.js';
import { DatabaseManager } from '../services/DatabaseManager.js';

const logger = createLogger('backend-thumbnails.log');
const router = Router();

// Global database manager instance (will be set by server on startup)
export let dbManager: DatabaseManager | null = null;

export function setDatabaseManager(manager: DatabaseManager) {
  dbManager = manager;
}

const PRIORITY_SIZES = [1920, 1200, 640];
const WEBP_QUALITY = parseInt(process.env.IMAGE_QUALITY_WEBP || '75');

interface ThumbnailResult {
  size: string;
  path: string;
  fileSize: number;
}

interface RegenerationError {
  code: string;
  message: string;
  details: Record<string, any>;
  stack?: string;
}

/**
 * POST /api/thumbnails/regenerate/:imageId
 * Regenerate thumbnails for a single image
 *
 * Query Parameters:
 * - sizes: Comma-separated list of sizes (e.g., "640,1200,1920")
 * - force: true (default) - Delete existing thumbnails before regenerating
 */
router.post('/regenerate/:imageId', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { imageId } = req.params;
  const force = req.query.force !== 'false'; // Default true
  const sizes = req.query.sizes
    ? (req.query.sizes as string).split(',').map(Number)
    : PRIORITY_SIZES;

  try {
    await logger.info('ThumbnailRoutes', `POST /regenerate/${imageId}`, { force, sizes });

    if (!dbManager) {
      return res.status(500).json({
        success: false,
        message: 'Database manager not initialized',
        code: 'DB_NOT_INITIALIZED'
      });
    }

    // Get image from database
    const image = await dbManager.getImageById(imageId) as any;

    if (!image) {
      return res.status(404).json({
        success: false,
        message: `Image not found: ${imageId}`,
        code: 'IMAGE_NOT_FOUND',
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'No image exists in database with this ID',
          details: {
            imageId,
            suggestion: 'Check that the image ID is correct'
          }
        }
      });
    }

    // Extract image path
    const imagePath = image.exif_data ? JSON.parse(image.exif_data).path : image.original_url;

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: 'Image path not found in database',
        code: 'NO_IMAGE_PATH',
        error: {
          code: 'NO_IMAGE_PATH',
          message: 'Image record exists but has no filesystem path',
          details: {
            imageId,
            filename: image.filename,
            suggestion: 'Database entry may be corrupted. Try rescanning the collection.'
          }
        }
      });
    }

    // Validate source file exists
    let pathLength = imagePath.length;
    let fileExists = false;
    let fileStats: any = null;

    try {
      fileStats = await fs.stat(imagePath);
      fileExists = true;
    } catch (error: any) {
      const isWindowsPathLimit = process.platform === 'win32' && pathLength > 260;

      return res.status(400).json({
        success: false,
        message: 'Source image file not accessible',
        code: 'SOURCE_FILE_ERROR',
        error: {
          code: 'SOURCE_FILE_ERROR',
          message: error.message || 'File does not exist or cannot be accessed',
          details: {
            imageId,
            filename: image.filename,
            originalPath: imagePath,
            pathLength,
            fileExists: false,
            platform: process.platform,
            reason: isWindowsPathLimit
              ? 'Windows MAX_PATH limit (260 characters) exceeded'
              : 'File not found or permission denied',
            suggestion: isWindowsPathLimit
              ? 'Path exceeds Windows limit. Rename file/directories to shorten path, or use Linux server.'
              : 'Verify file exists and has correct permissions. May need to rescan collection.'
          },
          stack: error.stack
        }
      });
    }

    // Setup thumbnail directory
    const thumbnailDir = path.join(path.dirname(imagePath), '.thumbnails');

    try {
      await fs.mkdir(thumbnailDir, { recursive: true });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Cannot create thumbnail directory',
        code: 'MKDIR_ERROR',
        error: {
          code: 'MKDIR_ERROR',
          message: error.message || 'Failed to create .thumbnails directory',
          details: {
            imageId,
            filename: image.filename,
            thumbnailDir,
            reason: error.code === 'EACCES' ? 'Permission denied'
                  : error.code === 'ENOSPC' ? 'Disk full'
                  : 'Unknown filesystem error',
            suggestion: error.code === 'EACCES'
              ? 'Check directory permissions'
              : error.code === 'ENOSPC'
              ? 'Free up disk space'
              : 'Check filesystem health'
          },
          stack: error.stack
        }
      });
    }

    // Delete existing thumbnails if force=true
    if (force) {
      try {
        const ext = path.extname(imagePath);
        const basename = path.basename(imagePath, ext);

        for (const size of sizes) {
          const thumbPath = path.join(thumbnailDir, `${basename}_${size}w.webp`);
          try {
            await fs.unlink(thumbPath);
            await logger.debug('ThumbnailRoutes', 'Deleted existing thumbnail', { thumbPath });
          } catch {
            // Thumbnail doesn't exist, continue
          }
        }
      } catch (error: any) {
        await logger.warn('ThumbnailRoutes', 'Failed to delete some existing thumbnails', { error });
      }
    }

    // Generate thumbnails
    const thumbnailsGenerated: ThumbnailResult[] = [];
    const errors: string[] = [];

    for (const size of sizes) {
      // Skip if thumbnail is larger than image
      if (size >= image.width) {
        await logger.debug('ThumbnailRoutes', 'Skipping thumbnail larger than image', {
          size,
          imageWidth: image.width
        });
        continue;
      }

      try {
        const ext = path.extname(imagePath);
        const basename = path.basename(imagePath, ext);
        const thumbPath = path.join(thumbnailDir, `${basename}_${size}w.webp`);

        // Generate thumbnail using Sharp
        await sharp(imagePath)
          .resize(size, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: WEBP_QUALITY })
          .toFile(thumbPath);

        // Get file size
        const thumbStats = await fs.stat(thumbPath);

        thumbnailsGenerated.push({
          size: `${size}w`,
          path: thumbPath,
          fileSize: thumbStats.size
        });

        await logger.debug('ThumbnailRoutes', 'Generated thumbnail', {
          size: `${size}w`,
          path: thumbPath,
          fileSize: thumbStats.size
        });

      } catch (error: any) {
        const errMsg = `Failed to generate ${size}w: ${error.message}`;
        errors.push(errMsg);
        await logger.error('ThumbnailRoutes', 'Thumbnail generation failed', {
          size,
          error: error.message,
          stack: error.stack
        });

        // If Sharp fails, return detailed error
        if (error.message.includes('Input file') || error.message.includes('unsupported')) {
          return res.status(400).json({
            success: false,
            message: 'Failed to process image with Sharp',
            code: 'SHARP_ERROR',
            error: {
              code: 'SHARP_ERROR',
              message: error.message,
              details: {
                imageId,
                filename: image.filename,
                originalPath: imagePath,
                size: `${size}w`,
                fileSize: fileStats.size,
                format: image.format,
                reason: error.message.includes('unsupported')
                  ? 'Image format not supported or file corrupted'
                  : 'Sharp could not read image file',
                suggestion: error.message.includes('unsupported')
                  ? 'File may be corrupted. Try re-exporting from source application.'
                  : 'Verify file is a valid image format'
              },
              stack: error.stack
            }
          });
        }
      }
    }

    // Update database with new thumbnail paths
    try {
      const exifData = image.exif_data ? JSON.parse(image.exif_data) : {};
      const thumbnails: Record<string, string> = {};

      for (const thumb of thumbnailsGenerated) {
        thumbnails[thumb.size] = thumb.path;
      }

      const updateData = {
        thumbnailUrl: thumbnails['640w'] || image.thumbnail_url || null,
        mediumUrl: thumbnails['1200w'] || image.medium_url || null,
        largeUrl: thumbnails['1920w'] || image.large_url || null,
        exifData: {
          ...exifData,
          thumbnails
        }
      };

      await dbManager.updateImageThumbnails(imageId, updateData);
      await logger.info('ThumbnailRoutes', 'Database updated with new thumbnails', { imageId });

    } catch (error: any) {
      await logger.error('ThumbnailRoutes', 'Failed to update database', { error });

      return res.status(500).json({
        success: false,
        message: 'Thumbnails generated but database update failed',
        code: 'DB_UPDATE_ERROR',
        error: {
          code: 'DB_UPDATE_ERROR',
          message: error.message,
          details: {
            imageId,
            thumbnailsGenerated: thumbnailsGenerated.length,
            reason: 'Database write failed after thumbnails were created',
            suggestion: 'Thumbnails exist on disk but database is out of sync. Try rescanning collection.'
          },
          stack: error.stack
        }
      });
    }

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      message: 'Thumbnails regenerated successfully',
      data: {
        imageId,
        filename: image.filename,
        originalPath: imagePath,
        thumbnailsGenerated,
        timeTaken: `${timeTaken}s`,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    await logger.error('ThumbnailRoutes', `POST /regenerate/${imageId} failed`, { error });

    res.status(500).json({
      success: false,
      message: 'Unexpected error during thumbnail regeneration',
      code: 'INTERNAL_ERROR',
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        details: {
          imageId,
          reason: 'Unexpected server error',
          suggestion: 'Check server logs for details'
        },
        stack: error.stack
      }
    });
  }
});

/**
 * POST /api/thumbnails/regenerate-collection/:slug
 * Regenerate thumbnails for all images in a collection
 *
 * Query Parameters:
 * - sizes: Comma-separated list of sizes (e.g., "640,1200,1920")
 * - force: true (default) - Delete existing thumbnails before regenerating
 * - workers: Number of parallel workers (default: 5, max: 10)
 */
router.post('/regenerate-collection/:slug', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { slug } = req.params;
  const force = req.query.force !== 'false';
  const sizes = req.query.sizes
    ? (req.query.sizes as string).split(',').map(Number)
    : PRIORITY_SIZES;
  const workers = Math.min(
    parseInt(req.query.workers as string) || 5,
    10
  );

  try {
    await logger.info('ThumbnailRoutes', `POST /regenerate-collection/${slug}`, {
      force,
      sizes,
      workers
    });

    if (!dbManager) {
      return res.status(500).json({
        success: false,
        message: 'Database manager not initialized',
        code: 'DB_NOT_INITIALIZED'
      });
    }

    // Get directory from database
    const directory = await dbManager.getDirectoryBySlug(slug) as any;

    if (!directory || !directory.id) {
      return res.status(404).json({
        success: false,
        message: `Collection not found: ${slug}`,
        code: 'COLLECTION_NOT_FOUND'
      });
    }

    // Get all images in directory
    const images = await dbManager.getImagesByDirectory(directory.id);

    await logger.info('ThumbnailRoutes', 'Starting bulk regeneration', {
      slug,
      imageCount: images.length
    });

    // Return immediately - processing happens in background
    res.json({
      success: true,
      message: `Thumbnail regeneration initiated for ${images.length} images`,
      data: {
        slug,
        imageCount: images.length,
        sizes,
        workers,
        startedAt: new Date().toISOString(),
        status: 'processing'
      }
    });

    // Process images in parallel batches (in background)
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < images.length; i += workers) {
      const batch = images.slice(i, i + workers);

      const batchPromises = batch.map(async (image: any) => {
        try {
          // Regenerate thumbnails for this image
          const imagePath = image.exif_data ? JSON.parse(image.exif_data).path : image.original_url;

          if (!imagePath) {
            throw new Error('No image path in database');
          }

          // Check file exists
          await fs.access(imagePath);

          const thumbnailDir = path.join(path.dirname(imagePath), '.thumbnails');
          await fs.mkdir(thumbnailDir, { recursive: true });

          // Delete existing if force=true
          if (force) {
            const ext = path.extname(imagePath);
            const basename = path.basename(imagePath, ext);

            for (const size of sizes) {
              const thumbPath = path.join(thumbnailDir, `${basename}_${size}w.webp`);
              try {
                await fs.unlink(thumbPath);
              } catch {
                // Ignore if doesn't exist
              }
            }
          }

          // Generate thumbnails
          const thumbnails: Record<string, string> = {};
          let generatedCount = 0;

          for (const size of sizes) {
            if (size < image.width) {
              const ext = path.extname(imagePath);
              const basename = path.basename(imagePath, ext);
              const thumbPath = path.join(thumbnailDir, `${basename}_${size}w.webp`);

              await sharp(imagePath)
                .resize(size, null, {
                  withoutEnlargement: true,
                  fit: 'inside'
                })
                .webp({ quality: WEBP_QUALITY })
                .toFile(thumbPath);

              thumbnails[`${size}w`] = thumbPath;
              generatedCount++;
            }
          }

          // Update database
          const exifData = image.exif_data ? JSON.parse(image.exif_data) : {};

          if (!dbManager) {
            throw new Error('Database manager not initialized');
          }

          await dbManager.updateImageThumbnails(image.id, {
            thumbnailUrl: thumbnails['640w'] || image.thumbnail_url || null,
            mediumUrl: thumbnails['1200w'] || image.medium_url || null,
            largeUrl: thumbnails['1920w'] || image.large_url || null,
            exifData: {
              ...exifData,
              thumbnails
            }
          });

          succeeded++;

        } catch (error: any) {
          failed++;
          const errMsg = `${image.filename}: ${error.message}`;
          errors.push(errMsg);
          await logger.error('ThumbnailRoutes', 'Bulk regeneration error', {
            imageId: image.id,
            filename: image.filename,
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
      processed += batch.length;

      // Log progress
      await logger.info('ThumbnailRoutes', 'Bulk regeneration progress', {
        slug,
        processed,
        succeeded,
        failed,
        total: images.length,
        percentage: Math.round((processed / images.length) * 100)
      });
    }

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

    await logger.info('ThumbnailRoutes', 'Bulk regeneration complete', {
      slug,
      total: images.length,
      succeeded,
      failed,
      timeTaken: `${timeTaken}s`
    });

  } catch (error: any) {
    await logger.error('ThumbnailRoutes', `POST /regenerate-collection/${slug} failed`, { error });
    // Response already sent, just log the error
  }
});

export default router;
