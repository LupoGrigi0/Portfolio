/**
 * Rate Limiter Middleware
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Rate limiting to prevent abuse using rate-limiter-flexible with Redis backing
 */
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
export declare const rateLimiter: RateLimiterMemory;
/**
 * Reset rate limit for a specific IP or all IPs
 * @param identifier - IP address to reset, or undefined to reset all
 */
export declare function resetRateLimit(identifier?: string): Promise<void>;
export declare function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
