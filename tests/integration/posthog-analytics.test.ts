import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  trackReportGeneration,
  trackFrankensteinInteraction,
  trackHomepageInteraction,
  trackIdeaEnhancement,
  trackExport,
  identifyUser,
} from "@/features/analytics/tracking";
import {
  captureServerEvent,
  trackServerAnalysisRequest,
  trackServerError,
} from "@/features/analytics/server-tracking";

/**
 * PostHog Analytics Integration Tests
 *
 * These tests verify that the PostHog analytics integration:
 * 1. Handles missing configuration gracefully
 * 2. Provides type-safe tracking functions
 * 3. Includes proper error handling
 * 4. Works with both client and server-side tracking
 */

describe("PostHog Analytics Integration", () => {
  describe("Client-Side Tracking", () => {
    describe("trackReportGeneration", () => {
      it("should accept valid report generation properties", () => {
        expect(() => {
          trackReportGeneration({
            reportType: "startup",
            ideaLength: 100,
            userId: "test-user-123",
          });
        }).not.toThrow();
      });

      it("should accept all report types", () => {
        const reportTypes: Array<"startup" | "kiroween" | "frankenstein"> = [
          "startup",
          "kiroween",
          "frankenstein",
        ];

        reportTypes.forEach((reportType) => {
          expect(() => {
            trackReportGeneration({
              reportType,
              userId: "test-user",
            });
          }).not.toThrow();
        });
      });

      it("should handle optional properties", () => {
        expect(() => {
          trackReportGeneration({
            reportType: "startup",
          });
        }).not.toThrow();
      });
    });

    describe("trackFrankensteinInteraction", () => {
      it("should track roll action with all properties", () => {
        expect(() => {
          trackFrankensteinInteraction({
            action: "roll",
            mode: "aws",
            slotCount: 3,
            rollCount: 5,
          });
        }).not.toThrow();
      });

      it("should track mode selection", () => {
        expect(() => {
          trackFrankensteinInteraction({
            action: "mode_select",
            mode: "tech_companies",
          });
        }).not.toThrow();
      });

      it("should track slot configuration", () => {
        expect(() => {
          trackFrankensteinInteraction({
            action: "slot_config",
            slotCount: 4,
          });
        }).not.toThrow();
      });

      it("should accept both slot count values", () => {
        const slotCounts: Array<3 | 4> = [3, 4];

        slotCounts.forEach((slotCount) => {
          expect(() => {
            trackFrankensteinInteraction({
              action: "slot_config",
              slotCount,
            });
          }).not.toThrow();
        });
      });
    });

    describe("trackHomepageInteraction", () => {
      it("should track animation toggle with all properties", () => {
        expect(() => {
          trackHomepageInteraction({
            action: "animation_toggle",
            animationState: "enabled",
            deviceType: "desktop",
          });
        }).not.toThrow();
      });

      it("should accept all device types", () => {
        const deviceTypes: Array<"mobile" | "tablet" | "desktop"> = [
          "mobile",
          "tablet",
          "desktop",
        ];

        deviceTypes.forEach((deviceType) => {
          expect(() => {
            trackHomepageInteraction({
              action: "animation_toggle",
              animationState: "enabled",
              deviceType,
            });
          }).not.toThrow();
        });
      });

      it("should work without device type (auto-detection)", () => {
        expect(() => {
          trackHomepageInteraction({
            action: "animation_toggle",
            animationState: "disabled",
          });
        }).not.toThrow();
      });
    });

    describe("trackIdeaEnhancement", () => {
      it("should track add suggestion action", () => {
        expect(() => {
          trackIdeaEnhancement({
            action: "add_suggestion",
            analysisType: "startup",
            suggestionLength: 150,
          });
        }).not.toThrow();
      });

      it("should track modify idea action", () => {
        expect(() => {
          trackIdeaEnhancement({
            action: "modify_idea",
            analysisType: "kiroween",
            changeType: "refinement",
          });
        }).not.toThrow();
      });

      it("should accept both analysis types", () => {
        const analysisTypes: Array<"startup" | "kiroween"> = [
          "startup",
          "kiroween",
        ];

        analysisTypes.forEach((analysisType) => {
          expect(() => {
            trackIdeaEnhancement({
              action: "add_suggestion",
              analysisType,
            });
          }).not.toThrow();
        });
      });
    });

    describe("trackExport", () => {
      it("should track successful export", () => {
        expect(() => {
          trackExport({
            format: "pdf",
            reportType: "startup",
            success: true,
          });
        }).not.toThrow();
      });

      it("should track failed export with error message", () => {
        expect(() => {
          trackExport({
            format: "markdown",
            reportType: "frankenstein",
            success: false,
            errorMessage: "Export failed due to network error",
          });
        }).not.toThrow();
      });

      it("should accept all export formats", () => {
        const formats: Array<"pdf" | "markdown" | "json" | "txt"> = [
          "pdf",
          "markdown",
          "json",
          "txt",
        ];

        formats.forEach((format) => {
          expect(() => {
            trackExport({
              format,
              reportType: "startup",
              success: true,
            });
          }).not.toThrow();
        });
      });

      it("should accept all report types", () => {
        const reportTypes: Array<"startup" | "kiroween" | "frankenstein"> = [
          "startup",
          "kiroween",
          "frankenstein",
        ];

        reportTypes.forEach((reportType) => {
          expect(() => {
            trackExport({
              format: "pdf",
              reportType,
              success: true,
            });
          }).not.toThrow();
        });
      });
    });

    describe("identifyUser", () => {
      it("should identify user with ID only", () => {
        expect(() => {
          identifyUser("user-123");
        }).not.toThrow();
      });

      it("should identify user with properties", () => {
        expect(() => {
          identifyUser("user-123", {
            email: "test@example.com",
            created_at: "2024-01-01T00:00:00Z",
            tier: "free",
          });
        }).not.toThrow();
      });
    });
  });

  describe("Server-Side Tracking", () => {
    describe("captureServerEvent", () => {
      it("should accept valid server event properties", async () => {
        await expect(
          captureServerEvent({
            distinctId: "user-123",
            event: "test_event",
            properties: {
              test_property: "test_value",
            },
          })
        ).resolves.not.toThrow();
      });

      it("should work without properties", async () => {
        await expect(
          captureServerEvent({
            distinctId: "user-123",
            event: "test_event",
          })
        ).resolves.not.toThrow();
      });
    });

    describe("trackServerAnalysisRequest", () => {
      it("should track all analysis types", async () => {
        const analysisTypes: Array<"startup" | "kiroween" | "frankenstein"> = [
          "startup",
          "kiroween",
          "frankenstein",
        ];

        for (const analysisType of analysisTypes) {
          await expect(
            trackServerAnalysisRequest("user-123", analysisType)
          ).resolves.not.toThrow();
        }
      });
    });

    describe("trackServerError", () => {
      it("should track server errors", async () => {
        await expect(
          trackServerError(
            "user-123",
            "ai_service_error",
            "Failed to generate analysis"
          )
        ).resolves.not.toThrow();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle tracking calls gracefully when PostHog is not configured", () => {
      // All tracking functions should fail silently
      expect(() => {
        trackReportGeneration({ reportType: "startup" });
        trackFrankensteinInteraction({ action: "roll" });
        trackHomepageInteraction({
          action: "animation_toggle",
          animationState: "enabled",
        });
        trackIdeaEnhancement({
          action: "add_suggestion",
          analysisType: "startup",
        });
        trackExport({
          format: "pdf",
          reportType: "startup",
          success: true,
        });
        identifyUser("user-123");
      }).not.toThrow();
    });

    it("should handle server-side tracking gracefully when PostHog is not configured", async () => {
      await expect(
        Promise.all([
          captureServerEvent({
            distinctId: "user-123",
            event: "test_event",
          }),
          trackServerAnalysisRequest("user-123", "startup"),
          trackServerError("user-123", "test_error", "Test error message"),
        ])
      ).resolves.not.toThrow();
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct report types", () => {
      // This test verifies TypeScript compilation
      // @ts-expect-error - invalid report type
      const invalidReportType = () =>
        trackReportGeneration({ reportType: "invalid" });

      // Valid types should compile
      trackReportGeneration({ reportType: "startup" });
      trackReportGeneration({ reportType: "kiroween" });
      trackReportGeneration({ reportType: "frankenstein" });
    });

    it("should enforce correct action types", () => {
      // @ts-expect-error - invalid action
      const invalidAction = () =>
        trackFrankensteinInteraction({ action: "invalid" });

      // Valid actions should compile
      trackFrankensteinInteraction({ action: "roll" });
      trackFrankensteinInteraction({ action: "mode_select" });
      trackFrankensteinInteraction({ action: "slot_config" });
    });

    it("should enforce correct slot counts", () => {
      // @ts-expect-error - invalid slot count
      const invalidSlotCount = () =>
        trackFrankensteinInteraction({ action: "slot_config", slotCount: 5 });

      // Valid slot counts should compile
      trackFrankensteinInteraction({ action: "slot_config", slotCount: 3 });
      trackFrankensteinInteraction({ action: "slot_config", slotCount: 4 });
    });
  });
});
