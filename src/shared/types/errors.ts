/**
 * Base class for all domain errors
 * Provides consistent error structure across the application
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    public readonly validationErrors: string[] = [],
    cause?: Error
  ) {
    super(message, cause);
  }
}

/**
 * Error thrown when business rules are violated
 */
export class BusinessRuleViolationError extends DomainError {
  readonly code = "BUSINESS_RULE_VIOLATION";

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when an entity is not found
 */
export class EntityNotFoundError extends DomainError {
  readonly code = "ENTITY_NOT_FOUND";

  constructor(entityType: string, identifier: string, cause?: Error) {
    super(`${entityType} with identifier '${identifier}' was not found`, cause);
  }
}

/**
 * Error thrown when attempting to create a duplicate entity
 */
export class DuplicateEntityError extends DomainError {
  readonly code = "DUPLICATE_ENTITY";

  constructor(entityType: string, identifier: string, cause?: Error) {
    super(
      `${entityType} with identifier '${identifier}' already exists`,
      cause
    );
  }
}

/**
 * Error thrown when domain invariants are violated
 */
export class InvariantViolationError extends DomainError {
  readonly code = "INVARIANT_VIOLATION";

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when a user attempts to access or modify resources they don't have permission for
 */
export class AuthorizationError extends DomainError {
  readonly code = "AUTHORIZATION_ERROR";

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when a user has insufficient credits to perform an action
 */
export class InsufficientCreditsError extends DomainError {
  readonly code = "INSUFFICIENT_CREDITS";

  constructor(public readonly userId: string, cause?: Error) {
    super(
      `User ${userId} has insufficient credits to perform this action.`,
      cause
    );
  }
}
