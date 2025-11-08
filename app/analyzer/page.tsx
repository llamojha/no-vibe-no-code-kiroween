import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import AnalyzerView from "@/features/analyzer/components/AnalyzerView";
import Loader from "@/features/analyzer/components/Loader";
import {
  isCurrentUserPaid,
  isAuthenticated,
  getCurrentUser,
} from "@/src/infrastructure/web/helpers/serverAuth";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { UserIdentityBadge } from "@/features/auth/components/UserIdentityBadge";
import { generateMockUser } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function AnalyzerPage() {
  // Ensure feature flags are initialized
  initFeatureFlags();
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    // In local dev mode, bypass authentication and tier checks
    const mockUser = generateMockUser();
    return (
      <div className="relative">
        <UserIdentityBadge
          userEmail={mockUser.email}
          className="absolute top-4 right-4 z-20"
        />
        <Suspense fallback={<Loader message="Loading analyzer..." />}>
          <AnalyzerView />
        </Suspense>
      </div>
    );
  }

  // Regular authentication and authorization flow for production
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  // Check if user has paid access using the new authentication helpers
  const hasPaidAccess = await isCurrentUserPaid();
  if (!hasPaidAccess) {
    redirect("/dashboard");
  }

  // Get user information for identity badge
  const user = await getCurrentUser();

  return (
    <div className="relative">
      <UserIdentityBadge
        userEmail={user?.email.value}
        userName={user?.name}
        className="absolute top-4 right-4 z-20"
      />
      <Suspense fallback={<Loader message="Loading analyzer..." />}>
        <AnalyzerView />
      </Suspense>
    </div>
  );
}
