import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '../AuthMiddleware';
import { AuthenticationService } from '../../../../application/services/AuthenticationService';
import { User } from '../../../../domain/entities/User';
import { UserId } from '../../../../domain/value-objects/UserId';
import { Email } from '../../../../domain/value-objects/Email';

// Mock authentication service
const mockAuthService = {
  authenticateRequest: vi.fn(),
  getSession: vi.fn()
} as any;

describe('AuthMiddleware Integration Tests', () => {
  let authMiddleware: AuthMiddleware;
  let testUser: User;

  beforeEach(() => {
    vi.clearAllMocks();
    
    authMiddleware = new AuthMiddleware(mockAuthService);

    // Create test user
    testUser = User.create({
      email: Email.create('test@example.com'),
      name: 'Test User'
    });
  });

  describe('authenticate', () => {
    it('should successfully authenticate valid request', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/analyze'
      } as NextRequest;

      const mockAuthResult = {
        success: true,
        user: testUser,
        userId: testUser.id.value,
        userEmail: testUser.email.value
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      // Act
      const result = await authMiddleware.authenticate(mockRequest);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBe(testUser);
        expect(result.userId).toBe(testUser.id.value);
        expect(result.userEmail).toBe(testUser.email.value);
      }

      expect(mockAuthService.authenticateRequest).toHaveBeenCalledWith({
        allowFree: true,
        updateLastLogin: false
      });
    });

    it('should fail authentication for missing token', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/analyze'
      } as NextRequest;

      const mockAuthResult = {
        success: false,
        error: 'No authorization token provided'
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      // Act
      const result = await authMiddleware.authenticate(mockRequest);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No authorization token provided');
      }
    });

    it('should fail authentication for invalid token', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }),
        method: 'POST'
      } as NextRequest;

      const mockAuthResult = {
        success: false,
        error: 'Invalid or expired token'
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      // Act
      const result = await authMiddleware.authenticate(mockRequest);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid or expired token');
      }
    });

    it('should authenticate with paid tier requirement', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer valid-token'
        }),
        method: 'POST'
      } as NextRequest;

      const mockAuthResult = {
        success: true,
        user: testUser,
        userId: testUser.id.value,
        userEmail: testUser.email.value,
        userTier: 'paid'
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      // Act
      const result = await authMiddleware.authenticate(mockRequest, {
        requirePaid: true,
        allowFree: false
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.userTier).toBe('paid');
      }

      expect(mockAuthService.authenticateRequest).toHaveBeenCalledWith({
        requirePaid: true,
        allowFree: false,
        updateLastLogin: false
      });
    });

    it('should fail authentication for free user when paid required', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer valid-token'
        }),
        method: 'POST'
      } as NextRequest;

      const mockAuthResult = {
        success: false,
        error: 'Paid subscription required'
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      // Act
      const result = await authMiddleware.authenticate(mockRequest, {
        requirePaid: true,
        allowFree: false
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Paid subscription required');
      }
    });
  });

  describe('requireAuth', () => {
    it('should return NextResponse for authenticated request', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer valid-token'
        }),
        method: 'POST'
      } as NextRequest;

      const mockAuthResult = {
        success: true,
        user: testUser,
        userId: testUser.id.value,
        userEmail: testUser.email.value
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // Act
      const response = await authMiddleware.requireAuth(mockRequest, mockHandler);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockAuthResult);
    });

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers(),
        method: 'POST'
      } as NextRequest;

      const mockAuthResult = {
        success: false,
        error: 'Authentication required'
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      const mockHandler = vi.fn();

      // Act
      const response = await authMiddleware.requireAuth(mockRequest, mockHandler);

      // Assert
      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();

      const responseBody = await response.json();
      expect(responseBody.error).toContain('Authentication required');
    });

    it('should return 403 for insufficient permissions', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer valid-token'
        }),
        method: 'POST'
      } as NextRequest;

      const mockAuthResult = {
        success: false,
        error: 'Insufficient permissions'
      };

      mockAuthService.authenticateRequest.mockResolvedValue(mockAuthResult);

      const mockHandler = vi.fn();

      // Act
      const response = await authMiddleware.requireAuth(mockRequest, mockHandler, {
        requireAdmin: true
      });

      // Assert
      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();

      const responseBody = await response.json();
      expect(responseBody.error).toContain('Insufficient permissions');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow request within rate limits', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'X-Forwarded-For': '192.168.1.1'
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/analyze'
      } as NextRequest;

      // Act
      const result = await authMiddleware.checkRateLimit(mockRequest, testUser.id.value, '/api/analyze');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBeGreaterThan(0);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('should block request when rate limit exceeded', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'X-Forwarded-For': '192.168.1.1'
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/analyze'
      } as NextRequest;

      // Simulate multiple requests to exceed rate limit
      for (let i = 0; i < 100; i++) {
        await authMiddleware.checkRateLimit(mockRequest, testUser.id.value, '/api/analyze');
      }

      // Act
      const result = await authMiddleware.checkRateLimit(mockRequest, testUser.id.value, '/api/analyze');

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('should use different limits for different endpoints', async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          'X-Forwarded-For': '192.168.1.1'
        }),
        method: 'POST'
      } as NextRequest;

      // Act
      const analyzeResult = await authMiddleware.checkRateLimit(mockRequest, testUser.id.value, '/api/analyze');
      const dashboardResult = await authMiddleware.checkRateLimit(mockRequest, testUser.id.value, '/api/dashboard');

      // Assert
      expect(analyzeResult.allowed).toBe(true);
      expect(dashboardResult.allowed).toBe(true);
      
      // Different endpoints should have independent rate limits
      expect(analyzeResult.remainingRequests).not.toBe(dashboardResult.remainingRequests);
    });
  });

  describe('CORS handling', () => {
    it('should validate allowed origins', () => {
      // Arrange
      const allowedRequest = {
        headers: new Headers({
          'Origin': 'http://localhost:3000'
        })
      } as NextRequest;

      const disallowedRequest = {
        headers: new Headers({
          'Origin': 'http://malicious-site.com'
        })
      } as NextRequest;

      // Act
      const allowedResult = authMiddleware.checkCorsHeaders(allowedRequest);
      const disallowedResult = authMiddleware.checkCorsHeaders(disallowedRequest);

      // Assert
      expect(allowedResult).toBe(true);
      expect(disallowedResult).toBe(false);
    });

    it('should handle requests without origin header', () => {
      // Arrange
      const requestWithoutOrigin = {
        headers: new Headers()
      } as NextRequest;

      // Act
      const result = authMiddleware.checkCorsHeaders(requestWithoutOrigin);

      // Assert
      expect(result).toBe(true); // Should allow requests without origin (same-origin)
    });
  });

  describe('security headers', () => {
    it('should add security headers to response', () => {
      // Arrange
      const response = NextResponse.json({ success: true });

      // Act
      const secureResponse = authMiddleware.addSecurityHeaders(response);

      // Assert
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(secureResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(secureResponse.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('should preserve existing headers when adding security headers', () => {
      // Arrange
      const response = NextResponse.json({ success: true });
      response.headers.set('Custom-Header', 'custom-value');

      // Act
      const secureResponse = authMiddleware.addSecurityHeaders(response);

      // Assert
      expect(secureResponse.headers.get('Custom-Header')).toBe('custom-value');
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });
});