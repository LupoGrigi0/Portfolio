/**
 * Admin Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Administrative endpoints for content management
 */
import { Router } from 'express';
import { createLogger } from '../utils/logger-wrapper.js';
import { resetRateLimit } from '../middleware/rateLimiter.js';
const logger = createLogger('backend-admin.log');
const router = Router();
// Global content scanner instance (will be set by server on startup)
export let contentScanner = null;
export let dbManager = null;
export function setContentScanner(scanner) {
    contentScanner = scanner;
}
export function setDatabaseManager(manager) {
    dbManager = manager;
}
/**
 * POST /api/admin/scan
 * Trigger content directory scan
 */
router.post('/scan', async (req, res, next) => {
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
    }
    catch (error) {
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
router.post('/scan/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const mode = req.query.mode || 'incremental';
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
        const scanPromise = contentScanner.scanBySlug(slug, mode);
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
    }
    catch (error) {
        await logger.error('AdminRoutes', `POST /scan/:slug failed for ${req.params.slug}`, { error });
        next(error);
    }
});
/**
 * POST /api/admin/thumbnails/:slug
 * Generate thumbnails for a specific directory (Phase 2)
 * Run this after metadata scan completes
 */
router.post('/thumbnails/:slug', async (req, res, next) => {
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
    }
    catch (error) {
        await logger.error('AdminRoutes', `POST /thumbnails/:slug failed for ${req.params.slug}`, { error });
        next(error);
    }
});
/**
 * GET /api/admin/stats
 * Get portfolio statistics
 */
router.get('/stats', async (req, res, next) => {
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
    }
    catch (error) {
        await logger.error('AdminRoutes', 'GET /stats failed', { error });
        next(error);
    }
});
/**
 * POST /api/admin/reinit-db
 * Manually re-initialize the database connection
 * Use this if database becomes unresponsive or uninitialized at runtime
 */
router.post('/reinit-db', async (req, res, next) => {
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
    }
    catch (error) {
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
router.post('/reset-rate-limit', async (req, res, next) => {
    try {
        const targetIp = req.query.ip || req.ip || req.connection.remoteAddress || 'unknown';
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
    }
    catch (error) {
        await logger.error('AdminRoutes', 'POST /reset-rate-limit failed', { error });
        next(error);
    }
});
export default router;
