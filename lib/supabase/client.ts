import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let browserClient: SupabaseClient<Database> | null = null;

export const browserSupabase = (): SupabaseClient<Database> => {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are not set');
  }

  browserClient = createPagesBrowserClient<Database>({
    supabaseUrl: url,
    supabaseKey: anonKey,
  }) as unknown as SupabaseClient<Database>;
  
  return browserClient;
};
