import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { DocumentGenerator } from "@/features/document-generator/components";

interface ArchitectureGeneratorPageProps {
  params: Promise<{
    ideaId: string;
  }>;
}

/**
 * Architecture Generator Page
 *
 * Server-side rendered page for generating an Architecture Document:
 * - Implements server-side authentication check
 * - Checks feature flag for document generation
 * - Uses shared DocumentGenerator component
 *
 * Requirements: 5.2
 */
export default async function ArchitectureGeneratorPage({
  params,
}: ArchitectureGeneratorPageProps) {
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
      documentType="architecture"
    />
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({
  params,
}: ArchitectureGeneratorPageProps) {
  const { ideaId } = await params;

  return {
    title: "Generate Architecture Document | No Vibe No Code",
    description: `Generate an Architecture Document for idea ${ideaId}`,
  };
}
