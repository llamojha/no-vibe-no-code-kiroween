import {
  evaluateProjectForCategory,
  analyzeProjectCategories,
} from "../categoryMatcher";
import type { ProjectSubmission, KiroweenCategory } from "@/lib/types";

describe("categoryMatcher", () => {
  const mockSubmission: ProjectSubmission = {
    description:
      "A project that combines old and new technologies and uses Kiro agents for integration and automation",
    supportingMaterials: {
      screenshots: ["screenshot1.png"],
      demoLink: "https://demo.example.com",
    },
  };

  describe("evaluateProjectForCategory", () => {
    it("should return a complete category evaluation", () => {
      const result = evaluateProjectForCategory(mockSubmission, "resurrection");

      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("fitScore");
      expect(result).toHaveProperty("explanation");
      expect(result).toHaveProperty("improvementSuggestions");
      expect(result.category).toBe("resurrection");
    });

    it("should keep fit scores within 0-10 range", () => {
      const categories: KiroweenCategory[] = [
        "resurrection",
        "frankenstein",
        "skeleton-crew",
        "costume-contest",
      ];

      categories.forEach((category) => {
        const result = evaluateProjectForCategory(mockSubmission, category);
        expect(result.fitScore).toBeGreaterThanOrEqual(0);
        expect(result.fitScore).toBeLessThanOrEqual(10);
      });
    });

    it("should provide meaningful explanations", () => {
      const result = evaluateProjectForCategory(mockSubmission, "resurrection");

      expect(result.explanation).toBeTruthy();
      expect(typeof result.explanation).toBe("string");
      expect(result.explanation.length).toBeGreaterThan(50);
      expect(result.explanation).toContain("Resurrection");
    });

    it("should provide improvement suggestions", () => {
      const result = evaluateProjectForCategory(mockSubmission, "resurrection");

      expect(Array.isArray(result.improvementSuggestions)).toBe(true);
      expect(result.improvementSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe("Resurrection category evaluation", () => {
    it("should score higher for projects mentioning legacy/obsolete technology", () => {
      const legacySubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "Reviving legacy systems and obsolete vintage technology with modern updates",
      };

      const modernSubmission: ProjectSubmission = {
        ...mockSubmission,
        description: "A modern web application with latest frameworks",
      };

      const legacyResult = evaluateProjectForCategory(
        legacySubmission,
        "resurrection"
      );
      const modernResult = evaluateProjectForCategory(
        modernSubmission,
        "resurrection"
      );

      expect(legacyResult.fitScore).toBeGreaterThan(modernResult.fitScore);
    });
  });
  describe("Frankenstein category evaluation", () => {
    it("should score higher for projects combining incompatible technologies", () => {
      const frankensteinSubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "Combining incompatible technologies and integrating different systems into a hybrid solution using Kiro to merge various technologies and overcome integration challenges",
      };

      const result = evaluateProjectForCategory(
        frankensteinSubmission,
        "frankenstein"
      );

      expect(result.fitScore).toBeGreaterThan(5);
    });
  });

  describe("Skeleton Crew category evaluation", () => {
    it("should score higher for framework/platform projects", () => {
      const frameworkSubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "A flexible framework and extensible platform that provides a foundation for multiple use cases, using Kiro to create a modular and adaptable system architecture",
      };

      const result = evaluateProjectForCategory(
        frameworkSubmission,
        "skeleton-crew"
      );

      expect(result.fitScore).toBeGreaterThan(5);
    });
  });

  describe("Costume Contest category evaluation", () => {
    it("should score higher for UI/design focused projects", () => {
      const designSubmission: ProjectSubmission = {
        ...mockSubmission,
        description:
          "A beautiful, polished UI with spooky Halloween theme and excellent visual design",
        supportingMaterials: {
          screenshots: ["ui1.png", "ui2.png"],
          demoLink: "https://demo.example.com",
        },
      };

      const result = evaluateProjectForCategory(
        designSubmission,
        "costume-contest"
      );

      expect(result.fitScore).toBeGreaterThan(5);
    });

    it("should give bonus for supporting visual materials", () => {
      const withMaterials: ProjectSubmission = {
        ...mockSubmission,
        description: "A UI-focused project with visual design",
        supportingMaterials: {
          screenshots: ["screenshot1.png"],
          demoLink: "https://demo.example.com",
        },
      };

      const withoutMaterials: ProjectSubmission = {
        ...mockSubmission,
        description: "A UI-focused project with visual design",
        supportingMaterials: {},
      };

      const withResult = evaluateProjectForCategory(
        withMaterials,
        "costume-contest"
      );
      const withoutResult = evaluateProjectForCategory(
        withoutMaterials,
        "costume-contest"
      );

      expect(withResult.fitScore).toBeGreaterThan(withoutResult.fitScore);
    });
  });

  describe("analyzeProjectCategories", () => {
    it("should evaluate all four categories", () => {
      const result = analyzeProjectCategories(mockSubmission);

      expect(result.evaluations).toHaveLength(4);
      const categories = result.evaluations.map((e) => e.category);
      expect(categories).toContain("resurrection");
      expect(categories).toContain("frankenstein");
      expect(categories).toContain("skeleton-crew");
      expect(categories).toContain("costume-contest");
    });

    it("should identify the best matching category", () => {
      const result = analyzeProjectCategories(mockSubmission);

      expect(result.bestMatch).toBeTruthy();
      expect(result.bestMatchReason).toBeTruthy();
      expect(typeof result.bestMatchReason).toBe("string");

      // Best match should be one of the evaluated categories
      const categories = result.evaluations.map((e) => e.category);
      expect(categories).toContain(result.bestMatch);
    });

    it("should select category with highest fit score as best match", () => {
      const result = analyzeProjectCategories(mockSubmission);

      const bestEvaluation = result.evaluations.find(
        (e) => e.category === result.bestMatch
      );
      const otherEvaluations = result.evaluations.filter(
        (e) => e.category !== result.bestMatch
      );

      expect(bestEvaluation).toBeTruthy();
      otherEvaluations.forEach((evaluation) => {
        expect(bestEvaluation!.fitScore).toBeGreaterThanOrEqual(
          evaluation.fitScore
        );
      });
    });
  });
});
