/**
 * Rate Limiter Middleware
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Rate limiting to prevent abuse using rate-limiter-flexible with Redis backing
 */
import { Request, Response, NextFunction } from 'express';
export declare function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
