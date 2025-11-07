import { z } from 'zod';
import { Result, PaginationParams, PaginatedResult } from '../../../shared/types/common';

/**
 * Base interface for all queries in the application
 * Queries represent read operations that don't change system state
 */
export interface Query {
  readonly type: string;
  readonly timestamp: Date;
  readonly correlationId: string;
}

/**
 * Base interface for query results
 * All query handlers must return a Result type
 */
export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  correlationId: string;
  executionTime?: number;
}

/**
 * Query handler interface
 * Defines the contract for handling queries
 */
export interface QueryHandler<TQuery extends Query, TResult> {
  handle(query: TQuery): Promise<Result<TResult, Error>>;
}

/**
 * Base query implementation with common properties
 */
export abstract class BaseQuery implements Query {
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
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Paginated query base class
 */
export abstract class PaginatedQuery extends BaseQuery {
  constructor(
    type: string,
    public readonly pagination: PaginationParams,
    correlationId?: string
  ) {
    super(type, correlationId);
  }
}

/**
 * Query validation schema base
 */
export interface QuerySchema<T> {
  schema: z.ZodSchema<T>;
  validate(data: unknown): Result<T, Error>;
}

/**
 * Create a query schema with validation
 */
export function createQuerySchema<T>(schema: z.ZodSchema<T>): QuerySchema<T> {
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
        error: new Error(`Query validation failed: ${errorMessage}`) 
      };
    }
  };
}

/**
 * Search query base class with common search parameters
 */
export abstract class SearchQuery extends PaginatedQuery {
  constructor(
    type: string,
    pagination: PaginationParams,
    public readonly searchTerm?: string,
    public readonly filters?: Record<string, unknown>,
    public readonly sortBy?: string,
    public readonly sortOrder?: 'asc' | 'desc',
    correlationId?: string
  ) {
    super(type, pagination, correlationId);
  }
}

/**
 * Helper type for paginated query results
 */
export type PaginatedQueryResult<T> = Result<PaginatedResult<T>, Error>;