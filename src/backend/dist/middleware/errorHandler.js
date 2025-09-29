/**
 * Error Handler Middleware
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Centralized error handling for Express routes
 */
import { createLogger } from '../utils/logger-wrapper.js';
const logger = createLogger('backend-errors.log');
export function errorHandler(err, req, res, next) {
    // Log error
    logger.error('ErrorHandler', 'Request error', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack,
        code: err.code,
    });
    // Determine status code
    const statusCode = err.statusCode || 500;
    // Prepare error response
    const response = {
        success: false,
        message: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
    };
    // Include details in development mode
    if (process.env.NODE_ENV === 'development' && err.details) {
        response.details = err.details;
    }
    // Include stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
}
