/**
 * Property tests for Credit System Bypass in Open Source Mode
 *
 * Feature: open-source-mode
 * Tests Properties 8, 9, 10 from the design document
 *
 * @module tests/properties/business-rules/credit-bypass.properties.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { forAll } from "../utils/property-helpers";
import { generateUserId } from "../utils/generators";

// Track the current LOCAL_STORAGE_MODE value for mocking
let mockLocalStorageMode = false;

// Mock the feature flags module
vi.mock("@/lib/featureFlags", () => ({
  isEnabled: (flag: string) => {
    if (flag === "LOCAL_STORAGE_MODE") {
      return mockLocalStorageMode;
    }
    return false;
  },
}));

// Mock the credit system config
vi.mock("@/src/infrastructure/config/credits", () => ({
  isCreditSystemEnabled: () => true,
}));

// Mock the localDevCredits module
vi.mock("@/src/application/utils/localDevCredits", () => ({
  isLocalDevModeEnabled: () => false,
  getOrInitializeLocalDevCredits: vi.fn().mockResolvedValue(999),
  setLocalDevCredits: vi.fn().mockResolvedValue(undefined),
}));

// Mock getUserTier
vi.mock("@/src/application/utils/getUserTier", () => ({
  getUserTierFromDatabase: vi.fn().mockResolvedValue("free"),
}));

// Import after mocks are set up
import { CheckCreditsUseCase } from "@/src/application/use-cases/CheckCreditsUseCase";
import { DeductCreditUseCase } from "@/src/application/use-cases/DeductCreditUseCase";
import { GetCreditBalanceUseCase } from "@/src/application/use-cases/GetCreditBalanceUseCase";
import { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import { ICreditTransactionRepository } from "@/src/domain/repositories/ICreditTransactionRepository";
import { CreditPolicy } from "@/src/domain/services/CreditPolicy";
import { ICache } from "@/src/infrastructure/cache/ICache";
import { User } from "@/src/domain/entities/User";
import { Email } from "@/src/domain/value-objects/Email";
import { UserId } from "@/src/domain/value-objects/UserId";
import { success } from "@/src/shared/types/common";

// Create mock implementations
function createMockCache(): ICache {
  const store = new Map<string, { value: unknown; expiresAt: number }>();
  return {
    get: async <T>(key: string): Promise<T | null> => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value as T;
    },
    set: async <T>(
      key: string,
      value: T,
      ttlSeconds?: number
    ): Promise<void> => {
      store.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds || 60) * 1000,
      });
    },
    delete: async (key: string): Promise<void> => {
      store.delete(key);
    },
    clear: async (): Promise<void> => {
      store.clear();
    },
  };
}

function createMockUserRepository(user?: User): IUserRepository {
  return {
    findById: vi.fn().mockResolvedValue(success(user || null)),
    findByEmail: vi.fn().mockResolvedValue(success(user || null)),
    save: vi.fn().mockResolvedValue(success(undefined)),
    updateCredits: vi.fn().mockResolvedValue(success(undefined)),
    updateLastLogin: vi.fn().mockResolvedValue(success(undefined)),
    delete: vi.fn().mockResolvedValue(success(undefined)),
  };
}

function createMockCreditTransactionRepository(): ICreditTransactionRepository {
  return {
    recordTransaction: vi.fn().mockResolvedValue(success(undefined)),
    getTransactionsByUserId: vi.fn().mockResolvedValue(success([])),
    getBalance: vi
      .fn()
      .mockResolvedValue(success({ credits: 0, tier: "free" })),
  };
}

describe("Property 8: Credit bypass in local mode", () => {
  /**
   * **Feature: open-source-mode, Property 8: Credit bypass in local mode**
   *
   * For any credit check operation when LOCAL_STORAGE_MODE is enabled,
   * the operation SHALL return success (sufficient credits) regardless of the actual balance.
   *
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */

  let cache: ICache;
  let creditPolicy: CreditPolicy;

  beforeEach(() => {
    mockLocalStorageMode = true;
    cache = createMockCache();
    creditPolicy = new CreditPolicy();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should always return allowed=true for credit checks in LOCAL_STORAGE_MODE", async () => {
    await forAllAsync(
      generateUserId,
      async (userId) => {
        // Create user with 0 credits (would normally fail credit check)
        const user = User.create({
          email: Email.create(`test-${userId.value}@example.com`),
          credits: 0,
        });
        const userRepository = createMockUserRepository(user);

        const useCase = new CheckCreditsUseCase(
          userRepository,
          creditPolicy,
          cache
        );

        const result = await useCase.execute(userId);

        return result.success && result.data?.allowed === true;
      },
      100
    );
  });

  it("should return credits=9999 for credit checks in LOCAL_STORAGE_MODE", async () => {
    await forAllAsync(
      generateUserId,
      async (userId) => {
        const userRepository = createMockUserRepository();

        const useCase = new CheckCreditsUseCase(
          userRepository,
          creditPolicy,
          cache
        );

        const result = await useCase.execute(userId);

        return result.success && result.data?.credits === 9999;
      },
      100
    );
  });

  it("should return tier='admin' for credit checks in LOCAL_STORAGE_MODE", async () => {
    await forAllAsync(
      generateUserId,
      async (userId) => {
        const userRepository = createMockUserRepository();

        const useCase = new CheckCreditsUseCase(
          userRepository,
          creditPolicy,
          cache
        );

        const result = await useCase.execute(userId);

        return result.success && result.data?.tier === "admin";
      },
      100
    );
  });

  it("should bypass credit check regardless of user's actual credit balance", async () => {
    // Test with various credit balances
    const creditBalances = [0, 1, 5, 10, 100, 1000];

    for (const credits of creditBalances) {
      const userId = generateUserId();
      const user = User.create({
        email: Email.create(`test-${credits}@example.com`),
        credits,
      });
      const userRepository = createMockUserRepository(user);

      const useCase = new CheckCreditsUseCase(
        userRepository,
        creditPolicy,
        cache
      );

      const result = await useCase.execute(userId);

      expect(result.success).toBe(true);
      expect(result.data?.allowed).toBe(true);
      expect(result.data?.credits).toBe(9999);
      expect(result.data?.tier).toBe("admin");
    }
  });
});

