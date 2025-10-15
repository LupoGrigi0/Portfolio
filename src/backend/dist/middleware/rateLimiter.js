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
// Create rate limiter for public endpoints (content, social, media)
// Increased limits to support large galleries (100+ images per page)
export const rateLimiter = new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // Number of requests (was 100)
    duration: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60, // Time window in seconds (15 min)
    blockDuration: 60, // Block for 60 seconds if limit exceeded
});
// Create separate rate limiter for admin endpoints (much higher limit)
export const adminRateLimiter = new RateLimiterMemory({
    points: parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '5000'), // Higher limit for admin/diagnostic tools
    duration: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW || '15') * 60, // Same window (15 min)
    blockDuration: 30, // Shorter block duration
});
/**
 * Reset rate limit for a specific IP or all IPs
 * @param identifier - IP address to reset, or undefined to reset all
 */
export async function resetRateLimit(identifier) {
    if (identifier) {
        // Reset specific IP
        await rateLimiter.delete(identifier);
        await logger.info('RateLimiter', `Rate limit reset for IP: ${identifier}`);
    }
    else {
        // Reset all - not directly supported by library, but we can log it
        // The RateLimiterMemory doesn't have a clear all method, but limits expire naturally
        await logger.info('RateLimiter', 'Rate limit reset requested (limits will expire naturally)');
    }
}
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
                limit: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
            },
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Admin rate limiter middleware with higher limits
 */
export async function adminRateLimiterMiddleware(req, res, next) {
    // Skip rate limiting in development mode for admin endpoints
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        return next();
    }
    try {
        // Use IP address as identifier
        const identifier = req.ip || req.connection.remoteAddress || 'unknown';
        await adminRateLimiter.consume(identifier);
        next();
    }
    catch (rejRes) {
        // Admin rate limit exceeded (very rare - 1000 requests per window!)
        await logger.warn('AdminRateLimiter', 'Admin rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many admin requests',
            code: 'ADMIN_RATE_LIMIT_EXCEEDED',
            details: {
                retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 30,
                limit: parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '5000'),
                windowMs: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW || '15') * 60 * 1000,
            },
            timestamp: new Date().toISOString(),
        });
    }
}
