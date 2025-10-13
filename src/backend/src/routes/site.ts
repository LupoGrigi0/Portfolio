/**
 * Site Configuration Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-10-13
 *
 * Endpoints for managing site-wide configuration (branding, contact info, social links)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger-wrapper.js';

const logger = createLogger('backend-site.log');
const router = Router();

// In-memory cache for site config
let configCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * GET /api/site/config
 * Fetch site-wide configuration
 *
 * Returns site configuration with image paths resolved to media URLs
 */
router.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logger.info('SiteRoutes', 'GET /config - Fetching site configuration');

    // Check cache first
    const now = Date.now();
    if (configCache && (now - cacheTimestamp) < CACHE_TTL) {
      await logger.debug('SiteRoutes', 'Returning cached site config');
      return res.json({
        success: true,
        data: configCache,
        cached: true
      });
    }

    // Load from filesystem
    const contentDir = process.env.CONTENT_DIRECTORY || 'E:/mnt/lupoportfolio/content';
    const brandingDir = path.join(contentDir, 'branding');
    const configPath = path.join(brandingDir, 'site-config.json');

    // Check if config file exists
    try {
      await fs.access(configPath);
    } catch (error) {
      await logger.warn('SiteRoutes', 'site-config.json not found', { configPath });

      // Return default config if file doesn't exist
      const defaultConfig = {
        siteName: 'Modern Art Portfolio',
        tagline: '',
        copyright: `© ${new Date().getFullYear()} All rights reserved.`,
        contact: {},
        social: [],
        branding: {},
        seo: {
          description: 'Art Portfolio',
          keywords: []
        }
      };

      return res.json({
        success: true,
        data: defaultConfig,
        default: true,
        message: 'Using default configuration. Create site-config.json in branding directory to customize.'
      });
    }

    // Read and parse config file
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Transform relative image paths to absolute media URLs
    if (config.branding) {
      const baseUrl = `/api/media/branding`;

      if (config.branding.logo) {
        config.branding.logoUrl = `${baseUrl}/${config.branding.logo}`;
      }
      if (config.branding.favicon) {
        config.branding.faviconUrl = `${baseUrl}/${config.branding.favicon}`;
      }
      if (config.branding.appleTouchIcon) {
        config.branding.appleTouchIconUrl = `${baseUrl}/${config.branding.appleTouchIcon}`;
      }
    }

    // Cache the result
    configCache = config;
    cacheTimestamp = now;

    await logger.info('SiteRoutes', 'Site config loaded successfully', { configPath });

    res.json({
      success: true,
      data: config
    });

  } catch (error: any) {
    await logger.error('SiteRoutes', 'GET /config failed', { error });

    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        message: 'site-config.json contains invalid JSON',
        code: 'INVALID_JSON',
        error: {
          code: 'INVALID_JSON',
          message: error.message,
          suggestion: 'Check site-config.json for syntax errors'
        }
      });
    }

    next(error);
  }
});

/**
 * PUT /api/site/config
 * Update site-wide configuration
 *
 * Development mode only - updates both filesystem and cache
 * Body: JSON object representing the new site config
 */
