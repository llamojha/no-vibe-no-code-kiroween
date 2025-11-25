import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { DocumentGenerator } from "@/features/document-generator/components";

interface TechnicalDesignGeneratorPageProps {
  params: Promise<{
    ideaId: string;
  }>;
}

/**
 * Technical Design Generator Page
 *
 * Server-side rendered page for generating a Technical Design Document:
 * - Implements server-side authentication check
 * - Checks feature flag for document generation
 * - Uses shared DocumentGenerator component
 *
 * Requirements: 3.2
 */
export default async function TechnicalDesignGeneratorPage({
  params,
}: TechnicalDesignGeneratorPageProps) {
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
    <DocumentGenerator
      ideaId={ideaId}
      documentType="technical_design"
    />
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({
  params,
}: TechnicalDesignGeneratorPageProps) {
  const { ideaId } = await params;

  return {
    title: "Generate Technical Design | No Vibe No Code",
    description: `Generate a Technical Design Document for idea ${ideaId}`,
  };
}
