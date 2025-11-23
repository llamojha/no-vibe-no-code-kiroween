import { redirect } from "next/navigation";
import { headers } from "next/headers";
import UserDashboard from "@/features/dashboard/components/UserDashboard";
import {
  getCurrentUserId,
  getCurrentUser,
  isAuthenticated,
  getSessionContext,
} from "@/src/infrastructure/web/helpers/serverAuth";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { generateMockUser, generateMockIdeas } from "@/lib/mockData";
import type { UserTier } from "@/lib/types";
import type { DashboardIdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";
import { serverSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Ensure feature flags are initialized
  initFeatureFlags();
  const requestHeaders = headers();
  const isE2ETestRequest =
    requestHeaders.get("x-test-mode") === "true" ||
    requestHeaders.get("x-e2e-test") === "true";
  const isTestEnv = process.env.NODE_ENV === "test" || isE2ETestRequest;
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE") || isTestEnv;

  if (isLocalDevMode) {
    // In local dev mode, create mock data and bypass authentication
    const mockUser = generateMockUser();
    const mockIdeas = (
      isTestEnv ? [] : generateMockIdeas()
    ) as DashboardIdeaDTO[];

    return (
      <UserDashboard
        initialIdeas={mockIdeas}
        sessionUserId={mockUser.id}
        initialCredits={3}
        userTier="free"
        userEmail={mockUser.email}
      />
    );
  }

  // Regular authentication flow for production
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  // Get user information for identity badge and credits
  const user = await getCurrentUser();
  const sessionContext = await getSessionContext();
  const credits = user?.credits ?? 3;
  const tier: UserTier = sessionContext.tier ?? "free";

  // Fetch ideas from the new ideas table using optimized query with JOIN
  // This avoids N+1 queries by getting document counts in a single query
  const supabase = serverSupabase();
  let initialIdeas: DashboardIdeaDTO[] = [];

  try {
    // Type for the query result with documents count
    type IdeaWithDocumentCount = {
      id: string;
      user_id: string;
      idea_text: string;
      source: string;
      project_status: string;
      notes: string;
      tags: string[];
      created_at: string;
      updated_at: string;
      documents: Array<{ count: number }> | { count: number }[];
    };

    // Use LEFT JOIN with COUNT to get document counts efficiently
    // This is a single query that avoids the N+1 problem
    const { data: ideasData, error: ideasError } = await supabase
      .from("ideas")
      .select(
        `
        id,
        user_id,
        idea_text,
        source,
        project_status,
        notes,
        tags,
        created_at,
        updated_at,
        documents(count)
      `
      )
      .eq("user_id", userId.value)
      .order("updated_at", { ascending: false });

    if (ideasError) {
      console.error("Error fetching ideas:", ideasError);
    } else if (ideasData) {
      // Map to DashboardIdeaDTO
      initialIdeas = (ideasData as IdeaWithDocumentCount[]).map((idea) => {
        // Supabase returns documents count in different formats depending on the query.
        // For `documents(count)` we receive either an array with one `{ count }` object
        // or that object directly. Read the `count` value so the dashboard shows the
        // actual number of documents per idea.
        let documentCount = 0;
        if (Array.isArray(idea.documents)) {
          const docsArray = idea.documents as Array<{ count?: number }>;
          documentCount = docsArray[0]?.count ?? 0;
        } else if (idea.documents && typeof idea.documents === "object") {
          documentCount = (idea.documents as { count?: number }).count ?? 0;
        }

        return {
          id: idea.id,
          ideaText: idea.idea_text,
          source: idea.source,
          projectStatus: idea.project_status,
          documentCount,
          createdAt: idea.created_at,
          updatedAt: idea.updated_at,
          tags: idea.tags || [],
        };
      });
    }
  } catch (error) {
    console.error("Error loading ideas:", error);
  }

  return (
    <UserDashboard
      initialIdeas={initialIdeas}
      sessionUserId={userId.value}
      initialCredits={credits}
      userTier={tier}
      userEmail={user?.email.value}
    />
  );
}
