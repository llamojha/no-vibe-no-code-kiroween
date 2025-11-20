import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { DoctorFrankensteinView } from "@/features/doctor-frankenstein/components/DoctorFrankensteinView";
import Loader from "@/features/analyzer/components/Loader";
import {
  isCurrentUserPaid,
  isAuthenticated,
  getCurrentUser,
  getSessionContext,
} from "@/src/infrastructure/web/helpers/serverAuth";
import { generateMockUser } from "@/lib/mockData";
import type { UserTier } from "@/lib/types";
import { resolveMockModeFlag } from "@/lib/testing/config/mock-mode-flags";

export const dynamic = "force-dynamic";

export default async function DoctorFrankensteinPage() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isMockMode =
    resolveMockModeFlag(process.env.FF_USE_MOCK_API) ||
    resolveMockModeFlag(process.env.NEXT_PUBLIC_FF_USE_MOCK_API);

  if (isDevelopment || isMockMode) {
    // In development mode, bypass authentication and tier checks
    const mockUser = generateMockUser();
    return (
      <Suspense fallback={<Loader message="Loading Doctor Frankenstein..." />}>
        <DoctorFrankensteinView initialCredits={3} userTier="free" />
      </Suspense>
    );
  }

  // Regular authentication flow for production
  // All logged-in users can access, credit system controls usage
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  // Get user information for identity badge and credits
  const user = await getCurrentUser();
  const sessionContext = await getSessionContext();
  const credits = user?.credits ?? 3;
  const tier: UserTier = sessionContext.tier ?? "free";

  return (
    <Suspense fallback={<Loader message="Loading Doctor Frankenstein..." />}>
      <DoctorFrankensteinView initialCredits={credits} userTier={tier} />
    </Suspense>
  );
}
