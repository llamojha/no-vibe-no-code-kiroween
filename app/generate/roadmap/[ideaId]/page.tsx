import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { DocumentGenerator } from "@/features/document-generator/components";

interface RoadmapGeneratorPageProps {
  params: Promise<{
    ideaId: string;
  }>;
}

/**
 * Roadmap Generator Page
 *
 * Server-side rendered page for generating a Project Roadmap:
 * - Implements server-side authentication check
 * - Checks feature flag for document generation
 * - Uses shared DocumentGenerator component
 *
 * Requirements: 7.2
 */
export default async function RoadmapGeneratorPage({
  params,
}: RoadmapGeneratorPageProps) {
  // Await params to get ideaId
  const { ideaId } = await params;

  // Check feature flag
  initFeatureFlags();
  if (!isEnabled("ENABLE_DOCUMENT_GENERATION")) {
    redirect(`/idea/${ideaId}`);
  }

  // Authentication check
  const supabase = serverSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  return (
    <DocumentGenerator ideaId={ideaId} documentType="roadmap" />
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: RoadmapGeneratorPageProps) {
  const { ideaId } = await params;

  return {
    title: "Generate Roadmap | No Vibe No Code",
    description: `Generate a Project Roadmap for idea ${ideaId}`,
  };
}
