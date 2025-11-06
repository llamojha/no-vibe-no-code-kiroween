import { redirect } from "next/navigation";
import UserDashboard from "@/features/dashboard/components/UserDashboard";
import { serverSupabase } from "@/lib/supabase/server";
import { loadUnifiedAnalysesServer } from "@/features/dashboard/api/loadUnifiedAnalyses";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { generateMockUser } from "@/lib/mockData";
import type { UnifiedAnalysisRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Ensure feature flags are initialized
  initFeatureFlags();
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    // In local dev mode, create mock data and bypass authentication
    const mockUser = generateMockUser();
    const mockAnalyses: UnifiedAnalysisRecord[] = []; // Empty array for now, could be populated with mock data
    const mockCounts = { total: 0, idea: 0, kiroween: 0 };

    return (
      <UserDashboard
        initialAnalyses={mockAnalyses}
        initialCounts={mockCounts}
        sessionUserId={mockUser.id}
      />
    );
  }

  // Regular authentication flow for production
  const supabase = serverSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const {
    data: initialAnalyses,
    counts: initialCounts,
    error,
  } = await loadUnifiedAnalysesServer(session.user.id, supabase);

  if (error) {
    console.error("Error fetching unified analyses", error);
  }

  return (
    <UserDashboard
      initialAnalyses={initialAnalyses}
      initialCounts={initialCounts}
      sessionUserId={session!.user.id}
    />
  );
}
