import { analyzeCriteria } from "../hackathonScoring";
import type { ProjectSubmission } from "@/lib/types";

describe("hackathonScoring", () => {
  const mockSubmission: ProjectSubmission = {
    description: "A unique and innovative project that solves real problems",
    selectedCategory: "resurrection",
    kiroUsage:
      "Using Kiro agents and tools for automation and workflow integration",
    supportingMaterials: {
      screenshots: ["screenshot1.png"],
      demoLink: "https://demo.example.com",
      additionalNotes: "Additional project details",
    },
  };

  describe("analyzeCriteria", () => {
    it("should return a complete criteria analysis", () => {
      const result = analyzeCriteria(mockSubmission);

      expect(result).toHaveProperty("scores");
      expect(result).toHaveProperty("finalScore");
      expect(result).toHaveProperty("finalScoreExplanation");
      expect(result.scores).toHaveLength(3);
    });

    it("should include all three criteria scores", () => {
      const result = analyzeCriteria(mockSubmission);

      const criteriaNames = result.scores.map((score) => score.name);
      expect(criteriaNames).toContain("Potential Value");
      expect(criteriaNames).toContain("Implementation");
      expect(criteriaNames).toContain("Quality and Design");
    });

    it("should calculate final score as average of criteria scores", () => {
      const result = analyzeCriteria(mockSubmission);
      const expectedAverage =
        result.scores.reduce((sum, score) => sum + score.score, 0) /
        result.scores.length;
      const roundedExpected = Math.round(expectedAverage * 10) / 10;

      expect(result.finalScore).toBe(roundedExpected);
    });

    it("should provide justification for each criteria score", () => {
      const result = analyzeCriteria(mockSubmission);

      result.scores.forEach((score) => {
        expect(score.justification).toBeTruthy();
        expect(typeof score.justification).toBe("string");
        expect(score.justification.length).toBeGreaterThan(0);
      });
    });

    it("should include sub-scores for each criteria", () => {
      const result = analyzeCriteria(mockSubmission);

      result.scores.forEach((score) => {
        expect(score.subScores).toBeDefined();
        expect(Object.keys(score.subScores!)).toHaveLength(3);
      });
    });
  });

  describe("Potential Value scoring", () => {
    it("should score higher for projects with uniqueness indicators", () => {
      const uniqueSubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "A unique, novel, and innovative solution that's first of its kind",
      };

      const genericSubmission: ProjectSubmission = {
        ...mockSubmission,
        description: "A simple basic application",
      };

      const uniqueResult = analyzeCriteria(uniqueSubmission);
      const genericResult = analyzeCriteria(genericSubmission);

      const uniquePotentialValue = uniqueResult.scores.find(
        (s) => s.name === "Potential Value"
      )!;
      const genericPotentialValue = genericResult.scores.find(
        (s) => s.name === "Potential Value"
      )!;

      expect(uniquePotentialValue.score).toBeGreaterThan(
        genericPotentialValue.score
      );
    });

    it("should score higher for projects with UI/UX focus", () => {
      const uiSubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "An intuitive user interface with excellent user experience and easy-to-use design",
      };

      const result = analyzeCriteria(uiSubmission);
      const potentialValue = result.scores.find(
        (s) => s.name === "Potential Value"
      )!;

      expect(
        potentialValue.subScores!["UI Intuitiveness"].score
      ).toBeGreaterThan(2.5);
    });

    it("should give bonus points for supporting materials", () => {
      const withMaterials: ProjectSubmission = {
        ...mockSubmission,
        supportingMaterials: {
          screenshots: ["screenshot1.png", "screenshot2.png"],
          demoLink: "https://demo.example.com",
          additionalNotes: "Detailed notes",
        },
      };

      const withoutMaterials: ProjectSubmission = {
        ...mockSubmission,
        supportingMaterials: {},
      };

      const withResult = analyzeCriteria(withMaterials);
      const withoutResult = analyzeCriteria(withoutMaterials);

      const withUI = withResult.scores.find(
        (s) => s.name === "Potential Value"
      )!.subScores!["UI Intuitiveness"];
      const withoutUI = withoutResult.scores.find(
        (s) => s.name === "Potential Value"
      )!.subScores!["UI Intuitiveness"];

      expect(withUI.score).toBeGreaterThan(withoutUI.score);
    });
  });

  describe("Implementation scoring", () => {
    it("should score higher for variety of Kiro features", () => {
      const richKiroUsage: ProjectSubmission = {
        ...mockSubmission,
        kiroUsage:
          "Using Kiro agents, tools, functions, API integration, automation workflows, and MCP context",
      };

      const basicKiroUsage: ProjectSubmission = {
        ...mockSubmission,
        kiroUsage: "Using Kiro agent",
      };

      const richResult = analyzeCriteria(richKiroUsage);
      const basicResult = analyzeCriteria(basicKiroUsage);

      const richImplementation = richResult.scores.find(
        (s) => s.name === "Implementation"
      )!;
      const basicImplementation = basicResult.scores.find(
        (s) => s.name === "Implementation"
      )!;

      expect(richImplementation.score).toBeGreaterThan(
        basicImplementation.score
      );
    });

    it("should score higher for detailed explanations", () => {
      const detailedUsage: ProjectSubmission = {
        ...mockSubmission,
        kiroUsage:
          "Using Kiro specifically because it provides comprehensive automation capabilities with detailed implementation considerations",
      };

      const result = analyzeCriteria(detailedUsage);
      const implementation = result.scores.find(
        (s) => s.name === "Implementation"
      )!;

      expect(
        implementation.subScores!["Depth of Understanding"].score
      ).toBeGreaterThan(2);
    });
  });

  describe("Quality and Design scoring", () => {
    it("should score higher for creative language", () => {
      const creativeSubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "A creative, innovative, and original solution with unique approach",
      };

      const result = analyzeCriteria(creativeSubmission);
      const qualityDesign = result.scores.find(
        (s) => s.name === "Quality and Design"
      )!;

      expect(qualityDesign.subScores!["Creativity"].score).toBeGreaterThan(2.5);
    });

    it("should penalize generic descriptions", () => {
      const genericSubmission: ProjectSubmission = {
        ...mockSubmission,
        description: "A simple, basic, standard, typical application",
      };

      const result = analyzeCriteria(genericSubmission);
      const qualityDesign = result.scores.find(
        (s) => s.name === "Quality and Design"
      )!;

      expect(qualityDesign.subScores!["Originality"].score).toBeLessThan(3);
    });

    it("should give bonus for supporting materials in polish score", () => {
      const polishedSubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "A polished, professional, high-quality application with careful attention to detail",
        supportingMaterials: {
          screenshots: ["screenshot1.png"],
          demoLink: "https://demo.example.com",
          additionalNotes: "Comprehensive documentation",
        },
      };

      const result = analyzeCriteria(polishedSubmission);
      const qualityDesign = result.scores.find(
        (s) => s.name === "Quality and Design"
      )!;

      expect(qualityDesign.subScores!["Polish"].score).toBeGreaterThan(3);
    });
  });

  describe("Score boundaries", () => {
    it("should keep all scores within 1-5 range", () => {
      const result = analyzeCriteria(mockSubmission);

      result.scores.forEach((score) => {
        expect(score.score).toBeGreaterThanOrEqual(1);
        expect(score.score).toBeLessThanOrEqual(5);

        if (score.subScores) {
          Object.values(score.subScores).forEach((subScore) => {
            expect(subScore.score).toBeGreaterThanOrEqual(1);
            expect(subScore.score).toBeLessThanOrEqual(5);
          });
        }
      });
    });

    it("should keep final score within 1-5 range", () => {
      const result = analyzeCriteria(mockSubmission);

      expect(result.finalScore).toBeGreaterThanOrEqual(1);
      expect(result.finalScore).toBeLessThanOrEqual(5);
    });
  });
});
