import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Adapter to integrate Supabase with hexagonal architecture
 * Provides a clean interface for the infrastructure layer to access Supabase
 * 
 * ⚠️ CRITICAL SECURITY INFORMATION ⚠️
 * 
 * ## Server-Side Client Caching Vulnerability
 * 
 * **NEVER cache Supabase server clients in a static variable or singleton pattern.**
 * 
 * ### Why This Is Critical:
 * 
 * In Next.js server-side operations (Server Components, API Routes, Server Actions),
 * each HTTP request has its own cookie store containing user-specific session tokens.
 * If you cache the Supabase client globally:
 * 
 * 1. **Session Leak**: The first user's session tokens get "frozen" in the cached client
 * 2. **Cross-User Access**: User B can access User A's data and permissions
 * 3. **Stale Tokens**: Refresh tokens don't update when cookies change
 * 4. **Auth Bypass**: Unauthenticated users can inherit authenticated sessions
 * 
 * ### The Problem (INCORRECT):
 * ```typescript
 * // ❌ DANGEROUS - DO NOT DO THIS
 * class BadAdapter {
 *   private static serverInstance: SupabaseClient | null = null;
 *   
 *   static getServerClient() {
 *     if (!this.serverInstance) {
 *       this.serverInstance = createServerComponentClient({ cookies });
 *     }
 *     return this.serverInstance; // Returns same instance for all users!
 *   }
 * }
 * ```
 * 
 * ### The Solution (CORRECT):
 * ```typescript
 * // ✅ SAFE - Always create fresh client
 * class SafeAdapter {
 *   static getServerClient() {
 *     return createServerComponentClient({ cookies }); // New client per request
 *   }
 * }
 * ```
 * 
 * ### Usage Examples:
 * 
 * **Server Component (Correct):**
 * ```typescript
 * export default async function MyServerComponent() {
 *   const supabase = SupabaseAdapter.getServerClient(); // Fresh client
 *   const { data } = await supabase.from('analyses').select();
 *   return <div>{data}</div>;
 * }
 * ```
 * 
 * **API Route (Correct):**
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const supabase = SupabaseAdapter.getServerClient(); // Fresh client
 *   const { data } = await supabase.from('analyses').select();
 *   return NextResponse.json(data);
 * }
 * ```
 * 
 * **Client Component (Singleton is Safe):**
 * ```typescript
 * 'use client';
 * export function MyClientComponent() {
 *   const supabase = SupabaseAdapter.getClientClient(); // Singleton OK in browser
 *   // Browser context is isolated per user
 * }
 * ```
 * 
 * ### Why Client-Side Singleton is Safe:
 * 
 * - Each browser has its own JavaScript context
 * - Cookies are managed by the browser, not shared between users
 * - No risk of cross-user session leaks
 * - Performance benefit from reusing the same client instance
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
 */
export class SupabaseAdapter {
  private static clientInstance: any = null;

  /**
   * Get Supabase client for server-side operations
   * 
   * ⚠️ SECURITY: This method ALWAYS creates a fresh client instance.
   * 
   * ## Why Fresh Clients Are Required:
   * 
   * Each HTTP request in Next.js has its own cookie store via the `cookies()` function.
   * These cookies contain:
   * - Access tokens (JWT for current session)
   * - Refresh tokens (for renewing expired sessions)
   * - User-specific session data
   * 
   * If we cached the client, we would cache the cookie store from the first request,
   * causing all subsequent requests to use the first user's credentials.
   * 
   * ## Security Implications:
   * 
   * **Scenario Without Fresh Clients:**
   * 1. User A (admin) makes request → Client cached with admin cookies
   * 2. User B (regular user) makes request → Gets cached client with admin cookies
   * 3. User B now has admin access → CRITICAL SECURITY BREACH
   * 
   * **Scenario With Fresh Clients (Current Implementation):**
   * 1. User A makes request → Fresh client with User A's cookies
   * 2. User B makes request → Fresh client with User B's cookies
   * 3. Each user has their own isolated session → SECURE ✓
   * 
   * ## Performance Note:
   * 
   * Creating a new client per request has minimal overhead because:
   * - The client is lightweight (just a wrapper around fetch)
   * - No database connections are pooled at this level
   * - Supabase handles connection pooling on their end
   * - Security always trumps micro-optimizations
   * 
   * @returns A fresh Supabase client with current request's cookie store
   * @throws Never throws - client creation is synchronous and safe
   * 
   * @example
   * // In Server Component
   * const supabase = SupabaseAdapter.getServerClient();
   * const { data } = await supabase.from('analyses').select();
   * 
   * @example
   * // In API Route
   * export async function GET() {
   *   const supabase = SupabaseAdapter.getServerClient();
   *   const { data: { user } } = await supabase.auth.getUser();
   *   return NextResponse.json({ user });
   * }
   */
  static getServerClient(): SupabaseClient {
    return createServerComponentClient({ cookies }) as any;
  }

  /**
   * Get Supabase client for client-side operations
   * 
   * ✅ SAFE: Singleton pattern is secure for client-side usage.
   * 
   * ## Why Singleton is Safe Here:
   * 
   * Unlike server-side operations, client-side code runs in the user's browser:
   * - Each browser has its own isolated JavaScript context
   * - Cookies are managed by the browser, not shared between users
   * - No risk of cross-user session leaks
   * - Each user's browser maintains its own singleton instance
   * 
   * ## Performance Benefit:
   * 
   * Reusing the same client instance in the browser:
   * - Reduces memory allocation
   * - Maintains consistent state across components
   * - Avoids unnecessary re-initialization
   * 
   * @returns Singleton Supabase client for browser operations
   * 
   * @example
   * // In Client Component
   * 'use client';
   * export function MyComponent() {
   *   const supabase = SupabaseAdapter.getClientClient();
   *   const [data, setData] = useState(null);
   *   
   *   useEffect(() => {
   *     supabase.from('analyses').select().then(({ data }) => setData(data));
   *   }, []);
   *   
   *   return <div>{data}</div>;
   * }
   */
  static getClientClient(): SupabaseClient {
    if (!SupabaseAdapter.clientInstance) {
      SupabaseAdapter.clientInstance = createClientComponentClient();
    }
    return SupabaseAdapter.clientInstance;
  }

  /**
   * Create a new server client instance (for cases where fresh instance is needed)
   * 
   * @deprecated This method is no longer necessary as getServerClient() now always
   * creates a fresh client. Use getServerClient() instead. This method is kept for
   * backward compatibility and will be removed in a future version.
   */
  static createServerClient(): SupabaseClient {
    return createServerComponentClient({ cookies }) as any;
  }

  /**
   * Create a new client instance (for cases where fresh instance is needed)
   */
  static createClientClient(): SupabaseClient {
    return createClientComponentClient() as any;
  }

  /**
   * Reset instances (useful for testing or when configuration changes)
   * Note: Only resets client-side instance as server-side is never cached
   */
  static resetInstances(): void {
    SupabaseAdapter.clientInstance = null;
  }

  /**
   * Check if Supabase is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Get Supabase configuration
   */
  static getConfig() {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isConfigured: SupabaseAdapter.isConfigured(),
    };
  }

  /**
   * Handle Supabase errors consistently
   */
  static handleError(error: unknown, operation: string): Error {
    console.error(`Supabase ${operation} error:`, error);
    
    const errorObj = error as { code?: string; message?: string };
    
    if (errorObj?.code === 'PGRST116') {
      return new Error('Resource not found');
    }
    
    if (errorObj?.code === '23505') {
      return new Error('Resource already exists');
    }
    
    if (errorObj?.code === '42501') {
      return new Error('Insufficient permissions');
    }
    
    if (errorObj?.message) {
      return new Error(`${operation} failed: ${errorObj.message}`);
    }
    
    return new Error(`${operation} failed: Unknown error`);
  }

  /**
   * Execute Supabase operation with error handling
   */
  static async executeWithErrorHandling<T>(
    operation: () => Promise<{ data: T | null; error: unknown }>,
    operationName: string
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        throw SupabaseAdapter.handleError(error, operationName);
      }
      
      if (data === null) {
        throw new Error(`${operationName} returned no data`);
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`${operationName} failed: ${String(error)}`);
    }
  }

  /**
   * Execute Supabase operation that might return null (for optional data)
   */
  static async executeOptional<T>(
    operation: () => Promise<{ data: T | null; error: unknown }>,
    operationName: string
  ): Promise<T | null> {
    try {
      const { data, error } = await operation();
      
      const errorObj = error as { code?: string } | null;
      if (error && errorObj?.code !== 'PGRST116') { // PGRST116 is "not found"
        throw SupabaseAdapter.handleError(error, operationName);
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`${operationName} failed: ${String(error)}`);
    }
  }
}

/**
 * Convenience functions for common Supabase operations
 */
export const supabaseUtils = {
  /**
   * Get server client for use in server components and API routes
   */
  getServerClient(): SupabaseClient {
    return SupabaseAdapter.getServerClient();
  },

  /**
   * Get client for use in client components
   */
  getClientClient(): SupabaseClient {
    return SupabaseAdapter.getClientClient();
  },

  /**
   * Execute database operation with consistent error handling
   */
  async execute<T>(
    operation: () => Promise<{ data: T | null; error: unknown }>,
    operationName: string
  ): Promise<T> {
    return SupabaseAdapter.executeWithErrorHandling(operation, operationName);
  },

  /**
   * Execute optional database operation
   */
  async executeOptional<T>(
    operation: () => Promise<{ data: T | null; error: unknown }>,
    operationName: string
  ): Promise<T | null> {
    return SupabaseAdapter.executeOptional(operation, operationName);
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(client?: SupabaseClient): Promise<boolean> {
    const supabase = client || SupabaseAdapter.getServerClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(client?: SupabaseClient) {
    const supabase = client || SupabaseAdapter.getServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw SupabaseAdapter.handleError(error, 'get current user');
    }
    
    return user;
  },
};