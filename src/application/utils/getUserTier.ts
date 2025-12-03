import { UserId } from "../../domain/value-objects/UserId";
import type { UserTier } from "../../infrastructure/database/types/database";
import { SupabaseClient } from "../../infrastructure/database/supabase/SupabaseClient";

/**
 * Utility function to fetch user tier from the database
 * This is a temporary solution until tier is added to the User domain entity
 *
 * @param userId - The user ID to fetch tier for
 * @returns The user's tier or "free" as default
 */
export async function getUserTierFromDatabase(
  userId: UserId
): Promise<UserTier> {
  try {
    const supabase = SupabaseClient.getServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", userId.value)
      .single();

    if (error || !data) {
      console.warn(
        `Failed to fetch tier for user ${userId.value}, defaulting to 'free'`,
        error
      );
      return "free";
    }

    return (data.tier as UserTier) || "free";
  } catch (error) {
    console.error(`Error fetching tier for user ${userId.value}:`, error);
    return "free";
  }
}
