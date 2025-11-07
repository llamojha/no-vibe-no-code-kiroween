import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyzeIdeaUseCase, AnalyzeIdeaInput } from '../AnalyzeIdeaUseCase';
import { IAnalysisRepository } from '../../../domain/repositories/IAnalysisRepository';
import { AnalysisValidationService } from '../../../domain/services/AnalysisValidationService';
import { ScoreCalculationService } from '../../../domain/services/ScoreCalculationService';
import { Analysis } from '../../../domain/entities/Analysis';
import { UserId, Locale, Category, Score } from '../../../domain/value-objects';
import { success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

describe('AnalyzeIdeaUseCase', () => {
  let useCase: AnalyzeIdeaUseCase;
  let mockAnalysisRepository: Partial<IAnalysisRepository>;
  let mockValidationService: Partial<AnalysisValidationService>;
  let mockScoreCalculationService: Partial<ScoreCalculationService>;

  const validInput: AnalyzeIdeaInput = {
    idea: 'A revolutionary AI-powered platform that helps developers create better applications with automated code review and suggestions',
    userId: UserId.generate(),
    locale: Locale.english(),
    category: Category.createGeneral('technology'),
    additionalContext: {
      hasVisualMaterials: true,
      hasImplementation: false,
      timeSpent: 24
    }
  };

  beforeEach(() => {
    mockAnalysisRepository = {
      save: vi.fn()
    };

    mockValidationService = {
      validateAnalysis: vi.fn()
    };

    mockScoreCalculationService = {
      calculateAnalysisScore: vi.fn()
    };

    useCase = new AnalyzeIdeaUseCase(
      mockAnalysisRepository as IAnalysisRepository,
      mockValidationService as AnalysisValidationService,
      mockScoreCalculationService as ScoreCalculationService
    );
  });

  describe('execute', () => {
    it('should successfully analyze a valid idea', async () => {
      // Arrange
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      const mockScoreBreakdown = {
        totalScore: Score.create(85),
        criteriaScores: [
          {
            criteria: { name: 'Market Potential' },
            score: Score.create(80),
            weight: 0.3,
            justification: 'Strong market demand for AI development tools'
          },
          {
            criteria: { name: 'Technical Feasibility' },
            score: Score.create(90),
            weight: 0.25,
            justification: 'Well-established AI technologies available'
          }
        ],
        bonusPoints: 5,
        penaltyPoints: 0
      };

      const mockAnalysis = Analysis.create({
        idea: validInput.idea,
        userId: validInput.userId,
        score: Score.create(85),
        locale: validInput.locale,
        category: validInput.category
      });

      mockValidationService.validateAnalysis = vi.fn().mockReturnValue(mockValidationResult);
      mockScoreCalculationService.calculateAnalysisScore = vi.fn().mockReturnValue(mockScoreBreakdown);
      mockAnalysisRepository.save = vi.fn().mockResolvedValue(success(mockAnalysis));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analysis).toBeDefined();
        expect(result.data.validationResult.isValid).toBe(true);
        expect(result.data.scoreBreakdown.totalScore.value).toBe(85);
        expect(result.data.suggestions).toBeDefined();
        expect(result.data.suggestions.length).toBeGreaterThan(0);
      }

      expect(mockValidationService.validateAnalysis).toHaveBeenCalledOnce();
      expect(mockScoreCalculationService.calculateAnalysisScore).toHaveBeenCalledOnce();
      expect(mockAnalysisRepository.save).toHaveBeenCalledOnce();
    });

    it('should fail when validation fails', async () => {
      // Arrange
      const mockValidationResult = {
        isValid: false,
        errors: ['Idea is too short', 'Missing required details'],
        warnings: []
      };

      mockValidationService.validateAnalysis = vi.fn().mockReturnValue(mockValidationResult);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toBe('Analysis validation failed');
      }

      expect(mockValidationService.validateAnalysis).toHaveBeenCalledOnce();
      expect(mockScoreCalculationService.calculateAnalysisScore).not.toHaveBeenCalled();
      expect(mockAnalysisRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when repository save fails', async () => {
      // Arrange
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      const mockScoreBreakdown = {
        totalScore: Score.create(75),
        criteriaScores: [],
        bonusPoints: 0,
        penaltyPoints: 0
      };

      const saveError = new Error('Database connection failed');

      mockValidationService.validateAnalysis = vi.fn().mockReturnValue(mockValidationResult);
      mockScoreCalculationService.calculateAnalysisScore = vi.fn().mockReturnValue(mockScoreBreakdown);
      mockAnalysisRepository.save = vi.fn().mockResolvedValue(failure(saveError));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(saveError);
      }

      expect(mockAnalysisRepository.save).toHaveBeenCalledOnce();
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      mockValidationService.validateAnalysis = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected validation error');
      });

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Unexpected validation error');
      }
    });

    it('should generate appropriate suggestions for low scores', async () => {
      // Arrange
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      const mockScoreBreakdown = {
        totalScore: Score.create(35), // Low score
        criteriaScores: [
          {
            criteria: { name: 'Market Potential' },
            score: Score.create(30),
            weight: 0.3,
            justification: 'Limited market research provided'
          }
        ],
        bonusPoints: 0,
        penaltyPoints: 0
      };

      const mockAnalysis = Analysis.create({
        idea: validInput.idea,
        userId: validInput.userId,
        score: Score.create(35),
        locale: validInput.locale,
        category: validInput.category
      });

      mockValidationService.validateAnalysis = vi.fn().mockReturnValue(mockValidationResult);
      mockScoreCalculationService.calculateAnalysisScore = vi.fn().mockReturnValue(mockScoreBreakdown);
      mockAnalysisRepository.save = vi.fn().mockResolvedValue(success(mockAnalysis));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toContain('Consider refining your core value proposition to make it more compelling');
        expect(result.data.suggestions).toContain('Research your target market more thoroughly to identify specific pain points');
        expect(result.data.suggestions).toContain('Expand on the market size and target audience for your idea');
      }
    });

    it('should generate hackathon-specific suggestions', async () => {
      // Arrange
      const hackathonInput: AnalyzeIdeaInput = {
        ...validInput,
        category: Category.createHackathon('frankenstein')
      };

      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      const mockScoreBreakdown = {
        totalScore: Score.create(75),
        criteriaScores: [],
        bonusPoints: 0,
        penaltyPoints: 0
      };

      const mockAnalysis = Analysis.create({
        idea: hackathonInput.idea,
        userId: hackathonInput.userId,
        score: Score.create(75),
        locale: hackathonInput.locale,
        category: hackathonInput.category
      });

      mockValidationService.validateAnalysis = vi.fn().mockReturnValue(mockValidationResult);
      mockScoreCalculationService.calculateAnalysisScore = vi.fn().mockReturnValue(mockScoreBreakdown);
      mockAnalysisRepository.save = vi.fn().mockResolvedValue(success(mockAnalysis));

      // Act
      const result = await useCase.execute(hackathonInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toContain('Consider how your project fits within the hackathon category requirements');
        expect(result.data.suggestions).toContain('Think about what makes your project stand out in the competition');
      }
    });

    it('should limit suggestions to maximum of 5 when adding to analysis', async () => {
      // Arrange
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      const mockScoreBreakdown = {
        totalScore: Score.create(30), // Very low score to generate many suggestions
        criteriaScores: [
          { criteria: { name: 'Market Potential' }, score: Score.create(20), weight: 0.25, justification: 'Poor' },
          { criteria: { name: 'Technical Feasibility' }, score: Score.create(25), weight: 0.25, justification: 'Poor' },
          { criteria: { name: 'Innovation Level' }, score: Score.create(30), weight: 0.25, justification: 'Poor' },
          { criteria: { name: 'Business Viability' }, score: Score.create(35), weight: 0.25, justification: 'Poor' }
        ],
        bonusPoints: 0,
        penaltyPoints: 0
      };

      const mockAnalysis = Analysis.create({
        idea: 'Short', // Short idea to trigger more suggestions
        userId: validInput.userId,
        score: Score.create(30),
        locale: validInput.locale,
        category: validInput.category
      });

      mockValidationService.validateAnalysis = vi.fn().mockReturnValue(mockValidationResult);
      mockScoreCalculationService.calculateAnalysisScore = vi.fn().mockReturnValue(mockScoreBreakdown);
      mockAnalysisRepository.save = vi.fn().mockResolvedValue(success(mockAnalysis));

      // Act
      const result = await useCase.execute({
        ...validInput,
        idea: 'Short'
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        // The analysis entity should have at most 5 suggestions added
        expect(result.data.analysis.suggestions.length).toBeLessThanOrEqual(5);
        // But the suggestions array in output should contain all generated suggestions
        expect(result.data.suggestions.length).toBeGreaterThan(5);
      }
    });
  });
});