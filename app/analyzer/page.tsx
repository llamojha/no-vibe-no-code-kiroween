import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import AnalyzerView from "@/features/analyzer/components/AnalyzerView";
import Loader from "@/features/analyzer/components/Loader";
import {
  isAuthenticated,
  getCurrentUser,
  getCurrentUserId,
  getSessionContext,
} from "@/src/infrastructure/web/helpers/serverAuth";
import type { UserTier } from "@/lib/types";
import { resolveMockModeFlag } from "@/lib/testing/config/mock-mode-flags";
import { NextJSBootstrap } from "@/src/infrastructure/bootstrap/nextjs";
import { IdeaId } from "@/src/domain/value-objects";

export const dynamic = "force-dynamic";

interface AnalyzerPageProps {
  searchParams: { ideaId?: string };
}

export default async function AnalyzerPage({
  searchParams,
}: AnalyzerPageProps) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isMockMode =
    resolveMockModeFlag(process.env.FF_USE_MOCK_API) ||
    resolveMockModeFlag(process.env.NEXT_PUBLIC_FF_USE_MOCK_API);

  // Load idea text if ideaId is provided
  let prefilledIdeaText: string | undefined;
  if (searchParams.ideaId) {
    try {
      await NextJSBootstrap.initialize();
      const serviceFactory = await NextJSBootstrap.getServiceFactory();
      const ideaRepository = serviceFactory
        .getRepositoryFactory()
        .createIdeaRepository();

      const userId = await getCurrentUserId();
      if (userId) {
        const ideaResult = await ideaRepository.findById(
          IdeaId.fromString(searchParams.ideaId),
          userId
        );

        if (ideaResult.success && ideaResult.data) {
          prefilledIdeaText = ideaResult.data.getIdeaText();
        }
      }
    } catch (error) {
      console.error("Failed to load idea for pre-fill:", error);
      // Continue without pre-fill
    }
  }

  if (isDevelopment || isMockMode) {
    // In development mode, bypass authentication and tier checks
    return (
      <Suspense fallback={<Loader message="Loading analyzer..." />}>
        <AnalyzerView
          initialCredits={3}
          userTier="free"
          prefilledIdea={prefilledIdeaText}
          ideaId={searchParams.ideaId}
        />
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
    <Suspense fallback={<Loader message="Loading analyzer..." />}>
      <AnalyzerView
        initialCredits={credits}
        userTier={tier}
        prefilledIdea={prefilledIdeaText}
        ideaId={searchParams.ideaId}
      />
    </Suspense>
  );
}
