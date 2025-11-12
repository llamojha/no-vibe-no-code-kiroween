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
import { UserIdentityBadge } from "@/features/auth/components/UserIdentityBadge";
import { generateMockUser } from "@/lib/mockData";
import type { UserTier } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DoctorFrankensteinPage() {
  // In development mode, bypass authentication and tier checks
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    // In development mode, bypass authentication and tier checks
    const mockUser = generateMockUser();
    return (
      <div className="relative">
        <UserIdentityBadge
          userEmail={mockUser.email}
          className="absolute top-4 right-4 z-20"
        />
        <Suspense
          fallback={<Loader message="Loading Doctor Frankenstein..." />}
        >
          <DoctorFrankensteinView initialCredits={3} userTier="free" />
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

  // Get user information for identity badge and credits
  const user = await getCurrentUser();
  const sessionContext = await getSessionContext();
  const credits = user?.credits ?? 3;
  const tier: UserTier = sessionContext.tier ?? "free";

  return (
    <div className="relative">
      <UserIdentityBadge
        userEmail={user?.email.value}
        userName={user?.name}
        className="absolute top-4 right-4 z-20"
      />
      <Suspense fallback={<Loader message="Loading Doctor Frankenstein..." />}>
        <DoctorFrankensteinView initialCredits={credits} userTier={tier} />
      </Suspense>
    </div>
  );
}
