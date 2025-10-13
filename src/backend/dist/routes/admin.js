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
import fs from 'fs/promises';
import path from 'path';
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
/**
 * GET /api/admin/reset-rate-limit
 * Dev convenience: GET version of reset-rate-limit for browser testing
 */
router.get('/reset-rate-limit', async (req, res, next) => {
    try {
        const targetIp = req.query.ip || req.ip || req.connection.remoteAddress || 'unknown';
        await logger.info('AdminRoutes', 'GET /reset-rate-limit - Rate limit reset triggered (dev convenience)', { targetIp });
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
        await logger.error('AdminRoutes', 'GET /reset-rate-limit failed', { error });
        next(error);
    }
});
/**
 * GET /api/admin/scan
 * Dev convenience: GET version of scan for browser testing
 */
router.get('/scan', async (req, res, next) => {
    try {
        await logger.info('AdminRoutes', 'GET /scan - Manual scan triggered (dev convenience)');
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
        await logger.error('AdminRoutes', 'GET /scan failed', { error });
        next(error);
    }
});
/**
 * GET /api/admin/scan/:slug
 * Dev convenience: GET version of scan/:slug for browser testing
 */
router.get('/scan/:slug', async (req, res, next) => {
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
        await logger.info('AdminRoutes', `GET /scan/${slug} - Manual directory scan triggered (dev convenience)`, { mode });
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
        await logger.error('AdminRoutes', `GET /scan/:slug failed for ${req.params.slug}`, { error });
        next(error);
    }
});
/**
 * GET /api/admin/reinit-db
 * Dev convenience: GET version of reinit-db for browser testing
 */
router.get('/reinit-db', async (req, res, next) => {
    try {
        await logger.info('AdminRoutes', 'GET /reinit-db - Manual database re-initialization triggered (dev convenience)');
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
        await logger.error('AdminRoutes', 'GET /reinit-db failed', { error });
        next(error);
    }
});
/**
 * PUT /api/admin/config/:slug
 * Update config.json for a collection
 * Body: JSON object representing the new config
 *
 * This enables visual portfolio crafting from the frontend!
 * Frontend can update collection settings and see changes in real-time.
 */
router.put('/config/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const newConfig = req.body;
        await logger.info('AdminRoutes', `PUT /config/${slug} - Updating collection config`, { config: newConfig });
        if (!dbManager) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        // Get directory from database to find filesystem path
        const directory = await dbManager.getDirectoryBySlug(slug);
        if (!directory) {
            return res.status(404).json({
                success: false,
                message: `Collection not found: ${slug}`,
                code: 'COLLECTION_NOT_FOUND'
            });
        }
        // Construct path to config.json
        // Get the directory name from an image's path in this directory
        const contentDir = process.env.CONTENT_DIRECTORY || 'E:/mnt/lupoportfolio/content';
        // Query an image to get the filesystem directory name
        const sampleImage = await dbManager.getDb().prepare("SELECT json_extract(exif_data, '$.path') as path FROM images WHERE directory_id = ? LIMIT 1").get(directory.id);
        let dirName;
        if (sampleImage && sampleImage.path) {
            // Extract directory name from full path
            // E.g., "E:\mnt\lupoportfolio\content\Scientists\file.jpg" -> "Scientists"
            const fullPath = sampleImage.path;
            // Normalize both paths to use forward slashes for consistent comparison
            const normalizedFullPath = fullPath.replace(/\\/g, '/');
            const normalizedContentDir = contentDir.replace(/\\/g, '/');
            const relativePath = normalizedFullPath.replace(normalizedContentDir, '').replace(/^[\\\/]+/, '');
            dirName = relativePath.split(/[\\\/]/)[0];
        }
        else {
            // Fallback: capitalize the slug (scientists -> Scientists)
            dirName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        const configPath = path.join(contentDir, dirName, 'config.json');
        // Validate config object (basic validation)
        if (typeof newConfig !== 'object' || newConfig === null) {
            return res.status(400).json({
                success: false,
                message: 'Config must be a valid JSON object',
                code: 'INVALID_CONFIG'
            });
        }
        // Write config.json to filesystem
        await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
        // Update database with new config - directly update the config field, don't merge
        const stmt = dbManager.getDb().prepare('UPDATE directories SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(JSON.stringify(newConfig), directory.id);
        await logger.info('AdminRoutes', `Config updated successfully for ${slug}`, { path: configPath });
        res.json({
            success: true,
            message: `Config updated for collection: ${slug}`,
            data: {
                slug,
                config: newConfig,
                updatedAt: new Date().toISOString(),
                path: configPath
            }
        });
    }
    catch (error) {
        await logger.error('AdminRoutes', `PUT /config/:slug failed for ${req.params.slug}`, { error });
        next(error);
    }
});
/**
 * POST /api/admin/config/:slug
 * Alternative POST version for easier testing
 */
router.post('/config/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const newConfig = req.body;
        await logger.info('AdminRoutes', `POST /config/${slug} - Updating collection config`, { config: newConfig });
        if (!dbManager) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        // Get directory from database to find filesystem path
        const directory = await dbManager.getDirectoryBySlug(slug);
        if (!directory) {
            return res.status(404).json({
                success: false,
                message: `Collection not found: ${slug}`,
                code: 'COLLECTION_NOT_FOUND'
            });
        }
        // Construct path to config.json
        const contentDir = process.env.CONTENT_DIRECTORY || 'E:/mnt/lupoportfolio/content';
        const dirPath = directory.path;
        const configPath = path.join(contentDir, dirPath, 'config.json');
        // Validate config object (basic validation)
        if (typeof newConfig !== 'object' || newConfig === null) {
            return res.status(400).json({
                success: false,
                message: 'Config must be a valid JSON object',
                code: 'INVALID_CONFIG'
            });
        }
        // Write config.json to filesystem
        await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
        // Update database with new config - directly update the config field, don't merge
        const stmt = dbManager.getDb().prepare('UPDATE directories SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(JSON.stringify(newConfig), directory.id);
        await logger.info('AdminRoutes', `Config updated successfully for ${slug}`, { path: configPath });
        res.json({
            success: true,
            message: `Config updated for collection: ${slug}`,
            data: {
                slug,
                config: newConfig,
                updatedAt: new Date().toISOString(),
                path: configPath
            }
        });
    }
    catch (error) {
        await logger.error('AdminRoutes', `POST /config/:slug failed for ${req.params.slug}`, { error });
        next(error);
    }
});
export default router;
