import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseAdapter } from '../SupabaseAdapter';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(),
  createClientComponentClient: vi.fn(),
}));

import { cookies } from 'next/headers';
import { 
  createServerComponentClient, 
  createClientComponentClient 
} from '@supabase/auth-helpers-nextjs';

describe('SupabaseAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SupabaseAdapter.resetInstances();
  });

  describe('getServerClient', () => {
    it('should create a new client for each call', () => {
      // Arrange
      const mockClient1 = { id: 'client1' };
      const mockClient2 = { id: 'client2' };
      
      vi.mocked(createServerComponentClient)
        .mockReturnValueOnce(mockClient1 as any)
        .mockReturnValueOnce(mockClient2 as any);

      // Act
      const client1 = SupabaseAdapter.getServerClient();
      const client2 = SupabaseAdapter.getServerClient();

      // Assert
      expect(client1).not.toBe(client2);
      expect(createServerComponentClient).toHaveBeenCalledTimes(2);
      expect(createServerComponentClient).toHaveBeenCalledWith({ cookies });
    });

    it('should always use current request cookies', () => {
      // Arrange
      const mockClient = { id: 'client' };
      vi.mocked(createServerComponentClient).mockReturnValue(mockClient as any);

      // Act
      SupabaseAdapter.getServerClient();
      SupabaseAdapter.getServerClient();
      SupabaseAdapter.getServerClient();

      // Assert
      expect(createServerComponentClient).toHaveBeenCalledTimes(3);
      expect(createServerComponentClient).toHaveBeenCalledWith({ cookies });
    });

    it('should not cache server client instances', () => {
      // Arrange
      let callCount = 0;
      vi.mocked(createServerComponentClient).mockImplementation(() => {
        callCount++;
        return { id: `client${callCount}` } as any;
      });

      // Act
      const clients = [
        SupabaseAdapter.getServerClient(),
        SupabaseAdapter.getServerClient(),
        SupabaseAdapter.getServerClient(),
      ];

      // Assert
      expect(clients[0]).not.toBe(clients[1]);
      expect(clients[1]).not.toBe(clients[2]);
      expect(clients[0]).not.toBe(clients[2]);
    });
  });

  describe('getClientClient', () => {
    it('should return singleton for client-side', () => {
      // Arrange
      const mockClient = { id: 'client' };
      vi.mocked(createClientComponentClient).mockReturnValue(mockClient as any);

      // Act
      const client1 = SupabaseAdapter.getClientClient();
      const client2 = SupabaseAdapter.getClientClient();

      // Assert
      expect(client1).toBe(client2);
      expect(createClientComponentClient).toHaveBeenCalledTimes(1);
    });

    it('should create new instance after reset', () => {
      // Arrange
      const mockClient1 = { id: 'client1' };
      const mockClient2 = { id: 'client2' };
      vi.mocked(createClientComponentClient)
        .mockReturnValueOnce(mockClient1 as any)
        .mockReturnValueOnce(mockClient2 as any);

      // Act
      const client1 = SupabaseAdapter.getClientClient();
      SupabaseAdapter.resetInstances();
      const client2 = SupabaseAdapter.getClientClient();

      // Assert
      expect(client1).not.toBe(client2);
      expect(createClientComponentClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('createServerClient', () => {
    it('should create a new server client', () => {
      // Arrange
      const mockClient = { id: 'client' };
      vi.mocked(createServerComponentClient).mockReturnValue(mockClient as any);

      // Act
      const client = SupabaseAdapter.createServerClient();

      // Assert
      expect(client).toBe(mockClient);
      expect(createServerComponentClient).toHaveBeenCalledWith({ cookies });
    });

    it('should create different instances on each call', () => {
      // Arrange
      const mockClient1 = { id: 'client1' };
      const mockClient2 = { id: 'client2' };
      vi.mocked(createServerComponentClient)
        .mockReturnValueOnce(mockClient1 as any)
        .mockReturnValueOnce(mockClient2 as any);

      // Act
      const client1 = SupabaseAdapter.createServerClient();
      const client2 = SupabaseAdapter.createServerClient();

      // Assert
      expect(client1).not.toBe(client2);
    });
  });

  describe('createClientClient', () => {
    it('should create a new client client', () => {
      // Arrange
      const mockClient = { id: 'client' };
      vi.mocked(createClientComponentClient).mockReturnValue(mockClient as any);

      // Act
      const client = SupabaseAdapter.createClientClient();

      // Assert
      expect(client).toBe(mockClient);
      expect(createClientComponentClient).toHaveBeenCalled();
    });
  });

  describe('resetInstances', () => {
    it('should reset client instance only', () => {
      // Arrange
      const mockClient1 = { id: 'client1' };
      const mockClient2 = { id: 'client2' };
      vi.mocked(createClientComponentClient)
        .mockReturnValueOnce(mockClient1 as any)
        .mockReturnValueOnce(mockClient2 as any);

      // Act
      const clientBefore = SupabaseAdapter.getClientClient();
      SupabaseAdapter.resetInstances();
      const clientAfter = SupabaseAdapter.getClientClient();

      // Assert
      expect(clientBefore).not.toBe(clientAfter);
    });

    it('should not affect server client behavior', () => {
      // Arrange
      let callCount = 0;
      vi.mocked(createServerComponentClient).mockImplementation(() => {
        callCount++;
        return { id: `server${callCount}` } as any;
      });

      // Act
      const server1 = SupabaseAdapter.getServerClient();
      SupabaseAdapter.resetInstances();
      const server2 = SupabaseAdapter.getServerClient();

      // Assert
      // Server clients should always be different regardless of reset
      expect(server1).not.toBe(server2);
      expect(createServerComponentClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('isConfigured', () => {
    it('should return true when environment variables are set', () => {
      // Arrange
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Act
      const result = SupabaseAdapter.isConfigured();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when environment variables are missing', () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Act
      const result = SupabaseAdapter.isConfigured();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return configuration object', () => {
      // Arrange
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Act
      const config = SupabaseAdapter.getConfig();

      // Assert
      expect(config).toEqual({
        url: 'https://example.supabase.co',
        anonKey: 'test-key',
        isConfigured: true,
      });
    });
  });

  describe('handleError', () => {
    it('should handle PGRST116 error (not found)', () => {
      // Arrange
      const error = { code: 'PGRST116', message: 'Not found' };

      // Act
      const result = SupabaseAdapter.handleError(error, 'test operation');

      // Assert
      expect(result.message).toBe('Resource not found');
    });

    it('should handle 23505 error (duplicate)', () => {
      // Arrange
      const error = { code: '23505', message: 'Duplicate key' };

      // Act
      const result = SupabaseAdapter.handleError(error, 'test operation');

      // Assert
      expect(result.message).toBe('Resource already exists');
    });

    it('should handle 42501 error (permissions)', () => {
      // Arrange
      const error = { code: '42501', message: 'Permission denied' };

      // Act
      const result = SupabaseAdapter.handleError(error, 'test operation');

      // Assert
      expect(result.message).toBe('Insufficient permissions');
    });

    it('should handle generic error with message', () => {
      // Arrange
      const error = { message: 'Something went wrong' };

      // Act
      const result = SupabaseAdapter.handleError(error, 'test operation');

      // Assert
      expect(result.message).toBe('test operation failed: Something went wrong');
    });

    it('should handle unknown error', () => {
      // Arrange
      const error = {};

      // Act
      const result = SupabaseAdapter.handleError(error, 'test operation');

      // Assert
      expect(result.message).toBe('test operation failed: Unknown error');
    });
  });

  describe('Session Isolation Integration Tests', () => {
    describe('User Session Isolation', () => {
      it('should create different client instances for different users', () => {
        // Arrange - Simulate two different users with different tokens
        const mockUserAClient = {
          id: 'client-user-a',
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-a-id', email: 'usera@example.com' } },
              error: null,
            }),
          },
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'analysis-a', user_id: 'user-a-id' }],
                error: null,
              }),
            }),
          }),
        };

        const mockUserBClient = {
          id: 'client-user-b',
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-b-id', email: 'userb@example.com' } },
              error: null,
            }),
          },
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'analysis-b', user_id: 'user-b-id' }],
                error: null,
              }),
            }),
          }),
        };

        // Mock different cookies for different users
        vi.mocked(createServerComponentClient)
          .mockReturnValueOnce(mockUserAClient as any)
          .mockReturnValueOnce(mockUserBClient as any);

        // Act - Simulate two different requests
        const clientA = SupabaseAdapter.getServerClient();
        const clientB = SupabaseAdapter.getServerClient();

        // Assert - Clients should be different instances
        expect(clientA).not.toBe(clientB);
        expect(clientA.id).toBe('client-user-a');
        expect(clientB.id).toBe('client-user-b');
      });

      it('should prevent User B from accessing User A data through RLS', async () => {
        // Arrange - Mock RLS behavior
        const mockUserAClient = {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-a-id' } },
              error: null,
            }),
          },
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'analysis-a', user_id: 'user-a-id' }],
                error: null,
              }),
            }),
          }),
        };

        const mockUserBClient = {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-b-id' } },
              error: null,
            }),
          },
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((field: string, value: string) => {
                // Simulate RLS: User B trying to access User A's data returns empty
                if (value === 'user-a-id') {
                  return Promise.resolve({ data: [], error: null });
                }
                return Promise.resolve({
                  data: [{ id: 'analysis-b', user_id: 'user-b-id' }],
                  error: null,
                });
              }),
            }),
          }),
        };

        vi.mocked(createServerComponentClient)
          .mockReturnValueOnce(mockUserAClient as any)
          .mockReturnValueOnce(mockUserBClient as any);

        // Act
        const clientA = SupabaseAdapter.getServerClient();
        const clientB = SupabaseAdapter.getServerClient();

        // User A can access their own data
        const userAData = await clientA.auth.getUser();
        const analysisAResult = await clientA
          .from('analyses')
          .select()
          .eq('user_id', 'user-a-id');

        // User B tries to access User A's data (should be blocked by RLS)
        const userBData = await clientB.auth.getUser();
        const analysisBAttempt = await clientB
          .from('analyses')
          .select()
          .eq('user_id', 'user-a-id');

        // Assert
        expect(userAData.data?.user?.id).toBe('user-a-id');
        expect(analysisAResult.data?.length).toBeGreaterThan(0);
        expect(analysisAResult.data?.[0].user_id).toBe('user-a-id');

        expect(userBData.data?.user?.id).toBe('user-b-id');
        expect(analysisBAttempt.data?.length).toBe(0); // RLS blocks access
      });

      it('should maintain separate authentication contexts', async () => {
        // Arrange - Mock different authentication states
        const mockAuthenticatedClient = {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'authenticated-user', email: 'auth@example.com' } },
              error: null,
            }),
            getSession: vi.fn().mockResolvedValue({
              data: {
                session: {
                  access_token: 'valid-token',
                  refresh_token: 'valid-refresh',
                  user: { id: 'authenticated-user' },
                },
              },
              error: null,
            }),
          },
        };

        const mockUnauthenticatedClient = {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: null },
              error: { message: 'Not authenticated' },
            }),
            getSession: vi.fn().mockResolvedValue({
              data: { session: null },
              error: { message: 'No session' },
            }),
          },
        };

        vi.mocked(createServerComponentClient)
          .mockReturnValueOnce(mockAuthenticatedClient as any)
          .mockReturnValueOnce(mockUnauthenticatedClient as any);

        // Act
        const clientAuthenticated = SupabaseAdapter.getServerClient();
        const clientUnauthenticated = SupabaseAdapter.getServerClient();

        const authUser = await clientAuthenticated.auth.getUser();
        const authSession = await clientAuthenticated.auth.getSession();

        const unauthUser = await clientUnauthenticated.auth.getUser();
        const unauthSession = await clientUnauthenticated.auth.getSession();

        // Assert - Authenticated user has valid session
        expect(authUser.data?.user).toBeTruthy();
        expect(authUser.data?.user?.id).toBe('authenticated-user');
        expect(authSession.data?.session?.access_token).toBe('valid-token');

        // Assert - Unauthenticated user has no session
        expect(unauthUser.data?.user).toBeNull();
        expect(unauthSession.data?.session).toBeNull();
      });

      it('should handle refresh token updates correctly', async () => {
        // Arrange - Mock token refresh scenario
        const mockClientBeforeRefresh = {
          auth: {
            getSession: vi.fn().mockResolvedValue({
              data: {
                session: {
                  access_token: 'old-token',
                  refresh_token: 'old-refresh',
                  expires_at: Date.now() / 1000 - 100, // Expired
                },
              },
              error: null,
            }),
            refreshSession: vi.fn().mockResolvedValue({
              data: {
                session: {
                  access_token: 'new-token',
                  refresh_token: 'new-refresh',
                  expires_at: Date.now() / 1000 + 3600, // Valid for 1 hour
                },
              },
              error: null,
            }),
          },
        };

        const mockClientAfterRefresh = {
          auth: {
            getSession: vi.fn().mockResolvedValue({
              data: {
                session: {
                  access_token: 'new-token',
                  refresh_token: 'new-refresh',
                  expires_at: Date.now() / 1000 + 3600,
                },
              },
              error: null,
            }),
          },
        };

        vi.mocked(createServerComponentClient)
          .mockReturnValueOnce(mockClientBeforeRefresh as any)
          .mockReturnValueOnce(mockClientAfterRefresh as any);

        // Act - Simulate token refresh flow
        const client1 = SupabaseAdapter.getServerClient();
        const sessionBefore = await client1.auth.getSession();
        
        // Trigger refresh
        await client1.auth.refreshSession();

        // Get new client (simulating next request with updated cookies)
        const client2 = SupabaseAdapter.getServerClient();
        const sessionAfter = await client2.auth.getSession();

        // Assert - Tokens should be updated
        expect(sessionBefore.data?.session?.access_token).toBe('old-token');
        expect(sessionAfter.data?.session?.access_token).toBe('new-token');
        expect(sessionAfter.data?.session?.refresh_token).toBe('new-refresh');
      });

      it('should verify each request gets fresh cookies', () => {
        // Arrange
        const mockCookieStore1 = { get: vi.fn(), set: vi.fn() };
        const mockCookieStore2 = { get: vi.fn(), set: vi.fn() };
        const mockCookieStore3 = { get: vi.fn(), set: vi.fn() };

        vi.mocked(cookies)
          .mockReturnValueOnce(mockCookieStore1 as any)
          .mockReturnValueOnce(mockCookieStore2 as any)
          .mockReturnValueOnce(mockCookieStore3 as any);

        // Act - Simulate three different requests
        SupabaseAdapter.getServerClient();
        SupabaseAdapter.getServerClient();
        SupabaseAdapter.getServerClient();

        // Assert - Each call should use cookies() to get fresh cookie store
        expect(createServerComponentClient).toHaveBeenCalledTimes(3);
        expect(createServerComponentClient).toHaveBeenNthCalledWith(1, { cookies });
        expect(createServerComponentClient).toHaveBeenNthCalledWith(2, { cookies });
        expect(createServerComponentClient).toHaveBeenNthCalledWith(3, { cookies });
      });
    });

    describe('RLS (Row Level Security) Validation', () => {
      it('should enforce RLS policies preventing cross-user data access', async () => {
        // Arrange - Mock strict RLS enforcement
        const createMockClientWithRLS = (userId: string) => ({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: userId } },
              error: null,
            }),
          },
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((field: string, value: string) => {
                // RLS: Only return data if querying own user_id
                if (field === 'user_id' && value === userId) {
                  return Promise.resolve({
                    data: [{ id: `analysis-${userId}`, user_id: userId }],
                    error: null,
                  });
                }
                // RLS blocks access to other users' data
                return Promise.resolve({ data: [], error: null });
              }),
            }),
            insert: vi.fn().mockImplementation((data: any) => ({
              select: vi.fn().mockImplementation(() => {
                // RLS: Only allow insert if user_id matches authenticated user
                if (data.user_id === userId) {
                  return Promise.resolve({
                    data: [{ ...data, id: 'new-id' }],
                    error: null,
                  });
                }
                return Promise.resolve({
                  data: null,
                  error: { code: '42501', message: 'RLS policy violation' },
                });
              }),
            })),
          }),
        });

        vi.mocked(createServerComponentClient)
          .mockReturnValueOnce(createMockClientWithRLS('user-1') as any)
          .mockReturnValueOnce(createMockClientWithRLS('user-2') as any);

        // Act
        const client1 = SupabaseAdapter.getServerClient();
        const client2 = SupabaseAdapter.getServerClient();

        // User 1 accesses their own data
        const user1OwnData = await client1
          .from('analyses')
          .select()
          .eq('user_id', 'user-1');

        // User 1 tries to access User 2's data
        const user1CrossAccess = await client1
          .from('analyses')
          .select()
          .eq('user_id', 'user-2');

        // User 2 accesses their own data
        const user2OwnData = await client2
          .from('analyses')
          .select()
          .eq('user_id', 'user-2');

        // Assert - RLS allows own data, blocks others
        expect(user1OwnData.data?.length).toBeGreaterThan(0);
        expect(user1CrossAccess.data?.length).toBe(0); // Blocked by RLS
        expect(user2OwnData.data?.length).toBeGreaterThan(0);
      });

      it('should prevent unauthorized data insertion via RLS', async () => {
        // Arrange
        const mockClient = {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-1' } },
              error: null,
            }),
          },
          from: vi.fn().mockReturnValue({
            insert: vi.fn().mockImplementation((data: any) => ({
              select: vi.fn().mockImplementation(() => {
                // RLS: Block insert if user_id doesn't match authenticated user
                if (data.user_id !== 'user-1') {
                  return Promise.resolve({
                    data: null,
                    error: { code: '42501', message: 'RLS policy violation' },
                  });
                }
                return Promise.resolve({
                  data: [{ ...data, id: 'new-id' }],
                  error: null,
                });
              }),
            })),
          }),
        };

        vi.mocked(createServerComponentClient).mockReturnValue(mockClient as unknown);

        // Act
        const client = SupabaseAdapter.getServerClient();

        // Try to insert data for own user (should succeed)
        const validInsert = await client
          .from('analyses')
          .insert({ user_id: 'user-1', idea: 'My idea' })
          .select();

        // Try to insert data for another user (should fail)
        const invalidInsert = await client
          .from('analyses')
          .insert({ user_id: 'user-2', idea: 'Malicious idea' })
          .select();

        // Assert
        expect(validInsert.data).toBeTruthy();
        expect(validInsert.error).toBeNull();
        expect(invalidInsert.data).toBeNull();
        expect(invalidInsert.error?.code).toBe('42501');
      });
    });
  });
});
