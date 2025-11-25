import { describe, it, expect, vi, beforeEach } from "vitest";
import posthog from "posthog-js";
import {
  trackDocumentGenerationRequest,
  trackDocumentGenerationSuccess,
  trackDocumentGenerationFailure,
  trackDocumentEdit,
  trackVersionHistory,
  trackDocumentRegeneration,
  trackDocumentExport,
  trackFeatureFlag,
  trackCreditUsage,
  trackGeneratorPageView,
} from "../tracking";

// Mock posthog
vi.mock("posthog-js", () => ({
  default: {
    __loaded: true,
    capture: vi.fn(),
  },
}));

describe("Document Generator Analytics Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackDocumentGenerationRequest", () => {
    it("should track document generation request with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        documentType: "prd" as const,
        creditCost: 5,
        userCredits: 20,
        hasExistingDocuments: true,
        existingDocumentTypes: ["startup_analysis"],
      };

      trackDocumentGenerationRequest(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_generation_requested",
        expect.objectContaining({
          idea_id: "test-idea-id",
          document_type: "prd",
          credit_cost: 5,
          user_credits: 20,
          has_existing_documents: true,
          existing_document_types: "startup_analysis",
        })
      );
    });
  });

  describe("trackDocumentGenerationSuccess", () => {
    it("should track document generation success with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        documentId: "test-doc-id",
        documentType: "technical_design" as const,
        creditCost: 5,
        generationTimeMs: 15000,
        version: 1,
      };

      trackDocumentGenerationSuccess(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_generation_success",
        expect.objectContaining({
          idea_id: "test-idea-id",
          document_id: "test-doc-id",
          document_type: "technical_design",
          credit_cost: 5,
          generation_time_ms: 15000,
          version: 1,
        })
      );
    });
  });

  describe("trackDocumentGenerationFailure", () => {
    it("should track document generation failure with correct properties", () => {
      const props = {
        ideaId: "test-idea-id",
        documentType: "architecture" as const,
        errorType: "ai_error" as const,
        errorMessage: "AI service unavailable",
        creditsRefunded: true,
      };

      trackDocumentGenerationFailure(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_generation_failure",
        expect.objectContaining({
          idea_id: "test-idea-id",
          document_type: "architecture",
          error_type: "ai_error",
          error_message: "AI service unavailable",
          credits_refunded: true,
        })
      );
    });
  });

  describe("trackDocumentEdit", () => {
    it("should track document edit with correct properties", () => {
      const props = {
        documentId: "test-doc-id",
        documentType: "prd" as const,
        action: "save" as const,
        previousVersion: 1,
        newVersion: 2,
        contentLengthChange: 150,
      };

      trackDocumentEdit(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_edited",
        expect.objectContaining({
          document_id: "test-doc-id",
          document_type: "prd",
          action: "save",
          previous_version: 1,
          new_version: 2,
          content_length_change: 150,
        })
      );
    });
  });

  describe("trackVersionHistory", () => {
    it("should track version history view with correct properties", () => {
      const props = {
        documentId: "test-doc-id",
        documentType: "roadmap" as const,
        action: "view" as const,
        totalVersions: 5,
        currentVersion: 5,
      };

      trackVersionHistory(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "version_history_action",
        expect.objectContaining({
          document_id: "test-doc-id",
          document_type: "roadmap",
          action: "view",
          total_versions: 5,
          current_version: 5,
        })
      );
    });

    it("should track version restore with correct properties", () => {
      const props = {
        documentId: "test-doc-id",
        documentType: "prd" as const,
        action: "restore" as const,
        totalVersions: 5,
        selectedVersion: 3,
        currentVersion: 5,
      };

      trackVersionHistory(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "version_history_action",
        expect.objectContaining({
          document_id: "test-doc-id",
          document_type: "prd",
          action: "restore",
          total_versions: 5,
          selected_version: 3,
          current_version: 5,
        })
      );
    });
  });

  describe("trackDocumentRegeneration", () => {
    it("should track document regeneration success with correct properties", () => {
      const props = {
        documentId: "test-doc-id",
        documentType: "technical_design" as const,
        action: "success" as const,
        creditCost: 5,
        previousVersion: 2,
        newVersion: 3,
      };

      trackDocumentRegeneration(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_regeneration",
        expect.objectContaining({
          document_id: "test-doc-id",
          document_type: "technical_design",
          action: "success",
          credit_cost: 5,
          previous_version: 2,
          new_version: 3,
        })
      );
    });
  });

  describe("trackDocumentExport", () => {
    it("should track successful PDF export with correct properties", () => {
      const props = {
        documentId: "test-doc-id",
        documentType: "prd" as const,
        format: "pdf" as const,
        success: true,
        fileSizeBytes: 125000,
      };

      trackDocumentExport(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_exported",
        expect.objectContaining({
          document_id: "test-doc-id",
          document_type: "prd",
          format: "pdf",
          success: true,
          file_size_bytes: 125000,
        })
      );
    });

    it("should track failed markdown export with error message", () => {
      const props = {
        documentId: "test-doc-id",
        documentType: "architecture" as const,
        format: "markdown" as const,
        success: false,
        errorMessage: "Export failed",
      };

      trackDocumentExport(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_exported",
        expect.objectContaining({
          document_id: "test-doc-id",
          document_type: "architecture",
          format: "markdown",
          success: false,
          error_message: "Export failed",
        })
      );
    });
  });

  describe("trackFeatureFlag", () => {
    it("should track feature flag check with correct properties", () => {
      const props = {
        flagName: "ENABLE_DOCUMENT_GENERATION",
        flagValue: true,
        context: "page_load" as const,
      };

      trackFeatureFlag(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "feature_flag_checked",
        expect.objectContaining({
          flag_name: "ENABLE_DOCUMENT_GENERATION",
          flag_value: true,
          context: "page_load",
        })
      );
    });
  });

  describe("trackCreditUsage", () => {
    it("should track credit deduction with correct properties", () => {
      const props = {
        documentType: "prd" as const,
        action: "deduct" as const,
        amount: 5,
        balanceBefore: 20,
        balanceAfter: 15,
        success: true,
      };

      trackCreditUsage(props);

      expect(posthog.capture).toHaveBeenCalledWith(
        "document_credit_usage",
        expect.objectContaining({
          document_type: "prd",
          action: "deduct",
          amount: 5,
          balance_before: 20,
          balance_after: 15,
          success: true,
        })
      );
    });
  });

  describe("trackGeneratorPageView", () => {
    it("should track generator page view with correct properties", () => {
      trackGeneratorPageView("test-idea-id", "prd");

      expect(posthog.capture).toHaveBeenCalledWith(
        "generator_page_viewed",
        expect.objectContaining({
          idea_id: "test-idea-id",
          document_type: "prd",
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
        trackDocumentGenerationRequest({
          ideaId: "test",
          documentType: "prd",
          creditCost: 5,
          userCredits: 20,
          hasExistingDocuments: false,
        });
      }).not.toThrow();

      // Restore original value
      posthog.__loaded = originalLoaded;
    });
  });
});
