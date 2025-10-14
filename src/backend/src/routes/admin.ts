/**
 * Admin Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Administrative endpoints for content management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger-wrapper.js';
import { DatabaseManager } from '../services/DatabaseManager.js';
import { ContentScanner } from '../services/ContentScanner.js';
import { resetRateLimit } from '../middleware/rateLimiter.js';

const logger = createLogger('backend-admin.log');
const router = Router();

// Global content scanner instance (will be set by server on startup)
export let contentScanner: ContentScanner | null = null;
export let dbManager: DatabaseManager | null = null;

export function setContentScanner(scanner: ContentScanner) {
  contentScanner = scanner;
}

export function setDatabaseManager(manager: DatabaseManager) {
  dbManager = manager;
}

/**
 * POST /api/admin/scan
 * Trigger content directory scan
 */
router.post('/scan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logger.info('AdminRoutes', 'POST /scan - Manual scan triggered');

    if (!contentScanner) {
      return res.status(500).json({
        success: false,
        message: 'Content scanner not initialized',
      });
    }

    // Run scan in background to avoid timeout
    const scanPromise = contentScanner.scanAll();

    // Return immediately
    res.json({
      success: true,
      message: 'Content scan initiated',
      data: {
        status: 'scanning',
        startedAt: new Date().toISOString(),
      },
    });

    // Wait for scan to complete in background
    const result = await scanPromise;
    await logger.info('AdminRoutes', 'Content scan completed', result);

  } catch (error) {
    await logger.error('AdminRoutes', 'POST /scan failed', { error });
    next(error);
  }
});

/**
 * POST /api/admin/scan/:slug
 * Trigger content scan for a specific directory
 * Query params:
 *   - mode: 'full' (purge & rebuild), 'incremental' (add/update/cleanup), 'lightweight' (filesystem-only)
 *   Default: 'incremental'
 */
