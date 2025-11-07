import { redirect, notFound } from "next/navigation";
import { isAuthenticated, getCurrentUserId } from "@/src/infrastructure/web/helpers/serverAuth";
import { getAnalysisAction } from "@/app/actions/analysis";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import AnalysisDetailView from "@/features/analyzer/components/AnalysisDetailView";

export const dynamic = "force-dynamic";

interface AnalysisPageProps {
  params: {
    id: string;
  };
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  // Ensure feature flags are initialized
  initFeatureFlags();
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (!isLocalDevMode) {
    // Regular authentication flow for production
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      redirect("/login");
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      redirect("/login");
    }
  }

  // Get analysis data using server action
  const result = await getAnalysisAction(params.id);

  if (!result.success) {
    if (result.error?.includes('not found') || result.error?.includes('Invalid')) {
      notFound();
    }
    
    // For other errors, redirect to dashboard with error
    redirect(`/dashboard?error=${encodeURIComponent(result.error || 'Failed to load analysis')}`);
  }

  if (!result.data) {
    notFound();
  }

  return <AnalysisDetailView analysis={result.data} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: AnalysisPageProps) {
  const result = await getAnalysisAction(params.id);
  
  if (!result.success || !result.data) {
    return {
      title: 'Analysis Not Found - No Vibe No Code',
      description: 'The requested analysis could not be found.',
    };
  }

  const analysis = result.data;
  const title = analysis.idea.split('\n')[0].trim() || 'Analysis';
  
  return {
    title: `${title} - Analysis - No Vibe No Code`,
    description: analysis.detailedSummary || `Analysis of: ${title}`,
    openGraph: {
      title: `${title} - Analysis`,
      description: analysis.detailedSummary || `Analysis of: ${title}`,
      type: 'article',
    },
  };
}