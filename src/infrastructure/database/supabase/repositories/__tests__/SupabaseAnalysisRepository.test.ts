import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseAnalysisRepository } from '../SupabaseAnalysisRepository';
import { AnalysisMapper } from '../mappers/AnalysisMapper';
import { Analysis } from '../../../../../domain/entities/Analysis';
import { AnalysisId, UserId, Score, Locale, Category } from '../../../../../domain/value-objects';
import { DatabaseError, DatabaseQueryError, RecordNotFoundError } from '../../../errors';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn()
} as any;

// Mock query builder
const mockQueryBuilder = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn()
};

describe('SupabaseAnalysisRepository Integration Tests', () => {
  let repository: SupabaseAnalysisRepository;
  let mapper: AnalysisMapper;
  let testAnalysis: Analysis;
  let testAnalysisDAO: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mapper = new AnalysisMapper();
    repository = new SupabaseAnalysisRepository(mockSupabaseClient, mapper);

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

    // Create corresponding DAO
    testAnalysisDAO = {
      id: testAnalysis.id.value,
      idea: testAnalysis.idea,
      user_id: testAnalysis.userId.value,
      score: testAnalysis.score.value,
      locale: testAnalysis.locale.value,
      category_type: testAnalysis.category?.type || null,
      category_value: testAnalysis.category?.value || null,
      feedback: testAnalysis.feedback,
      suggestions: testAnalysis.suggestions,
      created_at: testAnalysis.createdAt.toISOString(),
      updated_at: testAnalysis.updatedAt.toISOString()
    };

    // Setup default mock behavior
    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  });

  describe('save', () => {
    it('should successfully save analysis to database', async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: testAnalysisDAO,
        error: null
      });

      // Act
      const result = await repository.save(testAnalysis);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id.equals(testAnalysis.id)).toBe(true);
        expect(result.data.idea).toBe(testAnalysis.idea);
        expect(result.data.score.equals(testAnalysis.score)).toBe(true);
      }

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('saved_analyses');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testAnalysis.id.value,
          idea: testAnalysis.idea,
          user_id: testAnalysis.userId.value
        })
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should handle database insert errors', async () => {
      // Arrange
      const dbError = { message: 'Unique constraint violation', code: '23505' };
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: dbError
      });

      // Act
      const result = await repository.save(testAnalysis);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseQueryError);
        expect(result.error.message).toContain('Failed to save analysis');
      }
    });

    it('should handle unexpected errors during save', async () => {
      // Arrange
      mockQueryBuilder.single.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await repository.save(testAnalysis);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toContain('Unexpected error saving analysis');
      }
    });
  });

  describe('findById', () => {
    it('should successfully find analysis by ID', async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: testAnalysisDAO,
        error: null
      });

      // Act
      const result = await repository.findById(testAnalysis.id);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.id.equals(testAnalysis.id)).toBe(true);
        expect(result.data!.idea).toBe(testAnalysis.idea);
      }

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('saved_analyses');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', testAnalysis.id.value);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should return null when analysis not found', async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' } // Supabase "no rows" error
      });

      // Act
      const result = await repository.findById(testAnalysis.id);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should handle database query errors', async () => {
      // Arrange
      const dbError = { message: 'Connection timeout', code: '08006' };
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: dbError
      });

      // Act
      const result = await repository.findById(testAnalysis.id);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseQueryError);
      }
    });
  });

  describe('update', () => {
    it('should successfully update analysis', async () => {
      // Arrange
      const updatedAnalysisDAO = { ...testAnalysisDAO, score: 90 };
      mockQueryBuilder.single.mockResolvedValue({
        data: updatedAnalysisDAO,
        error: null
      });

      // Update the test analysis
      testAnalysis.updateScore(Score.create(90));

      // Act
      const result = await repository.update(testAnalysis);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score.value).toBe(90);
      }

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 90
        })
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', testAnalysis.id.value);
    });

    it('should handle update of non-existent analysis', async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      // Act
      const result = await repository.update(testAnalysis);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(RecordNotFoundError);
      }
    });
  });

  describe('delete', () => {
    it('should successfully delete analysis', async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: testAnalysisDAO,
        error: null
      });

      // Act
      const result = await repository.delete(testAnalysis.id);

      // Assert
      expect(result.success).toBe(true);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', testAnalysis.id.value);
    });

    it('should handle deletion of non-existent analysis', async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      // Act
      const result = await repository.delete(testAnalysis.id);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(RecordNotFoundError);
      }
    });
  });

  describe('findByUserId', () => {
    it('should successfully find analyses by user ID', async () => {
      // Arrange
      const analysesDAO = [testAnalysisDAO, { ...testAnalysisDAO, id: 'another-id' }];
      mockQueryBuilder.mockResolvedValue({
        data: analysesDAO,
        error: null
      });

      // Act
      const result = await repository.findByUserId(testAnalysis.userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].userId.equals(testAnalysis.userId)).toBe(true);
      }

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', testAnalysis.userId.value);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no analyses found for user', async () => {
      // Arrange
      mockQueryBuilder.mockResolvedValue({
        data: [],
        error: null
      });

      // Act
      const result = await repository.findByUserId(testAnalysis.userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('search', () => {
    it('should successfully search analyses with criteria', async () => {
      // Arrange
      const searchCriteria = {
        userId: testAnalysis.userId,
        ideaKeywords: 'AI platform',
        minScore: 80,
        maxScore: 100,
        locale: Locale.english(),
        category: Category.createGeneral('technology')
      };

      mockQueryBuilder.mockResolvedValue({
        data: [testAnalysisDAO],
        error: null
      });

      // Act
      const result = await repository.search(searchCriteria);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id.equals(testAnalysis.id)).toBe(true);
      }

      // Verify search criteria were applied
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', testAnalysis.userId.value);
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('idea', '%AI platform%');
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('score', 80);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('score', 100);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('locale', 'en');
    });

    it('should handle search with no results', async () => {
      // Arrange
      const searchCriteria = {
        userId: testAnalysis.userId,
        ideaKeywords: 'nonexistent'
      };

      mockQueryBuilder.mockResolvedValue({
        data: [],
        error: null
      });

      // Act
      const result = await repository.search(searchCriteria);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('findByUserIdPaginated', () => {
    it('should successfully return paginated results', async () => {
      // Arrange
      const analyses = Array(15).fill(null).map((_, i) => ({
        ...testAnalysisDAO,
        id: `analysis-${i}`
      }));

      // Mock count query
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { count: 15 },
        error: null
      });

      // Mock data query
      mockQueryBuilder.mockResolvedValueOnce({
        data: analyses.slice(0, 10), // First page
        error: null
      });

      // Act
      const result = await repository.findByUserIdPaginated(
        testAnalysis.userId,
        1, // page
        10 // limit
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analyses).toHaveLength(10);
        expect(result.data.total).toBe(15);
      }

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9); // Supabase uses 0-based indexing
    });
  });
});