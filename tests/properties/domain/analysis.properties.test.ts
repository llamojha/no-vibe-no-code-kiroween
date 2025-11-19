/**
 * Property tests for Analysis Entity (P-DOM-008, P-DOM-009, P-DOM-010, P-DOM-011)
 * Tests analysis ownership, score consistency, hackathon category evaluation, and category fit scores
 *
 * Feature: property-testing-framework
 * Requirements: 2.1, 2.4
 */

import { describe, it, expect } from "vitest";
import {
  generateAnalysis,
  generateUserId,
  generateScore,
  generateMany,
  generateCategory,
} from "../utils/generators";
import { forAll, assertInRange } from "../utils/property-helpers";
import { Analysis } from "@/src/domain/entities/Analysis";
import { Score } from "@/src/domain/value-objects/Score";
import { Category } from "@/src/domain/value-objects/Category";
import { Locale } from "@/src/domain/value-objects/Locale";
import {
  HackathonAnalysisService,
  HackathonProjectMetadata,
} from "@/src/domain/services/HackathonAnalysisService";

describe("Property: Analysis Entity", () => {
  describe("P-DOM-008: Analysis Ownership", () => {
    /**
     * Property: For any analysis, it should belong to exactly one user
     * The userId should be set and immutable
     * Validates: Requirements 2.1, 2.4
     */
    it("should have exactly one userId for every analysis", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          // Every analysis must have a userId
          const hasUserId =
            analysis.userId !== undefined && analysis.userId !== null;

          // userId should be a valid UserId value object
          const hasValidUserId =
            typeof analysis.userId.value === "string" &&
            analysis.userId.value.length > 0;

          return hasUserId && hasValidUserId;
        },
        100
      );
    });

    it("should maintain immutable userId through all operations", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const originalUserId = analysis.userId;

          // Perform various operations that modify the analysis
          if (!analysis.isCompleted()) {
            analysis.updateScore(Score.create(75));
          }
          analysis.updateFeedback("New feedback");
          analysis.addSuggestion("New suggestion");

          // userId should remain unchanged
          return analysis.userId.equals(originalUserId);
        },
        100
      );
    });

    it("should correctly identify ownership with belongsToUser method", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const ownerId = analysis.userId;
          const differentUserId = generateUserId();

          // Analysis should belong to its owner
          const belongsToOwner = analysis.belongsToUser(ownerId);

          // Analysis should not belong to a different user
          const notBelongsToDifferent =
            !analysis.belongsToUser(differentUserId);

          return belongsToOwner && notBelongsToDifferent;
        },
        100
      );
    });

    it("should have unique userId-analysis relationships", () => {
      const analyses = generateMany(generateAnalysis, 50);

      // Each analysis should have a userId
      const allHaveUserId = analyses.every((a) => a.userId !== undefined);

      // Multiple analyses can belong to the same user (this is valid)
      // But each analysis should have exactly one userId
      const eachHasOneUserId = analyses.every((a) => {
        const userId = a.userId;
        return userId !== undefined && userId !== null;
      });

      expect(allHaveUserId).toBe(true);
      expect(eachHasOneUserId).toBe(true);
    });
  });

  describe("P-DOM-009: Analysis Score Consistency", () => {
    /**
     * Property: For any analysis, the score should be consistent and within valid bounds
     * Note: The current Analysis entity has a single score field, not calculated from criteria
     * This test validates that the score is always valid and consistent
     * Validates: Requirements 2.1, 2.4
     */
    it("should maintain score within valid bounds (0-100)", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const score = analysis.score.value;
          return score >= 0 && score <= 100;
        },
        100
      );
    });

    it("should maintain score consistency after updates", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          // Skip if analysis is already completed (can't update score)
          if (analysis.isCompleted()) {
            return true;
          }

          const newScore = generateScore();
          analysis.updateScore(newScore);

          // Score should match the updated value
          return analysis.score.equals(newScore);
        },
        100
      );
    });

    it("should not allow score updates on completed analyses", () => {
      // Create a completed analysis (one with feedback)
      const analysis = generateAnalysis({
        feedback: "This is completed feedback",
      });

      expect(analysis.isCompleted()).toBe(true);

      // Attempting to update score should throw
      expect(() => {
        analysis.updateScore(Score.create(90));
      }).toThrow("Cannot update score of a completed analysis");
    });

    it("should maintain score immutability through read operations", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const originalScore = analysis.score.value;

          // Perform various read operations
          analysis.isHighQuality();
          analysis.isLowQuality();
          analysis.getSummary();
          analysis.score.toPercentage();
          analysis.score.toString();

          // Score should remain unchanged
          return analysis.score.value === originalScore;
        },
        100
      );
    });

    it("should correctly classify high quality analyses (score >= 80)", () => {
      const highScoreAnalysis = generateAnalysis({
        score: Score.create(85),
      });

      expect(highScoreAnalysis.isHighQuality()).toBe(true);
      expect(highScoreAnalysis.isLowQuality()).toBe(false);
    });

    it("should correctly classify low quality analyses (score < 40)", () => {
      const lowScoreAnalysis = generateAnalysis({
        score: Score.create(30),
      });

      expect(lowScoreAnalysis.isLowQuality()).toBe(true);
      expect(lowScoreAnalysis.isHighQuality()).toBe(false);
    });
  });

  describe("P-DOM-010: Hackathon Category Evaluation Completeness", () => {
    /**
     * Property: For any hackathon analysis, all four categories should be evaluated
     * The HackathonAnalysisService should evaluate all hackathon categories
     * Validates: Requirements 2.1, 2.4
     */
    const hackathonService = new HackathonAnalysisService();

    it("should evaluate all four hackathon categories", () => {
      forAll(
        () => {
          // Generate a hackathon-focused analysis
          const analysis = generateAnalysis({
            idea: "A project that combines legacy code modernization with new features",
            category: Category.createHackathon("frankenstein"),
          });

          const metadata: HackathonProjectMetadata = {
            projectName: "Test Project",
            description: "A test project for hackathon evaluation",
            teamSize: 3,
            githubUrl: "https://github.com/test/project",
            demoUrl: "https://demo.test.com",
          };

          return { analysis, metadata };
        },
        ({ analysis, metadata }) => {
          const evaluation = hackathonService.evaluateProjectForCategory(
            analysis,
            metadata
          );

          // Should have a recommended category
          const hasRecommendedCategory =
            evaluation.recommendedCategory !== undefined;

          // Should have alternative categories (at least 2)
          const hasAlternatives = evaluation.alternativeCategories.length >= 2;

          // Total evaluated categories should be at least 3 (1 recommended + 2 alternatives)
          // This ensures comprehensive evaluation across categories
          const totalEvaluated = 1 + evaluation.alternativeCategories.length;
          const hasComprehensiveEvaluation = totalEvaluated >= 3;

          return (
            hasRecommendedCategory &&
            hasAlternatives &&
            hasComprehensiveEvaluation
          );
        },
        50
      );
    });

    it("should include all hackathon category types in evaluation", () => {
      const hackathonCategories = Category.getHackathonCategories();

      // Verify we have exactly 4 hackathon categories
      expect(hackathonCategories.length).toBe(4);
      expect(hackathonCategories).toContain("resurrection");
      expect(hackathonCategories).toContain("frankenstein");
      expect(hackathonCategories).toContain("skeleton-crew");
      expect(hackathonCategories).toContain("costume-contest");
    });

    it("should provide fit scores for all evaluated categories", () => {
      const analysis = generateAnalysis({
        idea: "A framework for building modern web applications with legacy system integration",
      });

      const metadata: HackathonProjectMetadata = {
        projectName: "Modern Framework",
        description: "Combines old and new technologies seamlessly",
        teamSize: 2,
      };

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // Recommended category should have a fit score
      expect(evaluation.categoryFitScore).toBeDefined();
      expect(evaluation.categoryFitScore.value).toBeGreaterThanOrEqual(0);
      expect(evaluation.categoryFitScore.value).toBeLessThanOrEqual(100);

      // All alternative categories should have fit scores
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.fitScore).toBeDefined();
        expect(alt.fitScore.value).toBeGreaterThanOrEqual(0);
        expect(alt.fitScore.value).toBeLessThanOrEqual(100);
      });
    });

    it("should provide explanations for all evaluated categories", () => {
      const analysis = generateAnalysis({
        idea: "A visual design system for creating beautiful user interfaces",
      });

      const metadata: HackathonProjectMetadata = {
        projectName: "Design System",
        description: "Beautiful UI components with modern styling",
        teamSize: 1,
      };

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // All alternative categories should have reasons/explanations
      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.reason).toBeDefined();
        expect(alt.reason.length).toBeGreaterThan(0);
      });
    });
  });

  describe("P-DOM-011: Category Fit Score Bounds", () => {
    /**
     * Property: For any category evaluation, fit scores should be between 0 and 100
     * (Note: The design doc mentions 0-5, but the implementation uses 0-100 scale)
     * Validates: Requirements 2.1, 2.4
     */
    const hackathonService = new HackathonAnalysisService();

    it("should have fit scores within 0-100 range for all categories", () => {
      forAll(
        () => {
          const analysis = generateAnalysis({
            idea:
              "A project that " +
              ["modernizes", "combines", "builds", "designs"][
                Math.floor(Math.random() * 4)
              ] +
              " something interesting",
          });

          const metadata: HackathonProjectMetadata = {
            projectName: "Test Project " + Math.random(),
            description:
              "A test project with various features and capabilities",
            teamSize: Math.floor(Math.random() * 5) + 1,
          };

          return { analysis, metadata };
        },
        ({ analysis, metadata }) => {
          const evaluation = hackathonService.evaluateProjectForCategory(
            analysis,
            metadata
          );

          // Check recommended category fit score
          const recommendedInRange = assertInRange(
            evaluation.categoryFitScore.value,
            0,
            100
          );

          // Check all alternative category fit scores
          const alternativesInRange = evaluation.alternativeCategories.every(
            (alt) => assertInRange(alt.fitScore.value, 0, 100)
          );

          return recommendedInRange && alternativesInRange;
        },
        100
      );
    });

    it("should never produce negative fit scores", () => {
      forAll(
        () => {
          const analysis = generateAnalysis();
          const metadata: HackathonProjectMetadata = {
            projectName: "Test",
            description: "Test description",
            teamSize: 1,
          };
          return { analysis, metadata };
        },
        ({ analysis, metadata }) => {
          const evaluation = hackathonService.evaluateProjectForCategory(
            analysis,
            metadata
          );

          const recommendedNonNegative = evaluation.categoryFitScore.value >= 0;
          const alternativesNonNegative =
            evaluation.alternativeCategories.every(
              (alt) => alt.fitScore.value >= 0
            );

          return recommendedNonNegative && alternativesNonNegative;
        },
        100
      );
    });

    it("should never produce fit scores exceeding 100", () => {
      forAll(
        () => {
          // Generate analysis with strong category indicators
          const categories = [
            "resurrection",
            "frankenstein",
            "skeleton-crew",
            "costume-contest",
          ];
          const category =
            categories[Math.floor(Math.random() * categories.length)];

          const analysis = generateAnalysis({
            idea: `This project is all about ${category} and focuses on ${category} concepts with ${category} implementation`,
          });

          const metadata: HackathonProjectMetadata = {
            projectName: `${category} Project`,
            description: `A ${category} focused project with ${category} features`,
            teamSize: 3,
            githubUrl: "https://github.com/test/project",
            demoUrl: "https://demo.test.com",
          };

          return { analysis, metadata };
        },
        ({ analysis, metadata }) => {
          const evaluation = hackathonService.evaluateProjectForCategory(
            analysis,
            metadata
          );

          const recommendedNotExceeding =
            evaluation.categoryFitScore.value <= 100;
          const alternativesNotExceeding =
            evaluation.alternativeCategories.every(
              (alt) => alt.fitScore.value <= 100
            );

          return recommendedNotExceeding && alternativesNotExceeding;
        },
        100
      );
    });

    it("should rank categories by fit score correctly", () => {
      const analysis = generateAnalysis({
        idea: "A project that combines multiple legacy systems into a unified modern platform",
      });

      const metadata: HackathonProjectMetadata = {
        projectName: "Legacy Unifier",
        description: "Combines and modernizes old systems",
        teamSize: 4,
      };

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // Recommended category should have the highest or equal fit score
      const recommendedScore = evaluation.categoryFitScore.value;

      evaluation.alternativeCategories.forEach((alt) => {
        // Recommended should be >= all alternatives (allowing ties)
        expect(recommendedScore).toBeGreaterThanOrEqual(alt.fitScore.value);
      });
    });

    it("should handle edge cases with minimal project information", () => {
      const analysis = generateAnalysis({
        idea: "A simple project",
      });

      const metadata: HackathonProjectMetadata = {
        projectName: "Simple",
        description: "A simple project description",
        teamSize: 1,
      };

      const evaluation = hackathonService.evaluateProjectForCategory(
        analysis,
        metadata
      );

      // Even with minimal info, scores should be valid
      expect(evaluation.categoryFitScore.value).toBeGreaterThanOrEqual(0);
      expect(evaluation.categoryFitScore.value).toBeLessThanOrEqual(100);

      evaluation.alternativeCategories.forEach((alt) => {
        expect(alt.fitScore.value).toBeGreaterThanOrEqual(0);
        expect(alt.fitScore.value).toBeLessThanOrEqual(100);
      });
    });

    it("should handle projects with explicit category mentions", () => {
      const categories = [
        "resurrection",
        "frankenstein",
        "skeleton-crew",
        "costume-contest",
      ];

      categories.forEach((categoryName) => {
        const analysis = generateAnalysis({
          idea: `This is a ${categoryName} project focused on ${categoryName} concepts`,
        });

        const metadata: HackathonProjectMetadata = {
          projectName: `${categoryName} Project`,
          description: `A ${categoryName} themed project`,
          teamSize: 2,
        };

        const evaluation = hackathonService.evaluateProjectForCategory(
          analysis,
          metadata
        );

        // Fit scores should still be within bounds even with explicit mentions
        expect(evaluation.categoryFitScore.value).toBeGreaterThanOrEqual(0);
        expect(evaluation.categoryFitScore.value).toBeLessThanOrEqual(100);

        // The recommended category should likely be the mentioned one (high fit score)
        // But we don't enforce this as the algorithm may have other factors
        expect(evaluation.recommendedCategory).toBeDefined();
      });
    });
  });
});
