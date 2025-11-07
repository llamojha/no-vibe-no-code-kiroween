/**
 * Development Logger
 * 
 * Simple logging utility for development only.
 * Provides functions to log errors and warnings to files.
 * 
 * Usage:
 *   import { logError, logWarning } from '@/lib/dev-logger';
 *   logError('Something went wrong', error);
 *   logWarning('This is a warning');
 * 
 * NOTE: This is a temporary development tool and should be replaced
 * with a proper logging solution in production.
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const ERROR_LOG = path.join(LOG_DIR, 'errors.log');
const WARNING_LOG = path.join(LOG_DIR, 'warnings.log');

let isInitialized = false;

/**
 * Ensure logs directory exists
 */
function ensureLogDirectory(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Format log entry with timestamp
 */
function formatLogEntry(level: 'ERROR' | 'WARN', ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const message = args
    .map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
  
  return `[${timestamp}] [${level}] ${message}\n${'='.repeat(80)}\n`;
}

/**
 * Write to log file
 */
function writeToLog(filePath: string, content: string): void {
  try {
    fs.appendFileSync(filePath, content, 'utf8');
  } catch (error) {
    // Fallback to original console if file writing fails
    originalConsoleError('Failed to write to log file:', error);
  }
}

/**
 * Initialize the development logger
 * Only works in development mode
 */
export function initDevLogger(): void {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Only initialize once
  if (isInitialized) {
    return;
  }

  ensureLogDirectory();

  // Clear old logs on startup
  try {
    fs.writeFileSync(ERROR_LOG, `=== Error Log Started at ${new Date().toISOString()} ===\n\n`, 'utf8');
    fs.writeFileSync(WARNING_LOG, `=== Warning Log Started at ${new Date().toISOString()} ===\n\n`, 'utf8');
    console.log('📝 Development logger initialized. Logs will be saved to:', LOG_DIR);
  } catch (error) {
    console.error('Failed to initialize log files:', error);
  }

  isInitialized = true;
}

/**
 * Log an error message
 * Writes to both console and error log file
 */
export function logError(...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'development') {
    console.error(...args);
    return;
  }

  if (!isInitialized) {
    initDevLogger();
  }

  const logEntry = formatLogEntry('ERROR', ...args);
  writeToLog(ERROR_LOG, logEntry);
  console.error(...args);
}

/**
 * Log a warning message
 * Writes to both console and warning log file
 */
export function logWarning(...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn(...args);
    return;
  }

  if (!isInitialized) {
    initDevLogger();
  }

  const logEntry = formatLogEntry('WARN', ...args);
  writeToLog(WARNING_LOG, logEntry);
  console.warn(...args);
}
