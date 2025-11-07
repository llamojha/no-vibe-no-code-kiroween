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

      // Mock private methods by spying on the service
      const callGoogleAISpy = vi.spyOn(service as any, 'callGoogleAI').mockResolvedValue(
        success('{"score": 85, "feedback": "Excellent idea", "suggestions": ["test"]}')
      );
      const parseAnalysisResponseSpy = vi.spyOn(service as any, 'parseAnalysisResponse').mockReturnValue(mockAnalysisResult);

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

      expect(callGoogleAISpy).toHaveBeenCalledOnce();
      expect(parseAnalysisResponseSpy).toHaveBeenCalledOnce();
    });

    it('should handle Google AI API failure', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      const apiError = new Error('API rate limit exceeded');
      vi.spyOn(service as any, 'callGoogleAI').mockResolvedValue(failure(apiError));

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

      vi.spyOn(service as any, 'callGoogleAI').mockResolvedValue(
        success('invalid json response')
      );
      vi.spyOn(service as any, 'parseAnalysisResponse').mockImplementation(() => {
        throw new Error('Failed to parse response');
      });

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

      vi.spyOn(service as any, 'callGoogleAI').mockRejectedValue(new Error('Network error'));

      // Act
      const result = await service.analyzeIdea(idea, locale);

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
      const kiroUsage = 'Used Kiro extensively for project planning and analysis';
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

      vi.spyOn(service as any, 'callGoogleAI').mockResolvedValue(
        success('{"score": 90, "feedback": "Outstanding project"}')
      );
      vi.spyOn(service as any, 'parseAnalysisResponse').mockReturnValue(mockAnalysisResult);

      // Act
      const result = await service.analyzeHackathonProject(projectName, description, kiroUsage, locale);

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
      const kiroUsage = 'Test usage';
      const locale = Locale.english();

      const apiError = new Error('Service unavailable');
      vi.spyOn(service as any, 'callGoogleAI').mockResolvedValue(failure(apiError));

      // Act
      const result = await service.analyzeHackathonProject(projectName, description, kiroUsage, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(apiError);
      }
    });
  });

  describe('buildIdeaAnalysisPrompt', () => {
    it('should build appropriate prompt for English locale', () => {
      // Arrange
      const idea = 'Test startup idea';
      const locale = Locale.english();

      // Act
      const prompt = (service as any).buildIdeaAnalysisPrompt(idea, locale);

      // Assert
      expect(prompt).toContain(idea);
      expect(prompt).toContain('English');
      expect(prompt).toContain('startup idea');
      expect(prompt).toContain('JSON');
    });

    it('should build appropriate prompt for Spanish locale', () => {
      // Arrange
      const idea = 'Idea de startup de prueba';
      const locale = Locale.spanish();

      // Act
      const prompt = (service as any).buildIdeaAnalysisPrompt(idea, locale);

      // Assert
      expect(prompt).toContain(idea);
      expect(prompt).toContain('Spanish');
      expect(prompt).toContain('startup idea');
    });
  });

  describe('parseAnalysisResponse', () => {
    it('should parse valid JSON response', () => {
      // Arrange
      const validResponse = JSON.stringify({
        score: 85,
        feedback: 'Great idea',
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        criteria: [
          {
            name: 'Market Potential',
            score: 80,
            justification: 'Good market fit'
          }
        ]
      });

      // Act
      const result = (service as any).parseAnalysisResponse(validResponse);

      // Assert
      expect(result.score.value).toBe(85);
      expect(result.feedback).toBe('Great idea');
      expect(result.suggestions).toHaveLength(2);
      expect(result.criteriaScores).toHaveLength(1);
      expect(result.criteriaScores[0].name).toBe('Market Potential');
    });

    it('should handle invalid JSON', () => {
      // Arrange
      const invalidResponse = 'not valid json';

      // Act & Assert
      expect(() => {
        (service as any).parseAnalysisResponse(invalidResponse);
      }).toThrow();
    });

    it('should handle missing required fields', () => {
      // Arrange
      const incompleteResponse = JSON.stringify({
        feedback: 'Great idea'
        // Missing score and other required fields
      });

      // Act & Assert
      expect(() => {
        (service as any).parseAnalysisResponse(incompleteResponse);
      }).toThrow();
    });

    it('should handle invalid score values', () => {
      // Arrange
      const invalidScoreResponse = JSON.stringify({
        score: 150, // Invalid score > 100
        feedback: 'Great idea',
        suggestions: []
      });

      // Act & Assert
      expect(() => {
        (service as any).parseAnalysisResponse(invalidScoreResponse);
      }).toThrow();
    });
  });
});