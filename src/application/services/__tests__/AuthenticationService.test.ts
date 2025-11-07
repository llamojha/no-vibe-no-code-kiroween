import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthenticationService } from '../AuthenticationService';
import { GetUserByIdUseCase, CreateUserUseCase, UpdateUserLastLoginUseCase } from '../../use-cases/user';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { Email } from '../../../domain/value-objects/Email';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn()
  },
  from: vi.fn()
} as any;

// Mock user repository
const mockUserRepository: Partial<IUserRepository> = {
  findById: vi.fn(),
  save: vi.fn(),
  updateLastLogin: vi.fn(),
  isEmailTaken: vi.fn()
};

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let getUserByIdUseCase: GetUserByIdUseCase;
  let createUserUseCase: CreateUserUseCase;
  let updateUserLastLoginUseCase: UpdateUserLastLoginUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    
    getUserByIdUseCase = new GetUserByIdUseCase(mockUserRepository as IUserRepository);
    createUserUseCase = new CreateUserUseCase(mockUserRepository as IUserRepository);
    updateUserLastLoginUseCase = new UpdateUserLastLoginUseCase(mockUserRepository as IUserRepository);
    
    authService = new AuthenticationService(
      mockSupabaseClient,
      getUserByIdUseCase,
      createUserUseCase,
      updateUserLastLoginUseCase
    );
  });

  describe('getSession', () => {
    it('should return authenticated session when user is logged in', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getSession();

      expect(result).toEqual({
        userId: 'test-user-id',
        userEmail: 'test@example.com',
        isAuthenticated: true
      });
    });

    it('should return unauthenticated when no session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await authService.getSession();

      expect(result).toEqual({
        userId: '',
        isAuthenticated: false
      });
    });

    it('should return unauthenticated when session error', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session error')
      });

      const result = await authService.getSession();

      expect(result).toEqual({
        userId: '',
        isAuthenticated: false
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user has valid session', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    it('should return UserId when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getCurrentUserId();

      expect(result).toBeInstanceOf(UserId);
      expect(result?.value).toBe('test-user-id');
    });

    it('should return null when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await authService.getCurrentUserId();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated and user exists', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      };

      const mockUser = User.create({
        email: Email.create('test@example.com')
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUserRepository.findById.mockResolvedValue({
        success: true,
        data: mockUser
      });

      const result = await authService.getCurrentUser();

      expect(result).toBe(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null when user not found in repository', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUserRepository.findById.mockResolvedValue({
        success: true,
        data: null
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});