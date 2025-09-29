/**
 * Logger Wrapper for TypeScript
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * TypeScript wrapper around the project's logger.js
 */

// @ts-ignore - JavaScript module
import { createLogger as createLoggerJS } from '../../../../../src/logger.js';

export interface Logger {
  info(message: string, ...args: any[]): Promise<void>;
  error(message: string, ...args: any[]): Promise<void>;
  warn(message: string, ...args: any[]): Promise<void>;
  debug(message: string, ...args: any[]): Promise<void>;
}

export function createLogger(logFileName: string): Logger {
  return createLoggerJS(logFileName) as Logger;
}