router.put('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev) {
      return res.status(403).json({
        success: false,
        message: 'Site config updates only available in development mode',
        code: 'PRODUCTION_MODE'
      });
    }

    const newConfig = req.body;

    await logger.info('SiteRoutes', 'PUT /config - Updating site configuration', { config: newConfig });

    // Validate config object
    if (typeof newConfig !== 'object' || newConfig === null) {
      return res.status(400).json({
        success: false,
        message: 'Config must be a valid JSON object',
        code: 'INVALID_CONFIG'
      });
    }

    // Write to filesystem
    const contentDir = process.env.CONTENT_DIRECTORY || 'E:/mnt/lupoportfolio/content';
    const brandingDir = path.join(contentDir, 'branding');
    const configPath = path.join(brandingDir, 'site-config.json');

    // Ensure branding directory exists
    try {
      await fs.mkdir(brandingDir, { recursive: true });
    } catch (error: any) {
      await logger.error('SiteRoutes', 'Failed to create branding directory', { error });
      return res.status(500).json({
        success: false,
        message: 'Cannot create branding directory',
        code: 'MKDIR_ERROR',
        error: {
          code: 'MKDIR_ERROR',
          message: error.message,
          suggestion: 'Check directory permissions'
        }
      });
    }

    // Write config file with pretty formatting
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');

    // Invalidate cache
    configCache = null;
    cacheTimestamp = 0;

    await logger.info('SiteRoutes', 'Site config updated successfully', { configPath });

    res.json({
      success: true,
      message: 'Site configuration updated successfully',
      data: {
        config: newConfig,
        updatedAt: new Date().toISOString(),
        path: configPath
      }
    });

  } catch (error: any) {
    await logger.error('SiteRoutes', 'PUT /config failed', { error });
    next(error);
  }
});

/**
 * POST /api/site/config
 * Alternative POST version for easier testing (dev mode only)
 */
router.post('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev) {
      return res.status(403).json({
        success: false,
        message: 'Site config updates only available in development mode',
        code: 'PRODUCTION_MODE'
      });
    }

    const newConfig = req.body;

    await logger.info('SiteRoutes', 'POST /config - Updating site configuration', { config: newConfig });

    // Validate config object
    if (typeof newConfig !== 'object' || newConfig === null) {
      return res.status(400).json({
        success: false,
        message: 'Config must be a valid JSON object',
        code: 'INVALID_CONFIG'
      });
    }

    // Write to filesystem
    const contentDir = process.env.CONTENT_DIRECTORY || 'E:/mnt/lupoportfolio/content';
    const brandingDir = path.join(contentDir, 'branding');
    const configPath = path.join(brandingDir, 'site-config.json');

    // Ensure branding directory exists
    try {
      await fs.mkdir(brandingDir, { recursive: true });
    } catch (error: any) {
      await logger.error('SiteRoutes', 'Failed to create branding directory', { error });
      return res.status(500).json({
        success: false,
        message: 'Cannot create branding directory',
        code: 'MKDIR_ERROR',
        error: {
          code: 'MKDIR_ERROR',
          message: error.message,
          suggestion: 'Check directory permissions'
        }
      });
    }

    // Write config file with pretty formatting
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');

    // Invalidate cache
    configCache = null;
    cacheTimestamp = 0;

    await logger.info('SiteRoutes', 'Site config updated successfully', { configPath });

    res.json({
      success: true,
      message: 'Site configuration updated successfully',
      data: {
        config: newConfig,
        updatedAt: new Date().toISOString(),
        path: configPath
      }
    });

  } catch (error: any) {
    await logger.error('SiteRoutes', 'POST /config failed', { error });
    next(error);
  }
});

/**
 * DELETE /api/site/config/cache
 * Clear the in-memory cache (dev convenience)
 */
router.delete('/config/cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logger.info('SiteRoutes', 'DELETE /config/cache - Clearing cache');

    configCache = null;
    cacheTimestamp = 0;

    res.json({
      success: true,
      message: 'Site config cache cleared'
    });

  } catch (error: any) {
    await logger.error('SiteRoutes', 'DELETE /config/cache failed', { error });
    next(error);
  }
});

/**
 * GET /api/site/config/cache
 * Dev convenience: GET version of cache clear
 */
router.get('/config/cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logger.info('SiteRoutes', 'GET /config/cache - Clearing cache (dev convenience)');

    configCache = null;
    cacheTimestamp = 0;

    res.json({
      success: true,
      message: 'Site config cache cleared'
    });

  } catch (error: any) {
    await logger.error('SiteRoutes', 'GET /config/cache failed', { error });
    next(error);
  }
});

export default router;
