import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import AnalyzerView from "@/features/analyzer/components/AnalyzerView";
import Loader from "@/features/analyzer/components/Loader";
import { serverSupabase } from "@/lib/supabase/server";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";

export const dynamic = "force-dynamic";

export default async function AnalyzerPage() {
  // Ensure feature flags are initialized
  initFeatureFlags();
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    // In local dev mode, bypass authentication and tier checks
    return (
      <Suspense fallback={<Loader message="Loading analyzer..." />}>
        <AnalyzerView />
      </Suspense>
    );
  }

  // Regular authentication and authorization flow for production
  const supabase = serverSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // On error, fail closed to a safe page
    redirect("/dashboard");
  }

  const tier = profile?.tier ?? "free";
  const allowed = tier === "paid" || tier === "admin";
  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<Loader message="Loading analyzer..." />}>
      <AnalyzerView />
    </Suspense>
  );
}
