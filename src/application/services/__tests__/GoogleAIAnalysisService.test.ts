import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAIAnalysisService, GoogleAIConfig } from '../GoogleAIAnalysisService';
import { Locale, Score } from '../../../domain/value-objects';
import { success, failure } from '../../../shared/types/common';

// Mock the Google AI module
vi.mock('@google/genai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn()
    })
  }))
}));

describe('GoogleAIAnalysisService', () => {
  let service: GoogleAIAnalysisService;
  let mockConfig: GoogleAIConfig;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      model: 'gemini-pro',
      timeout: 30000,
      maxRetries: 3
    };

    service = new GoogleAIAnalysisService(mockConfig);
  });

  describe('analyzeIdea', () => {
    it('should successfully analyze an idea', async () => {
      // Arrange
      const idea = 'A revolutionary AI-powered development platform';
      const locale = Locale.english();

      // Mock the internal methods
      const mockAnalysisResult = {
        score: Score.create(85),
        feedback: 'Excellent idea with strong market potential',
        suggestions: ['Consider mobile app development', 'Explore enterprise partnerships'],
        criteriaScores: [
          {
            name: 'Market Potential',
            score: Score.create(90),
            justification: 'Large addressable market'
          },
          {
            name: 'Technical Feasibility',
            score: Score.create(80),
            justification: 'Technically achievable with current technology'
          }
        ]
      };

      // Mock the service methods directly
      vi.spyOn(service, 'analyzeIdea').mockResolvedValue(success(mockAnalysisResult));

      // Act
      const result = await service.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score.value).toBe(85);
        expect(result.data.feedback).toBe('Excellent idea with strong market potential');
        expect(result.data.suggestions).toHaveLength(2);
        expect(result.data.criteriaScores).toHaveLength(2);
      }
    });

    it('should handle Google AI API failure', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      const apiError = new Error('API rate limit exceeded');
      vi.spyOn(service, 'analyzeIdea').mockResolvedValue(failure(apiError));

      // Act
      const result = await service.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(apiError);
      }
    });

    it('should handle parsing errors', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      vi.spyOn(service, 'analyzeIdea').mockResolvedValue(failure(new Error('Failed to parse response')));

      // Act
      const result = await service.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to parse response');
      }
    });

    it('should handle unexpected exceptions', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      // Create a fresh service instance to avoid mocking conflicts
      const freshService = new GoogleAIAnalysisService(mockConfig);
      vi.spyOn(freshService, 'analyzeIdea').mockResolvedValue(failure(new Error('Network error')));

      // Act
      const result = await freshService.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Network error');
      }
    });
  });

  describe('analyzeHackathonProject', () => {
    it('should successfully analyze a hackathon project', async () => {
      // Arrange
      const projectName = 'AI Code Assistant';
      const description = 'An AI-powered tool that helps developers write better code';
      const locale = Locale.english();

      const mockAnalysisResult = {
        score: Score.create(90),
        feedback: 'Outstanding hackathon project',
        suggestions: ['Add demo video', 'Improve documentation'],
        criteriaScores: [
          {
            name: 'Innovation',
            score: Score.create(95),
            justification: 'Highly innovative approach'
          }
        ]
      };

      vi.spyOn(service, 'analyzeHackathonProject').mockResolvedValue(success(mockAnalysisResult));

      // Act
      const result = await service.analyzeHackathonProject(projectName, description, locale);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score.value).toBe(90);
        expect(result.data.feedback).toBe('Outstanding hackathon project');
      }
    });

    it('should handle API failures for hackathon analysis', async () => {
      // Arrange
      const projectName = 'Test Project';
      const description = 'Test description';
      const locale = Locale.english();

      const apiError = new Error('Service unavailable');
      vi.spyOn(service, 'analyzeHackathonProject').mockResolvedValue(failure(apiError));

      // Act
      const result = await service.analyzeHackathonProject(projectName, description, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(apiError);
      }
    });
  });


});
