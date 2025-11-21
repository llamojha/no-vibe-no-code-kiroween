import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import CriteriaScoring from "../CriteriaScoring";
import type { CriteriaAnalysis } from "@/lib/types";

vi.mock("@/features/locale/context/LocaleContext", () => ({
  useLocale: () => {
    const translations: Record<string, string> = {
      criteriaPotentialValue: "Potential Value",
      criteriaImplementation: "Implementation",
      criteriaQualityDesign: "Quality and Design",
      rubricJustification: "Justification",
      criteriaScoreTitle: "Criteria Scores",
      noCriteriaAnalysisAvailable: "No criteria analysis available",
    };
    return {
      locale: "en",
      setLocale: vi.fn(),
      t: (key: string) => translations[key] || key,
    };
  },
}));

const mockCriteriaAnalysis: CriteriaAnalysis = {
  scores: [
    {
      name: "Potential Value",
      score: 4.0,
      justification:
        "Strong market potential with good uniqueness and scalability",
      subScores: {
        "Market Uniqueness": {
          score: 4.2,
          explanation: "Highly unique approach to solving the problem",
        },
        "UI Intuitiveness": {
          score: 3.8,
          explanation: "Good user experience focus with intuitive design",
        },
        Scalability: {
          score: 4.0,
          explanation: "Strong potential for growth and expansion",
        },
      },
    },
    {
      name: "Implementation",
      score: 4.3,
      justification:
        "Excellent use of Kiro features with strategic integration",
      subScores: {
        "Kiro Features Variety": {
          score: 4.5,
          explanation: "Wide variety of Kiro features utilized effectively",
        },
        "Depth of Understanding": {
          score: 4.0,
          explanation: "Good understanding of Kiro capabilities demonstrated",
        },
        "Strategic Integration": {
          score: 4.4,
          explanation: "Strategic approach to Kiro integration evident",
        },
      },
    },
    {
      name: "Quality and Design",
      score: 4.1,
      justification: "High quality with creative and original elements",
      subScores: {
        Creativity: {
          score: 4.2,
          explanation: "Creative problem-solving approach demonstrated",
        },
        Originality: {
          score: 3.9,
          explanation: "Original concept with unique execution",
        },
        Polish: {
          score: 4.2,
          explanation: "Well-polished presentation and attention to detail",
        },
      },
    },
  ],
  finalScore: 4.1,
  finalScoreExplanation:
    "The final score of 4.1/5 is calculated as the average of all three judging criteria",
};

describe("CriteriaScoring", () => {
  it("renders all criteria scores", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    expect(screen.getByText(/potential value/i)).toBeInTheDocument();
    expect(screen.getByText(/implementation/i)).toBeInTheDocument();
    expect(screen.getByText(/quality and design/i)).toBeInTheDocument();
  });

  it("displays main criteria scores correctly", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    const mainScores = screen.getAllByText(/\(\d\.\d\/5\.0\)/);
    expect(mainScores.length).toBeGreaterThanOrEqual(3);
  });

  it("shows criteria justifications", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    expect(screen.getByText(/strong market potential/i)).toBeInTheDocument();
    expect(
      screen.getByText(/excellent use of kiro features/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/high quality with creative/i)).toBeInTheDocument();
  });

  it("displays sub-scores when expanded", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    // Check for sub-score names
    expect(screen.getAllByText(/market uniqueness/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ui intuitiveness/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/scalability/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/kiro features variety/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/depth of understanding/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/strategic integration/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/creativity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/originality/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/polish/i).length).toBeGreaterThan(0);
  });

  it("shows sub-score values", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    const subScoreValues = screen.getAllByText(/\(\d\.\d\/5\.0\)/);
    expect(subScoreValues.length).toBeGreaterThan(0);
  });

  it("displays sub-score explanations", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    expect(screen.getByText(/highly unique approach/i)).toBeInTheDocument();
    expect(screen.getByText(/good user experience focus/i)).toBeInTheDocument();
    expect(
      screen.getByText(/wide variety of kiro features/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/creative problem-solving approach/i)
    ).toBeInTheDocument();
  });

  it("shows final score and explanation", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    expect(screen.getByText(/criteria scores/i)).toBeInTheDocument();
  });

  it("renders score bars or visual indicators", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    const scoreIndicators = screen.getAllByText(/\(\d\.\d\/5\.0\)/);
    expect(scoreIndicators.length).toBeGreaterThan(0);
  });

  it("handles criteria without sub-scores", () => {
    const analysisWithoutSubScores: CriteriaAnalysis = {
      ...mockCriteriaAnalysis,
      scores: mockCriteriaAnalysis.scores.map((score) => ({
        ...score,
        subScores: undefined,
      })),
    };

    render(<CriteriaScoring criteriaAnalysis={analysisWithoutSubScores} />);

    // Should still render main criteria
    expect(screen.getByText(/potential value/i)).toBeInTheDocument();
    expect(screen.getByText(/implementation/i)).toBeInTheDocument();
    expect(screen.getByText(/quality and design/i)).toBeInTheDocument();
  });

  it("displays scores within expected range (1-5)", () => {
    render(<CriteriaScoring criteriaAnalysis={mockCriteriaAnalysis} />);

    // All displayed scores should be within 1-5 range
    const scoreElements = screen.getAllByText(/\(\d\.\d\/5\.0\)/);
    expect(scoreElements.length).toBeGreaterThan(0);

    scoreElements.forEach((element) => {
      const match = element.textContent?.match(/(\d\.\d)/);
      const score = match ? parseFloat(match[1]) : 0;
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(5);
    });
  });
});
