import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import HackathonAnalysisDisplay from "../HackathonAnalysisDisplay";
import type { HackathonAnalysis } from "@/lib/types";

// Mock the auth context
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    session: null,
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock the locale context
vi.mock("@/features/locale/context/LocaleContext", () => ({
  useLocale: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

// Mock feature flags
vi.mock("@/lib/featureFlags", () => ({
  isEnabled: () => false,
}));

const mockAnalysis: HackathonAnalysis = {
  finalScore: 4.2,
  finalScoreExplanation:
    "The final score of 4.2/5 is calculated as the average of all criteria",
  viabilitySummary:
    "This project shows strong potential for success in the hackathon",
  detailedSummary:
    "Detailed analysis of the project's strengths and areas for improvement",
  scoringRubric: [
    {
      name: "Innovation",
      score: 4.4,
      justification: "Strong inventive angle",
    },
  ],
  categoryAnalysis: {
    evaluations: [
      {
        category: "resurrection",
        fitScore: 8.5,
        explanation: "Excellent fit for the Resurrection category",
        improvementSuggestions: ["Focus more on legacy technology integration"],
      },
      {
        category: "frankenstein",
        fitScore: 6.2,
        explanation: "Good potential for Frankenstein category",
        improvementSuggestions: ["Highlight technology integration challenges"],
      },
    ],
    bestMatch: "resurrection",
    bestMatchReason: "Strong alignment with reviving obsolete technology",
  },
  criteriaAnalysis: {
    scores: [
      {
        name: "Potential Value",
        score: 4.0,
        justification: "Strong market potential with good uniqueness",
        subScores: {
          "Market Uniqueness": {
            score: 4.2,
            explanation: "Highly unique approach",
          },
          "UI Intuitiveness": {
            score: 3.8,
            explanation: "Good user experience focus",
          },
          Scalability: {
            score: 4.0,
            explanation: "Strong scalability potential",
          },
        },
      },
      {
        name: "Implementation",
        score: 4.3,
        justification: "Excellent use of Kiro features",
        subScores: {
          "Kiro Features Variety": {
            score: 4.5,
            explanation: "Wide variety of features used",
          },
          "Depth of Understanding": {
            score: 4.0,
            explanation: "Good understanding shown",
          },
          "Strategic Integration": {
            score: 4.4,
            explanation: "Strategic approach evident",
          },
        },
      },
      {
        name: "Quality and Design",
        score: 4.3,
        justification: "High quality with creative elements",
        subScores: {
          Creativity: {
            score: 4.2,
            explanation: "Creative problem-solving approach",
          },
          Originality: {
            score: 4.1,
            explanation: "Original concept and execution",
          },
          Polish: { score: 4.6, explanation: "Well-polished presentation" },
        },
      },
    ],
    finalScore: 4.2,
    finalScoreExplanation: "Average of all three criteria scores",
  },
  hackathonSpecificAdvice: {
    categoryOptimization: [
      "Focus on legacy technology revival",
      "Emphasize modernization approach",
    ],
    kiroIntegrationTips: [
      "Utilize more Kiro automation features",
      "Demonstrate deeper integration",
    ],
    competitionStrategy: [
      "Highlight unique value proposition",
      "Showcase technical innovation",
    ],
  },
  competitors: [],
  nextSteps: [
    {
      title: "Enhance UI Design",
      description: "Improve the user interface polish",
    },
    { title: "Add More Features", description: "Expand the feature set" },
  ],
  improvementSuggestions: [
    {
      title: "Legacy Integration",
      description: "Focus more on legacy technology integration",
    },
    {
      title: "Modern Approach",
      description: "Emphasize modern development practices",
    },
  ],
};

const mockProps = {
  analysis: mockAnalysis,
  onRefineSuggestion: vi.fn(),
  addedSuggestions: [],
  onSave: vi.fn(),
  isSaved: false,
  onGoToDashboard: vi.fn(),
};

describe("HackathonAnalysisDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders analysis results correctly", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText(/viability summary/i)).toBeInTheDocument();
    expect(screen.getByText(/category analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/criteria breakdown/i)).toBeInTheDocument();
  });

  it("displays final score and explanation", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText(/calculated as the average/i)).toBeInTheDocument();
  });

  it("shows viability summary", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(
      screen.getByText(/strong potential for success/i)
    ).toBeInTheDocument();
  });

  it("displays category evaluations", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText(/resurrection/i)).toBeInTheDocument();
    expect(screen.getByText(/frankenstein/i)).toBeInTheDocument();
    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("6.2")).toBeInTheDocument();
  });

  it("shows best matching category", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText(/best match/i)).toBeInTheDocument();
    expect(screen.getByText(/resurrection/i)).toBeInTheDocument();
    expect(
      screen.getByText(/reviving obsolete technology/i)
    ).toBeInTheDocument();
  });

  it("displays criteria scores", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText(/potential value/i)).toBeInTheDocument();
    expect(screen.getByText(/implementation/i)).toBeInTheDocument();
    expect(screen.getByText(/quality and design/i)).toBeInTheDocument();
    expect(screen.getByText("4.0")).toBeInTheDocument();
    expect(screen.getByText("4.3")).toBeInTheDocument();
  });

  it("shows improvement suggestions", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText(/legacy integration/i)).toBeInTheDocument();
    expect(screen.getByText(/modern approach/i)).toBeInTheDocument();
  });

  it("calls onRefineSuggestion when suggestion is clicked", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    const suggestionButton = screen.getByText(/legacy integration/i);
    fireEvent.click(suggestionButton);

    expect(mockProps.onRefineSuggestion).toHaveBeenCalledWith(
      "Focus more on legacy technology integration",
      "Legacy Integration",
      0
    );
  });

  it("disables already applied suggestions", () => {
    const propsWithAppliedSuggestions = {
      ...mockProps,
      addedSuggestions: [0],
    };

    render(<HackathonAnalysisDisplay {...propsWithAppliedSuggestions} />);

    const appliedSuggestion = screen.getByText(/legacy integration/i);
    expect(appliedSuggestion.closest("button")).toBeDisabled();
  });

  it("displays next steps", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText(/enhance ui design/i)).toBeInTheDocument();
    expect(screen.getByText(/add more features/i)).toBeInTheDocument();
    expect(screen.getByText(/improve the user interface/i)).toBeInTheDocument();
  });

  it("shows hackathon-specific advice", () => {
    render(<HackathonAnalysisDisplay {...mockProps} />);

    expect(screen.getByText(/category optimization/i)).toBeInTheDocument();
    expect(screen.getByText(/kiro integration tips/i)).toBeInTheDocument();
    expect(screen.getByText(/competition strategy/i)).toBeInTheDocument();
  });

  describe("ScoreGauge Integration", () => {
    it("should render ScoreGauge with correct score prop", () => {
      const { getByTestId } = render(
        <HackathonAnalysisDisplay {...mockProps} />
      );

      const scoreValue = getByTestId("score-value");
      expect(scoreValue).toBeInTheDocument();
      expect(scoreValue).toHaveTextContent("4.2");
    });

    it("should render ScoreGauge with size={160}", () => {
      const { container } = render(<HackathonAnalysisDisplay {...mockProps} />);

      // Find the gauge container div
      const gaugeContainer = container.querySelector(
        ".relative.flex.items-center.justify-center.font-mono"
      );
      expect(gaugeContainer).toBeInTheDocument();
      expect(gaugeContainer).toHaveStyle({ width: "160px", height: "160px" });
    });

    it("should display gauge within full analysis context", () => {
      const { getByTestId, getByText } = render(
        <HackathonAnalysisDisplay {...mockProps} />
      );

      // Verify gauge is present
      const scoreValue = getByTestId("score-value");
      expect(scoreValue).toBeInTheDocument();

      // Verify it's within the Final Score section
      expect(getByText(/viability summary/i)).toBeInTheDocument();
      expect(getByText(/strong potential for success/i)).toBeInTheDocument();

      // Verify gauge displays correct score
      expect(scoreValue).toHaveTextContent("4.2");
    });

    it("should verify no layout regressions in Final Score section", () => {
      const { container, getByTestId, getByText } = render(
        <HackathonAnalysisDisplay {...mockProps} />
      );

      // Verify gauge is present
      const scoreValue = getByTestId("score-value");
      expect(scoreValue).toBeInTheDocument();

      // Verify Final Score section structure
      const finalScoreSection = container.querySelector(
        ".bg-gradient-to-r.from-purple-500\\/20.to-orange-500\\/20"
      );
      expect(finalScoreSection).toBeInTheDocument();

      // Verify gauge container is centered
      const gaugeContainer = container.querySelector(
        ".flex.flex-col.items-center.justify-center"
      );
      expect(gaugeContainer).toBeInTheDocument();

      // Verify text labels are present
      expect(getByText(/average of all criteria/i)).toBeInTheDocument();
      expect(getByText(/out of five/i)).toBeInTheDocument();

      // Verify viability summary is present
      expect(getByText(/strong potential for success/i)).toBeInTheDocument();
    });
  });
});
