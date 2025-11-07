import { redirect, notFound } from "next/navigation";
import { getHackathonAnalysisAction } from "@/app/actions/hackathon";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import HackathonAnalysisDetailView from "@/features/kiroween-analyzer/components/HackathonAnalysisDetailView";

export const dynamic = "force-dynamic";

interface HackathonAnalysisPageProps {
  params: {
    id: string;
  };
}

export default async function HackathonAnalysisPage({ params }: HackathonAnalysisPageProps) {
  // Ensure feature flags are initialized
  initFeatureFlags();

  // Get hackathon analysis data using server action
  const result = await getHackathonAnalysisAction(params.id);

  if (!result.success) {
    if (result.error?.includes('not found') || result.error?.includes('Invalid')) {
      notFound();
    }
    
    // For other errors, redirect to kiroween analyzer with error
    redirect(`/kiroween-analyzer?error=${encodeURIComponent(result.error || 'Failed to load analysis')}`);
  }

  if (!result.data) {
    notFound();
  }

  return <HackathonAnalysisDetailView analysis={result.data} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: HackathonAnalysisPageProps) {
  const result = await getHackathonAnalysisAction(params.id);
  
  if (!result.success || !result.data) {
    return {
      title: 'Hackathon Analysis Not Found - No Vibe No Code',
      description: 'The requested hackathon analysis could not be found.',
    };
  }

  const analysis = result.data;
  const title = analysis.projectDescription.split('\n')[0].trim() || 'Hackathon Project';
  
  return {
    title: `${title} - Hackathon Analysis - No Vibe No Code`,
    description: analysis.detailedSummary || `Hackathon analysis of: ${title}`,
    openGraph: {
      title: `${title} - Hackathon Analysis`,
      description: analysis.detailedSummary || `Hackathon analysis of: ${title}`,
      type: 'article',
    },
  };
}