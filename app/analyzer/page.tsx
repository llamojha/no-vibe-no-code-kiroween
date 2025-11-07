import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import AnalyzerView from "@/features/analyzer/components/AnalyzerView";
import Loader from "@/features/analyzer/components/Loader";
import { isCurrentUserPaid, isAuthenticated } from "@/src/infrastructure/web/helpers/serverAuth";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { createAnalysisAction } from "@/app/actions/analysis";

export const dynamic = "force-dynamic";

export default async function AnalyzerPage() {
  // Ensure feature flags are initialized
  initFeatureFlags();
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    // In local dev mode, bypass authentication and tier checks
    return (
      <Suspense fallback={<Loader message="Loading analyzer..." />}>
        <AnalyzerView createAnalysisAction={createAnalysisAction} />
      </Suspense>
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

  return (
    <Suspense fallback={<Loader message="Loading analyzer..." />}>
      <AnalyzerView createAnalysisAction={createAnalysisAction} />
    </Suspense>
  );
}