router.post('/scan/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const mode = (req.query.mode as string) || 'incremental';

    // Validate mode parameter
    if (!['full', 'incremental', 'lightweight'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid scan mode: ${mode}. Must be 'full', 'incremental', or 'lightweight'`,
      });
    }

    await logger.info('AdminRoutes', `POST /scan/${slug} - Manual directory scan triggered`, { mode });

    if (!contentScanner) {
      return res.status(500).json({
        success: false,
        message: 'Content scanner not initialized',
      });
    }

    // Run scan in background to avoid timeout for large directories
    const scanPromise = contentScanner.scanBySlug(slug, mode as 'full' | 'incremental' | 'lightweight');

    // Return immediately
    res.json({
      success: true,
      message: `Content scan initiated for directory: ${slug} (mode: ${mode})`,
      data: {
        status: 'scanning',
        slug,
        mode,
        startedAt: new Date().toISOString(),
      },
    });

    // Wait for scan to complete in background
    const result = await scanPromise;
    await logger.info('AdminRoutes', `Directory scan completed for ${slug}`, { mode, result });

  } catch (error) {
    await logger.error('AdminRoutes', `POST /scan/:slug failed for ${req.params.slug}`, { error });
    next(error);
  }
});

/**
 * POST /api/admin/thumbnails/:slug
 * Generate thumbnails for a specific directory (Phase 2)
 * Run this after metadata scan completes
 */
router.post('/thumbnails/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    await logger.info('AdminRoutes', `POST /thumbnails/${slug} - Thumbnail generation triggered`);

    if (!contentScanner) {
      return res.status(500).json({
        success: false,
        message: 'Content scanner not initialized',
      });
    }

    // Run thumbnail generation in background
    const thumbPromise = contentScanner.generateThumbnailsForDirectory(slug);

    // Return immediately
    res.json({
      success: true,
      message: `Thumbnail generation initiated for directory: ${slug}`,
      data: {
        status: 'generating',
        slug,
        startedAt: new Date().toISOString(),
      },
    });

    // Wait for generation to complete in background
    const result = await thumbPromise;
    await logger.info('AdminRoutes', `Thumbnail generation completed for ${slug}`, result);

  } catch (error) {
    await logger.error('AdminRoutes', `POST /thumbnails/:slug failed for ${req.params.slug}`, { error });
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Get portfolio statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logger.info('AdminRoutes', 'GET /stats');

    // TODO: Implement statistics gathering
    res.json({
      success: true,
      data: {
        directories: 0,
        images: 0,
        reactions: 0,
        comments: 0,
        inquiries: 0,
      },
    });
  } catch (error) {
    await logger.error('AdminRoutes', 'GET /stats failed', { error });
    next(error);
  }
});

/**
 * POST /api/admin/reinit-db
 * Manually re-initialize the database connection
 * Use this if database becomes unresponsive or uninitialized at runtime
 */
router.post('/reinit-db', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logger.info('AdminRoutes', 'POST /reinit-db - Manual database re-initialization triggered');

    if (!dbManager) {
      return res.status(500).json({
        success: false,
        message: 'Database manager instance not available',
        code: 'DB_MANAGER_NOT_FOUND'
      });
    }

    // Close existing connection and re-initialize
    dbManager.close();
    await dbManager.initialize();

    await logger.info('AdminRoutes', 'Database re-initialized successfully');

    res.json({
      success: true,
      message: 'Database re-initialized successfully',
      data: {
        reinitializedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    await logger.error('AdminRoutes', 'POST /reinit-db failed', { error });
    next(error);
  }
});

/**
 * POST /api/admin/reset-rate-limit
 * Reset rate limit counters for testing purposes
 * Query params:
 *   - ip: (optional) Specific IP address to reset. If omitted, resets for the requesting IP
 */
router.post('/reset-rate-limit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetIp = (req.query.ip as string) || req.ip || req.connection.remoteAddress || 'unknown';

    await logger.info('AdminRoutes', 'POST /reset-rate-limit - Rate limit reset triggered', { targetIp });

    // Reset rate limit for the specified IP
    await resetRateLimit(targetIp);

    res.json({
      success: true,
      message: `Rate limit reset for IP: ${targetIp}`,
      data: {
        resetAt: new Date().toISOString(),
        ip: targetIp
      }
    });

  } catch (error) {
    await logger.error('AdminRoutes', 'POST /reset-rate-limit failed', { error });
    next(error);
  }
});

/**
 * PUT /api/admin/config/:slug
 * Update collection configuration file
 * Body: JSON config object to save
 */
router.put('/config/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const config = req.body;

    await logger.info('AdminRoutes', `PUT /config/${slug} - Config update triggered`);

    if (!dbManager) {
      return res.status(500).json({
        success: false,
        message: 'Database manager not initialized',
      });
    }

    // Get directory info from database to verify it exists
    const directory = await dbManager.getDirectoryBySlug(slug) as any;
    if (!directory) {
      return res.status(404).json({
        success: false,
        error: `Directory not found: ${slug}`,
      });
    }

    // Get the actual filesystem path from an image in this directory
    // Images store absolute paths in exif_data.path
    const fs = await import('fs/promises');
    const path = await import('path');
    const contentDir = process.env.CONTENT_DIRECTORY || 'E:/mnt/lupoportfolio/content';

    const images = await dbManager.getImagesByDirectory(directory.id, 1);
    let dirPath: string;

    if (images.length > 0) {
      // Extract directory path from first image's path
      const imagePath = JSON.parse((images[0] as any).exif_data || '{}').path;
      if (imagePath) {
        dirPath = path.dirname(imagePath);
      } else {
        throw new Error(`No filesystem path found for collection: ${slug}`);
      }
    } else {
      // No images - try to infer from directory title
      // This is a fallback for empty collections
      dirPath = path.join(contentDir, directory.title);
    }

    const configPath = path.join(dirPath, 'config.json');

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    await logger.info('AdminRoutes', `Config written to filesystem for ${slug}`, { configPath });

    // Update database with full config JSON
    await logger.info('AdminRoutes', `Updating database cache for ${slug}`, { directoryId: directory.id, configKeys: Object.keys(config) });
    await dbManager.updateDirectoryConfig(directory.id, config);

    // Sync cached fields from config to directory table columns
    const cachedFields: any = {};

    if (config.title !== undefined) {
      cachedFields.title = config.title;
    }
    if (config.description !== undefined) {
      cachedFields.description = config.description;
    }
    if (config.isFeatured !== undefined) {
      cachedFields.featured = config.isFeatured;
    }
    if (config.order !== undefined) {
      cachedFields.menuOrder = config.order;
    }
    if (config.status !== undefined) {
      cachedFields.status = config.status;
    }

    // Handle coverImage - validate it exists in filesystem if provided
    if (config.coverImage !== undefined && config.coverImage !== null && config.coverImage !== '') {
      // Validate that the cover image path exists
      const coverImagePath = path.isAbsolute(config.coverImage)
        ? config.coverImage
        : path.join(dirPath, config.coverImage);

      try {
        await fs.access(coverImagePath);
        cachedFields.coverImage = coverImagePath;
        await logger.info('AdminRoutes', `Cover image validated`, { coverImagePath });
      } catch (error) {
        await logger.warn('AdminRoutes', `Cover image not found, skipping cache update`, {
          configCoverImage: config.coverImage,
          resolvedPath: coverImagePath
        });
      }
    } else if (config.coverImage === null || config.coverImage === '') {
      // Clear cover image if explicitly set to null or empty string
      cachedFields.coverImage = null;
    }

    // Update cached fields if any were changed
    if (Object.keys(cachedFields).length > 0) {
      await logger.info('AdminRoutes', `Updating cached directory fields`, { cachedFields });
      await dbManager.updateDirectoryCachedFields(directory.id, cachedFields);
      await logger.info('AdminRoutes', `Cached fields updated successfully`);
    }

    await logger.info('AdminRoutes', `Database cache updated successfully for ${slug}`);

    // Verify the update by reading back
    const verifyDirectory = await dbManager.getDirectoryBySlug(slug) as any;
    const verifyConfig = JSON.parse(verifyDirectory.config || '{}');
    await logger.info('AdminRoutes', `Verification read - config keys in DB`, {
      configKeys: Object.keys(verifyConfig),
      title: verifyDirectory.title,
      description: verifyDirectory.description,
      coverImage: verifyDirectory.cover_image
    });

    const updatedAt = new Date().toISOString();
    await logger.info('AdminRoutes', `Config updated successfully for ${slug}`, { configPath });

    res.json({
      success: true,
      message: `Config saved successfully for ${slug}`,
      config,
      path: configPath,
      updatedAt,
    });

  } catch (error: any) {
    await logger.error('AdminRoutes', `PUT /config/:slug failed for ${req.params.slug}`, { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update config',
    });
  }
});

export default router;