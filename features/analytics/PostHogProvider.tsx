"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * PostHog Client-Side Provider
 *
 * Initializes PostHog on the client side when the app loads.
 * This component should be included in the root layout.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    // Skip initialization if not configured
    if (!apiKey) {
      console.warn(
        "[PostHog] Client not initialized: NEXT_PUBLIC_POSTHOG_KEY not set"
      );
      return;
    }

    // Check if already initialized
    if (posthog.__loaded) {
      console.log("[PostHog] Client already initialized");
      return;
    }

    try {
      posthog.init(apiKey, {
        // Use reverse proxy for better reliability and ad-blocker bypass
        api_host: "/ingest",
        ui_host: host
          .replace("us.i.posthog.com", "us.posthog.com")
          .replace("eu.i.posthog.com", "eu.posthog.com"),
        loaded: (posthog) => {
          console.log("[PostHog] Client initialized successfully");

          // Enable debug mode in development
          if (process.env.NODE_ENV === "development") {
            console.log("[PostHog] Debug mode enabled for development");
            // Uncomment to enable verbose logging:
            // posthog.debug();
          }
        },
        // Capture pageviews automatically
        capture_pageview: true,
        // Capture page leave events
        capture_pageleave: true,
        // Disable session recording by default (enable in PostHog dashboard if needed)
        disable_session_recording: true,
        // Persistence
        persistence: "localStorage+cookie",
        // Cross-subdomain cookie
        cross_subdomain_cookie: false,
        // Respect Do Not Track
        respect_dnt: true,
      });
    } catch (error) {
      console.error("[PostHog] Failed to initialize client:", error);
    }
  }, []);

  return <>{children}</>;
}
