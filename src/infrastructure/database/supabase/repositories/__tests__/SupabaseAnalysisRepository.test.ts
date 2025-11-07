import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseAnalysisRepository } from '../SupabaseAnalysisRepository';
import { AnalysisMapper } from '../../mappers/AnalysisMapper';
import { Analysis } from '../../../../../domain/entities/Analysis';
import { AnalysisId, UserId, Score, Locale, Category } from '../../../../../domain/value-objects';
import { DatabaseError, DatabaseQueryError, RecordNotFoundError } from '../../../errors';

interface MockQueryBuilder {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: <T>(onfulfilled?: ((value: unknown) => T | PromiseLike<T>) | null, onrejected?: ((reason: unknown) => T | PromiseLike<T>) | null) => Promise<T>;
  mockReturnValueOnce: (value: unknown) => void;
}

// Helper function to create mock query builder
const createMockQueryBuilder = (): MockQueryBuilder => {
  // Create a promise-like object that can be awaited
  const state = { resolveValue: { data: null, error: null, count: null } };
  
  const builder: unknown = {
    // Chainable methods that return the builder
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    limit: vi.fn(),
    or: vi.fn(),
    contains: vi.fn(),
    
    // Terminal methods that return promises
    single: vi.fn(),
    maybeSingle: vi.fn(),
    
    // Make the builder itself thenable (promise-like)
    then: function<T>(onfulfilled?: ((value: unknown) => T | PromiseLike<T>) | null, onrejected?: ((reason: unknown) => T | PromiseLike<T>) | null) {
      return Promise.resolve(state.resolveValue).then(onfulfilled, onrejected);
    },
    
    // Helper method to set return value for both single() and direct await
    mockReturnValueOnce: (value: unknown) => {
      state.resolveValue = value;
      builder.single.mockResolvedValueOnce(value);
    }
  };
  
  // Make all chainable methods return the builder
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.neq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.gte.mockReturnValue(builder);
  builder.lte.mockReturnValue(builder);
  builder.ilike.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.range.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.or.mockReturnValue(builder);
  builder.contains.mockReturnValue(builder);
  
  // Make single() return a promise with the resolve value by default
  builder.single.mockResolvedValue(state.resolveValue);
  
  return builder as MockQueryBuilder;
};

interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
}

// Mock Supabase client
const mockSupabaseClient: MockSupabaseClient = {
  from: vi.fn()
};

// Mock query builder - will be recreated in beforeEach
let mockQueryBuilder: MockQueryBuilder;

