/**
 * Lightweight browser-safe logger.
 * Mirrors the server logger API but skips any file system access.
 */
import { LogCategory, LogLevel, type LoggerConfig, type LogEntry } from "./types";

const levelPriority: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

const levelToConsole: Record<LogLevel, (...args: unknown[]) => void> = {
  [LogLevel.DEBUG]: console.log,
  [LogLevel.INFO]: console.info,
  [LogLevel.WARN]: console.warn,
  [LogLevel.ERROR]: console.error,
};

class BrowserLogger {
  private config: LoggerConfig = {
    enabled: true,
    minLevel: LogLevel.DEBUG,
    categories: Object.values(LogCategory),
    fileLogging: false,
    consoleLogging: true,
  };

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (!this.config.enabled || !this.config.consoleLogging) return false;
    if (!this.config.categories.includes(category)) return false;
    return levelPriority[level] >= levelPriority[this.config.minLevel];
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: unknown): void {
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    const logFn = levelToConsole[level] ?? console.log;
    if (data !== undefined) {
      logFn(`[${entry.level}] [${entry.category}] ${entry.message}`, data);
    } else {
      logFn(`[${entry.level}] [${entry.category}] ${entry.message}`);
    }
  }

  error(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  warn(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  info(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  debug(category: LogCategory, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config, fileLogging: false };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

export const browserLogger = new BrowserLogger();
export { LogCategory, LogLevel };
export type { LoggerConfig, LogEntry };
