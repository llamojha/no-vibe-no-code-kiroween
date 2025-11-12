import { PostHog } from "posthog-node";

/**
 * Server-side PostHog tracking utilities
 *
 * This module provides server-side event capture for API routes and server actions.
 * Events are sent immediately with proper shutdown to prevent memory leaks.
 *
 * @module server-tracking
 */

// Singleton instance
let posthogClient: PostHog | null = null;

/**
 * Get or create PostHog client instance
 * Configured for immediate event flushing
 *
 * @returns PostHog client instance or null if not configured
 */
const getPostHogClient = (): PostHog | null => {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

  if (!apiKey) {
    console.warn("[PostHog Server] API key not configured, analytics disabled");
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host,
      flushAt: 1, // Send events immediately
      flushInterval: 0, // No batching delay
    });
  }

  return posthogClient;
};

/**
 * Properties for server-side event capture
 */
export interface ServerEventProps {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}

/**
 * Capture a server-side event and ensure proper shutdown
 *
 * @param props - Event properties including distinctId, event name, and custom properties
 * @returns Promise that resolves when eventaptured and client is shutdown
 *
 * @example
 * ```typescript
 * await captureServerEvent({
 *   distinctId: userId,
 *   event: 'server_analysis_request',
 *   properties: { analysis_type: 'startup' }
 * });
 * ```
 */
export const captureServerEvent = async (
  props: ServerEventProps
): Promise<void> => {
  const client = getPostHogClient();
  if (!client) return;

  try {
    client.capture({
      distinctId: props.distinctId,
      event: props.event,
      properties: {
        ...props.properties,
        timestamp: new Date().toISOString(),
        source: "server",
      },
    });

    // Ensure event is sent before shutdown
    await client.shutdown();
  } catch (error) {
    console.error("[PostHog Server] Failed to capture event:", error);
  }
};

/**
 * Track server-side analysis request
 *
 * @param userId - User identifier
 * @param analysisType - Type of analysis being performed
 * @returns Promise that resolves when event is captured
 *
 * @example
 * ```typescript
 * await trackServerAnalysisRequest(user.id, 'startup');
 * ```
 */
export const trackServerAnalysisRequest = async (
  userId: string,
  analysisType: "startup" | "kiroween" | "frankenstein"
): Promise<void> => {
  await captureServerEvent({
    distinctId: userId,
    event: "server_analysis_request",
    properties: {
      analysis_type: analysisType,
    },
  });
};

/**
 * Track server-side error
 *
 * @param userId - User identifier
 * @param errorType - Type or category of error
 * @param errorMessage - Error message or description
 * @returns Promise that resolves when event is captured
 *
 * @example
 * ```typescript
 * await trackServerError(user.id, 'ai_service_error', 'Failed to generate analysis');
 * ```
 */
export const trackServerError = async (
  userId: string,
  errorType: string,
  errorMessage: string
): Promise<void> => {
  await captureServerEvent({
    distinctId: userId,
    event: "server_error",
    properties: {
      error_type: errorType,
      error_message: errorMessage,
    },
  });
};
