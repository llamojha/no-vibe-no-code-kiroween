import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { AnalysisController } from '../AnalysisController';
import { createMockAuthenticationService } from '../../../__tests__/test-utils';
import { Analysis } from '../../../../domain/entities/Analysis';
import { AnalysisId, UserId, Score, Locale, Category } from '../../../../domain/value-objects';

// Mock the AuthMiddleware module
vi.mock('../../middleware/AuthMiddleware', () => ({
  authenticateRequest: vi.fn()
}));

// Mock the GoogleAIAdapter module
vi.mock('../../../external/ai/GoogleAIAdapter', () => ({
  GoogleAIAdapter: {
    create: vi.fn().mockReturnValue({
      analyzeIdea: vi.fn().mockResolvedValue({
        score: 85,
        detailedSummary: 'Excellent idea with strong market potential',
        criteria: [],
        suggestions: []
      })
    })
  }
}));

// Import the mocked function
import { authenticateRequest } from '../../middleware/AuthMiddleware';

// Mock handlers
const mockCreateAnalysisHandler = {
  handle: vi.fn()
} as any;

const mockUpdateAnalysisHandler = {
  handle: vi.fn()
} as any;

const mockDeleteAnalysisHandler = {
  handle: vi.fn()
} as any;

const mockGetAnalysisHandler = {
  handle: vi.fn()
} as any;

const mockListAnalysesHandler = {
  handle: vi.fn()
} as any;

const mockSearchAnalysesHandler = {
  handle: vi.fn()
} as any;

describe('AnalysisController API Integration Tests', () => {
  let controller: AnalysisController;
  let testAnalysis: Analysis;
  const mockAuthService = createMockAuthenticationService();
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default authentication mock to return success with valid UUID
    (authenticateRequest as any).mockResolvedValue({
      success: true,
      userId: testUserId,
      userEmail: 'test@example.com',
      userTier: 'free'
    });
    
    controller = new AnalysisController(
      mockCreateAnalysisHandler,
      mockUpdateAnalysisHandler,
      mockDeleteAnalysisHandler,
      mockGetAnalysisHandler,
      mockListAnalysesHandler,
      mockSearchAnalysesHandler
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

    mockCreateAnalysisHandler.handle.mockResolvedValue({
      success: true,
      data: {
        analysis: testAnalysis
      }
    });
  });

  describe('POST /api/analyze', () => {
    it('should successfully create analysis with valid request', async () => {
      // Arrange
      const requestBody = {
        idea: 'A revolutionary AI-powered development platform',
        locale: 'en'
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      
      // Check that authentication was called
      expect(authenticateRequest).toHaveBeenCalledWith(mockRequest);
      
      // Check response status (200 for successful analysis)
      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid request data', async () => {
      // Arrange
      const invalidRequestBody = {
        idea: '', // Empty idea
        locale: 'invalid-locale'
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(invalidRequestBody)
      });

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      const requestBody = {
        idea: 'Valid idea',
        locale: 'en'
      };

      // Mock authentication failure
      (authenticateRequest as any).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Act
      const response = await controller.createAnalysis(mockRequest);

      // Assert
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });

  });

  describe('GET /api/analyze/[id]', () => {
    it('should successfully retrieve analysis by ID', async () => {
      // Arrange
      const analysisId = testAnalysis.id.value;

      const mockRequest = new NextRequest(`http://localhost:3000/api/analyze/${analysisId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const mockQueryResult = {
        success: true,
        data: {
          analysis: testAnalysis
        }
      };

      mockGetAnalysisHandler.handle.mockResolvedValue(mockQueryResult);

      // Act
      const response = await controller.getAnalysis(mockRequest, { params: { id: analysisId } });

      // Assert
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.id).toBe(testAnalysis.id.value);
      expect(responseBody.idea).toBe(testAnalysis.idea);

      // Verify authentication was called
      expect(authenticateRequest).toHaveBeenCalledWith(mockRequest);
    });

    it('should return 404 when analysis not found', async () => {
      // Arrange
      const analysisId = AnalysisId.generate().value;

      const mockRequest = new NextRequest(`http://localhost:3000/api/analyze/${analysisId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      mockGetAnalysisHandler.handle.mockResolvedValue({
        success: true,
        data: {
          analysis: null
        }
      });

      // Act
      const response = await controller.getAnalysis(mockRequest, { params: { id: analysisId } });

      // Assert
      expect(response.status).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      const analysisId = testAnalysis.id.value;

      // Mock authentication failure
      (authenticateRequest as any).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      });

      const mockRequest = new NextRequest(`http://localhost:3000/api/analyze/${analysisId}`, {
        method: 'GET'
      });

      // Act
      const response = await controller.getAnalysis(mockRequest, { params: { id: analysisId } });

      // Assert
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });
  });



  describe('CORS handling', () => {
    it('should handle OPTIONS preflight requests', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      // Act
      const response = await controller.handleOptions(mockRequest);

      // Assert
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });
});
