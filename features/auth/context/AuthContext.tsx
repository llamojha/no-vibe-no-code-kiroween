"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { browserSupabase } from "@/lib/supabase/client";
import type { Database, ProfileRow, UserTier } from "@/lib/supabase/types";
import { identifyUser } from "@/features/analytics/tracking";
import { isEnabled } from "@/lib/featureFlags";
import {
  generateMockUser,
  initializeMockData,
  type LocalDevUser,
} from "@/lib/mockData";

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient<Database> | null;
  tier: UserTier;
  signOut: () => Promise<void>;
  // Enhanced properties for local dev mode
  isLocalDevMode: boolean;
  localUser: LocalDevUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseClient, setSupabaseClient] =
    useState<SupabaseClient<Database> | null>(null);
  const [tier, setTier] = useState<UserTier>("free");

  // Local dev mode state
  const [isLocalDevMode, setIsLocalDevMode] = useState(false);
  const [localUser, setLocalUser] = useState<LocalDevUser | null>(null);

  const fetchUserTierForId = useCallback(
    async (client: SupabaseClient<Database>, userId: string) => {
      const { data, error } = await client
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .maybeSingle<Pick<ProfileRow, "tier">>();

      if (error) {
        console.error("Failed to load user tier", error);
        return;
      }

      setTier(data?.tier ?? "free");
    },
    []
  );

  useEffect(() => {
    try {
      const client = browserSupabase();
      setSupabaseClient(client);
    } catch (error) {
      console.error("Failed to initialize Supabase client", error);
      setSupabaseClient(null);
      setIsLoading(false);
      return;
    }
  }, []);

  // Local dev mode detection and initialization
  useEffect(() => {
    const checkLocalDevMode = async () => {
      try {
        // Check if local dev mode is enabled
        const localDevEnabled = isEnabled("LOCAL_DEV_MODE");
        setIsLocalDevMode(localDevEnabled);

        if (localDevEnabled) {
          // Create mock user for local development
          const mockUser = generateMockUser();
          setLocalUser(mockUser);
          setTier(mockUser.tier);

          // Create a mock session object for compatibility with existing components
          const mockSession: Session = {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: "bearer",
            user: {
              id: mockUser.id,
              aud: "authenticated",
              role: "authenticated",
              email: mockUser.email,
              email_confirmed_at: mockUser.created_at,
              phone: "",
              confirmed_at: mockUser.created_at,
              last_sign_in_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {},
              identities: [],
              created_at: mockUser.created_at,
              updated_at: new Date().toISOString(),
            },
          };

          setSession(mockSession);
          setIsLoading(false);

          // Identify user in PostHog for local dev mode
          identifyUser(mockUser.id, {
            email: mockUser.email,
            created_at: mockUser.created_at,
          });

          // Initialize mock data if needed
          await initializeMockData();

          console.log(
            "Local development mode activated with mock user:",
            mockUser.email
          );
        }
      } catch (error) {
        console.error("Failed to initialize local dev mode:", error);
        setIsLocalDevMode(false);
        setLocalUser(null);
      }
    };

    void checkLocalDevMode();
  }, []);

  useEffect(() => {
    // Skip Supabase authentication if in local dev mode
    if (isLocalDevMode) {
      return;
    }

    if (!supabaseClient) return;

    let active = true;
    supabaseClient.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error retrieving session", error);
        }
        if (active) {
          setSession(data.session ?? null);
          setIsLoading(false);
          const userId = data.session?.user?.id;
          if (userId) {
            void fetchUserTierForId(supabaseClient, userId);
          } else {
            setTier("free");
          }
        }
      })
      .catch((error) => {
        console.error("Unexpected auth error", error);
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
        // Identify user in PostHog with email and created_at
        identifyUser(nextSession.user.id, {
          email: nextSession.user.email ?? undefined,
          created_at: nextSession.user.created_at,
        });
      }
      const userId = nextSession?.user?.id;
      if (userId) {
        void fetchUserTierForId(supabaseClient, userId);
      } else {
        setTier("free");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchUserTierForId, supabaseClient, isLocalDevMode]);

  const signOut = useCallback(async () => {
    if (isLocalDevMode) {
      // In local dev mode, reset all local state
      setLocalUser(null);
      setSession(null);
      setTier("free");
      console.log("Signed out from local development mode");
      return;
    }

    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error("Error signing out", error);
    }
    setTier("free");
  }, [supabaseClient, isLocalDevMode]);

  useEffect(() => {
    // Skip profile operations in local dev mode
    if (isLocalDevMode) return;

    if (!supabaseClient || !session) return;

    const upsertProfile = async () => {
      const { error } = await supabaseClient
        .from("profiles")
        .upsert({ id: session.user.id });
      if (error) {
        console.error("Failed to upsert profile", error);
        return;
      }
      void fetchUserTierForId(supabaseClient, session.user.id);
    };

    void upsertProfile();
  }, [fetchUserTierForId, session, supabaseClient, isLocalDevMode]);

  useEffect(() => {
    // In local dev mode, tier is managed by the mock user
    if (isLocalDevMode) return;

    if (!session) {
      setTier("free");
    }
  }, [session, isLocalDevMode]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      supabase: supabaseClient,
      tier,
      signOut,
      isLocalDevMode,
      localUser,
    }),
    [
      isLoading,
      session,
      signOut,
      supabaseClient,
      tier,
      isLocalDevMode,
      localUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
