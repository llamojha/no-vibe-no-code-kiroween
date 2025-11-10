import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import AnalyzerView from "@/features/analyzer/components/AnalyzerView";
import Loader from "@/features/analyzer/components/Loader";
import {
  isCurrentUserPaid,
  isAuthenticated,
  getCurrentUser,
  getSessionContext,
} from "@/src/infrastructure/web/helpers/serverAuth";
import { UserIdentityBadge } from "@/features/auth/components/UserIdentityBadge";
import { generateMockUser } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function AnalyzerPage() {
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

  // Check if user has paid or admin access
  const sessionContext = await getSessionContext();
  console.log("[Analyzer Page] Session context:", {
    isAuthenticated: sessionContext.isAuthenticated,
    isPaid: sessionContext.isPaid,
    isAdmin: sessionContext.isAdmin,
    tier: sessionContext.tier,
    userId: sessionContext.userId?.value,
  });

  const hasPaidAccess = await isCurrentUserPaid();
  if (!hasPaidAccess) {
    console.log("[Analyzer Page] Access denied - redirecting to dashboard");
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
