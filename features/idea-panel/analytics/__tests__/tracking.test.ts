import { describe, it, expect, vi, beforeEach } from "vitest";
import posthog from "posthog-js";
import {
  trackIdeaPanelView,
  trackStatusUpdate,
  trackNotesSave,
  trackTagsManagement,
  trackDocumentView,
  trackAnalyzeButtonClick,
} from "../tracking";

// Mock posthog
vi.mock("posthog-js", () => ({
  default: {
    __loaded: true,
    capture: vi.fn(),
  },
}));

describe("Idea Panel Analytics Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackIdeaPanelView", () => {
    it("should track idea panel view with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        ideaSource: "manual" as const,
        projectStatus: "idea" as const,
        documentCount: 2,
        hasNotes: true,
        tagCount: 3,
      };

      trackIdeaPanelView(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "idea_panel_viewed",
        expect.objectContaining({
          idea_id: "test-idea-id",
          idea_source: "manual",
          project_status: "idea",
          document_count: 2,
          has_notes: true,
          tag_count: 3,
        })
      );
    });
  });

  describe("trackStatusUpdate", () => {
    it("should track status update with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        previousStatus: "idea" as const,
        newStatus: "in_progress" as const,
        ideaSource: "frankenstein" as const,
      };

      trackStatusUpdate(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "idea_status_updated",
        expect.objectContaining({
          idea_id: "test-idea-id",
          previous_status: "idea",
          new_status: "in_progress",
          idea_source: "frankenstein",
        })
      );
    });
  });

  describe("trackNotesSave", () => {
    it("should track notes save with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        notesLength: 150,
        hadPreviousNotes: false,
        ideaSource: "manual" as const,
      };

      trackNotesSave(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "idea_notes_saved",
        expect.objectContaining({
          idea_id: "test-idea-id",
          notes_length: 150,
          had_previous_notes: false,
          idea_source: "manual",
        })
      );
    });
  });

  describe("trackTagsManagement", () => {
    it("should track tags save action with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        action: "save" as const,
        tagCount: 5,
        previousTagCount: 3,
        ideaSource: "manual" as const,
      };

      trackTagsManagement(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "idea_tags_managed",
        expect.objectContaining({
          idea_id: "test-idea-id",
          action: "save",
          tag_count: 5,
          previous_tag_count: 3,
          idea_source: "manual",
        })
      );
    });
  });

  describe("trackDocumentView", () => {
    it("should track document expand action with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        documentId: "test-doc-id",
        documentType: "startup_analysis" as const,
        action: "expand" as const,
      };

      trackDocumentView(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "idea_document_viewed",
        expect.objectContaining({
          idea_id: "test-idea-id",
          document_id: "test-doc-id",
          document_type: "startup_analysis",
          action: "expand",
        })
      );
    });
  });

  describe("trackAnalyzeButtonClick", () => {
    it("should track analyze button click with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        analysisType: "hackathon" as const,
        ideaSource: "frankenstein" as const,
        existingDocumentCount: 1,
      };

      trackAnalyzeButtonClick(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "idea_analyze_clicked",
        expect.objectContaining({
          idea_id: "test-idea-id",
          analysis_type: "hackathon",
          idea_source: "frankenstein",
          existing_document_count: 1,
        })
      );
    });
  });

  describe("PostHog not available", () => {
    it("should not throw error when PostHog is not loaded", () => {
      // Temporarily set __loaded to false
      const originalLoaded = posthog.__loaded;
      posthog.__loaded = false;

      expect(() => {
        trackIdeaPanelView({
          ideaId: "test",
          ideaSource: "manual",
          projectStatus: "idea",
          documentCount: 0,
          hasNotes: false,
          tagCount: 0,
        });
      }).not.toThrow();

      // Restore original value
      posthog.__loaded = originalLoaded;
    });
  });
});
