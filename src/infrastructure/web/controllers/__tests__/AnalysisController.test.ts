import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { AnalysisController } from '../AnalysisController';
import { CreateAnalysisHandler } from '../../../../application/handlers/commands/CreateAnalysisHandler';
import { GetAnalysisHandler } from '../../../../application/handlers/queries/GetAnalysisHandler';
import { Analysis } from '../../../../domain/entities/Analysis';
import { AnalysisId, UserId, Score, Locale, Category } from '../../../../domain/value-objects';
import { success, failure } from '../../../../shared/types/common';
import { ValidationError } from '../../../../shared/types/errors';

// Mock handlers
const mockCreateAnalysisHandler = {
  handle: vi.fn(),
  validateCommand: vi.fn()
} as any;

const mockGetAnalysisHandler = {
  handle: vi.fn(),
  validateQuery: vi.fn()
} as any;

describe('AnalysisController API Integration Tests', () => {
  let controller: AnalysisController;
  let testAnalysis: Analysis;

  beforeEach(() => {
    vi.clearAllMocks();
    
    controller = new AnalysisController(
      mockCreateAnalysisHandler,
      mockGetAnalysisHandler
    );

    // Create test analysis
    testAnalysis = Analysis.create({
      idea: 'A revolutionary AI-powered development platform that helps developers create better applications',
      userId: UserId.generate(),
      score: Score.create(85),
      locale: Locale.english(),
      category: Category.createGeneral('technology'),
      feedback: 'Excellent idea with strong market potential',
      suggestions: ['Consider mobile app development', 'Explore enterprise partnerships']
    });
  });

  describe('POST /api/analyze', () => {
    it('should successfully create analysis with valid request', async () => {
      // Arrange
      const requestBody = {
        idea: 'A revolutionary AI-powered development platform',
        userId: testAnalysis.userId.value,
        locale: 'en',
        category: 'technology'
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST',
        url: 'http://localhost:3000/api/analyze'
      } as any as NextRequest;

      const mockCommandResult = {
        analysis: testAnalysis
      };

      mockCreateAnalysisHandler.validateCommand.mockReturnValue(success({
        idea: requestBody.idea,
        userId: UserId.fromString(requestBody.userId),
        locale: Locale.create(requestBody.locale),
        category: Category.createGeneral(requestBody.category)
      }));

      mockCreateAnalysisHandler.handle.mockResolvedValue(success(mockCommandResult));

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      
      // Check response status
      expect(response.status).toBe(201);

      // Parse response body
      const responseBody = await response.json();
      expect(responseBody.analysis).toBeDefined();
      expect(responseBody.analysis.id).toBe(testAnalysis.id.value);
      expect(responseBody.analysis.idea).toBe(testAnalysis.idea);
      expect(responseBody.analysis.score).toBe(testAnalysis.score.value);

      // Verify handler calls
      expect(mockCreateAnalysisHandler.validateCommand).toHaveBeenCalledWith(requestBody);
      expect(mockCreateAnalysisHandler.handle).toHaveBeenCalled();
    });

    it('should return 400 for invalid request data', async () => {
      // Arrange
      const invalidRequestBody = {
        idea: '', // Empty idea
        userId: 'invalid-uuid',
        locale: 'invalid-locale'
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(invalidRequestBody),
        method: 'POST'
      } as any as NextRequest;

      mockCreateAnalysisHandler.validateCommand.mockReturnValue(
        failure(new ValidationError('Invalid request data'))
      );

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error).toContain('Invalid request data');
    });

    it('should return 422 for business rule violations', async () => {
      // Arrange
      const requestBody = {
        idea: 'Valid idea',
        userId: testAnalysis.userId.value,
        locale: 'en'
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      } as any as NextRequest;

      mockCreateAnalysisHandler.validateCommand.mockReturnValue(success({
        idea: requestBody.idea,
        userId: UserId.fromString(requestBody.userId),
        locale: Locale.create(requestBody.locale)
      }));

      mockCreateAnalysisHandler.handle.mockResolvedValue(
        failure(new ValidationError('Analysis validation failed'))
      );

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(422);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });

    it('should return 500 for internal server errors', async () => {
      // Arrange
      const requestBody = {
        idea: 'Valid idea',
        userId: testAnalysis.userId.value,
        locale: 'en'
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      } as any as NextRequest;

      mockCreateAnalysisHandler.validateCommand.mockReturnValue(success({
        idea: requestBody.idea,
        userId: UserId.fromString(requestBody.userId),
        locale: Locale.create(requestBody.locale)
      }));

      mockCreateAnalysisHandler.handle.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(500);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Internal server error');
    });

    it('should handle malformed JSON in request', async () => {
      // Arrange
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        method: 'POST'
      } as any as NextRequest;

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.error).toContain('Invalid request format');
    });
  });

  describe('GET /api/analyze/[id]', () => {
    it('should successfully retrieve analysis by ID', async () => {
      // Arrange
      const analysisId = testAnalysis.id.value;
      const userId = testAnalysis.userId.value;

      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams(`userId=${userId}`)
        },
        method: 'GET'
      } as any as NextRequest;

      const mockQueryResult = {
        analysis: testAnalysis
      };

      mockGetAnalysisHandler.validateQuery.mockReturnValue(success({
        analysisId: AnalysisId.fromString(analysisId),
        userId: UserId.fromString(userId)
      }));

      mockGetAnalysisHandler.handle.mockResolvedValue(success(mockQueryResult));

      // Act
      const response = await controller.getAnalysis(mockRequest, { params: { id: analysisId } });

      // Assert
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.analysis).toBeDefined();
      expect(responseBody.analysis.id).toBe(testAnalysis.id.value);
      expect(responseBody.analysis.idea).toBe(testAnalysis.idea);

      // Verify handler calls
      expect(mockGetAnalysisHandler.validateQuery).toHaveBeenCalledWith({
        analysisId: analysisId,
        userId: userId
      });
      expect(mockGetAnalysisHandler.handle).toHaveBeenCalled();
    });

    it('should return 404 when analysis not found', async () => {
      // Arrange
      const analysisId = AnalysisId.generate().value;

      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams()
        },
        method: 'GET'
      } as any as NextRequest;

      mockGetAnalysisHandler.validateQuery.mockReturnValue(success({
        analysisId: AnalysisId.fromString(analysisId)
      }));

      mockGetAnalysisHandler.handle.mockResolvedValue(
        failure(new Error('Analysis not found'))
      );

      // Act
      const response = await controller.getAnalysis(mockRequest, { params: { id: analysisId } });

      // Assert
      expect(response.status).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });

    it('should return 400 for invalid analysis ID format', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';

      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams()
        },
        method: 'GET'
      } as any as NextRequest;

      mockGetAnalysisHandler.validateQuery.mockReturnValue(
        failure(new ValidationError('Invalid analysis ID format'))
      );

      // Act
      const response = await controller.getAnalysis(mockRequest, { params: { id: invalidId } });

      // Assert
      expect(response.status).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.error).toContain('Invalid analysis ID format');
    });

    it('should handle requests without user ID (public access)', async () => {
      // Arrange
      const analysisId = testAnalysis.id.value;

      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams() // No userId parameter
        },
        method: 'GET'
      } as any as NextRequest;

      const mockQueryResult = {
        analysis: testAnalysis
      };

      mockGetAnalysisHandler.validateQuery.mockReturnValue(success({
        analysisId: AnalysisId.fromString(analysisId),
        userId: undefined
      }));

      mockGetAnalysisHandler.handle.mockResolvedValue(success(mockQueryResult));

      // Act
      const response = await controller.getAnalysis(mockRequest, { params: { id: analysisId } });

      // Assert
      expect(response.status).toBe(200);
      
      // Verify that query was validated without userId
      expect(mockGetAnalysisHandler.validateQuery).toHaveBeenCalledWith({
        analysisId: analysisId,
        userId: undefined
      });
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      // Arrange
      const requestBody = {
        idea: 'Valid idea',
        userId: testAnalysis.userId.value,
        locale: 'en'
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      } as any as NextRequest;

      mockCreateAnalysisHandler.validateCommand.mockReturnValue(success({
        idea: requestBody.idea,
        userId: UserId.fromString(requestBody.userId),
        locale: Locale.create(requestBody.locale)
      }));

      mockCreateAnalysisHandler.handle.mockResolvedValue(
        failure(new Error('Authentication required'))
      );

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.error).toContain('Authentication required');
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const requestBody = {
        idea: 'Valid idea',
        userId: testAnalysis.userId.value,
        locale: 'en'
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      } as any as NextRequest;

      mockCreateAnalysisHandler.validateCommand.mockReturnValue(success({
        idea: requestBody.idea,
        userId: UserId.fromString(requestBody.userId),
        locale: Locale.create(requestBody.locale)
      }));

      mockCreateAnalysisHandler.handle.mockResolvedValue(
        failure(new Error('Rate limit exceeded'))
      );

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(429);
      
      const responseBody = await response.json();
      expect(responseBody.error).toContain('Rate limit exceeded');
    });
  });

  describe('CORS handling', () => {
    it('should include appropriate CORS headers', async () => {
      // Arrange
      const requestBody = {
        idea: 'Valid idea',
        userId: testAnalysis.userId.value,
        locale: 'en'
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST',
        headers: new Headers({
          'Origin': 'http://localhost:3000'
        })
      } as any as NextRequest;

      mockCreateAnalysisHandler.validateCommand.mockReturnValue(success({
        idea: requestBody.idea,
        userId: UserId.fromString(requestBody.userId),
        locale: Locale.create(requestBody.locale)
      }));

      mockCreateAnalysisHandler.handle.mockResolvedValue(success({
        analysis: testAnalysis
      }));

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined();
    });

    it('should handle OPTIONS preflight requests', async () => {
      // Arrange
      const mockRequest = {
        method: 'OPTIONS',
        headers: new Headers({
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        })
      } as any as NextRequest;

      // Act
      const response = await controller.handleOptions(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });
});