describe("Property 9: Credit balance in local mode", () => {
  /**
   * **Feature: open-source-mode, Property 9: Credit balance in local mode**
   *
   * For any credit balance query when LOCAL_STORAGE_MODE is enabled,
   * the returned balance SHALL be 9999 with tier "admin".
   *
   * **Validates: Requirements 4.1**
   */

  let cache: ICache;

  beforeEach(() => {
    mockLocalStorageMode = true;
    cache = createMockCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should always return credits=9999 for balance queries in LOCAL_STORAGE_MODE", async () => {
    await forAllAsync(
      generateUserId,
      async (userId) => {
        const userRepository = createMockUserRepository();

        const useCase = new GetCreditBalanceUseCase(userRepository, cache);

        const result = await useCase.execute(userId);

        return result.success && result.data?.credits === 9999;
      },
      100
    );
  });

  it("should always return tier='admin' for balance queries in LOCAL_STORAGE_MODE", async () => {
    await forAllAsync(
      generateUserId,
      async (userId) => {
        const userRepository = createMockUserRepository();

        const useCase = new GetCreditBalanceUseCase(userRepository, cache);

        const result = await useCase.execute(userId);

        return result.success && result.data?.tier === "admin";
      },
      100
    );
  });

  it("should return consistent balance regardless of user's actual credits", async () => {
    // Test with various credit balances
    const creditBalances = [0, 1, 5, 10, 100, 1000];

    for (const credits of creditBalances) {
      const userId = generateUserId();
      const user = User.create({
        email: Email.create(`test-${credits}@example.com`),
        credits,
      });
      const userRepository = createMockUserRepository(user);

      const useCase = new GetCreditBalanceUseCase(userRepository, cache);

      const result = await useCase.execute(userId);

      expect(result.success).toBe(true);
      expect(result.data?.credits).toBe(9999);
      expect(result.data?.tier).toBe("admin");
    }
  });
});

