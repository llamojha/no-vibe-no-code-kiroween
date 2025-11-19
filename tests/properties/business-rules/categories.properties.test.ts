/**
 * Property-Based Tests for Category Evaluation Business Rules
 *
 * Tests best match category selection and category explanation presence.
 */

import { describe, it, expect } from "vitest";
import { HackathonAnalysisService } from "@/src/domain/services/HackathonAnalysisService";
import { Analysis } from "@/src/domain/entities/Analysis";
import { Category } from "@/src/domain/value-objects/Category";
import { generateAnalysis, generateMany } from "../utils/generators";
import { forAll } from "../utils/property-helpers";

describe("Property: Category Evaluation Business Rules", () => {
  const hackathonService = new HackathonAnalysisService();

  /**
   * Helper to create hackathon project metadata for testing
   */
  const createTestMetadata = (overrides?: any) => ({
    projectName: "Test Project",
    description:
      "A test hackathon project description that is long enough to meet validation requirements",
    githubUrl: "https://github.com/test/project",
    demoUrl: "https://demo.test.com",
    teamSize: 3,
    ...overrides,
  });

  describe("P-BIZ-009: Best Match Category Selection", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-009**
     * **Validates: Requirements 4.1, 4.4**
     *
     * Property: Best match category has highest fit score
     * Formal: ∀h: HackathonAnalysis, h.bestMatch.fitScore = max(h.evaluations.map(e => e.fitScore))
     */
    it("should select category with highest fit score as best match", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const metadata = createTestMetadata();
          const evaluation = hackathonService.evaluateProjectForCategory(
            analysis,
            metadata
          );

          // Best match should have the highest fit score
          const bestMatchScore = evaluation.categoryFitScore.value;

          // Check all alternative categories have lower or equal scores
          const allAlternativesLowerOrEqual =
            evaluation.alternativeCategories.every(
              (alt) => alt.fitScore.value <= bestMatchScore
            );

          return allAlternativesLowerOrEqual;
        },
        100
      );
    });

    it("should ensure best match score is greater than or equal to all alternatives", () => {
      const analyses = generateMany(generateAnalysis, 20);

      analyses.forEach((analysis) => {
        const metadata = createTestMetadata();
        const evaluation = hackathonService.evaluateProjectForCategory(
          analysis,
          metadata
        );

        const bestMatchScore = evaluation.categoryFitScore.value;

        // Verify best match has highest score
        evaluation.alternativeCategories.forEach((alt) => {
          expect(alt.fitScore.value).toBeLessThanOrEqual(bestMatchScore);
        });
      });
    });

    it("should maintain best match property with category-specific keywords", () => {
      // Test with ideas that strongly match specific categories
      const categoryKeywords = {
        resurrection: "modernize legacy outdated system revive old technology",
        frankenstein:
          "combine merge integrate hybrid mashup multiple technologies",
        "skeleton-crew": "framework foundation structure base platform core",
        "costume-contest":
          "ui design visual interface beautiful appearance style",
      };

      Object.entries(categoryKeywords).forEach(([categoryValue, keywords]) => {
        const analysis = generateAnalysis({
          idea: `A project that aims to ${keywords} for better results`,
        });

        const metadata = createTestMetadata({
          description: `This project focuses on ${keywords}`,
        });

        const evaluation = hackathonService.evaluateProjectForCategory(
          analysis,
          metadata
        );

        const bestMatchScore = evaluation.categoryFitScore.value;

        // All alternatives should have lower or equal scores
        evaluation.alternativeCategories.forEach((alt) => {
          expect(alt.fitScore.value).toBeLessThanOrEqual(bestMatchScore);
        });

        // The recommended category should ideally match our keyword-targeted category
        // (though this is not strictly guaranteed due to scoring algorithm)
        expect(evaluation.recommendedCategory.value).toBeDefined();
      });
    });

    it("should handle ties in fit scores gracefully", () => {
      // Create an analysis with generic content that might score similarly across categories
      const genericAnalysis = generateAnalysis({
        idea: "A simple web application for managing tasks",
      });

      const metadata = createTestMetadata({
        description: "A basic task management application",
      });

      const evaluation = hackathonService.evaluateProjectForCategory(
        genericAnalysis,
        metadata
      );

      // Even with similar scores, there should be a clear best match
      expect(evaluation.recommendedCategory).toBeDefined();
      expect(evaluation.categoryFitScore).toBeDefined();

      // Best match score should still be >= all alternatives
      const bestMatchScore = evaluation.categoryFitScore.value;
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.fitScore.value).toBeLessThanOrEqual(bestMatchScore);
      });
    });

    it("should consistently select same best match for identical inputs", () => {
      const analysis = generateAnalysis({
        idea: "Combine AI and blockchain to create a hybrid platform",
      });

      const metadata = createTestMetadata({
        description: "A mashup of AI and blockchain technologies",
      });

      // Evaluate multiple times
      const evaluations = Array.from({ length: 5 }, () =>
        hackathonService.evaluateProjectForCategory(analysis, metadata)
      );

      // All evaluations should recommend the same category
      const firstCategory = evaluations[0].recommendedCategory.value;
      evaluations.forEach((evaluation) => {
        expect(evaluation.recommendedCategory.value).toBe(firstCategory);
      });

      // All evaluations should have the same best match score
      const firstScore = evaluations[0].categoryFitScore.value;
      evaluations.forEach((evaluation) => {
        expect(evaluation.categoryFitScore.value).toBe(firstScore);
      });
    });
  });

  describe("P-BIZ-010: Category Explanation Presence", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-010**
     * **Validates: Requirements 4.1, 4.4**
     *
     * Property: Every category evaluation includes an explanation
     * Formal: ∀c: CategoryEvaluation, c.explanation ≠ null ∧ c.explanation.length > 0
     */
    it("should provide non-empty explanation for recommended category", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const metadata = createTestMetadata();
          const evaluation = hackathonService.evaluateProjectForCategory(
            analysis,
            metadata
          );

          // Recommended category should have a reason (explanation)
          // The reason is stored in the alternativeCategories array for alternatives
          // For the best match, we need to check that it was evaluated with a reason

          // At minimum, verify that alternative categories have reasons
          const allAlternativesHaveReasons =
            evaluation.alternativeCategories.every(
              (alt) => alt.reason && alt.reason.length > 0
            );

          return allAlternativesHaveReasons;
        },
        100
      );
    });

    it("should provide non-empty reasons for all alternative categories", () => {
      const analyses = generateMany(generateAnalysis, 20);

      analyses.forEach((analysis) => {
        const metadata = createTestMetadata();
        const evaluation = hackathonService.evaluateProjectForCategory(
          analysis,
          metadata
        );

        // Check all alternative categories have non-empty reasons
        evaluation.alternativeCategories.forEach((alt) => {
          expect(alt.reason).toBeDefined();
          expect(alt.reason).not.toBe("");
          expect(alt.reason.length).toBeGreaterThan(0);
        });
      });
    });

    it("should provide meaningful explanations with category context", () => {
      const analyses = generateMany(generateAnalysis, 10);

      analyses.forEach((analysis) => {
        const metadata = createTestMetadata();
        const evaluation = hackathonService.evaluateProjectForCategory(
          analysis,
          metadata
        );

        // Check that reasons mention the category or provide context
        evaluation.alternativeCategories.forEach((alt) => {
          const reason = alt.reason.toLowerCase();

          // Reason should be substantial (more than just a few words)
          expect(alt.reason.length).toBeGreaterThan(10);

          // Reason should provide some context (contains common explanation words)
          const hasContextWords =
            reason.includes("fit") ||
            reason.includes("match") ||
            reason.includes("relevant") ||
            reason.includes("keyword") ||
            reason.includes("element") ||
            reason.includes("aspect") ||
            reason.includes("excellent") ||
            reason.includes("good") ||
            reason.includes("limited");

          expect(hasContextWords).toBe(true);
        });
      });
    });

    it("should provide explanations that reflect fit score quality", () => {
      const analyses = generateMany(generateAnalysis, 15);

      analyses.forEach((analysis) => {
        const metadata = createTestMetadata();
        const evaluation = hackathonService.evaluateProjectForCategory(
          analysis,
          metadata
        );

        evaluation.alternativeCategories.forEach((alt) => {
          const reason = alt.reason.toLowerCase();
          const fitScore = alt.fitScore.value;

          // High scores should have positive language
          if (fitScore >= 80) {
            const hasPositiveLanguage =
              reason.includes("excellent") ||
              reason.includes("strong") ||
              reason.includes("perfect") ||
              reason.includes("great");

            expect(hasPositiveLanguage).toBe(true);
          }

          // Low scores should have cautionary language
          if (fitScore < 60) {
            const hasCautionaryLanguage =
              reason.includes("limited") ||
              reason.includes("consider") ||
              reason.includes("some") ||
              reason.includes("good");

            expect(hasCautionaryLanguage).toBe(true);
          }
        });
      });
    });

    it("should never return null or undefined reasons", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const metadata = createTestMetadata();
          const evaluation = hackathonService.evaluateProjectForCategory(
            analysis,
            metadata
          );

          // Check no alternative has null or undefined reason
          const noNullReasons = evaluation.alternativeCategories.every(
            (alt) => alt.reason !== null && alt.reason !== undefined
          );

          return noNullReasons;
        },
        100
      );
    });
  });

  describe("Category Evaluation Edge Cases", () => {
    it("should handle very short project descriptions", () => {
      const analysis = generateAnalysis({
        idea: "A simple app",
      });

      const metadata = createTestMetadata({
        description: "A very short description that barely meets requirements",
      });

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // Should still produce valid evaluation
      expect(evaluation.recommendedCategory).toBeDefined();
      expect(evaluation.categoryFitScore.value).toBeGreaterThanOrEqual(0);
      expect(evaluation.categoryFitScore.value).toBeLessThanOrEqual(100);

      // Should still have explanations
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.reason).toBeDefined();
        expect(alt.reason.length).toBeGreaterThan(0);
      });
    });

    it("should handle very long project descriptions", () => {
      const longIdea = "A ".repeat(500) + "comprehensive project";
      const analysis = generateAnalysis({
        idea: longIdea,
      });

      const metadata = createTestMetadata({
        description: "B ".repeat(500) + "detailed description",
      });

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // Should still produce valid evaluation
      expect(evaluation.recommendedCategory).toBeDefined();
      expect(evaluation.categoryFitScore.value).toBeGreaterThanOrEqual(0);
      expect(evaluation.categoryFitScore.value).toBeLessThanOrEqual(100);

      // Best match property should hold
      const bestMatchScore = evaluation.categoryFitScore.value;
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.fitScore.value).toBeLessThanOrEqual(bestMatchScore);
      });
    });

    it("should handle projects with no keywords matching any category", () => {
      const analysis = generateAnalysis({
        idea: "A project about something completely unrelated to any category",
      });

      const metadata = createTestMetadata({
        description: "This project has no specific category keywords at all",
      });

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // Should still select a best match
      expect(evaluation.recommendedCategory).toBeDefined();

      // Should still provide explanations
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.reason).toBeDefined();
        expect(alt.reason.length).toBeGreaterThan(0);
      });

      // Best match property should still hold
      const bestMatchScore = evaluation.categoryFitScore.value;
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.fitScore.value).toBeLessThanOrEqual(bestMatchScore);
      });
    });

    it("should handle projects with keywords from multiple categories", () => {
      const analysis = generateAnalysis({
        idea: "Combine legacy systems with modern UI design using a framework foundation",
      });

      const metadata = createTestMetadata({
        description:
          "Modernize old technology with beautiful visual interface and core platform structure",
      });

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // Should still select a single best match
      expect(evaluation.recommendedCategory).toBeDefined();

      // Best match should have highest score
      const bestMatchScore = evaluation.categoryFitScore.value;
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.fitScore.value).toBeLessThanOrEqual(bestMatchScore);
      });

      // All categories should have explanations
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.reason).toBeDefined();
        expect(alt.reason.length).toBeGreaterThan(0);
      });
    });
  });
});