describe('SupabaseAnalysisRepository Integration Tests', () => {
  let repository: SupabaseAnalysisRepository;
  let mapper: AnalysisMapper;
  let testAnalysis: Analysis;
  let testAnalysisDAO: unknown;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mock query builder for each test
    mockQueryBuilder = createMockQueryBuilder();
    
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

    // Create corresponding DAO with proper structure
    testAnalysisDAO = {
      id: testAnalysis.id.value,
      idea: testAnalysis.idea,
      user_id: testAnalysis.userId.value,
      analysis: {
        score: testAnalysis.score.value,
        locale: testAnalysis.locale.value,
        detailedSummary: testAnalysis.feedback || 'Test detailed summary',
        viabilitySummary: 'Test viability summary',
        finalScoreExplanation: 'Test explanation',
        strengths: ['Strength 1', 'Strength 2'],
        weaknesses: ['Weakness 1'],
        improvementSuggestions: testAnalysis.suggestions || [],
        scoringRubric: [],
        foundersChecklist: []
      },
      audio_base64: null,
      created_at: testAnalysis.createdAt.toISOString()
    };

    // Setup default mock behavior
    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  });

  describe('save', () => {
    it('should successfully save analysis to database', async () => {
      // Arrange
      mockQueryBuilder.mockReturnValueOnce({
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
      mockQueryBuilder.mockReturnValueOnce({
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
      // Create a fresh analysis with a different ID
      const freshAnalysisId = AnalysisId.generate();
      const freshUserId = UserId.generate();
      
      // Create DAO for the fresh analysis with analysis field
      const freshAnalysisDAO = {
        id: freshAnalysisId.value,
        idea: 'A revolutionary AI-powered development platform',
        user_id: freshUserId.value,
        score: 90,
        locale: 'en',
        category_type: 'general',
        category_value: 'technology',
        feedback: 'Excellent idea',
        suggestions: ['Consider mobile app development'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        analysis: {
          score: 90,
          detailedSummary: 'Excellent idea',
          criteria: [],
          suggestions: ['Consider mobile app development']
        }
      };
      
      // Reconstruct the analysis from DAO (this won't be completed)
      const freshAnalysis = mapper.toDomain(freshAnalysisDAO as unknown);
      
      mockQueryBuilder.mockReturnValueOnce({
        data: freshAnalysisDAO,
        error: null
      });

      // Act
      const result = await repository.update(freshAnalysis);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score.value).toBe(90);
      }

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', freshAnalysis.id.value);
    });

    it('should handle update of non-existent analysis', async () => {
      // Arrange
      // When there's an error, repository returns DatabaseQueryError
      mockQueryBuilder.mockReturnValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      // Act
      const result = await repository.update(testAnalysis);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        // Repository returns DatabaseQueryError when there's an error from Supabase
        expect(result.error).toBeInstanceOf(DatabaseQueryError);
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
      // Supabase delete doesn't return error for non-existent records, it just succeeds
      mockQueryBuilder.mockReturnValueOnce({
        data: null,
        error: null
      });

      // Act
      const result = await repository.delete(testAnalysis.id);

      // Assert
      // Delete operation succeeds even if record doesn't exist (idempotent)
      expect(result.success).toBe(true);
    });
  });

  describe('findByUserId', () => {
    it('should successfully find analyses by user ID', async () => {
      // Arrange
      const analysesDAO = [testAnalysisDAO, { ...testAnalysisDAO, id: 'another-id' }];
      
      mockQueryBuilder.mockReturnValueOnce({
        data: analysesDAO,
        error: null,
        count: 2
      });

      // Act
      const result = await repository.findByUserId(testAnalysis.userId, { page: 1, limit: 10 });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.items[0].userId.equals(testAnalysis.userId)).toBe(true);
      }

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', testAnalysis.userId.value);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no analyses found for user', async () => {
      // Arrange
      mockQueryBuilder.mockReturnValueOnce({
        data: [],
        error: null,
        count: 0
      });

      // Act
      const result = await repository.findByUserId(testAnalysis.userId, { page: 1, limit: 10 });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(0);
      }
    });
  });

  describe('search', () => {
    it('should successfully search analyses with criteria', async () => {
      // Arrange
      const searchCriteria = {
        userId: testAnalysis.userId,
        ideaKeywords: 'AI platform',
        minScore: Score.create(80),
        maxScore: Score.create(100),
        locale: Locale.english(),
        category: Category.createGeneral('technology')
      };

      mockQueryBuilder.mockReturnValueOnce({
        data: [testAnalysisDAO],
        error: null,
        count: 1
      });

      // Act
      const result = await repository.search(
        searchCriteria,
        { field: 'createdAt', direction: 'desc' },
        { page: 1, limit: 10 }
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].id.equals(testAnalysis.id)).toBe(true);
      }

      // Verify search criteria were applied
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', testAnalysis.userId.value);
    });

    it('should handle search with no results', async () => {
      // Arrange
      const searchCriteria = {
        userId: testAnalysis.userId,
        ideaContains: 'nonexistent'
      };

      mockQueryBuilder.mockReturnValueOnce({
        data: [],
        error: null,
        count: 0
      });

      // Act
      const result = await repository.search(
        searchCriteria,
        { field: 'createdAt', direction: 'desc' },
        { page: 1, limit: 10 }
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(0);
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

      mockQueryBuilder.mockReturnValueOnce({
        data: analyses.slice(0, 10), // First page
        error: null,
        count: 15
      });

      // Act
      const result = await repository.findByUserIdPaginated(
        testAnalysis.userId,
        {
          page: 1,
          limit: 10
        }
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