import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { getDatabaseConfig } from './environment';

/**
 * Database configuration and client creation
 * Handles Supabase client instantiation with proper configuration
 */

let supabaseClient: SupabaseClient | null = null;

/**
 * Create and configure Supabase client
 * Uses singleton pattern to ensure single client instance
 */
export function createSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getDatabaseConfig();
  
  const enableAuthDebug = process.env.SUPABASE_AUTH_DEBUG === 'true';

  const authOptions: SupabaseClientOptions['auth'] = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    ...(enableAuthDebug ? { debug: true } : {}),
  };

  supabaseClient = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: authOptions,
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'no-vibe-no-code',
      },
    },
  });

  return supabaseClient;
}

/**
 * Create Supabase client with service role key for admin operations
 * Should only be used in server-side contexts
 */
export function createSupabaseServiceClient(): SupabaseClient {
  const config = getDatabaseConfig();
  
  if (!config.supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service client');
  }

  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'no-vibe-no-code-service',
      },
    },
  });
}

/**
 * Get the current Supabase client instance
 * Creates one if it doesn't exist
 */
export function getSupabaseClient(): SupabaseClient {
  return supabaseClient || createSupabaseClient();
}

/**
 * Reset the Supabase client (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    // Use an existing table for a lightweight check
    const { error } = await client.from('saved_analyses').select('id').limit(1);
    
    if (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database connection check error:', error);
    return false;
  }
}

/**
 * Database configuration for different environments
 */
export const databaseConfig = {
  development: {
    poolSize: 5,
    connectionTimeout: 10000,
    queryTimeout: 30000,
  },
  production: {
    poolSize: 20,
    connectionTimeout: 5000,
    queryTimeout: 60000,
  },
  test: {
    poolSize: 2,
    connectionTimeout: 5000,
    queryTimeout: 10000,
  },
};
