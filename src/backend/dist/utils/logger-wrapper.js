/**
 * Logger Wrapper for TypeScript
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * TypeScript wrapper around the project's logger.js
 */
// @ts-ignore - JavaScript module
import { createLogger as createLoggerJS } from '../../../../../src/logger.js';
export function createLogger(logFileName) {
    return createLoggerJS(logFileName);
}
