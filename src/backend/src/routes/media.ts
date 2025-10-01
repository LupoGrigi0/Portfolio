/**
 * Media Serving Routes
 * Author: Viktor v2 (Backend API & Database Specialist)
 * Created: 2025-10-01
 *
 * Serves actual image/video files from the content directory via HTTP
 * Supports thumbnail sizes and proper caching headers
 */

import { Router, Request, Response, NextFunction } from 'express';
import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger-wrapper.js';

const logger = createLogger('backend-media.log');
const router = Router();

// Content directory (from environment or default)
const CONTENT_DIR = process.env.CONTENT_DIRECTORY || 'E:/mnt/lupoportfolio/content';

/**
 * Size mappings for thumbnail generation
 * Maps query param 'size' to actual thumbnail filename suffixes
 */
const SIZE_MAPPINGS: Record<string, string> = {
  'thumbnail': '_640w',
  'small': '_828w',
  'medium': '_1200w',
  'large': '_1920w',
  'xlarge': '_2048w',
  '4k': '_3840w',
  'original': '' // No suffix for original
};

/**
 * MIME type detection from file extension
 */
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

/**
 * GET /api/media/:slug/:subdirectory/:filename
 * Serves image/video files from subdirectories
 *
 * Query Parameters:
 *   - size: thumbnail|small|medium|large|xlarge|4k|original (default: original)
 *
 * Examples:
 *   GET /api/media/couples/gallery/image.jpg?size=medium
 *   GET /api/media/cafe/Coffee/image.jpg
 */
router.get('/:slug/:subdirectory/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, subdirectory, filename: baseFilename } = req.params;
    const filename = `${subdirectory}/${baseFilename}`; // Reconstruct full path with subdirectory
    const size = (req.query.size as string) || 'original';

    await logger.info('MediaRoutes', 'GET /media/:slug/:filename(*)', { slug, filename, size });

    // Validate size parameter
    if (!(size in SIZE_MAPPINGS)) {
      return res.status(400).json({
        success: false,
        message: `Invalid size parameter. Must be one of: ${Object.keys(SIZE_MAPPINGS).join(', ')}`,
        code: 'INVALID_SIZE'
      });
    }

    // Parse filename to get base name and extension
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);
    const dirName = path.dirname(filename); // Extract subdirectory path (e.g., "gallery" or ".")

    // Determine MIME type
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Build file path based on size
    let filePath: string;

    if (size === 'original' || !mimeType.startsWith('image/')) {
      // Original file or video - use as-is with full path including subdirectories
      filePath = path.join(CONTENT_DIR, slug, filename);
    } else {
      // Thumbnail requested - look in .thumbnails subdirectory with size suffix
      const sizeSuffix = SIZE_MAPPINGS[size];
      const thumbnailFilename = `${baseName}${sizeSuffix}.webp`; // Thumbnails are .webp

      // Thumbnails are stored in .thumbnails within the same directory as the original
      // E.g., couples/gallery/image.jpg → couples/gallery/.thumbnails/image_640w.webp
      if (dirName && dirName !== '.') {
        filePath = path.join(CONTENT_DIR, slug, dirName, '.thumbnails', thumbnailFilename);
      } else {
        filePath = path.join(CONTENT_DIR, slug, '.thumbnails', thumbnailFilename);
      }

      // If thumbnail doesn't exist, fall back to original
      try {
        await fs.access(filePath);
      } catch {
        await logger.warn('MediaRoutes', 'Thumbnail not found, using original', {
          requestedThumbnail: thumbnailFilename,
          slug,
          filename,
          dirName
        });
        filePath = path.join(CONTENT_DIR, slug, filename);
      }
    }

    // Security: Prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const contentDirResolved = path.resolve(CONTENT_DIR);

    if (!resolvedPath.startsWith(contentDirResolved)) {
      await logger.warn('MediaRoutes', 'Directory traversal attempt blocked', {
        requestedPath: filePath,
        slug,
        filename
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    // Check if file exists
    try {
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      // Set caching headers for optimal performance
      // Images are immutable - cache for 1 year
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stats.size);

      // Optional: Add ETag for conditional requests
      res.setHeader('ETag', `"${stats.size}-${stats.mtimeMs}"`);

      // Stream the file to response
      await logger.debug('MediaRoutes', 'Serving file', {
        filePath,
        resolvedPath,
        size: stats.size,
        mimeType
      });

      // Use fs.createReadStream for better control over file serving
      const fileStream = createReadStream(resolvedPath);
      fileStream.pipe(res);

      fileStream.on('error', (error: any) => {
        logger.error('MediaRoutes', 'Error streaming file', { error, resolvedPath });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file',
            code: 'STREAM_ERROR'
          });
        }
      });

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await logger.warn('MediaRoutes', 'File not found', { filePath, slug, filename });
        return res.status(404).json({
          success: false,
          message: 'Image not found',
          code: 'IMAGE_NOT_FOUND'
        });
      }
      throw error;
    }

  } catch (error) {
    await logger.error('MediaRoutes', 'GET /media/:slug/:subdirectory/:filename failed', { error });
    next(error);
  }
});

