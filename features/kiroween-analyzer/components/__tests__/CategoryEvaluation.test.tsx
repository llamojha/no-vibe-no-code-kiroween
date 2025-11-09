import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryEvaluation from "../CategoryEvaluation";
import type { CategoryAnalysis } from "@/lib/types";

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
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

    expect(screen.getByText(/resurrection/i)).toBeInTheDocument();
    expect(screen.getByText(/frankenstein/i)).toBeInTheDocument();
    expect(screen.getByText(/skeleton crew/i)).toBeInTheDocument();
    expect(screen.getByText(/costume contest/i)).toBeInTheDocument();
  });

  it("displays fit scores correctly", () => {
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("6.2")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("7.3")).toBeInTheDocument();
  });

  it("shows category explanations", () => {
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

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
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

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
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

    // The best match should be visually distinguished
    const resurrectionSection = screen
      .getByText(/resurrection/i)
      .closest('[data-testid="category-resurrection"]');
    expect(resurrectionSection).toHaveClass("border-orange-500"); // Assuming this is the highlight class
  });

  it("shows best match reason", () => {
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

    expect(screen.getByText(/best match/i)).toBeInTheDocument();
    expect(
      screen.getByText(/highest score with strong alignment/i)
    ).toBeInTheDocument();
  });

  it("renders star ratings for fit scores", () => {
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

    // Check for star rating elements (assuming they use a specific class or data attribute)
    const starRatings = screen.getAllByTestId(/star-rating/i);
    expect(starRatings).toHaveLength(4); // One for each category
  });

  it("handles empty improvement suggestions gracefully", () => {
    const analysisWithoutSuggestions: CategoryAnalysis = {
      ...mockCategoryAnalysis,
      evaluations: mockCategoryAnalysis.evaluations.map((evaluation) => ({
        ...evaluation,
        improvementSuggestions: [],
      })),
    };

    render(
      <CategoryEvaluation categoryAnalysis={analysisWithoutSuggestions} />
    );

    // Should still render without errors
    expect(screen.getByText(/resurrection/i)).toBeInTheDocument();
  });

  it("displays category descriptions", () => {
    render(<CategoryEvaluation categoryAnalysis={mockCategoryAnalysis} />);

    // Check for category descriptions (these would be defined in the component)
    expect(
      screen.getByText(/reviving obsolete technology/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/integration of seemingly incompatible/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/flexible foundation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ui polish and spooky design/i)
    ).toBeInTheDocument();
  });
});
