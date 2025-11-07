/**
 * Database-specific error types for the infrastructure layer
 */

/**
 * Base database error class
 */
export abstract class DatabaseError extends Error {
  abstract readonly code: string;
  
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly operation?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when a database connection fails
 */
export class DatabaseConnectionError extends DatabaseError {
  readonly code = 'DATABASE_CONNECTION_ERROR';
  
  constructor(message: string, originalError?: any) {
    super(message, originalError, 'connection');
  }
}

/**
 * Error thrown when a database query fails
 */
export class DatabaseQueryError extends DatabaseError {
  readonly code = 'DATABASE_QUERY_ERROR';
  
  constructor(
    message: string,
    originalError?: any,
    public readonly query?: string
  ) {
    super(message, originalError, 'query');
  }
}

/**
 * Error thrown when a record is not found
 */
export class RecordNotFoundError extends DatabaseError {
  readonly code = 'RECORD_NOT_FOUND';
  
  constructor(
    resource: string,
    identifier: string,
    originalError?: any
  ) {
    super(`${resource} with identifier '${identifier}' not found`, originalError, 'find');
  }
}

/**
 * Error thrown when a unique constraint is violated
 */
export class UniqueConstraintError extends DatabaseError {
  readonly code = 'UNIQUE_CONSTRAINT_VIOLATION';
  
  constructor(
    field: string,
    value: string,
    originalError?: any
  ) {
    super(`Unique constraint violation: ${field} '${value}' already exists`, originalError, 'insert');
  }
}

/**
 * Error thrown when data validation fails at the database level
 */
export class DatabaseValidationError extends DatabaseError {
  readonly code = 'DATABASE_VALIDATION_ERROR';
  
  constructor(
    message: string,
    public readonly validationErrors: string[],
    originalError?: any
  ) {
    super(message, originalError, 'validation');
  }
}

/**
 * Error thrown when a transaction fails
 */
export class TransactionError extends DatabaseError {
  readonly code = 'TRANSACTION_ERROR';
  
  constructor(message: string, originalError?: any) {
    super(message, originalError, 'transaction');
  }
}