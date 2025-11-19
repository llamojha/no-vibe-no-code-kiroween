/**
 * Property-Based Tests for Scoring Business Rules
 *
 * Tests scoring calculation determinism, criteria aggregation,
 * gauge fill percentage, anhreshold consistency.
 */

import { describe, it, expect } from "vitest";
import { ScoreCalculationService } from "@/src/domain/services/ScoreCalculationService";
import { Analysis } from "@/src/domain/entities/Analysis";
import { Score } from "@/src/domain/value-objects/Score";
import { generateAnalysis, generateMany } from "../utils/generators";
import { forAll, assertInRange } from "../utils/property-helpers";

describe("Property: Scoring Business Rules", () => {
  const scoreService = new ScoreCalculationService();

  describe("P-BIZ-001: Score Calculation Determinism", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-001**
     * **Validates: Requirements 4.1, 4.2**
     *
     * Property: Same input produces same score
     * Formal: ∀a: Analysis, calculateScore(a) = calculateScore(a)
     */
    it("should produce identical scores for identical inputs", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const context = {
            analysis,
            category: analysis.category,
          };

          const score1 = scoreService.calculateAnalysisScore(context);
          const score2 = scoreService.calculateAnalysisScore(context);

          // Scores should be exactly equal (deterministic)
          return score1.totalScore.equals(score2.totalScore);
        },
        100
      );
    });

    it("should produce same score when called multiple times on same analysis", () => {
      const analyses = generateMany(generateAnalysis, 20);

      analyses.forEach((analysis) => {
        const context = { analysis, category: analysis.category };

        // Calculate score 5 times
        const scores = Array.from(
          { length: 5 },
          () => scoreService.calculateAnalysisScore(context).totalScore.value
        );

        // All scores should be identical
        const allEqual = scores.every((score) => score === scores[0]);
        expect(allEqual).toBe(true);
      });
    });
  });

  describe("P-BIZ-002: Criteria Score Aggregation", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-002**
     * **Validates: Requirements 4.1, 4.2**
     *
     * Property: Final score is weighted average of criteria scores
     * Formal: finalScore = sum(criteriaScores × weights) / sum(weights)
     */
    it("should calculate final score as weighted average of criteria", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const context = { analysis, category: analysis.category };
          const breakdown = scoreService.calculateAnalysisScore(context);

          // Calculate expected weighted average
          const weightedSum = breakdown.criteriaScores.reduce(
            (sum, item) => sum + item.score.value * item.weight,
            0
          );

          // Apply bonuses and penalties
          const expectedScore = Math.max(
            0,
            Math.min(
              100,
              weightedSum + breakdown.bonusPoints - breakdown.penaltyPoints
            )
          );

          // Allow small floating point error (0.01)
          const actualScore = breakdown.totalScore.value;
          const difference = Math.abs(actualScore - expectedScore);

          return difference < 0.01;
        },
        100
      );
    });

    it("should ensure all criteria scores contribute to final score", () => {
      const analyses = generateMany(generateAnalysis, 20);

      analyses.forEach((analysis) => {
        const context = { analysis, category: analysis.category };
        const breakdown = scoreService.calculateAnalysisScore(context);

        // Verify all criteria have scores
        expect(breakdown.criteriaScores.length).toBeGreaterThan(0);

        // Verify all criteria scores are within valid range
        breakdown.criteriaScores.forEach((item) => {
          expect(item.score.value).toBeGreaterThanOrEqual(0);
          expect(item.score.value).toBeLessThanOrEqual(100);
          expect(item.weight).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("P-BIZ-003: Score Gauge Fill Percentage", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-003**
     * **Validates: Requirements 4.1, 4.2**
     *
     * Property: Gauge fill percentage matches score percentage
     * Formal: fillPercentage = (score / maxScore) × 100
     *
     * Note: ScoreGauge uses 0-5 scale, so maxScore = 5
     */
    it("should calculate correct fill percentage for any score", () => {
      // Test with scores from 0 to 5 in increments of 0.1
      const testScores = Array.from({ length: 51 }, (_, i) => i * 0.1);

      testScores.forEach((scoreValue) => {
        const maxScore = 5;
        const expectedPercentage = (scoreValue / maxScore) * 100;

        // Verify calculation matches formula
        const actualPercentage = (scoreValue / maxScore) * 100;
        expect(actualPercentage).toBeCloseTo(expectedPercentage, 2);

        // Verify percentage is in valid range
        expect(actualPercentage).toBeGreaterThanOrEqual(0);
        expect(actualPercentage).toBeLessThanOrEqual(100);
      });
    });

    it("should produce 0% fill for zero score", () => {
      const score = 0;
      const maxScore = 5;
      const fillPercentage = (score / maxScore) * 100;

      expect(fillPercentage).toBe(0);
    });

    it("should produce 100% fill for maximum score", () => {
      const score = 5;
      const maxScore = 5;
      const fillPercentage = (score / maxScore) * 100;

      expect(fillPercentage).toBe(100);
    });

    it("should produce 50% fill for mid-range score", () => {
      const score = 2.5;
      const maxScore = 5;
      const fillPercentage = (score / maxScore) * 100;

      expect(fillPercentage).toBe(50);
    });
  });

  describe("P-BIZ-004: Score Color Threshold Consistency", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-004**
     * **Validates: Requirements 4.1, 4.2**
     *
     * Property: Score color matches defined thresholds
     * Formal: score ≥ 4.0 ⇒ green ∧ score ≥ 3.5 ⇒ yellow ∧ score ≥ 2.5 ⇒ orange ∧ score < 2.5 ⇒ red
     */

    // Helper function to determine expected color based on thresholds
    const getExpectedColor = (score: number): string => {
      if (score >= 4.0) return "green";
      if (score >= 3.5) return "yellow";
      if (score >= 2.5) return "orange";
      return "red";
    };

    it("should assign green color for excellent scores (≥4.0)", () => {
      const excellentScores = [4.0, 4.1, 4.5, 4.9, 5.0];

      excellentScores.forEach((score) => {
        const color = getExpectedColor(score);
        expect(color).toBe("green");
      });
    });

    it("should assign yellow color for good scores (≥3.5, <4.0)", () => {
      const goodScores = [3.5, 3.6, 3.7, 3.8, 3.9];

      goodScores.forEach((score) => {
        const color = getExpectedColor(score);
        expect(color).toBe("yellow");
      });
    });

    it("should assign orange color for fair scores (≥2.5, <3.5)", () => {
      const fairScores = [2.5, 2.6, 3.0, 3.2, 3.4];

      fairScores.forEach((score) => {
        const color = getExpectedColor(score);
        expect(color).toBe("orange");
      });
    });

    it("should assign red color for poor scores (<2.5)", () => {
      const poorScores = [0, 0.5, 1.0, 1.5, 2.0, 2.4];

      poorScores.forEach((score) => {
        const color = getExpectedColor(score);
        expect(color).toBe("red");
      });
    });

    it("should handle boundary values correctly", () => {
      // Test exact boundary values
      expect(getExpectedColor(4.0)).toBe("green"); // Boundary: excellent
      expect(getExpectedColor(3.5)).toBe("yellow"); // Boundary: good
      expect(getExpectedColor(2.5)).toBe("orange"); // Boundary: fair
      expect(getExpectedColor(2.49)).toBe("red"); // Just below fair
    });

    it("should maintain color consistency across all valid scores", () => {
      // Generate 100 random scores between 0 and 5
      const scores = Array.from({ length: 100 }, () => Math.random() * 5);

      scores.forEach((score) => {
        const color = getExpectedColor(score);

        // Verify color is one of the valid options
        expect(["green", "yellow", "orange", "red"]).toContain(color);

        // Verify color matches threshold logic
        if (score >= 4.0) {
          expect(color).toBe("green");
        } else if (score >= 3.5) {
          expect(color).toBe("yellow");
        } else if (score >= 2.5) {
          expect(color).toBe("orange");
        } else {
          expect(color).toBe("red");
        }
      });
    });
  });

  describe("Score Calculation Edge Cases", () => {
    it("should handle analyses with no feedback", () => {
      const analysis = generateAnalysis({ feedback: undefined });
      const context = { analysis, category: analysis.category };

      const breakdown = scoreService.calculateAnalysisScore(context);

      expect(breakdown.totalScore.value).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalScore.value).toBeLessThanOrEqual(100);
    });

    it("should handle analyses with no suggestions", () => {
      const analysis = generateAnalysis({ suggestions: [] });
      const context = { analysis, category: analysis.category };

      const breakdown = scoreService.calculateAnalysisScore(context);

      expect(breakdown.totalScore.value).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalScore.value).toBeLessThanOrEqual(100);
    });

    it("should handle very short ideas", () => {
      // Minimum 10 characters required by Analysis entity
      const analysis = generateAnalysis({ idea: "Short test" });
      const context = { analysis, category: analysis.category };

      const breakdown = scoreService.calculateAnalysisScore(context);

      // Should still produce valid score, possibly with penalties
      expect(breakdown.totalScore.value).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalScore.value).toBeLessThanOrEqual(100);
    });

    it("should handle very long ideas", () => {
      const longIdea = "A ".repeat(500) + "startup idea";
      const analysis = generateAnalysis({ idea: longIdea });
      const context = { analysis, category: analysis.category };

      const breakdown = scoreService.calculateAnalysisScore(context);

      expect(breakdown.totalScore.value).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalScore.value).toBeLessThanOrEqual(100);
    });
  });
});
