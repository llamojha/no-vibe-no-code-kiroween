/**
 * Local Authentication Service for Open Source Mode
 *
 * Provides simple username/password authentication when LOCAL_STORAGE_MODE is enabled.
 * Uses localStorage for auth state persistence and generates deterministic user IDs.
 *
 * @module lib/auth/localAuth
 */

import type { Session, User } from "@supabase/supabase-js";
import { getLocalAuthCredentials } from "@/lib/featureFlags.config";

// Storage key for local auth state
const LOCAL_AUTH_STORAGE_KEY = "nvnc-local-auth";

/**
 * Local user entity for Open Source Mode
 * Always assigned admin tier for full feature access
 */
export interface LocalUser {
  /** Deterministic ID generated from username hash */
  id: string;
  /** Username used for authentication */
  username: string;
  /** Generated email: {username}@local.nvnc */
  email: string;
  /** Always "admin" in local mode for full access */
  tier: "admin";
  /** ISO timestamp of user creation */
  createdAt: string;
  /** ISO timestamp of last login */
  lastLoginAt: string;
}

/**
 * Authentication state stored in localStorage
 */
export interface LocalAuthState {
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** The authenticated user, or null if not authenticated */
  user: LocalUser | null;
  /** ISO timestamp when session was created */
  sessionCreatedAt: string;
}

/**
 * Result of authentication attempt
 */
export type AuthResult =
  | { success: true; user: LocalUser }
  | { success: false; error: string };

/**
 * Generate a deterministic user ID from username using a simple hash
 * The same username will always produce the same ID
 *
 * @param username - The username to hash
 * @returns A deterministic user ID in format "local-user-{hash}"
 */
export function generateUserId(username: string): string {
  // Simple hash function for deterministic ID generation
  // Uses djb2 algorithm for consistent hashing
  let hash = 5381;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = (hash << 5) + hash + char; // hash * 33 + char
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  const positiveHash = Math.abs(hash).toString(16).padStart(8, "0");
  return `local-user-${positiveHash}`;
}

/**
 * Validate credentials against configured or default values
 *
 * @param username - Username to validate
 * @param password - Password to validate
 * @returns true if credentials match, false otherwise
 */
export function validateCredentials(
  username: string,
  password: string
): boolean {
  const { username: expectedUsername, password: expectedPassword } =
    getLocalAuthCredentials();

  return username === expectedUsername && password === expectedPassword;
}

/**
 * Create a LocalUser entity from a username
 *
 * @param username - The authenticated username
 * @returns A LocalUser with deterministic ID and admin tier
 */
export function createLocalUser(username: string): LocalUser {
  const now = new Date().toISOString();
  return {
    id: generateUserId(username),
    username,
    email: `${username}@local.nvnc`,
    tier: "admin",
    createdAt: now,
    lastLoginAt: now,
  };
}

/**
 * Get the current authentication state from localStorage
 *
 * @returns The stored auth state, or null if not found or invalid
 */
export function getAuthState(): LocalAuthState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as LocalAuthState;

    // Validate the parsed state has required fields
    if (
      typeof parsed.isAuthenticated !== "boolean" ||
      typeof parsed.sessionCreatedAt !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    // Invalid JSON or other error - clear corrupted state
    localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
    return null;
  }
}

/**
 * Store authentication state in localStorage
 *
 * @param state - The auth state to store
 */
export function setAuthState(state: LocalAuthState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save auth state to localStorage:", error);
  }
}

/**
 * Clear authentication state from localStorage
 */
export function clearAuthState(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
}

/**
 * Create a mock Supabase Session object for compatibility with existing code
 *
 * @param user - The LocalUser to create a session for
 * @returns A Session object compatible with Supabase auth
 */
export function createMockSession(user: LocalUser): Session {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  const mockUser: User = {
    id: user.id,
    aud: "authenticated",
    role: "authenticated",
    email: user.email,
    email_confirmed_at: user.createdAt,
    phone: "",
    confirmed_at: user.createdAt,
    last_sign_in_at: user.lastLoginAt,
    app_metadata: {
      provider: "local",
      providers: ["local"],
    },
    user_metadata: {
      username: user.username,
      tier: user.tier,
    },
    identities: [],
    created_at: user.createdAt,
    updated_at: user.lastLoginAt,
  };

  return {
    access_token: `local-access-token-${user.id}`,
    refresh_token: `local-refresh-token-${user.id}`,
    expires_in: expiresIn,
    expires_at: now + expiresIn,
    token_type: "bearer",
    user: mockUser,
  };
}

/**
 * Authenticate a user with username and password
 *
 * @param username - Username to authenticate
 * @param password - Password to authenticate
 * @returns AuthResult with success status and user or error
 */
export function authenticate(username: string, password: string): AuthResult {
  // Validate inputs
  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  // Check credentials
  if (!validateCredentials(username, password)) {
    return { success: false, error: "Invalid credentials" };
  }

  // Create user and store auth state
  const user = createLocalUser(username);
  const authState: LocalAuthState = {
    isAuthenticated: true,
    user,
    sessionCreatedAt: new Date().toISOString(),
  };

  setAuthState(authState);

  return { success: true, user };
}

/**
 * Sign out the current user
 */
export function signOut(): void {
  clearAuthState();
}

/**
 * Check if a user is currently authenticated
 *
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  const state = getAuthState();
  return state?.isAuthenticated === true && state.user !== null;
}

/**
 * Get the current authenticated user
 *
 * @returns The current LocalUser or null if not authenticated
 */
export function getCurrentUser(): LocalUser | null {
  const state = getAuthState();
  return state?.user ?? null;
}

/**
 * Get the current session (mock Supabase Session)
 *
 * @returns A mock Session or null if not authenticated
 */
export function getSession(): Session | null {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  return createMockSession(user);
}
