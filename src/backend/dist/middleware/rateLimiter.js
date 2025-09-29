/**
 * Rate Limiter Middleware
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Rate limiting to prevent abuse using rate-limiter-flexible with Redis backing
 */
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createLogger } from '../utils/logger-wrapper.js';
const logger = createLogger('backend-ratelimit.log');
// Create rate limiter with in-memory store (will upgrade to Redis later)
const rateLimiter = new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Number of requests
    duration: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60, // Time window in seconds
    blockDuration: 60, // Block for 60 seconds if limit exceeded
});
export async function rateLimiterMiddleware(req, res, next) {
    try {
        // Use IP address as identifier
        const identifier = req.ip || req.connection.remoteAddress || 'unknown';
        await rateLimiter.consume(identifier);
        next();
    }
    catch (rejRes) {
        // Rate limit exceeded
        await logger.warn('RateLimiter', 'Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
                retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60,
                limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
            },
            timestamp: new Date().toISOString(),
        });
    }
}
