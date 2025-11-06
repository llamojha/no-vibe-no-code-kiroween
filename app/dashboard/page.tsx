import { redirect } from "next/navigation";
import UserDashboard from "@/features/dashboard/components/UserDashboard";
import { serverSupabase } from "@/lib/supabase/server";
import { loadUnifiedAnalysesServer } from "@/features/dashboard/api/loadUnifiedAnalyses";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = serverSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const {
    data: initialAnalyses,
    counts: initialCounts,
    error,
  } = await loadUnifiedAnalysesServer(session.user.id, supabase);

  if (error) {
    console.error("Error fetching unified analyses", error);
  }

  return (
    <UserDashboard
      initialAnalyses={initialAnalyses}
      initialCounts={initialCounts}
      sessionUserId={session!.user.id}
    />
  );
}
