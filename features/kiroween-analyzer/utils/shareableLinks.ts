/**
 * Generates a shareable URL for a saved hackathon analysis
 */
export function generateShareableLink(analysisId: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return `${baseUrl}/kiroween-analyzer?savedId=${encodeURIComponent(
    analysisId
  )}&mode=view`;
}

/**
 * Extracts analysis ID from a shareable URL
 */
export function extractAnalysisIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("savedId");
  } catch {
    return null;
  }
}

/**
 * Copies a shareable link to the clipboard
 */
export async function copyShareableLinkToClipboard(
  analysisId: string
): Promise<boolean> {
  try {
    const link = generateShareableLink(analysisId);
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error("Failed to copy link to clipboard:", error);
    return false;
  }
}
