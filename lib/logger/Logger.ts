/**
 * Centralized Logger Class
 * 
 * Provides structured logging with categories, levels, and automatic file writing.
 * 
 * Usage:
 *   import { Logger, LogCategory } from '@/lib/logger';
 *   
 *   const logger = Logger.getInstance();
 *   logger.error(LogCategory.API, 'Failed to fetch data', { userId: '123' });
 *   logger.warn(LogCategory.DATABASE, 'Slow query detected', { duration: 5000 });
 *   logger.info(LogCategory.AUTH, 'User logged in', { userId: '123' });
 */

import fs from 'fs';
import path from 'path';
import { LogLevel, LogCategory, LogEntry, LoggerConfig } from './types';

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logDir: string;
  private isInitialized = false;

  private constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      minLevel: LogLevel.DEBUG,
      categories: Object.values(LogCategory),
      fileLogging: true,
      consoleLogging: true,
    };
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize the logger
   */
  initialize(): void {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    this.ensureLogDirectory();
    this.clearOldLogs();
    this.interceptConsole();
    this.isInitialized = true;

    console.log('📝 Logger initialized. Logs directory:', this.logDir);
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Clear old logs on startup
   */
  private clearOldLogs(): void {
    try {
      const timestamp = new Date().toISOString();
      
      // Create/clear main log files
      fs.writeFileSync(
        path.join(this.logDir, 'all.log'),
        `=== All Logs Started at ${timestamp} ===\n\n`,
        'utf8'
      );

      // Create/clear category-specific log files
      Object.values(LogCategory).forEach(category => {
        const filename = `${category.toLowerCase()}.log`;
        fs.writeFileSync(
          path.join(this.logDir, filename),
          `=== ${category} Logs Started at ${timestamp} ===\n\n`,
          'utf8'
        );
      });

      // Create/clear level-specific log files
      fs.writeFileSync(
        path.join(this.logDir, 'errors.log'),
        `=== Error Logs Started at ${timestamp} ===\n\n`,
        'utf8'
      );
      fs.writeFileSync(
        path.join(this.logDir, 'warnings.log'),
        `=== Warning Logs Started at ${timestamp} ===\n\n`,
        'utf8'
      );
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  }

  /**
   * Intercept console methods to capture all logs automatically
   */
  private interceptConsole(): void {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalInfo = console.info;

    console.error = (...args: unknown[]) => {
      this.log(LogLevel.ERROR, LogCategory.GENERAL, this.formatArgs(args), args);
      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      this.log(LogLevel.WARN, LogCategory.GENERAL, this.formatArgs(args), args);
      originalWarn(...args);
    };

    console.info = (...args: unknown[]) => {
      this.log(LogLevel.INFO, LogCategory.GENERAL, this.formatArgs(args), args);
      originalInfo(...args);
    };

    console.log = (...args: unknown[]) => {
      this.log(LogLevel.DEBUG, LogCategory.GENERAL, this.formatArgs(args), args);
      originalLog(...args);
    };
  }

  /**
   * Format arguments for logging
   */
  private formatArgs(args: unknown[]): string {
    return args
      .map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  /**
   * Main logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown
  ): void {
    if (!this.config.enabled) {
      return;
    }

    if (!this.isInitialized) {
      this.initialize();
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data && data !== message ? data : undefined,
    };

    // Extract error if present
    if (data instanceof Error) {
      entry.error = data;
      entry.stack = data.stack;
    } else if (Array.isArray(data)) {
      const errorInArray = data.find(item => item instanceof Error);
      if (errorInArray) {
        entry.error = errorInArray;
        entry.stack = errorInArray.stack;
      }
    }

    this.writeToFiles(entry);
  }

  /**
   * Write log entry to appropriate files
   */
  private writeToFiles(entry: LogEntry): void {
    if (!this.config.fileLogging) {
      return;
    }

    const formattedEntry = this.formatLogEntry(entry);

    try {
      // Write to all.log
      fs.appendFileSync(
        path.join(this.logDir, 'all.log'),
        formattedEntry,
        'utf8'
      );

      // Write to category-specific log
      const categoryFile = `${entry.category.toLowerCase()}.log`;
      fs.appendFileSync(
        path.join(this.logDir, categoryFile),
        formattedEntry,
        'utf8'
      );

      // Write to level-specific logs
      if (entry.level === LogLevel.ERROR) {
        fs.appendFileSync(
          path.join(this.logDir, 'errors.log'),
          formattedEntry,
          'utf8'
        );
      } else if (entry.level === LogLevel.WARN) {
        fs.appendFileSync(
          path.join(this.logDir, 'warnings.log'),
          formattedEntry,
          'utf8'
        );
      }
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  /**
   * Format log entry for file output
   */
  private formatLogEntry(entry: LogEntry): string {
    let output = `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}\n`;

    if (entry.data) {
      try {
        const dataStr = typeof entry.data === 'object' 
          ? JSON.stringify(entry.data, null, 2)
          : String(entry.data);
        output += `Data: ${dataStr}\n`;
      } catch {
        output += `Data: [Unable to serialize]\n`;
      }
    }

    if (entry.stack) {
      output += `Stack: ${entry.stack}\n`;
    }

    output += '='.repeat(80) + '\n';
    return output;
  }

  // Public API methods

  /**
   * Log an error
   */
  error(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Log a warning
   */
  warn(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log an info message
   */
  info(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log a debug message
   */
  debug(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
