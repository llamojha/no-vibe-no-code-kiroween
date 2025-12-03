import { z } from 'zod';
import { ValidationError } from '../types/errors';

/**
 * Result type for validation operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Utility class for common validation operations
 */
export class ValidationUtils {
  /**
   * Validate data against a Zod schema
   */
  static validateWithSchema<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    const errors = result.error.issues.map((err) => 
      `${err.path.join('.')}: ${err.message}`
    );
    
    return { success: false, errors };
  }

  /**
   * Validate data and throw ValidationError if invalid
   */
  static validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = this.validateWithSchema(schema, data);
    
    if (result.success) {
      return result.data;
    }
    
    // TypeScript knows result is the failure case here
    const failureResult = result as { success: false; errors: string[] };
    throw new ValidationError('Validation failed', failureResult.errors);
  }

  /**
   * Check if a string is a valid UUID
   */
  static isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Check if a string is a valid email
   */
  static isValidEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  /**
   * Validate that a string is not empty or whitespace
   */
  static isNonEmptyString(value: string): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Validate that a number is within a range
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * Create a validation result
   */
  static createValidationResult(isValid: boolean, errors: string[] = []): ValidationResult {
    return { isValid, errors };
  }
}

/**
 * Common Zod schemas for reuse across the application
 */
export const CommonSchemas = {
  /**
   * UUID schema
   */
  uuid: z.string().uuid({ message: 'Invalid UUID format' }),

  /**
   * Non-empty string schema
   */
  nonEmptyString: z.string().min(1, { message: 'String cannot be empty' }).trim(),

  /**
   * Email schema
   */
  email: z.string().email({ message: 'Invalid email format' }),

  /**
   * Positive integer schema
   */
  positiveInteger: z.number().int().positive({ message: 'Must be a positive integer' }),

  /**
   * Score schema (0-100)
   */
  score: z.number().min(0, { message: 'Score must be at least 0' }).max(100, { message: 'Score must be at most 100' }),

  /**
   * Locale schema
   */
  localeString: z.enum(['en', 'es']),

  /**
   * Date string schema (ISO format)
   */
  dateString: z.string().datetime({ message: 'Invalid date format' }),

  /**
   * Optional string that can be null or undefined
   */
  optionalString: z.string().optional().nullable(),
};