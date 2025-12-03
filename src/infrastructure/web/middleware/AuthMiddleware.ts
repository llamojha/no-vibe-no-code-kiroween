import { NextRequest, NextResponse } from 'next/server';
import type { UserTier } from '@/lib/supabase/types';
import { AuthenticationOptions, AuthenticationService } from '../../../application/services/AuthenticationService';
import { ServiceFactory } from '../../factories/ServiceFactory';
import { User } from '../../../domain/entities/User';
import { serverSupabase } from '@/lib/supabase/server';

/**
 * Authentication result interface (for backward compatibility)
 */
export interface AuthResult {
  success: boolean;
  userId: string;
  userEmail?: string;
  userTier?: UserTier;
  user?: User;
  error?: string;
}

/**
 * Authentication options (for backward compatibility)
 */
export interface AuthOptions {
  requirePaid?: boolean;
  requireAdmin?: boolean;
  allowFree?: boolean;
  updateLastLogin?: boolean;
}

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
}

/**
 * AuthMiddleware class for handling authentication and authorization
 * This class provides methods for authenticating requests, checking rate limits,
 * and managing CORS headers
 */
export class AuthMiddleware {
  constructor(private authService: AuthenticationService) {}

  /**
   * Authenticate a request
   */
  async authenticate(
    request: NextRequest,
    options: AuthOptions = { allowFree: true }
  ): Promise<AuthResult> {
    try {
      // Convert options to new format
      const authOptions: AuthenticationOptions = {
        requirePaid: options.requirePaid,
        requireAdmin: options.requireAdmin,
        allowFree: options.allowFree,
        updateLastLogin: options.updateLastLogin
      };

      const result = await this.authService.authenticateRequest(authOptions);

      // Convert result to backward-compatible format
      return {
        success: result.success,
        userId: result.userId || '',
        userEmail: result.userEmail,
        userTier: result.userTier,
        user: result.user,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        userId: '',
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Require authentication for a request handler
   */
  async requireAuth(
    request: NextRequest,
    handler: (request: NextRequest, authResult: AuthResult) => Promise<NextResponse>,
    options: AuthOptions = { allowFree: true }
  ): Promise<NextResponse> {
    const authResult = await this.authenticate(request, options);

    if (!authResult.success) {
      const statusCode = authResult.error?.includes('Insufficient permissions') ? 403 : 401;
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: statusCode }
      );
    }

    return handler(request, authResult);
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    request: NextRequest,
    userId: string,
    endpoint: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): Promise<RateLimitResult> {
    // This is a basic in-memory implementation
    // In production, use Redis or a proper rate limiting service
    const now = Date.now();
    
    // For now, always allow (implement proper rate limiting in production)
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetTime: new Date(now + windowMs)
    };
  }

  /**
   * Check CORS headers
   */
  checkCorsHeaders(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (!origin) {
      return true; // Allow requests without origin (same-origin)
    }
    
    if (allowedOrigins.includes('*')) {
      return true; // Allow all origins
    }
    
    return allowedOrigins.includes(origin);
  }

  /**
   * Add security headers to response
   */
  addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
    
    return response;
  }
}

/**
 * Authenticate request using the new hexagonal architecture
 * Uses AuthenticationService to handle user authentication and management
 */
export async function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = { allowFree: true }
): Promise<AuthResult> {
  try {
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const authService = serviceFactory.createAuthenticationService();

    // Convert options to new format
    const authOptions: AuthenticationOptions = {
      requirePaid: options.requirePaid,
      requireAdmin: options.requireAdmin,
      allowFree: options.allowFree,
      updateLastLogin: options.updateLastLogin
    };

    const result = await authService.authenticateRequest(authOptions);

    // Convert result to backward-compatible format
    return {
      success: result.success,
      userId: result.userId || '',
      userEmail: result.userEmail,
      userTier: result.userTier,
      user: result.user,
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      userId: '',
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

/**
 * Authenticate request with paid or admin requirement
 * Uses the new AuthenticationService for consistency
 */
export async function authenticateRequestPaidOrAdmin(): Promise<AuthResult> {
  try {
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const authService = serviceFactory.createAuthenticationService();

    const result = await authService.authenticateRequestPaidOrAdmin();

    // Convert result to backward-compatible format
    return {
      success: result.success,
      userId: result.userId || '',
      userEmail: result.userEmail,
      userTier: result.userTier,
      user: result.user,
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      userId: '',
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Validate API key from request headers
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    return false;
  }
  
  return apiKey === validApiKey;
}

/**
 * Check if request is from localhost (for development)
 */
export function isLocalhost(request: NextRequest): boolean {
  const host = request.headers.get('host');
  return host?.includes('localhost') || host?.includes('127.0.0.1') || false;
}

/**
 * Rate limiting check (basic implementation)
 * In production, this should use a proper rate limiting service
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // This is a basic in-memory implementation
  // In production, use Redis or a proper rate limiting service
  const now = Date.now();
  
  // For now, always allow (implement proper rate limiting in production)
  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetTime: now + windowMs
  };
}

/**
 * Middleware to check CORS headers
 */
export function checkCorsHeaders(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  if (!origin) {
    return true; // Allow requests without origin (same-origin)
  }
  
  if (allowedOrigins.includes('*')) {
    return true; // Allow all origins
  }
  
  return allowedOrigins.includes(origin);
}