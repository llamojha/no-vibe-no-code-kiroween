import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Adapter to integrate Supabase with hexagonal architecture
 * Provides a clean interface for the infrastructure layer to access Supabase
 */
export class SupabaseAdapter {
  private static serverInstance: SupabaseClient | null = null;
  private static clientInstance: SupabaseClient | null = null;

  /**
   * Get Supabase client for server-side operations
   */
  static getServerClient(): SupabaseClient {
    if (!SupabaseAdapter.serverInstance) {
      SupabaseAdapter.serverInstance = createServerComponentClient({ cookies });
    }
    return SupabaseAdapter.serverInstance;
  }

  /**
   * Get Supabase client for client-side operations
   */
  static getClientClient(): SupabaseClient {
    if (!SupabaseAdapter.clientInstance) {
      SupabaseAdapter.clientInstance = createClientComponentClient();
    }
    return SupabaseAdapter.clientInstance;
  }

  /**
   * Create a new server client instance (for cases where fresh instance is needed)
   */
  static createServerClient(): SupabaseClient {
    return createServerComponentClient({ cookies });
  }

  /**
   * Create a new client instance (for cases where fresh instance is needed)
   */
  static createClientClient(): SupabaseClient {
    return createClientComponentClient();
  }

  /**
   * Reset instances (useful for testing or when configuration changes)
   */
  static resetInstances(): void {
    SupabaseAdapter.serverInstance = null;
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
  static handleError(error: any, operation: string): Error {
    console.error(`Supabase ${operation} error:`, error);
    
    if (error?.code === 'PGRST116') {
      return new Error('Resource not found');
    }
    
    if (error?.code === '23505') {
      return new Error('Resource already exists');
    }
    
    if (error?.code === '42501') {
      return new Error('Insufficient permissions');
    }
    
    if (error?.message) {
      return new Error(`${operation} failed: ${error.message}`);
    }
    
    return new Error(`${operation} failed: Unknown error`);
  }

  /**
   * Execute Supabase operation with error handling
   */
  static async executeWithErrorHandling<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
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
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string
  ): Promise<T | null> {
    try {
      const { data, error } = await operation();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
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
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string
  ): Promise<T> {
    return SupabaseAdapter.executeWithErrorHandling(operation, operationName);
  },

  /**
   * Execute optional database operation
   */
  async executeOptional<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
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