/**
 * GET /api/media/:slug/:filename
 * Serves root-level image/video files
 *
 * Query Parameters:
 *   - size: thumbnail|small|medium|large|xlarge|4k|original (default: original)
 *
 * Examples:
 *   GET /api/media/couples/Hero-image.jpg
 *   GET /api/media/couples/Hero-image.jpg?size=thumbnail
 */
router.get('/:slug/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, filename } = req.params;
    const size = (req.query.size as string) || 'original';

    await logger.info('MediaRoutes', 'GET /media/:slug/:filename', { slug, filename, size });

    // Validate size parameter
    if (!(size in SIZE_MAPPINGS)) {
      return res.status(400).json({
        success: false,
        message: `Invalid size parameter. Must be one of: ${Object.keys(SIZE_MAPPINGS).join(', ')}`,
        code: 'INVALID_SIZE'
      });
    }

    // Parse filename to get base name and extension
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);

    // Determine MIME type
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Build file path based on size
    let filePath: string;

    if (size === 'original' || !mimeType.startsWith('image/')) {
      // Original file - root level
      filePath = path.join(CONTENT_DIR, slug, filename);
    } else {
      // Thumbnail - in root .thumbnails directory
      const sizeSuffix = SIZE_MAPPINGS[size];
      const thumbnailFilename = `${baseName}${sizeSuffix}.webp`;
      filePath = path.join(CONTENT_DIR, slug, '.thumbnails', thumbnailFilename);

      // Fall back to original if thumbnail doesn't exist
      try {
        await fs.access(filePath);
      } catch {
        await logger.warn('MediaRoutes', 'Thumbnail not found, using original', {
          requestedThumbnail: thumbnailFilename,
          slug,
          filename
        });
        filePath = path.join(CONTENT_DIR, slug, filename);
      }
    }

    // Security: Prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const contentDirResolved = path.resolve(CONTENT_DIR);

    if (!resolvedPath.startsWith(contentDirResolved)) {
      await logger.warn('MediaRoutes', 'Directory traversal attempt blocked', {
        requestedPath: filePath,
        slug,
        filename
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    // Check if file exists and serve
    try {
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      // Set headers
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('ETag', `"${stats.size}-${stats.mtimeMs}"`);

      // Stream the file
      const fileStream = createReadStream(resolvedPath);
      fileStream.pipe(res);

      fileStream.on('error', (error: any) => {
        logger.error('MediaRoutes', 'Error streaming file', { error, resolvedPath });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file',
            code: 'STREAM_ERROR'
          });
        }
      });

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await logger.warn('MediaRoutes', 'File not found', { filePath, slug, filename });
        return res.status(404).json({
          success: false,
          message: 'Image not found',
          code: 'IMAGE_NOT_FOUND'
        });
      }
      throw error;
    }

  } catch (error) {
    await logger.error('MediaRoutes', 'GET /media/:slug/:filename failed', { error });
    next(error);
  }
});

/**
 * GET /api/media/:slug/gallery/:filename
 * Serves images from gallery subdirectories
 * (Handles nested gallery structure like couples/gallery/image.jpg)
 * NOTE: This route is now redundant - handled by /:slug/:subdirectory/:filename above
 */
router.get('/:slug/gallery/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, filename } = req.params;
    const size = (req.query.size as string) || 'original';

    await logger.info('MediaRoutes', 'GET /media/:slug/gallery/:filename', { slug, filename, size });

    // Validate size parameter
    if (!(size in SIZE_MAPPINGS)) {
      return res.status(400).json({
        success: false,
        message: `Invalid size parameter. Must be one of: ${Object.keys(SIZE_MAPPINGS).join(', ')}`,
        code: 'INVALID_SIZE'
      });
    }

    // Parse filename to get base name and extension
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);

    // Determine MIME type
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Build file path for gallery subdirectory
    let filePath: string;

    if (size === 'original' || !mimeType.startsWith('image/')) {
      // Original file in gallery subdirectory
      filePath = path.join(CONTENT_DIR, slug, 'gallery', filename);
    } else {
      // Thumbnail in gallery/.thumbnails
      const sizeSuffix = SIZE_MAPPINGS[size];
      const thumbnailFilename = `${baseName}${sizeSuffix}.webp`;
      filePath = path.join(CONTENT_DIR, slug, 'gallery', '.thumbnails', thumbnailFilename);

      // Fall back to original if thumbnail doesn't exist
      try {
        await fs.access(filePath);
      } catch {
        filePath = path.join(CONTENT_DIR, slug, 'gallery', filename);
      }
    }

    // Security: Prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const contentDirResolved = path.resolve(CONTENT_DIR);

    if (!resolvedPath.startsWith(contentDirResolved)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    // Check if file exists and serve
    try {
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      // Set headers
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('ETag', `"${stats.size}-${stats.mtimeMs}"`);

      // Stream the file using fs.createReadStream
      const fileStream = createReadStream(resolvedPath);
      fileStream.pipe(res);

      fileStream.on('error', (error: any) => {
        logger.error('MediaRoutes', 'Error streaming gallery file', { error, resolvedPath });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file',
            code: 'STREAM_ERROR'
          });
        }
      });

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
          code: 'IMAGE_NOT_FOUND'
        });
      }
      throw error;
    }

  } catch (error) {
    await logger.error('MediaRoutes', 'GET /media/:slug/gallery/:filename failed', { error });
    next(error);
  }
});

export default router;
