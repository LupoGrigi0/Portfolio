/**
 * Type declarations for logger.js
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 */

declare module '../../../../../src/logger.js' {
  export class Logger {
    constructor(logDir?: string, logFileName?: string, forceFileOnly?: boolean);
    initialize(): Promise<void>;
    log(level: string, message: string, ...args: any[]): Promise<void>;
    info(message: string, ...args: any[]): Promise<void>;
    error(message: string, ...args: any[]): Promise<void>;
    warn(message: string, ...args: any[]): Promise<void>;
    debug(message: string, ...args: any[]): Promise<void>;
  }

  export function createLogger(logFileName: string, forceFileOnly?: boolean): Logger;
  export const logger: Logger;
}