import { NextRequest } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validation result interface
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate against schema
    const result = schema.safeParse(body);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(err => err.message),
        fieldErrors: formatZodErrors(result.error)
      };
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        errors: ['Invalid JSON format in request body']
      };
    }
    
    return {
      success: false,
      errors: ['Failed to parse request body']
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const url = new URL(request.url);
    const params: Record<string, string | string[] | number> = {};
    
    // Convert URLSearchParams to object
    url.searchParams.forEach((value, key) => {
      // Handle array parameters (e.g., ?tags=a&tags=b)
      if (params[key]) {
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    });
    
    // Convert string numbers to actual numbers for validation
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (typeof value === 'string' && !isNaN(Number(value))) {
        params[key] = Number(value);
      }
    });
    
    const result = schema.safeParse(params);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(err => err.message),
        fieldErrors: formatZodErrors(result.error)
      };
    }
  } catch (_error) {
    return {
      success: false,
      errors: ['Failed to parse query parameters']
    };
  }
}

/**
 * Validate path parameters against a Zod schema
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const result = schema.safeParse(params);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(err => err.message),
        fieldErrors: formatZodErrors(result.error)
      };
    }
  } catch (_error) {
    return {
      success: false,
      errors: ['Failed to validate path parameters']
    };
  }
}

/**
 * Validate request headers against a Zod schema
 */
export function validateHeaders<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const headers: Record<string, string> = {};
    
    // Convert Headers to object
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    const result = schema.safeParse(headers);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(err => err.message),
        fieldErrors: formatZodErrors(result.error)
      };
    }
  } catch (_error) {
    return {
      success: false,
      errors: ['Failed to validate request headers']
    };
  }
}

/**
 * Format Zod errors into field-specific error messages
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  
  error.issues.forEach(err => {
    const path = err.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(err.message);
  });
  
  return fieldErrors;
}

/**
 * Common validation schemas for reuse
 */
export const CommonValidationSchemas = {
  // UUID validation
  uuid: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid UUID format'),
  
  // Pagination parameters
  pagination: z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
  }),
  
  // Search parameters
  search: z.object({
    q: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().optional()
  }),
  
  // Date range parameters
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }),
  
  // Common headers
  headers: z.object({
    'content-type': z.string().optional(),
    'authorization': z.string().optional(),
    'x-api-key': z.string().optional(),
    'user-agent': z.string().optional()
  })
};

/**
 * Sanitize input data to prevent XSS and other attacks
 */
export function sanitizeInput(data: unknown): unknown {
  if (typeof data === 'string') {
    return data
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      sanitized[key] = sanitizeInput((data as Record<string, unknown>)[key]);
    });
    return sanitized;
  }
  
  return data;
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult<File> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = []
  } = options;
  
  const errors: string[] = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${maxSize} bytes`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`File extension is not allowed`);
    }
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }
  
  return {
    success: true,
    data: file
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  options: FileValidationOptions & { maxFiles?: number } = {}
): ValidationResult<File[]> {
  const { maxFiles = 10 } = options;
  const errors: string[] = [];
  
  if (files.length > maxFiles) {
    errors.push(`Cannot upload more than ${maxFiles} files`);
  }
  
  const validFiles: File[] = [];
  
  files.forEach((file, index) => {
    const result = validateFile(file, options);
    if (result.success && result.data) {
      validFiles.push(result.data);
    } else {
      errors.push(`File ${index + 1}: ${result.errors?.join(', ')}`);
    }
  });
  
  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }
  
  return {
    success: true,
    data: validFiles
  };
}