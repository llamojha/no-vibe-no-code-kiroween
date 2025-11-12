import { PostHog } from "posthog-node";

/**
 * PostHog server-side client singleton
 * Initialized once during Next.js instrumentation phase
 */
let posthogClient: PostHog | undefined;

/**
 * Get the PostHog client instance
 * Returns undefined if PostHog is not configured
 */
export function getPostHogClient(): PostHog | undefined {
  return posthogClient;
}

/**
 * Register instrumentation for Next.js 14.2+
 * This function is called once when the Next.js server starts
 */
export async function register() {
  // Only initialize on server-side
  if (typeof window !== "undefined") {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  // Skip initialization if PostHog is not configured
  if (!apiKey || !host) {
    console.warn(
      "PostHog not configured. Set NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST to enable analytics."
    );
    return;
  }

  try {
    posthogClient = new PostHog(apiKey, {
      host,
      flushAt: 1, // Flush events immediately in development
      flushInterval: 0, // Disable automatic flushing
    });

    console.log("PostHog server-side client initialized successfully");
  } catch (error) {
    console.error("Failed to initialize PostHog:", error);
  }
}

/**
 * Shutdown PostHog client gracefully
 * Ensures all pending events are flushed before shutdown
 */
export async function onRequestError() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
