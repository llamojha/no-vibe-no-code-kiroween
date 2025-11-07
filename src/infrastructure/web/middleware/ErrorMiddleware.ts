import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard API error response interface
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, unknown> | unknown[];
  code?: string;
  timestamp?: string;
  path?: string;
}

/**
 * Custom error classes for different types of errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown> | unknown[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown> | unknown[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends ApiError {
  constructor(message: string, service: string, originalError?: unknown) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', { service, originalError });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Domain-specific error classes
 */
export class DomainError extends ApiError {
  constructor(message: string, code: string, details?: Record<string, unknown> | unknown[]) {
    super(message, 422, code, details);
    this.name = 'DomainError';
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, rule: string, details?: Record<string, unknown>) {
    super(message, 'BUSINESS_RULE_VIOLATION', { rule, ...details });
    this.name = 'BusinessRuleViolationError';
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string, invariant: string, details?: Record<string, unknown>) {
    super(message, 'INVARIANT_VIOLATION', { invariant, ...details });
    this.name = 'InvariantViolationError';
  }
}

/**
 * Infrastructure-specific error classes
 */
export class DatabaseError extends ApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, 500, 'DATABASE_ERROR', { originalError });
    this.name = 'DatabaseError';
  }
}

export class CacheError extends ApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, 500, 'CACHE_ERROR', { originalError });
    this.name = 'CacheError';
  }
}

export class FileSystemError extends ApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, 500, 'FILESYSTEM_ERROR', { originalError });
    this.name = 'FileSystemError';
  }
}

/**
 * Main error handler function
 * Converts various error types to appropriate HTTP responses
 */
export function handleApiError(error: unknown, path?: string): NextResponse {
  const timestamp = new Date().toISOString();
  
  // Log error for debugging (in production, use proper logging service)
  console.error('API Error:', {
    error,
    path,
    timestamp,
    stack: error instanceof Error ? error.stack : undefined
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errorResponse: ApiErrorResponse = {
      error: 'Validation failed',
      message: 'Request validation failed',
      details: {
        issues: error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      },
      code: 'VALIDATION_ERROR',
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    const errorResponse: ApiErrorResponse = {
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: error.statusCode });
  }

  // Handle domain errors from the domain layer
  if (error instanceof Error && error.name.includes('DomainError')) {
    const errorResponse: ApiErrorResponse = {
      error: error.message,
      code: 'DOMAIN_ERROR',
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: 422 });
  }

  // Handle database errors (Supabase, PostgreSQL, etc.)
  if (error instanceof Error && (
    error.message.includes('PGRST') || 
    error.message.includes('PostgreSQL') ||
    error.message.includes('Supabase')
  )) {
    const errorResponse: ApiErrorResponse = {
      error: 'Database operation failed',
      message: 'An error occurred while accessing the database',
      code: 'DATABASE_ERROR',
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }

  // Handle network/fetch errors
  if (error instanceof Error && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED')
  )) {
    const errorResponse: ApiErrorResponse = {
      error: 'External service unavailable',
      message: 'Failed to connect to external service',
      code: 'EXTERNAL_SERVICE_ERROR',
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: 502 });
  }

  // Handle timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    const errorResponse: ApiErrorResponse = {
      error: 'Request timeout',
      message: 'The request took too long to complete',
      code: 'TIMEOUT_ERROR',
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: 408 });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    const errorResponse: ApiErrorResponse = {
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      code: 'JSON_PARSE_ERROR',
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp,
      path
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }

  // Handle unknown errors
  const errorResponse: ApiErrorResponse = {
    error: 'Unknown error',
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    timestamp,
    path
  };
  
  return NextResponse.json(errorResponse, { status: 500 });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, unknown> | unknown[],
  path?: string
): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path
  };
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  errors: string[],
  fieldErrors?: Record<string, string[]>,
  path?: string
): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: 'Validation failed',
    message: errors.join(', '),
    details: {
      errors,
      fieldErrors
    },
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
    path
  };
  
  return NextResponse.json(errorResponse, { status: 400 });
}

/**
 * Create an authentication error response
 */
export function createAuthErrorResponse(message?: string, path?: string): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: message || 'Authentication required',
    code: 'AUTHENTICATION_ERROR',
    timestamp: new Date().toISOString(),
    path
  };
  
  return NextResponse.json(errorResponse, { status: 401 });
}

/**
 * Create an authorization error response
 */
export function createAuthorizationErrorResponse(message?: string, path?: string): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: message || 'Insufficient permissions',
    code: 'AUTHORIZATION_ERROR',
    timestamp: new Date().toISOString(),
    path
  };
  
  return NextResponse.json(errorResponse, { status: 403 });
}

/**
 * Create a not found error response
 */
export function createNotFoundErrorResponse(resource?: string, path?: string): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: resource ? `${resource} not found` : 'Resource not found',
    code: 'NOT_FOUND_ERROR',
    timestamp: new Date().toISOString(),
    path
  };
  
  return NextResponse.json(errorResponse, { status: 404 });
}

/**
 * Create a rate limit error response
 */
export function createRateLimitErrorResponse(
  limit: number,
  windowMs: number,
  path?: string
): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: 'Rate limit exceeded',
    message: `Too many requests. Limit: ${limit} requests per ${windowMs}ms`,
    code: 'RATE_LIMIT_ERROR',
    details: { limit, windowMs },
    timestamp: new Date().toISOString(),
    path
  };
  
  return NextResponse.json(errorResponse, { 
    status: 429,
    headers: {
      'Retry-After': Math.ceil(windowMs / 1000).toString()
    }
  });
}