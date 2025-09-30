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

const logger = createLogger('backend-admin.log');
const router = Router();

// Global content scanner instance (will be set by server on startup)
export let contentScanner: ContentScanner | null = null;

export function setContentScanner(scanner: ContentScanner) {
  contentScanner = scanner;
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

export default router;