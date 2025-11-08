import { createClient, SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../types';

/**
 * Supabase client wrapper for hexagonal architecture
 * Provides both server-side and client-side Supabase clients
 * 
 * SECURITY NOTE:
 * - Server-side clients MUST NOT be cached globally
 * - Each request needs a fresh client with its own cookie store
 * - Caching server clients causes session leaks between users
 * - Browser-side singleton is safe (browser context isolation)
 */
export class SupabaseClient {
  private static browserInstance: any = null;

  /**
   * Get server-side Supabase client for use in API routes and server components
   * 
   * IMPORTANT: Creates a new client for each call to prevent session leaks.
   * In Next.js, each HTTP request has its own cookie store containing user-specific
   * session tokens. Caching the client would freeze the first user's cookies for all
   * subsequent requests, causing:
   * - Session leaks (User B accessing User A's session)
   * - Stale tokens (refresh tokens not updating)
   * - Authentication bypass (unauthenticated users inheriting sessions)
   * 
   * @returns A fresh Supabase client with current request cookies
   */
  static getServerClient(): any {
    return createServerComponentClient({
      cookies,
    }) as any;
  }

  /**
   * Get browser-side Supabase client for use in client components
   */
  static getBrowserClient(): unknown {
    if (!SupabaseClient.browserInstance) {
      SupabaseClient.browserInstance = createBrowserSupabaseClient<Database>();
    }
    return SupabaseClient.browserInstance;
  }

  /**
   * Create a new Supabase client with custom configuration
   */
  static createClient(
    supabaseUrl?: string,
    supabaseKey?: string
  ): BaseSupabaseClient<Database> {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL and key must be provided');
    }

    return createClient<Database>(url, key);
  }

  /**
   * Reset client instances (useful for testing)
   * Note: Only resets browser-side instance as server-side is never cached
   */
  static resetInstances(): void {
    SupabaseClient.browserInstance = null;
  }
}