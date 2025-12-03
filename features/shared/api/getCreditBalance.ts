import type { UserTier } from "@/lib/types";

/**
 * Credit balance information for a user
 */
export interface CreditBalance {
  credits: number;
  tier: UserTier;
}

/**
 * Fetch the current credit balance for the authenticated user
 * @returns Promise resolving to CreditBalance with credits and tier
 * @throws Error if the request fails or user is not authenticated
 */
export async function getCreditBalance(): Promise<CreditBalance> {
  const response = await fetch("/api/v2/credits/balance", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch credit balance");
  }

  const result = await response.json();

  // Handle the Result<T, E> pattern from the backend
  if (result.success === false) {
    throw new Error(result.error?.message || "Failed to fetch credit balance");
  }

  // Extract data from the success response
  if (result.success && result.data) {
    return result.data as CreditBalance;
  }

  // Direct format support
  return result as CreditBalance;
}
