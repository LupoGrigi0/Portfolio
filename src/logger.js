/**
 * Simple file logger for MCP server to avoid stdout/stderr pollution and facilitate debugging.
 * In stdio mode, logs are written only to a file to maintain JSON-RPC compliance.
 * In non-stdio mode, logs are written to both stderr and a file.
 * Custom log file names can be specified for different logger instances. and log different modules, like front end, infrastructure, back end, etc.
 * The logger ensures the logs directory exists and handles errors gracefully to avoid crashing the server.
 * Can be configured to force file-only logging regardless of mode.
 * Usage:
 *   import { logger, createLogger } from './logger.js';
 *  logger.info('This is an info message');
 *  const customLogger = createLogger('custom-module.log');
 * customLogger.error('This is an error message from custom module');
 * customLogger.debug('Debugging details', { detail: 'value' });
 * Default log file is 'logs/Portfolio.log'.
 * @module logger
 * @requires fs/promises
 * @requires path
 * @author Lupo, ClaudeCode (Claude Leclerc)
 * @license MIT
 */
import { appendFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';

class Logger {
  constructor(logDir = 'logs', logFileName = 'Portfolio.log', forceFileOnly = false) {
    this.logDir = logDir;
    this.logFileName = logFileName; // Allow custom log file names
    this.forceFileOnly = forceFileOnly; // Store the explicit file-only flag
    this.isStdioMode = forceFileOnly || 
                      process.env.MCP_MODE === 'stdio' || 
                      process.argv.some(arg => arg.includes('mcp-server.js'));
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await mkdir(this.logDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      // If we can't create logs directory in stdio mode, fail silently to maintain JSON-RPC compliance
      // In non-stdio mode, stderr is acceptable but stdout pollution still risky
    }
  }

  async log(level, message, ...args) {
    await this.initialize();
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}\n`;
    
    if (this.isStdioMode || this.forceFileOnly) {
      // In stdio mode or forced file-only mode, ONLY write to file to avoid JSON-RPC pollution
      try {
        const logFile = join(this.logDir, this.logFileName);
        await appendFile(logFile, logEntry);
      } catch (error) {
        // Silent fail - can't pollute stdio stream or when file-only is forced
      }
    } else {
      // In non-stdio mode, use stderr for logging to avoid stdout pollution
      process.stderr.write(`${level.toUpperCase()}: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}\n`);
      try {
        const logFile = join(this.logDir, this.logFileName);
        await appendFile(logFile, logEntry);
      } catch (error) {
        // Silent fail in stdio mode to maintain JSON-RPC compliance
        if (!this.isStdioMode) {
          process.stderr.write(`Failed to write to log file: ${error.message}\n`);
        }
      }
    }
  }

  async info(message, ...args) {
    await this.log('info', message, ...args);
  }

  async error(message, ...args) {
    await this.log('error', message, ...args);
  }

  async warn(message, ...args) {
    await this.log('warn', message, ...args);
  }

  async debug(message, ...args) {
    await this.log('debug', message, ...args);
  }
}

// Factory function to create logger instances with custom log files
export function createLogger(logFileName, forceFileOnly = false) {
  return new Logger('logs', logFileName, forceFileOnly);
}

// Export singleton instance (default behavior - unchanged)
export const logger = new Logger();