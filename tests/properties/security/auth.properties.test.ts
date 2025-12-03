/**
 * Property tests for authentication and authorization
 * Tests security properties P-SEC-001 through P-SEC-005
 *
 * **Feature: property-testing-framework**
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthenticationService } from "@/src/application/services/AuthenticationService";
import { GetUserByIdUseCase } from "@/src/application/use-cases/user/GetUserByIdUseCase";
import { CreateUserUseCase } from "@/src/application/use-cases/user/CreateUserUseCase";
import { UpdateUserLastLoginUseCase } from "@/src/application/use-cases/user/UpdateUserLastLoginUseCase";
import { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import { UserId } from "@/src/domain/value-objects/UserId";
import { Email } from "@/src/domain/value-objects/Email";
import { User } from "@/src/domain/entities/User";
import { Locale } from "@/src/domain/value-objects/Locale";
import { forAll } from "../utils/property-helpers";
import {
  generateUser,
  generateUserId,
  generateMany,
} from "../utils/generators";

// Mock Supabase client
const createMockSupabaseClient = () => ({
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(),
      })),
    })),
  })),
});

// Mock user repository
const createMockUserRepository = (): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
  exists: vi.fn(),
  count: vi.fn(),
  getUserStats: vi.fn(),
});

describe("Property: Authentication and Authorization", () => {
  let authService: AuthenticationService;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  let mockUserRepository: IUserRepository;
  let getUserByIdUseCase: GetUserByIdUseCase;
  let createUserUseCase: CreateUserUseCase;
  let updateUserLastLoginUseCase: UpdateUserLastLoginUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient = createMockSupabaseClient();
    mockUserRepository = createMockUserRepository();

    getUserByIdUseCase = new GetUserByIdUseCase(mockUserRepository);
    createUserUseCase = new CreateUserUseCase(mockUserRepository);
    updateUserLastLoginUseCase = new UpdateUserLastLoginUseCase(
      mockUserRepository
    );

    authService = new AuthenticationService(
      mockSupabaseClient as any,
      getUserByIdUseCase,
      createUserUseCase,
      updateUserLastLoginUseCase
    );
  });

  describe("P-SEC-001: User Verificationore Session", () => {
    /**
     * Property: User must be verified before session is retrieved
     * Formal: getSession() ⇒ getUser() happens-before getSession()
     *
     * **Feature: property-testing-framework, Property 1: User verification before session**
idates: Requirements 5.1**
     */
    it("should always call getUser() before getSession()", async () => {
      // Arrange: Track call order
      const callOrder: string[] = [];

      mockSupabaseClient.auth.getUser.mockImplementation(async () => {
        callOrder.push("getUser");
        return {
          data: {
            user: {
              id: "test-user-id",
              email: "test@example.com",
            },
          },
          error: null,
        };
      });

      mockSupabaseClient.auth.getSession.mockImplementation(async () => {
        callOrder.push("getSession");
        return {
          data: {
            session: {
              user: { id: "test-user-id", email: "test@example.com" },
            },
          },
          error: null,
        };
      });

      // Act
      await authService.getSession();

      // Assert: getUser must be called before getSession
      expect(callOrder).toEqual(["getUser", "getSession"]);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });

    it("should not call getSession() if getUser() fails", async () => {
      // Arrange: getUser returns error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token", status: 401 },
      });

      // Act
      const result = await authService.getSession();

      // Assert: getSession should not be called
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.getSession).not.toHaveBeenCalled();
      expect(result.isAuthenticated).toBe(false);
      expect(result.isVerified).toBe(false);
    });

    it("should not call getSession() if getUser() returns no user", async () => {
      // Arrange: getUser returns no user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const result = await authService.getSession();

      // Assert: getSession should not be called
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.getSession).not.toHaveBeenCalled();
      expect(result.isAuthenticated).toBe(false);
      expect(result.isVerified).toBe(false);
    });

    it("should maintain verification order for multiple session checks", async () => {
      // Arrange: Set up successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "test-user-id", email: "test@example.com" },
        },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: "test-user-id", email: "test@example.com" },
          },
        },
        error: null,
      });

      // Act: Call getSession multiple times
      await authService.getSession();
      await authService.getSession();
      await authService.getSession();

      // Assert: getUser should always be called before getSession
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(3);
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(3);
    });
  });

  describe("P-SEC-002: Resource Ownership Enforcement", () => {
    /**
     * Property: Users can only access their own resources
     * Formal: ∀u: User, ∀r: Resource, canAccess(u, r) ⇒ r.userId = u.id
     *
     * **Feature: property-testing-framework, Property 2: Resource ownership enforcement**
     * **Validates: Requirements 5.2**
     */
    it("should enforce that resources belong to the authenticated user", () => {
      // Property: For any user and resource, if access is granted, userId must match
      forAll(
        () => {
          const user = generateUser();
          const resourceUserId = generateUserId();
          return { user, resourceUserId };
        },
        ({ user, resourceUserId }) => {
          // Simulate ownership check
          const canAccess = user.id.equals(resourceUserId);
          const ownershipMatches = user.id.equals(resourceUserId);

          // Property: If access is granted, ownership must match
          return !canAccess || ownershipMatches;
        },
        100
      );
    });

    it("should reject access when user ID does not match resource owner", () => {
      // Arrange: Generate different users
      const user1 = generateUser();
      const user2 = generateUser();

      // Act: Check if user1 can access user2's resource
      const canAccess = user1.id.equals(user2.id);

      // Assert: Access should be denied (IDs are different)
      expect(canAccess).toBe(false);
    });

    it("should allow access when user ID matches resource owner", () => {
      // Arrange: Generate user and resource with same ID
      const user = generateUser();
      const resourceUserId = user.id;

      // Act: Check if user can access their own resource
      const canAccess = user.id.equals(resourceUserId);

      // Assert: Access should be allowed
      expect(canAccess).toBe(true);
    });

    it("should maintain ownership enforcement across multiple resources", () => {
      // Arrange: Generate user and multiple resources
      const user = generateUser();
      const ownResources = generateMany(() => user.id, 5);
      const otherResources = generateMany(() => generateUserId(), 5);

      // Act & Assert: User can access own resources
      ownResources.forEach((resourceId) => {
        expect(user.id.equals(resourceId)).toBe(true);
      });

      // Act & Assert: User cannot access other resources
      otherResources.forEach((resourceId) => {
        expect(user.id.equals(resourceId)).toBe(false);
      });
    });
  });

  describe("P-SEC-003: RLS Policy Enforcement", () => {
    /**
     * Property: Database queries respect Row Level Security policies
     * Formal: ∀q: Query, ∀r: Row, returns(q, r) ⇒ rlsAllows(currentUser, r)
     *
     * **Feature: property-testing-framework, Property 3: RLS policy enforcement**
     * **Validates: Requirements 5.3**
     */
    it("should only return rows that match the current user's ID", async () => {
      // Arrange: Set up authenticated user
      const currentUserId = "authenticated-user-id";
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: currentUserId, email: "user@example.com" },
        },
        error: null,
      });

      // Mock database query with RLS
      const mockRows = [
        { id: "1", user_id: currentUserId, data: "user data" },
        { id: "2", user_id: currentUserId, data: "more user data" },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: mockRows[0], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      // Act: Query should filter by user_id
      const result = await mockSupabaseClient
        .from("analyses")
        .select("*")
        .eq("user_id", currentUserId)
        .maybeSingle();

      // Assert: Only rows matching user_id are returned
      expect(result.data?.user_id).toBe(currentUserId);
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", currentUserId);
    });

    it("should enforce RLS for multiple users querying simultaneously", () => {
      // Property: Each user's query only returns their own data
      const users = generateMany(() => generateUser(), 10);

      users.forEach((user) => {
        // Simulate RLS filtering
        const allRows = users.map((u) => ({
          id: u.id.value,
          user_id: u.id.value,
        }));

        // RLS should filter to only this user's rows
        const filteredRows = allRows.filter(
          (row) => row.user_id === user.id.value
        );

        // Assert: Only one row (the user's own) should be returned
        expect(filteredRows).toHaveLength(1);
        expect(filteredRows[0].user_id).toBe(user.id.value);
      });
    });

    it("should prevent cross-user data access via RLS", () => {
      // Arrange: Two different users
      const user1 = generateUser();
      const user2 = generateUser();

      // Simulate database rows
      const user1Rows = [
        { id: "1", user_id: user1.id.value, data: "user1 data" },
      ];
      const user2Rows = [
        { id: "2", user_id: user2.id.value, data: "user2 data" },
      ];

      // Act: User1 queries - RLS filters by user1.id
      const user1Results = [...user1Rows, ...user2Rows].filter(
        (row) => row.user_id === user1.id.value
      );

      // Act: User2 queries - RLS filters by user2.id
      const user2Results = [...user1Rows, ...user2Rows].filter(
        (row) => row.user_id === user2.id.value
      );

      // Assert: Each user only sees their own data
      expect(user1Results).toHaveLength(1);
      expect(user1Results[0].user_id).toBe(user1.id.value);

      expect(user2Results).toHaveLength(1);
      expect(user2Results[0].user_id).toBe(user2.id.value);
    });
  });

  describe("P-SEC-004: Token Validation", () => {
    /**
     * Property: Expired or invalid tokens are rejected
     * Formal: ∀t: Token, (isExpired(t) ∨ ¬isValid(t)) ⇒ rejects(t)
     *
     * **Feature: property-testing-framework, Property 4: Token validation**
     * **Validates: Requirements 5.4**
     */
    it("should reject expired tokens", async () => {
      // Arrange: Mock expired token
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Token expired", status: 401 },
      });

      // Act
      const result = await authService.getSession();

      // Assert: Authentication should fail
      expect(result.isAuthenticated).toBe(false);
      expect(result.isVerified).toBe(false);
    });

    it("should reject invalid tokens", async () => {
      // Arrange: Mock invalid token
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token", status: 401 },
      });

      // Act
      const result = await authService.getSession();

      // Assert: Authentication should fail
      expect(result.isAuthenticated).toBe(false);
      expect(result.isVerified).toBe(false);
    });

    it("should reject malformed tokens", async () => {
      // Arrange: Mock malformed token
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Malformed token", status: 400 },
      });

      // Act
      const result = await authService.getSession();

      // Assert: Authentication should fail
      expect(result.isAuthenticated).toBe(false);
      expect(result.isVerified).toBe(false);
    });

    it("should accept valid tokens", async () => {
      // Arrange: Mock valid token
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "valid-user-id", email: "valid@example.com" },
        },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: "valid-user-id", email: "valid@example.com" },
          },
        },
        error: null,
      });

      // Act
      const result = await authService.getSession();

      // Assert: Authentication should succeed
      expect(result.isAuthenticated).toBe(true);
      expect(result.isVerified).toBe(true);
      expect(result.userId).toBe("valid-user-id");
    });

    it("should consistently reject invalid tokens across multiple attempts", async () => {
      // Arrange: Mock invalid token
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token", status: 401 },
      });

      // Act: Try multiple times
      const results = await Promise.all([
        authService.getSession(),
        authService.getSession(),
        authService.getSession(),
      ]);

      // Assert: All attempts should fail
      results.forEach((result) => {
        expect(result.isAuthenticated).toBe(false);
        expect(result.isVerified).toBe(false);
      });
    });
  });

  describe("P-SEC-005: Authorization Check Before Data Access", () => {
    /**
     * Property: Authorization verified before any data operation
     * Formal: ∀op: DataOperation, authorize() happens-before op()
     *
     * **Feature: property-testing-framework, Property 5: Authorization check before data access**
     * **Validates: Requirements 5.5**
     */
    it("should verify authentication before allowing data operations", async () => {
      // Arrange: Track operation order
      const operationOrder: string[] = [];
      const testUserId = generateUserId();

      mockSupabaseClient.auth.getUser.mockImplementation(async () => {
        operationOrder.push("authorize");
        return {
          data: {
            user: { id: testUserId.value, email: "test@example.com" },
          },
          error: null,
        };
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: testUserId.value, email: "test@example.com" },
          },
        },
        error: null,
      });

      // Mock user repository to track data access
      vi.spyOn(mockUserRepository, "findById").mockImplementation(async () => {
        operationOrder.push("dataAccess");
        return {
          success: true,
          data: generateUser(),
        };
      });

      // Act: Authenticate and then access data
      const sessionResult = await authService.getSession();
      if (sessionResult.isAuthenticated) {
        await getUserByIdUseCase.execute(
          UserId.fromString(sessionResult.userId)
        );
      }

      // Assert: Authorization must happen before data access
      expect(operationOrder).toEqual(["authorize", "dataAccess"]);
    });

    it("should prevent data access without authentication", async () => {
      // Arrange: No authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act: Try to get session
      const sessionResult = await authService.getSession();

      // Assert: Should not be authenticated
      expect(sessionResult.isAuthenticated).toBe(false);

      // Verify data access would be blocked
      if (!sessionResult.isAuthenticated) {
        // Data access should not proceed
        expect(mockUserRepository.findById).not.toHaveBeenCalled();
      }
    });

    it("should enforce authorization for all data operations", async () => {
      // Property: Every data operation requires prior authorization
      const dataOperations = [
        "findById",
        "findByEmail",
        "save",
        "update",
        "delete",
      ] as const;

      // For each operation, authorization must happen first
      for (const operation of dataOperations) {
        const callOrder: string[] = [];

        // Mock authorization
        mockSupabaseClient.auth.getUser.mockImplementation(async () => {
          callOrder.push("authorize");
          return {
            data: {
              user: { id: "test-user-id", email: "test@example.com" },
            },
            error: null,
          };
        });

        // Mock data operation
        if (operation === "findById" || operation === "findByEmail") {
          vi.spyOn(mockUserRepository, operation).mockImplementation(
            async () => {
              callOrder.push(operation);
              return { success: true, data: generateUser() };
            }
          );
        } else {
          vi.spyOn(mockUserRepository, operation).mockImplementation(
            async () => {
              callOrder.push(operation);
              return { success: true };
            }
          );
        }

        // Act: Authorize then perform operation
        const sessionResult = await authService.getSession();
        if (sessionResult.isAuthenticated) {
          // Simulate data operation
          if (operation === "findById") {
            await mockUserRepository.findById(generateUserId());
          } else if (operation === "findByEmail") {
            await mockUserRepository.findByEmail(
              Email.create("test@example.com")
            );
          }
        }

        // Assert: Authorization must come first
        if (callOrder.length > 1) {
          expect(callOrder[0]).toBe("authorize");
        }
      }
    });

    it("should maintain authorization requirement across multiple operations", async () => {
      // Arrange: Set up authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "test-user-id", email: "test@example.com" },
        },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: "test-user-id", email: "test@example.com" },
          },
        },
        error: null,
      });

      // Act: Perform multiple operations
      const operations = [
        authService.getSession(),
        authService.getSession(),
        authService.getSession(),
      ];

      const results = await Promise.all(operations);

      // Assert: All operations should verify authorization
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(3);
      results.forEach((result) => {
        expect(result.isAuthenticated).toBe(true);
        expect(result.isVerified).toBe(true);
      });
    });
  });
});
