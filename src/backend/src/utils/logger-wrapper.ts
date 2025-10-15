/**
 * Logger Wrapper for TypeScript
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * TypeScript wrapper around the project's logger.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamically resolve logger.js path (works in both dev and production)
// From dist/utils/ go up to project root, then into src/
const loggerPath = join(__dirname, '../../../logger.js');
const loggerURL = pathToFileURL(loggerPath).href;

// @ts-ignore - JavaScript module
const { createLogger: createLoggerJS } = await import(loggerURL);

export interface Logger {
  info(message: string, ...args: any[]): Promise<void>;
  error(message: string, ...args: any[]): Promise<void>;
  warn(message: string, ...args: any[]): Promise<void>;
  debug(message: string, ...args: any[]): Promise<void>;
}

export function createLogger(logFileName: string): Logger {
  return createLoggerJS(logFileName) as Logger;
}