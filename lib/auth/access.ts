import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserTier } from "@/lib/supabase/types";

type Allowed = { allowed: true; userId: string; tier: UserTier };
type Denied = { allowed: false; response: NextResponse };
export type AccessResult = Allowed | Denied;

/**
 * @deprecated This function is deprecated. Use the new AuthMiddleware from the hexagonal architecture instead.
 * Import: import { authenticateRequest } from '@/src/infrastructure/web/middleware/AuthMiddleware'
 * Usage: const authResult = await authenticateRequest(request, { requirePaid: true, allowFree: false });
 */
export async function requirePaidOrAdmin(
  supabase: SupabaseClient<Database>
): Promise<AccessResult> {
  console.warn(
    "requirePaidOrAdmin is deprecated. Use AuthMiddleware from hexagonal architecture instead."
  );

  // Use getUser() for secure authentication validation
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userId = user.id;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Unable to verify access" },
        { status: 500 }
      ),
    };
  }

  const tier: UserTier = (profile?.tier ?? "free") as UserTier;
  const ok = tier === "paid" || tier === "admin";
  if (!ok) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { allowed: true, userId, tier };
}
