import { createClient, SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../types';

/**
 * Supabase client wrapper for hexagonal architecture
 * Provides both server-side and client-side Supabase clients
 */
export class SupabaseClient {
  private static serverInstance: any = null;
  private static browserInstance: any = null;

  /**
   * Get server-side Supabase client for use in API routes and server components
   */
  static getServerClient(): any {
    if (!SupabaseClient.serverInstance) {
      SupabaseClient.serverInstance = createServerComponentClient({
        cookies,
      }) as any;
    }
    return SupabaseClient.serverInstance;
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
   */
  static resetInstances(): void {
    SupabaseClient.serverInstance = null;
    SupabaseClient.browserInstance = null;
  }
}