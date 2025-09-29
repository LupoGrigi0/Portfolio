/**
 * Health Check Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Health check endpoints for monitoring and deployment
 */
import { Router } from 'express';
import { createLogger } from '../utils/logger-wrapper.js';
const logger = createLogger('backend-health.log');
const router = Router();
/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        });
    }
    catch (error) {
        await logger.error('Health', 'Health check failed', { error });
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * GET /api/health/detailed
 * Detailed health check including database and services
 */
router.get('/detailed', async (req, res) => {
    const health = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: 'unknown',
            redis: 'unknown',
            fileSystem: 'unknown',
        },
    };
    // TODO: Add actual service health checks
    // - Database connection test
    // - Redis connection test
    // - File system access test
    res.json(health);
});
export default router;
