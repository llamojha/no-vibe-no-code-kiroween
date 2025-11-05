'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { browserSupabase } from '@/lib/supabase/client';
import type { Database, ProfileRow, UserTier } from '@/lib/supabase/types';
import { identify } from '@/features/analytics/posthogClient';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient<Database> | null;
  tier: UserTier;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null);
  const [tier, setTier] = useState<UserTier>('free');

  const fetchUserTierForId = useCallback(async (client: SupabaseClient<Database>, userId: string) => {
    const { data, error } = await client
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .maybeSingle<Pick<ProfileRow, 'tier'>>();

    if (error) {
      console.error('Failed to load user tier', error);
      return;
    }

    setTier(data?.tier ?? 'free');
  }, []);

  useEffect(() => {
    try {
      const client = browserSupabase();
      setSupabaseClient(client);
    } catch (error) {
      console.error('Failed to initialize Supabase client', error);
      setSupabaseClient(null);
      setIsLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (!supabaseClient) return;

    let active = true;
    supabaseClient.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error retrieving session', error);
        }
        if (active) {
          setSession(data.session ?? null);
          setIsLoading(false);
          const userId = data.session?.user?.id;
          if (userId) {
            void fetchUserTierForId(supabaseClient, userId);
          } else {
            setTier('free');
          }
        }
      })
      .catch((error) => {
        console.error('Unexpected auth error', error);
        if (active) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      if (nextSession?.user?.id) {
        identify(nextSession.user.id, {
          email: nextSession.user.email ?? undefined,
        });
      }
      const userId = nextSession?.user?.id;
      if (userId) {
        void fetchUserTierForId(supabaseClient, userId);
      } else {
        setTier('free');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchUserTierForId, supabaseClient]);

  const signOut = useCallback(async () => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Error signing out', error);
    }
    setTier('free');
  }, [supabaseClient]);

  useEffect(() => {
    if (!supabaseClient || !session) return;

    const upsertProfile = async () => {
      const { error } = await supabaseClient.from('profiles').upsert({ id: session.user.id });
      if (error) {
        console.error('Failed to upsert profile', error);
        return;
      }
      void fetchUserTierForId(supabaseClient, session.user.id);
    };

    void upsertProfile();
  }, [fetchUserTierForId, session, supabaseClient]);

  useEffect(() => {
    if (!session) {
      setTier('free');
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      supabase: supabaseClient,
      tier,
      signOut,
    }),
    [isLoading, session, signOut, supabaseClient, tier],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
