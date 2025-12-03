'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../../../domain/entities/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database, UserTier } from '@/lib/supabase/types';

/**
 * User context interface
 */
export interface UserContextValue {
  user: User | null;
  userId: UserId | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tier: UserTier | null;
  isAdmin: boolean;
  isPaid: boolean;
  isFree: boolean;
  refreshUser: () => Promise<void>;
}

/**
 * User context for React components
 */
const UserContext = createContext<UserContextValue | undefined>(undefined);

/**
 * Props for UserProvider
 */
export interface UserProviderProps {
  children: React.ReactNode;
}

/**
 * User provider component that manages user state
 */
export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<UserId | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<UserTier | null>(null);

  const supabase = createClientComponentClient<Database>();

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session || !session.user) {
        setUser(null);
        setUserId(null);
        setIsAuthenticated(false);
        setTier(null);
        return;
      }

      const userIdValue = UserId.fromString(session.user.id);
      setUserId(userIdValue);
      setIsAuthenticated(true);

      // Fetch user tier from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setTier('free'); // Default to free tier
      } else if (profile) {
        const profileData = profile as { tier?: UserTier };
        const userTier: UserTier = (profileData.tier ?? 'free') as UserTier;
        setTier(userTier);
      } else {
        setTier('free'); // Default when no profile found
      }

      // TODO: Fetch full user entity from our domain layer
      // This would require a client-side API call to get the user from our repositories
      // For now, we'll leave this as null since we don't have a client-side API for users yet
      setUser(null);

    } catch (err) {
      console.error('Error refreshing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh user');
      setUser(null);
      setUserId(null);
      setIsAuthenticated(false);
      setTier(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Initial load
    refreshUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        await refreshUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUser]);

  // Compute derived values
  const isAdmin = tier === 'admin';
  const isPaid = tier === 'paid' || tier === 'admin';
  const isFree = tier === 'free';

  const value: UserContextValue = {
    user,
    userId,
    isAuthenticated,
    isLoading,
    error,
    tier,
    isAdmin,
    isPaid,
    isFree,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to use user context
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

/**
 * Hook to require authenticated user
 */
export function useRequireAuth(): UserContextValue & { userId: UserId } {
  const context = useUser();
  
  if (!context.isAuthenticated || !context.userId) {
    throw new Error('User must be authenticated');
  }

  return {
    ...context,
    userId: context.userId,
  };
}