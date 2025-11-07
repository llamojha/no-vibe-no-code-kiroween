import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAIAdapter, GoogleAIConfig, AIServiceError } from '../GoogleAIAdapter';
import { Locale } from '../../../../domain/value-objects/Locale';
import { success, failure } from '../../../../shared/types/common';

// Mock the Google AI module
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: mockGenerateContent
});

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel
  })),
  Modality: {
    TEXT: 'text'
  }
}));

describe('GoogleAIAdapter Integration Tests', () => {
  let adapter: GoogleAIAdapter;
  let config: GoogleAIConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      apiKey: 'test-api-key',
      timeout: 30000,
      maxRetries: 3
    };

    adapter = new GoogleAIAdapter(config);
  });

  describe('analyzeIdea', () => {
    it('should successfully analyze an idea and return structured result', async () => {
      // Arrange
      const idea = 'A revolutionary AI-powered development platform';
      const locale = Locale.english();

      const mockAIResponse = {
        response: {
          text: () => JSON.stringify({
            score: 85,
            detailedSummary: 'Excellent idea with strong market potential',
            criteria: [
              {
                name: 'Market Potential',
                score: 90,
                justification: 'Large addressable market for AI development tools'
              },
              {
                name: 'Technical Feasibility',
                score: 80,
                justification: 'Technically achievable with current AI technology'
              }
            ],
            suggestions: [
              'Consider mobile app development',
              'Explore enterprise partnerships',
              'Add real-time collaboration features'
            ]
          })
        }
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(85);
        expect(result.data.detailedSummary).toBe('Excellent idea with strong market potential');
        expect(result.data.criteria).toHaveLength(2);
        expect(result.data.criteria[0].name).toBe('Market Potential');
        expect(result.data.criteria[0].score).toBe(90);
        expect(result.data.suggestions).toHaveLength(3);
        expect(result.data.suggestions[0]).toBe('Consider mobile app development');
      }

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(idea)
      );
    });

    it('should handle different locales correctly', async () => {
      // Arrange
      const idea = 'Una plataforma revolucionaria de desarrollo con IA';
      const locale = Locale.spanish();

      const mockAIResponse = {
        response: {
          text: () => JSON.stringify({
            score: 75,
            detailedSummary: 'Buena idea con potencial de mercado',
            criteria: [],
            suggestions: []
          })
        }
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(75);
        expect(result.data.detailedSummary).toBe('Buena idea con potencial de mercado');
      }

      // Verify that the prompt was generated for Spanish locale
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('Spanish')
      );
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      const apiError = new Error('API rate limit exceeded');
      mockGenerateContent.mockRejectedValue(apiError);

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AIServiceError);
        expect(result.error.message).toContain('Failed to analyze idea');
        expect(result.error.originalError).toBe(apiError);
      }
    });

    it('should handle invalid JSON response from AI', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      const mockAIResponse = {
        response: {
          text: () => 'Invalid JSON response from AI'
        }
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AIServiceError);
        expect(result.error.message).toContain('Failed to parse AI response');
      }
    });

    it('should handle missing required fields in AI response', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      const mockAIResponse = {
        response: {
          text: () => JSON.stringify({
            // Missing required fields like score
            detailedSummary: 'Some summary'
          })
        }
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AIServiceError);
        expect(result.error.message).toContain('Invalid AI response format');
      }
    });

    it('should handle invalid score values from AI', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      const mockAIResponse = {
        response: {
          text: () => JSON.stringify({
            score: 150, // Invalid score > 100
            detailedSummary: 'Some summary',
            criteria: [],
            suggestions: []
          })
        }
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AIServiceError);
        expect(result.error.message).toContain('Invalid score value');
      }
    });
  });

  describe('analyzeHackathonProject', () => {
    it('should successfully analyze hackathon project', async () => {
      // Arrange
      const projectName = 'AI Code Assistant';
      const description = 'An AI-powered tool that helps developers write better code';
      const kiroUsage = 'Used Kiro extensively for project planning and analysis';
      const locale = Locale.english();

      const mockAIResponse = {
        response: {
          text: () => JSON.stringify({
            score: 90,
            detailedSummary: 'Outstanding hackathon project with innovative approach',
            criteria: [
              {
                name: 'Innovation',
                score: 95,
                justification: 'Highly innovative use of AI in development tools'
              },
              {
                name: 'Implementation Quality',
                score: 85,
                justification: 'Well-implemented with good code quality'
              }
            ],
            suggestions: [
              'Add demo video to showcase functionality',
              'Improve documentation for better user onboarding'
            ]
          })
        }
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      // Act
      const result = await adapter.analyzeHackathonProject(projectName, description, kiroUsage, locale);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(90);
        expect(result.data.detailedSummary).toBe('Outstanding hackathon project with innovative approach');
        expect(result.data.criteria).toHaveLength(2);
        expect(result.data.suggestions).toHaveLength(2);
      }

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(projectName)
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(description)
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(kiroUsage)
      );
    });

    it('should handle hackathon analysis API errors', async () => {
      // Arrange
      const projectName = 'Test Project';
      const description = 'Test description';
      const kiroUsage = 'Test usage';
      const locale = Locale.english();

      const apiError = new Error('Service temporarily unavailable');
      mockGenerateContent.mockRejectedValue(apiError);

      // Act
      const result = await adapter.analyzeHackathonProject(projectName, description, kiroUsage, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AIServiceError);
        expect(result.error.message).toContain('Failed to analyze hackathon project');
      }
    });
  });

  describe('retry mechanism', () => {
    it('should retry on transient failures', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      // First two calls fail, third succeeds
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              score: 70,
              detailedSummary: 'Good idea',
              criteria: [],
              suggestions: []
            })
          }
        });

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries exceeded', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      const persistentError = new Error('Persistent API error');
      mockGenerateContent.mockRejectedValue(persistentError);

      // Act
      const result = await adapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      expect(mockGenerateContent).toHaveBeenCalledTimes(4); // Initial call + 3 retries
    });
  });

  describe('timeout handling', () => {
    it('should handle request timeouts', async () => {
      // Arrange
      const idea = 'Test idea';
      const locale = Locale.english();

      // Create a timeout adapter with very short timeout
      const timeoutConfig = { ...config, timeout: 1 };
      const timeoutAdapter = new GoogleAIAdapter(timeoutConfig);

      // Mock a slow response
      mockGenerateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Act
      const result = await timeoutAdapter.analyzeIdea(idea, locale);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AIServiceError);
        expect(result.error.message).toContain('timeout');
      }
    });
  });

  describe('prompt generation', () => {
    it('should generate appropriate prompts for different locales', async () => {
      // Arrange
      const idea = 'Test startup idea';
      
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            score: 70,
            detailedSummary: 'Test summary',
            criteria: [],
            suggestions: []
          })
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Act - Test English
      await adapter.analyzeIdea(idea, Locale.english());
      const englishPrompt = mockGenerateContent.mock.calls[0][0];

      // Act - Test Spanish
      await adapter.analyzeIdea(idea, Locale.spanish());
      const spanishPrompt = mockGenerateContent.mock.calls[1][0];

      // Assert
      expect(englishPrompt).toContain('English');
      expect(englishPrompt).toContain('startup idea');
      expect(englishPrompt).toContain(idea);

      expect(spanishPrompt).toContain('Spanish');
      expect(spanishPrompt).toContain('startup idea');
      expect(spanishPrompt).toContain(idea);
    });
  });
});