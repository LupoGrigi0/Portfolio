/**
 * Frontend Logger - Browser-compatible logging with module filtering
 *
 * Adapted from backend logger.js for Next.js frontend use.
 * Prevents console spam by allowing module-level control of logging.
 *
 * Features:
 * - Module name filtering (whitelist/blacklist)
 * - Log level control (DEBUG, INFO, WARN, ERROR)
 * - Styled console output with timestamps
 * - Optional backend logging via API
 * - Environment-based configuration
 *
 * Usage:
 *   import { createLogger } from '@/lib/logger';
 *   const logger = createLogger('Carousel');
 *   logger.info('Image loaded', { imageId: '123' });
 *   logger.debug('State update', { currentIndex: 5 });
 *
 * Configuration (env or runtime):
 *   LOG_LEVEL: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE'
 *   LOG_MODULES: 'Carousel,PageRenderer' (whitelist) or '*' (all)
 *   LOG_EXCLUDE: 'MidgroundProjection' (blacklist)
 *
 * @module logger
 * @author Kat (Performance Specialist)
 * @created 2025-10-16
 */

// Log levels (higher number = more severe)
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 999
}

// Logger configuration (can be updated at runtime)
interface LoggerConfig {
  level: LogLevel;
  enabledModules: Set<string> | 'ALL';
  disabledModules: Set<string>;
  useColors: boolean;
  sendToBackend: boolean;
  backendUrl?: string;
}

// Global logger configuration
const config: LoggerConfig = {
  level: LogLevel.INFO, // Default: INFO and above
  enabledModules: 'ALL', // Default: all modules enabled
  disabledModules: new Set<string>(), // Default: none disabled
  useColors: true,
  sendToBackend: false, // Optional: send logs to backend for persistence
  backendUrl: undefined
};

// Initialize from environment variables (Next.js)
if (typeof window !== 'undefined') {
  // Client-side initialization
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
  if (envLevel && envLevel in LogLevel) {
    config.level = LogLevel[envLevel as keyof typeof LogLevel];
  }

  const envModules = process.env.NEXT_PUBLIC_LOG_MODULES;
  if (envModules && envModules !== '*') {
    config.enabledModules = new Set(envModules.split(',').map(m => m.trim()));
  }

  const envExclude = process.env.NEXT_PUBLIC_LOG_EXCLUDE;
  if (envExclude) {
    config.disabledModules = new Set(envExclude.split(',').map(m => m.trim()));
  }
}

/**
 * Configure logger at runtime
 * Useful for dynamic control via Lightboard or dev tools
 */
export function configureLogger(options: Partial<LoggerConfig>) {
  if (options.level !== undefined) config.level = options.level;
  if (options.enabledModules !== undefined) config.enabledModules = options.enabledModules;
  if (options.disabledModules !== undefined) config.disabledModules = options.disabledModules;
  if (options.useColors !== undefined) config.useColors = options.useColors;
  if (options.sendToBackend !== undefined) config.sendToBackend = options.sendToBackend;
  if (options.backendUrl !== undefined) config.backendUrl = options.backendUrl;
}

/**
 * Check if a module should log at given level
 */
function shouldLog(moduleName: string, level: LogLevel): boolean {
  // Check log level
  if (level < config.level) return false;

  // Check if module is disabled
  if (config.disabledModules.has(moduleName)) return false;

  // Check if module is enabled
  if (config.enabledModules === 'ALL') return true;
  return config.enabledModules.has(moduleName);
}

/**
 * Format timestamp
 */
function formatTimestamp(): string {
  return new Date().toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.mmm
}

/**
 * Get color for log level (for styled console output)
 */
function getColors(level: LogLevel): { bg: string; fg: string } {
  switch (level) {
    case LogLevel.DEBUG:
      return { bg: '#6B7280', fg: '#F3F4F6' }; // Gray
    case LogLevel.INFO:
      return { bg: '#3B82F6', fg: '#FFFFFF' }; // Blue
    case LogLevel.WARN:
      return { bg: '#F59E0B', fg: '#1F2937' }; // Yellow
    case LogLevel.ERROR:
      return { bg: '#EF4444', fg: '#FFFFFF' }; // Red
    default:
      return { bg: '#6B7280', fg: '#FFFFFF' };
  }
}

/**
 * Logger class for a specific module
 */
class Logger {
  constructor(private moduleName: string) {}

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!shouldLog(this.moduleName, level)) return;

    const timestamp = formatTimestamp();
    const levelName = LogLevel[level];
    const colors = getColors(level);

    // Format message
    const prefix = `[${timestamp}] [${this.moduleName}]`;

    if (config.useColors && typeof window !== 'undefined') {
      // Styled console output (browser only)
      const style = `background: ${colors.bg}; color: ${colors.fg}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`;
      console.log(`%c${levelName}%c ${prefix}`, style, 'color: #9CA3AF;', message, ...args);
    } else {
      // Plain output (SSR or colors disabled)
      console.log(`${levelName} ${prefix} ${message}`, ...args);
    }

    // Optional: Send to backend for persistence
    if (config.sendToBackend && config.backendUrl) {
      sendLogToBackend(level, this.moduleName, message, args);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Force log regardless of configuration (use sparingly)
   */
  force(message: string, ...args: any[]) {
    console.log(`[${this.moduleName}] ${message}`, ...args);
  }
}

/**
 * Optional: Send logs to backend for persistence
 * (Not implemented yet - requires backend endpoint)
 */
async function sendLogToBackend(
  level: LogLevel,
  module: string,
  message: string,
  args: any[]
) {
  if (!config.backendUrl) return;

  try {
    await fetch(`${config.backendUrl}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        level: LogLevel[level],
        module,
        message,
        data: args
      })
    });
  } catch (error) {
    // Silent fail - don't crash if backend logging fails
  }
}

/**
 * Factory function to create logger instances
 */
export function createLogger(moduleName: string): Logger {
  return new Logger(moduleName);
}

/**
 * Quick access to common loggers
 */
export const commonLoggers = {
  carousel: createLogger('Carousel'),
  projection: createLogger('MidgroundProjection'),
  pageRenderer: createLogger('PageRenderer'),
  navigation: createLogger('Navigation'),
  layout: createLogger('Layout'),
  lightboard: createLogger('Lightboard')
};

/**
 * Convenience function to disable all logging
 */
export function disableAllLogs() {
  config.level = LogLevel.NONE;
}

/**
 * Convenience function to enable debug logging for specific modules
 */
export function enableDebugFor(...modules: string[]) {
  config.level = LogLevel.DEBUG;
  config.enabledModules = new Set(modules);
}

/**
 * Convenience function to disable specific modules
 */
export function disableModules(...modules: string[]) {
  modules.forEach(m => config.disabledModules.add(m));
}

/**
 * Get current logger configuration (for debugging)
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config };
}

/**
 * Replace console.log globally (nuclear option)
 * Only use this if you need to catch ALL console.log calls
 */
export function interceptConsole() {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = function(...args: any[]) {
    if (config.level <= LogLevel.INFO) {
      originalLog.apply(console, args);
    }
  };

  console.warn = function(...args: any[]) {
    if (config.level <= LogLevel.WARN) {
      originalWarn.apply(console, args);
    }
  };

  console.error = function(...args: any[]) {
    if (config.level <= LogLevel.ERROR) {
      originalError.apply(console, args);
    }
  };
}

// Export default logger for quick use
export const logger = createLogger('App');
