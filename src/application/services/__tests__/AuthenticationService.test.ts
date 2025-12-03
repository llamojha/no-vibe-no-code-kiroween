import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthenticationService } from "../AuthenticationService";
import {
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserLastLoginUseCase,
} from "../../use-cases/user";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { User } from "../../../domain/entities/User";
import { UserId } from "../../../domain/value-objects/UserId";
import { Email } from "../../../domain/value-objects/Email";

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(),
} as any;

// Mock user repository
const mockUserRepository: Partial<IUserRepository> = {
  findById: vi.fn(),
  save: vi.fn(),
  updateLastLogin: vi.fn(),
  isEmailTaken: vi.fn(),
};

describe("AuthenticationService", () => {
  let authService: AuthenticationService;
  let getUserByIdUseCase: GetUserByIdUseCase;
  let createUserUseCase: CreateUserUseCase;
  let updateUserLastLoginUseCase: UpdateUserLastLoginUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    getUserByIdUseCase = new GetUserByIdUseCase(
      mockUserRepository as IUserRepository
    );
    createUserUseCase = new CreateUserUseCase(
      mockUserRepository as IUserRepository
    );
    updateUserLastLoginUseCase = new UpdateUserLastLoginUseCase(
      mockUserRepository as IUserRepository
    );

    authService = new AuthenticationService(
      mockSupabaseClient,
      getUserByIdUseCase,
      createUserUseCase,
      updateUserLastLoginUseCase
    );
  });

  describe("getSession", () => {
    it("should call getUser() before getSession() and return authenticated session", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
      };

      const mockSession = {
        user: mockUser,
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getSession();

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
      expect(result).toEqual({
        userId: "test-user-id",
        userEmail: "test@example.com",
        isAuthenticated: true,
        isVerified: true,
      });
    });

    it("should return unauthenticated when getUser() returns no user", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.getSession();

      expect(result).toEqual({
        userId: "",
        isAuthenticated: false,
        isVerified: false,
      });
      expect(mockSupabaseClient.auth.getSession).not.toHaveBeenCalled();
    });

    it("should return unauthenticated when getUser() returns error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token", status: 401 },
      });

      const result = await authService.getSession();

      expect(result).toEqual({
        userId: "",
        isAuthenticated: false,
        isVerified: false,
      });
      expect(mockSupabaseClient.auth.getSession).not.toHaveBeenCalled();
    });

    it("should return authenticated even if getSession() fails after user verification", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Session error" },
      });

      const result = await authService.getSession();

      expect(result).toEqual({
        userId: "test-user-id",
        userEmail: "test@example.com",
        isAuthenticated: true,
        isVerified: true,
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Network error")
      );

      const result = await authService.getSession();

      expect(result).toEqual({
        userId: "",
        isAuthenticated: false,
        isVerified: false,
      });
    });

    it("should set isVerified to true when user is successfully authenticated", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.isVerified).toBe(true);
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when user has valid session", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it("should return false when no session", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("authenticateRequest", () => {
    it("should successfully authenticate with valid session and existing user", async () => {
      const validUserId = UserId.generate();
      const mockUser = {
        id: validUserId.value,
        email: "test@example.com",
      };

      const domainUser = User.create({
        email: Email.create("test@example.com"),
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      getUserByIdUseCase.execute = vi.fn().mockResolvedValue({
        success: true,
        data: domainUser,
      });

      const result = await authService.authenticateRequest();

      expect(result.success).toBe(true);
      expect(result.user).toBe(domainUser);
      expect(result.userId).toBe(validUserId.value);
      expect(result.userEmail).toBe("test@example.com");
    });

    it("should fail when no session exists", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.authenticateRequest();

      expect(result.success).toBe(false);
      expect(result.error).toBe("No active session found");
    });

    it("should fail when user retrieval fails", async () => {
      const validUserId = UserId.generate();
      const mockUser = {
        id: validUserId.value,
        email: "test@example.com",
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      getUserByIdUseCase.execute = vi.fn().mockResolvedValue({
        success: false,
        error: new Error("Database error"),
      });

      const result = await authService.authenticateRequest();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to retrieve user information");
    });
  });
});
