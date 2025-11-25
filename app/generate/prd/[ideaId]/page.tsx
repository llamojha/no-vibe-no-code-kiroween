import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { DocumentGenerator } from "@/features/document-generator/components";

interface PRDGeneratorPageProps {
  params: Promise<{
    ideaId: string;
  }>;
}

/**
 * PRD Generator Page
 *
 * Server-side rendered page for generating a Product Requirements Document:
 * - Implements server-side authentication check
 * - Checks feature flag for document generation
 * - Uses shared DocumentGenerator component
 *
 * Requirements: 1.2
 */
export default async function PRDGeneratorPage({
  params,
}: PRDGeneratorPageProps) {
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

  return <DocumentGenerator ideaId={ideaId} documentType="prd" />;
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: PRDGeneratorPageProps) {
  const { ideaId } = await params;

  return {
    title: "Generate PRD | No Vibe No Code",
    description: `Generate a Product Requirements Document for idea ${ideaId}`,
  };
}
