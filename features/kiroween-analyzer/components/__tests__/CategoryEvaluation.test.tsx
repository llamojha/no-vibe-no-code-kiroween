import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryEvaluation from "../CategoryEvaluation";
import type { CategoryAnalysis } from "@/lib/types";
import { LocaleProvider } from "@/features/locale/context/LocaleContext";

// Helper to render with LocaleProvider
const renderWithLocale = (component: React.ReactElement) => {
  return render(<LocaleProvider>{component}</LocaleProvider>);
};

const mockCategoryAnalysis: CategoryAnalysis = {
  evaluations: [
    {
      category: "resurrection",
      fitScore: 8.5,
      explanation:
        "Excellent fit for the Resurrection category due to focus on reviving legacy technology",
      improvementSuggestions: [
        "Emphasize more on obsolete technology aspects",
        "Highlight modernization techniques used",
      ],
    },
    {
      category: "frankenstein",
      fitScore: 6.2,
      explanation:
        "Good potential for Frankenstein category with technology integration",
      improvementSuggestions: [
        "Describe incompatible technologies being combined",
        "Explain integration challenges overcome",
      ],
    },
    {
      category: "skeleton-crew",
      fitScore: 4.8,
      explanation: "Moderate fit for Skeleton Crew category",
      improvementSuggestions: [
        "Focus more on framework aspects",
        "Demonstrate extensibility features",
      ],
    },
    {
      category: "costume-contest",
      fitScore: 7.3,
      explanation:
        "Strong visual design elements align well with Costume Contest",
      improvementSuggestions: [
        "Add more Halloween-themed elements",
        "Include more visual materials",
      ],
    },
  ],
  bestMatch: "resurrection",
  bestMatchReason: "Highest score with strong alignment to category criteria",
};

describe("CategoryEvaluation", () => {
  it("renders all category evaluations", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    expect(screen.getAllByText(/resurrection/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/frankenstein/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/skeleton crew/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/costume contest/i).length).toBeGreaterThan(0);
  });

  it("displays fit scores correctly (converted to 0-5 scale)", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    // Scores are converted from 0-10 to 0-5 scale (divided by 2)
    expect(screen.getAllByText("4.3").length).toBeGreaterThan(0); // 8.5 / 2 = 4.25 -> 4.3
    expect(screen.getAllByText("3.1").length).toBeGreaterThan(0); // 6.2 / 2 = 3.1
    expect(screen.getAllByText("2.4").length).toBeGreaterThan(0); // 4.8 / 2 = 2.4
    expect(screen.getAllByText("3.6").length).toBeGreaterThan(0); // 7.3 / 2 = 3.65 -> 3.6
  });

  it("shows category explanations", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    expect(
      screen.getByText(/excellent fit for the resurrection/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/good potential for frankenstein/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/moderate fit for skeleton crew/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/strong visual design elements/i)
    ).toBeInTheDocument();
  });

  it("displays improvement suggestions", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    expect(
      screen.getByText(/emphasize more on obsolete technology/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/highlight modernization techniques/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/describe incompatible technologies/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/add more halloween-themed elements/i)
    ).toBeInTheDocument();
  });

  it("highlights the best matching category", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    // The best match should be visually distinguished with orange border
    // We can verify by checking that the best match section exists
    expect(screen.getByText(/best matching category/i)).toBeInTheDocument();
    expect(screen.getAllByText(/resurrection/i).length).toBeGreaterThan(0);
  });

  it("shows best match reason", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    expect(screen.getByText(/best match/i)).toBeInTheDocument();
    expect(
      screen.getByText(/highest score with strong alignment/i)
    ).toBeInTheDocument();
  });

  it("renders score gauges for fit scores", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    // Check for score gauge elements (using data-testid from ScoreGauge component)
    const scoreValues = screen.getAllByTestId("score-value");
    expect(scoreValues).toHaveLength(4); // One for each category
  });

  it("handles empty improvement suggestions gracefully", () => {
    const analysisWithoutSuggestions: CategoryAnalysis = {
      ...mockCategoryAnalysis,
      evaluations: mockCategoryAnalysis.evaluations.map((evaluation) => ({
        ...evaluation,
        improvementSuggestions: [],
      })),
    };

    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={analysisWithoutSuggestions} />
    );

    // Should still render without errors
    expect(screen.getAllByText(/resurrection/i).length).toBeGreaterThan(0);
  });

  it("displays category descriptions", () => {
    renderWithLocale(
      <CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />
    );

    // Check for category descriptions (these would be defined in the component)
    expect(screen.getByText(/reviving.*technology/i)).toBeInTheDocument();
    expect(
      screen.getByText(/integrate seemingly incompatible/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/flexible foundation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ui polish and spooky design/i)
    ).toBeInTheDocument();
  });
});