describe("Property 10: Credit enforcement in normal mode", () => {
  /**
   * **Feature: open-source-mode, Property 10: Credit enforcement in normal mode**
   *
   * For any credit check operation when LOCAL_STORAGE_MODE is disabled,
   * the operation SHALL enforce normal credit system rules based on actual balance.
   *
   * **Validates: Requirements 4.4**
   */

  let cache: ICache;
  let creditPolicy: CreditPolicy;

  beforeEach(() => {
    mockLocalStorageMode = false;
    cache = createMockCache();
    creditPolicy = new CreditPolicy();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return actual credit balance when LOCAL_STORAGE_MODE is disabled", async () => {
    const userId = generateUserId();
    const actualCredits = 5;
    const user = User.create({
      email: Email.create("test@example.com"),
      credits: actualCredits,
    });
    const userRepository = createMockUserRepository(user);

    const useCase = new CheckCreditsUseCase(
      userRepository,
      creditPolicy,
      cache
    );

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    expect(result.data?.credits).toBe(actualCredits);
    // Should NOT be 9999 (the LOCAL_STORAGE_MODE value)
    expect(result.data?.credits).not.toBe(9999);
  });

  it("should return allowed=false when user has 0 credits in normal mode", async () => {
    const userId = generateUserId();
    const user = User.create({
      email: Email.create("test@example.com"),
      credits: 0,
    });
    const userRepository = createMockUserRepository(user);

    const useCase = new CheckCreditsUseCase(
      userRepository,
      creditPolicy,
      cache
    );

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    expect(result.data?.allowed).toBe(false);
  });

  it("should return allowed=true when user has sufficient credits in normal mode", async () => {
    const userId = generateUserId();
    const user = User.create({
      email: Email.create("test@example.com"),
      credits: 5,
    });
    const userRepository = createMockUserRepository(user);

    const useCase = new CheckCreditsUseCase(
      userRepository,
      creditPolicy,
      cache
    );

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    expect(result.data?.allowed).toBe(true);
  });

  it("should return actual balance from GetCreditBalanceUseCase in normal mode", async () => {
    const userId = generateUserId();
    const actualCredits = 7;
    const user = User.create({
      email: Email.create("test@example.com"),
      credits: actualCredits,
    });
    const userRepository = createMockUserRepository(user);

    const useCase = new GetCreditBalanceUseCase(userRepository, cache);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    expect(result.data?.credits).toBe(actualCredits);
    // Should NOT be 9999 (the LOCAL_STORAGE_MODE value)
    expect(result.data?.credits).not.toBe(9999);
  });

  it("should enforce credit rules based on actual balance for various credit amounts", async () => {
    const testCases = [
      { credits: 0, expectedAllowed: false },
      { credits: 1, expectedAllowed: true },
      { credits: 5, expectedAllowed: true },
      { credits: 10, expectedAllowed: true },
    ];

    for (const { credits, expectedAllowed } of testCases) {
      const userId = generateUserId();
      const user = User.create({
        email: Email.create(`test-${credits}@example.com`),
        credits,
      });
      const userRepository = createMockUserRepository(user);

      const useCase = new CheckCreditsUseCase(
        userRepository,
        creditPolicy,
        cache
      );

      const result = await useCase.execute(userId);

      expect(result.success).toBe(true);
      expect(result.data?.allowed).toBe(expectedAllowed);
      expect(result.data?.credits).toBe(credits);
    }
  });
});

/**
 * Async version of forAll for testing async properties
 */
async function forAllAsync<T>(
  generator: () => T,
  property: (value: T) => Promise<boolean>,
  iterations: number = 100
): Promise<void> {
  for (let i = 0; i < iterations; i++) {
    const value = generator();
    const result = await property(value);
    if (!result) {
      throw new Error(
        `Property violated at iteration ${i + 1} with value: ${JSON.stringify(
          value,
          null,
          2
        )}`
      );
    }
  }
}
