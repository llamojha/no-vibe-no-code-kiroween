"use client";

import posthog from "posthog-js";

/**
 * Event property interfaces for type-safe analytics tracking
 */

/**
 * Properties for report generation events
 */
export interface ReportGenerationProps {
  reportType: "startup" | "kiroween" | "frankenstein";
  ideaLength?: number;
  userId?: string;
}

/**
 * Properties for Dr. Frankenstein interaction events
 */
export interface FrankensteinInteractionProps {
  action: "roll" | "mode_select" | "slot_config";
  mode?: "aws" | "tech_companies";
  slotCount?: 3 | 4;
  rollCount?: number;
}

/**
 * Properties for homepage interaction events
 */
export interface HomepageInteractionProps {
  action: "animation_toggle";
  animationState: "enabled" | "disabled";
  deviceType?: "mobile" | "tablet" | "desktop";
}

/**
 * Properties for idea enhancement events
 */
export interface IdeaEnhancementProps {
  action: "add_suggestion" | "modify_idea";
  analysisType: "startup" | "kiroween";
  suggestionLength?: number;
  changeType?: string;
}

/**
 * Properties for export events
 */
export interface ExportProps {
  format: "pdf" | "markdown" | "json" | "txt";
  reportType: "startup" | "kiroween" | "frankenstein";
  success: boolean;
  errorMessage?: string;
}

/**
 * Helper function to check if PostHog is available and loaded
 * @returns true if PostHog is available, false otherwise
 */
const isPostHogAvailable = (): boolean => {
  return typeof window !== "undefined" && posthog.__loaded;
};

/**
 * Helper function to detect device type based on viewport width
 * @returns Device type classification
 */
const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

/**
 * Track report generation events
 * @param props Report generation properties
 */
export const trackReportGeneration = (props: ReportGenerationProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    posthog.capture("report_generated", {
      report_type: props.reportType,
      idea_length: props.ideaLength,
      user_id: props.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track report generation:", error);
  }
};

/**
 * Track Dr. Frankenstein feature interactions
 * @param props Frankenstein interaction properties
 */
export const trackFrankensteinInteraction = (
  props: FrankensteinInteractionProps
): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventName = `frankenstein_${props.action}`;
    posthog.capture(eventName, {
      mode: props.mode,
      slot_count: props.slotCount,
      roll_count: props.rollCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[Analytics] Failed to track Frankenstein interaction:",
      error
    );
  }
};

/**
 * Track homepage interactions
 * @param props Homepage interaction properties
 */
export const trackHomepageInteraction = (
  props: HomepageInteractionProps
): void => {
  if (!isPostHogAvailable()) return;

  try {
    posthog.capture("homepage_interaction", {
      action: props.action,
      animation_state: props.animationState,
      device_type: props.deviceType || getDeviceType(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track homepage interaction:", error);
  }
};

/**
 * Track idea enhancement interactions
 * @param props Idea enhancement properties
 */
export const trackIdeaEnhancement = (props: IdeaEnhancementProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    posthog.capture("idea_enhancement", {
      action: props.action,
      analysis_type: props.analysisType,
      suggestion_length: props.suggestionLength,
      change_type: props.changeType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track idea enhancement:", error);
  }
};

/**
 * Track report export actions
 * @param props Export properties
 */
export const trackExport = (props: ExportProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    posthog.capture("report_exported", {
      format: props.format,
      report_type: props.reportType,
      success: props.success,
      error_message: props.errorMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track export:", error);
  }
};

/**
 * Identify a user in PostHog
 * @param userId Unique user identifier
 * @param properties Optional user properties
 */
export const identifyUser = (
  userId: string,
  properties?: Record<string, unknown>
): void => {
  if (!isPostHogAvailable()) return;

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error("[Analytics] Failed to identify user:", error);
  }
};
