import { redirect } from "next/navigation";
import HackathonDashboard from "@/features/kiroween-analyzer/components/HackathonDashboard";
import { serverSupabase } from "@/lib/supabase/server";
import { mapSavedHackathonAnalysesRow } from "@/lib/supabase/mappers";
import type { SavedHackathonAnalysesRow } from "@/lib/supabase/types";
import type { SavedHackathonAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function KiroweenDashboardPage() {
  const supabase = serverSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("saved_hackathon_analyses")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .returns<SavedHackathonAnalysesRow[]>();

  if (error) {
    console.error("Error fetching saved hackathon analyses", error);
  }

  const initialAnalyses: SavedHackathonAnalysis[] =
    data?.map(mapSavedHackathonAnalysesRow) ?? [];

  return (
    <HackathonDashboard
      initialAnalyses={initialAnalyses}
      sessionUserId={session!.user.id}
    />
  );
}
