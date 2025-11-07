import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetAnalysisHandler } from '../GetAnalysisHandler';
import { GetAnalysisByIdQuery } from '../../../types/queries/AnalysisQueries';
import { GetAnalysisUseCase } from '../../../use-cases/GetAnalysisUseCase';
import { Analysis } from '../../../../domain/entities/Analysis';
import { AnalysisId, UserId, Locale, Score } from '../../../../domain/value-objects';
import { success, failure } from '../../../../shared/types/common';
import { ValidationError } from '../../../../shared/types/errors';

describe('GetAnalysisHandler', () => {
  let handler: GetAnalysisHandler;
  let mockGetAnalysisUseCase: Partial<GetAnalysisUseCase>;

  const validAnalysisId = AnalysisId.generate();
  const validUserId = UserId.generate();

  beforeEach(() => {
    mockGetAnalysisUseCase = {
      execute: vi.fn()
    };

    handler = new GetAnalysisHandler(
      mockGetAnalysisUseCase as GetAnalysisUseCase
    );
  });

  describe('handle', () => {
    it('should successfully handle valid query with user ID', async () => {
      // Arrange
      const query = new GetAnalysisByIdQuery(
        validAnalysisId,
        validUserId,
        'test-correlation-id'
      );

      const mockAnalysis = Analysis.create({
        idea: 'Test analysis idea',
        userId: validUserId,
        score: Score.create(75),
        locale: Locale.english()
      });

      const mockUseCaseOutput = {
        analysis: mockAnalysis
      };

      mockGetAnalysisUseCase.execute = vi.fn().mockResolvedValue(success(mockUseCaseOutput));

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analysis).toBe(mockAnalysis);
      }

      expect(mockGetAnalysisUseCase.execute).toHaveBeenCalledWith({
        analysisId: query.analysisId,
        userId: query.userId,
        includePrivateData: true
      });
    });

    it('should successfully handle valid query without user ID', async () => {
      // Arrange
      const query = new GetAnalysisByIdQuery(
        validAnalysisId,
        undefined,
        'test-correlation-id'
      );

      const mockAnalysis = Analysis.create({
        idea: 'Test analysis idea',
        userId: validUserId,
        score: Score.create(75),
        locale: Locale.english()
      });

      const mockUseCaseOutput = {
        analysis: mockAnalysis
      };

      mockGetAnalysisUseCase.execute = vi.fn().mockResolvedValue(success(mockUseCaseOutput));

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analysis).toBe(mockAnalysis);
      }

      expect(mockGetAnalysisUseCase.execute).toHaveBeenCalledWith({
        analysisId: query.analysisId,
        userId: query.userId,
        includePrivateData: false
      });
    });

    it('should handle use case failure', async () => {
      // Arrange
      const query = new GetAnalysisByIdQuery(
        validAnalysisId,
        validUserId,
        'test-correlation-id'
      );

      const useCaseError = new Error('Analysis not found');
      mockGetAnalysisUseCase.execute = vi.fn().mockResolvedValue(failure(useCaseError));

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(useCaseError);
      }
    });

    it('should handle unexpected exceptions', async () => {
      // Arrange
      const query = new GetAnalysisByIdQuery(
        validAnalysisId,
        validUserId,
        'test-correlation-id'
      );

      mockGetAnalysisUseCase.execute = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Database connection failed');
      }
    });
  });

  describe('validateQuery', () => {
    it('should validate valid query data with user ID', () => {
      // Arrange
      const validData = {
        analysisId: validAnalysisId.value,
        userId: validUserId.value,
        correlationId: 'test-id'
      };

      // Act
      const result = handler.validateQuery(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analysisId.equals(validAnalysisId)).toBe(true);
        expect(result.data.userId?.equals(validUserId)).toBe(true);
        expect(result.data.correlationId).toBe('test-id');
      }
    });

    it('should validate valid query data without user ID', () => {
      // Arrange
      const validData = {
        analysisId: validAnalysisId.value,
        correlationId: 'test-id'
      };

      // Act
      const result = handler.validateQuery(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analysisId.equals(validAnalysisId)).toBe(true);
        expect(result.data.userId).toBeUndefined();
      }
    });

    it('should reject null or undefined data', () => {
      // Act & Assert
      expect(handler.validateQuery(null).success).toBe(false);
      expect(handler.validateQuery(undefined).success).toBe(false);
      expect(handler.validateQuery('string').success).toBe(false);
    });

    it('should reject missing required fields', () => {
      // Test missing analysisId
      const result = handler.validateQuery({
        userId: validUserId.value
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Analysis ID is required');
      }
    });

    it('should reject invalid field types', () => {
      // Test invalid analysisId type
      const result = handler.validateQuery({
        analysisId: 123,
        userId: validUserId.value
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Analysis ID is required and must be a string');
      }
    });

    it('should handle invalid value object creation', () => {
      // Test invalid analysisId format
      let result = handler.validateQuery({
        analysisId: 'invalid-uuid',
        userId: validUserId.value
      });
      expect(result.success).toBe(false);

      // Test invalid userId format
      result = handler.validateQuery({
        analysisId: validAnalysisId.value,
        userId: 'invalid-uuid'
      });
      expect(result.success).toBe(false);
    });

    it('should handle optional userId field', () => {
      // Arrange
      const validDataWithoutUserId = {
        analysisId: validAnalysisId.value
      };

      // Act
      const result = handler.validateQuery(validDataWithoutUserId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBeUndefined();
      }
    });
  });
});