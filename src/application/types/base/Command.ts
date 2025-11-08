import { z } from 'zod';
import { Result } from '../../../shared/types/common';

/**
 * Base interface for all commands in the application
 * Commands represent write operations that change system state
 */
export interface Command {
  readonly type: string;
  readonly timestamp: Date;
  readonly correlationId: string;
}

/**
 * Base interface for command results
 * All command handlers must return a Result type
 */
export interface CommandResult<T = void> {
  success: boolean;
  data?: T;
  error?: Error;
  correlationId: string;
}

/**
 * Command handler interface
 * Defines the contract for handling commands
 */
export interface CommandHandler<TCommand extends Command, TResult = void> {
  handle(command: TCommand): Promise<Result<TResult, Error>>;
}

/**
 * Base command implementation with common properties
 */
export abstract class BaseCommand implements Command {
  public readonly timestamp: Date;
  public readonly correlationId: string;

  constructor(
    public readonly type: string,
    correlationId?: string
  ) {
    this.timestamp = new Date();
    this.correlationId = correlationId || this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Command validation schema base
 */
export interface CommandSchema<T> {
  schema: z.ZodSchema<T>;
  validate(data: unknown): Result<T, Error>;
}

/**
 * Create a command schema with validation
 */
export function createCommandSchema<T>(schema: z.ZodSchema<T>): CommandSchema<T> {
  return {
    schema,
    validate(data: unknown): Result<T, Error> {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return { success: true, data: result.data };
      }
      
      const errorMessage = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      
      return { 
        success: false, 
        error: new Error(`Command validation failed: ${errorMessage}`) 
      };
    }
  };
}