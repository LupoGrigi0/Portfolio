/**
 * Rate Limiter Middleware
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Rate limiting to prevent abuse using rate-limiter-flexible with Redis backing
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createLogger } from '../utils/logger-wrapper.js';

const logger = createLogger('backend-ratelimit.log');

// Create rate limiter with in-memory store (will upgrade to Redis later)
export const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60, // Time window in seconds
  blockDuration: 60, // Block for 60 seconds if limit exceeded
});

/**
 * Reset rate limit for a specific IP or all IPs
 * @param identifier - IP address to reset, or undefined to reset all
 */
export async function resetRateLimit(identifier?: string): Promise<void> {
  if (identifier) {
    // Reset specific IP
    await rateLimiter.delete(identifier);
    await logger.info('RateLimiter', `Rate limit reset for IP: ${identifier}`);
  } else {
    // Reset all - not directly supported by library, but we can log it
    // The RateLimiterMemory doesn't have a clear all method, but limits expire naturally
    await logger.info('RateLimiter', 'Rate limit reset requested (limits will expire naturally)');
  }
}

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use IP address as identifier
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';

    await rateLimiter.consume(identifier);
    next();
  } catch (rejRes: any) {
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