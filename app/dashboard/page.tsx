import { redirect } from "next/navigation";
import UserDashboard from "@/features/dashboard/components/UserDashboard";
import {
  getCurrentUserId,
  getCurrentUser,
  isAuthenticated,
} from "@/src/infrastructure/web/helpers/serverAuth";
import { getDashboardDataAction } from "@/app/actions/dashboard";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { generateMockUser } from "@/lib/mockData";
import type { UnifiedAnalysisRecord } from "@/lib/types";
import { UserIdentityBadge } from "@/features/auth/components/UserIdentityBadge";

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
      <div className="relative">
        <UserIdentityBadge
          userEmail={mockUser.email}
          className="absolute top-4 right-4 z-20"
        />
        <UserDashboard
          initialAnalyses={mockAnalyses}
          initialCounts={mockCounts}
          sessionUserId={mockUser.id}
        />
      </div>
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

  // Get user information for identity badge
  const user = await getCurrentUser();

  // Use the new hexagonal architecture through server action
  const result = await getDashboardDataAction();

  let initialAnalyses: UnifiedAnalysisRecord[] = [];
  let initialCounts = { total: 0, idea: 0, kiroween: 0 };

  if (result.success && result.data) {
    initialAnalyses = result.data.analyses;
    initialCounts = result.data.counts;
  } else if (result.error) {
    console.error("Error fetching dashboard data:", result.error);
  }

  return (
    <div className="relative">
      <UserIdentityBadge
        userEmail={user?.email.value}
        userName={user?.name}
        className="absolute top-4 right-4 z-20"
      />
      <UserDashboard
        initialAnalyses={initialAnalyses}
        initialCounts={initialCounts}
        sessionUserId={userId.value}
      />
    </div>
  );
}
