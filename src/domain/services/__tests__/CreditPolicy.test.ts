import { describe, it, expect, beforeEach } from "vitest";
import { CreditPolicy } from "../CreditPolicy";
import { User } from "../../entities/User";
import { Email } from "../../value-objects/Email";
import { AnalysisType } from "../../value-objects/AnalysisType";

describe("CreditPolicy", () => {
  let creditPolicy: CreditPolicy;

  beforeEach(() => {
    creditPolicy = new CreditPolicy();
  });

  describe("getDefaultCredits", () => {
    it("should return 5 as default credits", () => {
      expect(creditPolicy.getDefaultCredits()).toBe(5);
    });
  });

  describe("getAnalysisCost", () => {
    it("should return 1 credit for startup idea analysis", () => {
      const cost = creditPolicy.getAnalysisCost(AnalysisType.STARTUP_IDEA);
      expect(cost).toBe(1);
    });

    it("should return 1 credit for hackathon project analysis", () => {
      const cost = creditPolicy.getAnalysisCost(AnalysisType.HACKATHON_PROJECT);
      expect(cost).toBe(1);
    });

    it("should return same cost for all analysis types", () => {
      const startupCost = creditPolicy.getAnalysisCost(
        AnalysisType.STARTUP_IDEA
      );
      const hackathonCost = creditPolicy.getAnalysisCost(
        AnalysisType.HACKATHON_PROJECT
      );
      expect(startupCost).toBe(hackathonCost);
    });
  });

  describe("canPerformAnalysis", () => {
    it("should return true when user has credits", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 3,
      });

      expect(creditPolicy.canPerformAnalysis(user)).toBe(true);
    });

    it("should return true when user has 1 credit", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 1,
      });

      expect(creditPolicy.canPerformAnalysis(user)).toBe(true);
    });

    it("should return false when user has 0 credits", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 0,
      });

      expect(creditPolicy.canPerformAnalysis(user)).toBe(false);
    });

    it("should return true when user has many credits", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 100,
      });

      expect(creditPolicy.canPerformAnalysis(user)).toBe(true);
    });
  });

  describe("shouldShowWarning", () => {
    it("should return true when credits are 0", () => {
      expect(creditPolicy.shouldShowWarning(0)).toBe(true);
    });

    it("should return true when credits are 1", () => {
      expect(creditPolicy.shouldShowWarning(1)).toBe(true);
    });

    it("should return false when credits are 2", () => {
      expect(creditPolicy.shouldShowWarning(2)).toBe(false);
    });

    it("should return false when credits are 3", () => {
      expect(creditPolicy.shouldShowWarning(3)).toBe(false);
    });

    it("should return false when credits are high", () => {
      expect(creditPolicy.shouldShowWarning(100)).toBe(false);
    });
  });

  describe("calculateCreditDeduction", () => {
    it("should return 1 for startup idea analysis", () => {
      const deduction = creditPolicy.calculateCreditDeduction(
        AnalysisType.STARTUP_IDEA
      );
      expect(deduction).toBe(1);
    });

    it("should return 1 for hackathon project analysis", () => {
      const deduction = creditPolicy.calculateCreditDeduction(
        AnalysisType.HACKATHON_PROJECT
      );
      expect(deduction).toBe(1);
    });

    it("should match getAnalysisCost result", () => {
      const analysisType = AnalysisType.STARTUP_IDEA;
      const cost = creditPolicy.getAnalysisCost(analysisType);
      const deduction = creditPolicy.calculateCreditDeduction(analysisType);
      expect(deduction).toBe(cost);
    });
  });

  describe("policy consistency", () => {
    it("should have consistent default credits and analysis cost", () => {
      const defaultCredits = creditPolicy.getDefaultCredits();
      const analysisCost = creditPolicy.getAnalysisCost(
        AnalysisType.STARTUP_IDEA
      );

      // Default credits should allow at least one analysis
      expect(defaultCredits).toBeGreaterThanOrEqual(analysisCost);
    });

    it("should allow multiple analyses with default credits", () => {
      const defaultCredits = creditPolicy.getDefaultCredits();
      const analysisCost = creditPolicy.getAnalysisCost(
        AnalysisType.STARTUP_IDEA
      );

      const numberOfAnalyses = Math.floor(defaultCredits / analysisCost);
      expect(numberOfAnalyses).toBeGreaterThanOrEqual(5);
    });
  });

  describe("edge cases", () => {
    it("should handle user with exactly enough credits for one analysis", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 1,
      });

      expect(creditPolicy.canPerformAnalysis(user)).toBe(true);
      expect(creditPolicy.shouldShowWarning(user.credits)).toBe(true);
    });

    it("should handle user just above warning threshold", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 2,
      });

      expect(creditPolicy.canPerformAnalysis(user)).toBe(true);
      expect(creditPolicy.shouldShowWarning(user.credits)).toBe(false);
    });
  });
});
