import { vi } from 'vitest';

/**
 * Test utilities for infrastructure layer tests
 */

/**
 * Creates a mock GoogleAI instance for testing
 * Returns a mock with the correct structure for Google Generative AI
 */
export function createMockGoogleAI() {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        score: 85,
        detailedSummary: 'Excellent idea with strong market potential',
        criteria: [
          {
            name: 'Market Potential',
            score: 90,
            justification: 'Large addressable market'
          },
          {
            name: 'Technical Feasibility',
            score: 80,
            justification: 'Technically achievable'
          }
        ],
        suggestions: [
          'Consider mobile app development',
          'Explore enterprise partnerships',
          'Add real-time collaboration features'
        ]
      })
    }
  });

  return {
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent
    }),
    // Expose the generateContent mock for easy access in tests
    _mockGenerateContent: mockGenerateContent
  };
}

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
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

  return {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
    _mockQueryBuilder: mockQueryBuilder
  };
}

/**
 * Creates a mock AuthenticationService for testing
 */
export function createMockAuthenticationService() {
  return {
    authenticateRequest: vi.fn().mockResolvedValue({
      success: true,
      userId: 'test-user-id',
      userEmail: 'test@example.com',
      userTier: 'free'
    }),
    authenticateRequestPaidOrAdmin: vi.fn().mockResolvedValue({
      success: true,
      userId: 'test-user-id',
      userEmail: 'test@example.com',
      userTier: 'paid'
    }),
    getSession: vi.fn().mockResolvedValue({
      success: true,
      session: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }
    })
  };
}
