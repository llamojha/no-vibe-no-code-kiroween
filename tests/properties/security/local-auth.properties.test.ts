/**
 * Property tests for Local Authentication Service (Open Source Mode)
 *
 * Feature: open-source-mode
 * Tests Properties 2, 3, 4, 5 from the design document
 *
 * @module tests/properties/security/local-auth.properties.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { forAll } from "../utils/property-helpers";
import {
  generateUserId,
  validateCredentials,
  createLocalUser,
  authenticate,
  clearAuthState,
} from "@/lib/auth/localAuth";

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock getLocalAuthCredentials
vi.mock("@/lib/featureFlags.config", () => ({
  getLocalAuthCredentials: () => ({
    username: "kiro",
    password: "kiro",
  }),
}));

describe("Property: Local Authentication (Open Source Mode)", () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(global, "window", {
      value: { localStorage: localStorageMock },
      writable: true,
    });
    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("Property 2: Local authentication determinism", () => {
    /**
     * **Feature: open-source-mode, Property 2: Local authentication determinism**
     *
     * For any username string, the generated user ID SHALL always be the same
     * value when generated multiple times with the same input.
     *
     * **Validates: Requirements 2.4**
     */
    it("should generate the same user ID for the same username across multiple calls", () => {
      forAll(
        () => faker.internet.username(),
        (username) => {
          const id1 = generateUserId(username);
          const id2 = generateUserId(username);
          const id3 = generateUserId(username);

          // All generated IDs should be identical
          return id1 === id2 && id2 === id3;
        },
        100
      );
    });

    it("should generate different user IDs for different usernames", () => {
      forAll(
        () => ({
          username1: faker.internet.username() + faker.string.alphanumeric(5),
          username2: faker.internet.username() + faker.string.alphanumeric(5),
        }),
        ({ username1, username2 }) => {
          // Skip if usernames happen to be the same
          if (username1 === username2) return true;

          const id1 = generateUserId(username1);
          const id2 = generateUserId(username2);

          // Different usernames should produce different IDs
          return id1 !== id2;
        },
        100
      );
    });

    it("should generate consistent IDs for edge case usernames", () => {
      const edgeCases = [
        "a", // Single character
        "kiro", // Default username
        "user123", // Alphanumeric
        "user_name", // With underscore
        "user-name", // With hyphen
        "User.Name", // With dot
        "UPPERCASE", // All caps
        "lowercase", // All lowercase
        "MixedCase123", // Mixed
        "🎃", // Emoji (unicode)
        "日本語", // Non-ASCII
        " spaces ", // With spaces
        "", // Empty string
      ];

      edgeCases.forEach((username) => {
        const id1 = generateUserId(username);
        const id2 = generateUserId(username);
        expect(id1).toBe(id2);
      });
    });

    it("should generate IDs in the expected format", () => {
      forAll(
        () => faker.internet.username(),
        (username) => {
          const id = generateUserId(username);
          // ID should start with "local-user-" prefix
          return id.startsWith("local-user-");
        },
        100
      );
    });
  });

  describe("Property 3: Local authentication tier assignment", () => {
    /**
     * **Feature: open-source-mode, Property 3: Local authentication tier assignment**
     *
     * For any successfully authenticated local user, the user's tier SHALL
     * always be "admin".
     *
     * **Validates: Requirements 2.5**
     */
    it("should always assign admin tier to created local users", () => {
      forAll(
        () => faker.internet.username(),
        (username) => {
          const user = createLocalUser(username);
          return user.tier === "admin";
        },
        100
      );
    });

    it("should assign admin tier regardless of username content", () => {
      const usernames = [
        "admin",
        "user",
        "guest",
        "free",
        "paid",
        "test",
        "kiro",
        faker.internet.username(),
        faker.person.firstName(),
        faker.string.alphanumeric(20),
      ];

      usernames.forEach((username) => {
        const user = createLocalUser(username);
        expect(user.tier).toBe("admin");
      });
    });

    it("should create user with all required fields", () => {
      forAll(
        () => faker.internet.username(),
        (username) => {
          const user = createLocalUser(username);

          // Verify all required fields are present and valid
          return (
            typeof user.id === "string" &&
            user.id.startsWith("local-user-") &&
            user.username === username &&
            user.email === `${username}@local.nvnc` &&
            user.tier === "admin" &&
            typeof user.createdAt === "string" &&
            typeof user.lastLoginAt === "string"
          );
        },
        100
      );
    });
  });

  describe("Property 4: Valid credentials authentication success", () => {
    /**
     * **Feature: open-source-mode, Property 4: Valid credentials authentication success**
     *
     * For any credentials that match the configured LOCAL_AUTH_USERNAME and
     * LOCAL_AUTH_PASSWORD (or defaults kiro/kiro), authentication SHALL succeed
     * and return a valid LocalUser.
     *
     * **Validates: Requirements 2.2**
     */
    it("should authenticate successfully with valid credentials", () => {
      // Using the mocked default credentials (kiro/kiro)
      const result = authenticate("kiro", "kiro");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.username).toBe("kiro");
        expect(result.user.tier).toBe("admin");
        expect(result.user.email).toBe("kiro@local.nvnc");
      }
    });

    it("should return valid LocalUser on successful authentication", () => {
      const result = authenticate("kiro", "kiro");

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify user has all required properties
        expect(result.user.id).toMatch(/^local-user-/);
        expect(result.user.username).toBe("kiro");
        expect(result.user.email).toBe("kiro@local.nvnc");
        expect(result.user.tier).toBe("admin");
        expect(result.user.createdAt).toBeDefined();
        expect(result.user.lastLoginAt).toBeDefined();
      }
    });

    it("should validate credentials correctly", () => {
      // Valid credentials
      expect(validateCredentials("kiro", "kiro")).toBe(true);

      // Invalid credentials
      expect(validateCredentials("kiro", "wrong")).toBe(false);
      expect(validateCredentials("wrong", "kiro")).toBe(false);
      expect(validateCredentials("wrong", "wrong")).toBe(false);
    });
  });

  describe("Property 5: Invalid credentials authentication failure", () => {
    /**
     * **Feature: open-source-mode, Property 5: Invalid credentials authentication failure**
     *
     * For any credentials that do not match the configured LOCAL_AUTH_USERNAME
     * and LOCAL_AUTH_PASSWORD, authentication SHALL fail and return an error.
     *
     * **Validates: Requirements 2.3**
     */
    it("should fail authentication with invalid username", () => {
      forAll(
        () => {
          // Generate username that is NOT "kiro"
          let username = faker.internet.username();
          while (username === "kiro") {
            username = faker.internet.username();
          }
          return username;
        },
        (invalidUsername) => {
          const result = authenticate(invalidUsername, "kiro");
          return (
            result.success === false && result.error === "Invalid credentials"
          );
        },
        100
      );
    });

    it("should fail authentication with invalid password", () => {
      forAll(
        () => {
          // Generate password that is NOT "kiro"
          let password = faker.internet.password();
          while (password === "kiro") {
            password = faker.internet.password();
          }
          return password;
        },
        (invalidPassword) => {
          const result = authenticate("kiro", invalidPassword);
          return (
            result.success === false && result.error === "Invalid credentials"
          );
        },
        100
      );
    });

    it("should fail authentication with both invalid username and password", () => {
      forAll(
        () => ({
          username: faker.internet.username() + "_invalid",
          password: faker.internet.password() + "_invalid",
        }),
        ({ username, password }) => {
          const result = authenticate(username, password);
          return (
            result.success === false && result.error === "Invalid credentials"
          );
        },
        100
      );
    });

    it("should fail authentication with empty credentials", () => {
      const emptyUsernameResult = authenticate("", "kiro");
      expect(emptyUsernameResult.success).toBe(false);
      if (!emptyUsernameResult.success) {
        expect(emptyUsernameResult.error).toBe(
          "Username and password are required"
        );
      }

      const emptyPasswordResult = authenticate("kiro", "");
      expect(emptyPasswordResult.success).toBe(false);
      if (!emptyPasswordResult.success) {
        expect(emptyPasswordResult.error).toBe(
          "Username and password are required"
        );
      }

      const bothEmptyResult = authenticate("", "");
      expect(bothEmptyResult.success).toBe(false);
      if (!bothEmptyResult.success) {
        expect(bothEmptyResult.error).toBe(
          "Username and password are required"
        );
      }
    });

    it("should return appropriate error message for invalid credentials", () => {
      const result = authenticate("wrong", "wrong");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid credentials");
      }
    });
  });
});
