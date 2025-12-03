import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateAnalysisHandler } from '../CreateAnalysisHandler';
import { CreateAnalysisCommand } from '../../../types/commands/AnalysisCommands';
import { AnalyzeIdeaUseCase } from '../../../use-cases/AnalyzeIdeaUseCase';
import { Analysis } from '../../../../domain/entities/Analysis';
import { UserId, Locale, Category, Score } from '../../../../domain/value-objects';
import { success, failure } from '../../../../shared/types/common';
import { ValidationError } from '../../../../shared/types/errors';

describe('CreateAnalysisHandler', () => {
  let handler: CreateAnalysisHandler;
  let mockAnalyzeIdeaUseCase: Partial<AnalyzeIdeaUseCase>;

  const validUserId = UserId.generate();
  const validLocale = Locale.english();
  const validCategory = Category.createGeneral('technology');

  beforeEach(() => {
    mockAnalyzeIdeaUseCase = {
      execute: vi.fn()
    };

    handler = new CreateAnalysisHandler(
      mockAnalyzeIdeaUseCase as AnalyzeIdeaUseCase
    );
  });

  describe('handle', () => {
    it('should successfully handle valid command', async () => {
      // Arrange
      const command = new CreateAnalysisCommand(
        'A revolutionary AI-powered development platform',
        validUserId,
        validLocale,
        validCategory,
        'test-correlation-id'
      );

      const mockAnalysis = Analysis.create({
        idea: command.idea,
        userId: command.userId,
        score: Score.create(85),
        locale: command.locale,
        category: command.category
      });

      const mockUseCaseOutput = {
        analysis: mockAnalysis,
        validationResult: { isValid: true, errors: [], warnings: [] },
        scoreBreakdown: {
          totalScore: Score.create(85),
          criteriaScores: [],
          bonusPoints: 0,
          penaltyPoints: 0
        },
        suggestions: ['Great idea!']
      };

      mockAnalyzeIdeaUseCase.execute = vi.fn().mockResolvedValue(success(mockUseCaseOutput));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analysis).toBe(mockAnalysis);
      }

      expect(mockAnalyzeIdeaUseCase.execute).toHaveBeenCalledWith({
        idea: command.idea,
        userId: command.userId,
        locale: command.locale,
        category: command.category
      });
    });

    it('should handle use case failure', async () => {
      // Arrange
      const command = new CreateAnalysisCommand(
        'Invalid idea',
        validUserId,
        validLocale,
        undefined,
        'test-correlation-id'
      );

      const useCaseError = new ValidationError('Idea validation failed');
      mockAnalyzeIdeaUseCase.execute = vi.fn().mockResolvedValue(failure(useCaseError));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(useCaseError);
      }
    });

    it('should handle unexpected exceptions', async () => {
      // Arrange
      const command = new CreateAnalysisCommand(
        'Test idea',
        validUserId,
        validLocale,
        undefined,
        'test-correlation-id'
      );

      mockAnalyzeIdeaUseCase.execute = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Unexpected error');
      }
    });
  });

  describe('validateCommand', () => {
    it('should validate valid command data', () => {
      // Arrange
      const validData = {
        idea: 'A great startup idea',
        userId: validUserId.value,
        locale: 'en',
        category: 'technology',
        correlationId: 'test-id'
      };

      // Act
      const result = handler.validateCommand(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idea).toBe(validData.idea);
        expect(result.data.userId.equals(validUserId)).toBe(true);
        expect(result.data.locale.equals(validLocale)).toBe(true);
        expect(result.data.category?.equals(validCategory)).toBe(true);
      }
    });

    it('should reject null or undefined data', () => {
      // Act & Assert
      expect(handler.validateCommand(null).success).toBe(false);
      expect(handler.validateCommand(undefined).success).toBe(false);
      expect(handler.validateCommand('string').success).toBe(false);
    });

    it('should reject missing required fields', () => {
      // Test missing idea
      let result = handler.validateCommand({
        userId: validUserId.value,
        locale: 'en'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Idea is required');
      }

      // Test missing userId
      result = handler.validateCommand({
        idea: 'Test idea',
        locale: 'en'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('User ID is required');
      }

      // Test missing locale
      result = handler.validateCommand({
        idea: 'Test idea',
        userId: validUserId.value
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Locale is required');
      }
    });

    it('should reject invalid field types', () => {
      // Test invalid idea type
      let result = handler.validateCommand({
        idea: 123,
        userId: validUserId.value,
        locale: 'en'
      });
      expect(result.success).toBe(false);

      // Test invalid userId type
      result = handler.validateCommand({
        idea: 'Test idea',
        userId: 123,
        locale: 'en'
      });
      expect(result.success).toBe(false);

      // Test invalid locale type
      result = handler.validateCommand({
        idea: 'Test idea',
        userId: validUserId.value,
        locale: 123
      });
      expect(result.success).toBe(false);
    });

    it('should handle invalid value object creation', () => {
      // Test invalid userId format
      let result = handler.validateCommand({
        idea: 'Test idea',
        userId: 'invalid-uuid',
        locale: 'en'
      });
      expect(result.success).toBe(false);

      // Test invalid locale
      result = handler.validateCommand({
        idea: 'Test idea',
        userId: validUserId.value,
        locale: 'invalid-locale'
      });
      expect(result.success).toBe(false);

      // Test invalid category
      result = handler.validateCommand({
        idea: 'Test idea',
        userId: validUserId.value,
        locale: 'en',
        category: 'invalid-category'
      });
      expect(result.success).toBe(false);
    });

    it('should handle optional category field', () => {
      // Arrange
      const validDataWithoutCategory = {
        idea: 'A great startup idea',
        userId: validUserId.value,
        locale: 'en'
      };

      // Act
      const result = handler.validateCommand(validDataWithoutCategory);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBeUndefined();
      }
    });
  });
});