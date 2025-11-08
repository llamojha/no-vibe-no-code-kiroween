/**
 * Logger Types and Enums
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogCategory {
  API = 'API',
  DATABASE = 'DATABASE',
  AI = 'AI',
  AUTH = 'AUTH',
  UI = 'UI',
  VALIDATION = 'VALIDATION',
  BUSINESS = 'BUSINESS',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  GENERAL = 'GENERAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
  error?: Error;
  stack?: string;
}

export interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  categories: LogCategory[];
  fileLogging: boolean;
  consoleLogging: boolean;
}
