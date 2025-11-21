import { redirect } from "next/navigation";
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
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    // In local dev mode, create mock data and bypass authentication
    const mockUser = generateMockUser();
    const mockIdeas = generateMockIdeas() as DashboardIdeaDTO[];

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

  // Fetch ideas from the new ideas table
  const supabase = serverSupabase();
  let initialIdeas: DashboardIdeaDTO[] = [];

  try {
    // Temporary type definition until Supabase types are regenerated
    type IdeaRow = {
      id: string;
      user_id: string;
      idea_text: string;
      source: string;
      project_status: string;
      notes: string;
      tags: string[];
      created_at: string;
      updated_at: string;
    };

    const { data: ideasData, error: ideasError } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", userId.value)
      .order("updated_at", { ascending: false });

    if (ideasError) {
      console.error("Error fetching ideas:", ideasError);
    } else if (ideasData) {
      // Get document counts for each idea
      const ideaIds = (ideasData as IdeaRow[]).map((idea) => idea.id);

      let documentCounts: Record<string, number> = {};
      if (ideaIds.length > 0) {
        // Temporary type definition for documents
        type DocumentRow = {
          idea_id: string;
        };

        const { data: documentsData, error: documentsError } = await supabase
          .from("documents")
          .select("idea_id")
          .in("idea_id", ideaIds);

        if (!documentsError && documentsData) {
          documentCounts = (documentsData as DocumentRow[]).reduce(
            (acc, doc) => {
              acc[doc.idea_id] = (acc[doc.idea_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );
        }
      }

      // Map to DashboardIdeaDTO
      initialIdeas = (ideasData as IdeaRow[]).map((idea) => ({
        id: idea.id,
        ideaText: idea.idea_text,
        source: idea.source,
        projectStatus: idea.project_status,
        documentCount: documentCounts[idea.id] || 0,
        createdAt: idea.created_at,
        updatedAt: idea.updated_at,
        tags: idea.tags || [],
      }));
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
