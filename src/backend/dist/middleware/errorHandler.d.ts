/**
 * Error Handler Middleware
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Centralized error handling for Express routes
 */
import { Request, Response, NextFunction } from 'express';
export interface APIError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}
export declare function errorHandler(err: APIError, req: Request, res: Response, next: NextFunction): void;
