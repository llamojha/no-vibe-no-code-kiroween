import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import AnalysisDisplay from "../AnalysisDisplay";
import type { Analysis } from "@/lib/types";

// Mock the locale context
vi.mock("@/features/locale/context/LocaleContext", () => ({
  useLocale: () => ({
    t: (key: string) => key,
    locale: "en",
    setLocale: vi.fn(),
  }),
}));

// Mock the auth context
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    session: { user: { id: "test-user-id" } },
    loading: false,
  }),
}));

const mockAnalysis: Analysis = {
  finalScore: 4.2,
  finalScoreExplanation:
    "The final score of 4.2/5 reflects strong market potential with some areas for improvement",
  viabilitySummary:
    "This startup idea shows strong potential for success with a clear value proposition",
  detailedSummary:
    "Detailed analysis of the startup idea's strengths and areas for improvement",
  scoringRubric: [
    {
      name: "Market Demand",
      score: 4.5,
      justification: "Strong market demand with clear customer pain points",
    },
    {
      name: "Uniqueness",
      score: 4.0,
      justification: "Unique approach to solving the problem",
    },
    {
      name: "Scalability",
      score: 4.2,
      justification: "Good scalability potential with proper execution",
    },
  ],
  founderQuestions: [
    {
      question: "Who is your target customer?",
      ask: "Define your ideal customer profile",
      why: "Understanding your customer is crucial for product-market fit",
      source: "Y Combinator",
      analysis: "The target customer is well-defined with clear pain points",
    },
  ],
  swotAnalysis: {
    strengths: ["Strong value proposition", "Clear market need"],
    weaknesses: ["Limited initial resources", "Competitive market"],
    opportunities: ["Growing market", "Technology trends"],
    threats: ["Established competitors", "Market saturation"],
  },
  currentMarketTrends: [
    {
      trend: "AI Integration",
      impact: "Positive impact on market adoption",
    },
  ],
  competitors: [
    {
      name: "Competitor A",
      description: "Leading player in the market",
      strengths: ["Market share", "Brand recognition"],
      weaknesses: ["High pricing", "Limited features"],
      sourceLink: "https://example.com",
    },
  ],
  monetizationStrategies: [
    {
      name: "Subscription Model",
      description: "Monthly recurring revenue from subscribers",
    },
  ],
  improvementSuggestions: [
    {
      title: "Enhance User Experience",
      description: "Focus on improving the user interface and experience",
    },
    {
      title: "Expand Feature Set",
      description: "Add more features to increase value proposition",
    },
  ],
  nextSteps: [
    {
      title: "Build MVP",
      description: "Create a minimum viable product to test the market",
    },
    {
      title: "Validate with Users",
      description: "Get feedback from potential customers",
    },
  ],
};

const mockProps = {
  analysis: mockAnalysis,
  onSave: vi.fn(),
  isSaved: false,
  onGoToDashboard: vi.fn(),
};

describe("AnalysisDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ScoreGauge Integration", () => {
    it("should render ScoreGauge with correct score prop", () => {
      render(<AnalysisDisplay {...mockProps} />);

      // Verify the score is displayed
      const scoreValue = screen.getByTestId("score-value");
      expect(scoreValue).toBeInTheDocument();
      expect(scoreValue).toHaveTextContent("4.2");
    });

    it("should render ScoreGauge with size={192}", () => {
      const { container } = render(<AnalysisDisplay {...mockProps} />);

      // Find the ScoreGauge wrapper div (the direct parent of score-value)
      const scoreGaugeWrapper = container.querySelector(
        '[data-testid="score-value"]'
      )?.parentElement;

      expect(scoreGaugeWrapper).toBeInTheDocument();
      expect(scoreGaugeWrapper?.style.width).toBe("192px");
      expect(scoreGaugeWrapper?.style.height).toBe("192px");
    });

    it("should verify gauge displays within full analysis context", () => {
      render(<AnalysisDisplay {...mockProps} />);

      // Verify the gauge is within the Final Score section
      expect(screen.getByTestId("score-value")).toBeInTheDocument();

      // Verify other analysis elements are present
      expect(screen.getByText("viabilityVerdict")).toBeInTheDocument();
      expect(
        screen.getByText(/strong potential for success/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/reflects strong market potential/i)
      ).toBeInTheDocument();
    });

    it("should verify no layout regressions in Final Score section", () => {
      const { container } = render(<AnalysisDisplay {...mockProps} />);

      // Verify the Final Score section structure
      const scoreSection = container
        .querySelector('[data-testid="score-value"]')
        ?.closest("div.flex.flex-col.items-center");

      expect(scoreSection).toBeInTheDocument();
      expect(scoreSection?.classList.contains("items-center")).toBe(true);
      expect(scoreSection?.classList.contains("text-center")).toBe(true);

      // Verify the gauge and text are properly laid out
      const scoreGauge = scoreSection?.querySelector(
        '[data-testid="score-value"]'
      )?.parentElement?.parentElement;
      expect(scoreGauge).toBeInTheDocument();

      // Verify viability verdict is present
      const viabilityVerdict = screen.getByText("viabilityVerdict");
      expect(viabilityVerdict).toBeInTheDocument();
    });
  });

  describe("Analysis Content Display", () => {
    it("should display final score explanation", () => {
      render(<AnalysisDisplay {...mockProps} />);

      expect(
        screen.getByText(/reflects strong market potential/i)
      ).toBeInTheDocument();
    });

    it("should display viability summary", () => {
      render(<AnalysisDisplay {...mockProps} />);

      expect(
        screen.getByText(/strong potential for success/i)
      ).toBeInTheDocument();
    });

    it("should display scoring rubric", () => {
      render(<AnalysisDisplay {...mockProps} />);

      // Use getAllByText since these terms appear in both the radar chart and table
      const marketDemandElements = screen.getAllByText(/market demand/i);
      expect(marketDemandElements.length).toBeGreaterThan(0);

      const uniquenessElements = screen.getAllByText(/uniqueness/i);
      expect(uniquenessElements.length).toBeGreaterThan(0);

      const scalabilityElements = screen.getAllByText(/scalability/i);
      expect(scalabilityElements.length).toBeGreaterThan(0);
    });

    it("should display SWOT analysis", () => {
      render(<AnalysisDisplay {...mockProps} />);

      expect(screen.getByText(/strong value proposition/i)).toBeInTheDocument();
      expect(
        screen.getByText(/limited initial resources/i)
      ).toBeInTheDocument();
    });

    it("should display improvement suggestions", () => {
      render(<AnalysisDisplay {...mockProps} />);

      expect(screen.getByText(/enhance user experience/i)).toBeInTheDocument();
      expect(screen.getByText(/expand feature set/i)).toBeInTheDocument();
    });

    it("should display next steps", () => {
      render(<AnalysisDisplay {...mockProps} />);

      expect(screen.getByText(/build mvp/i)).toBeInTheDocument();
      expect(screen.getByText(/validate with users/i)).toBeInTheDocument();
    });
  });

  describe("Score Gauge with Different Scores", () => {
    it("should render gauge correctly with low score", () => {
      const lowScoreAnalysis = { ...mockAnalysis, finalScore: 2.0 };
      render(<AnalysisDisplay {...mockProps} analysis={lowScoreAnalysis} />);

      const scoreValue = screen.getByTestId("score-value");
      expect(scoreValue).toHaveTextContent("2.0");
    });

    it("should render gauge correctly with perfect score", () => {
      const perfectScoreAnalysis = { ...mockAnalysis, finalScore: 5.0 };
      render(
        <AnalysisDisplay {...mockProps} analysis={perfectScoreAnalysis} />
      );

      const scoreValue = screen.getByTestId("score-value");
      expect(scoreValue).toHaveTextContent("5.0");
    });

    it("should render gauge correctly with zero score", () => {
      const zeroScoreAnalysis = { ...mockAnalysis, finalScore: 0 };
      render(<AnalysisDisplay {...mockProps} analysis={zeroScoreAnalysis} />);

      const scoreValue = screen.getByTestId("score-value");
      expect(scoreValue).toHaveTextContent("—");
    });
  });

  describe("Save and Export Actions", () => {
    it("should display save button when not saved", () => {
      render(<AnalysisDisplay {...mockProps} />);

      expect(screen.getByText("saveReportButton")).toBeInTheDocument();
    });

    it("should display saved message when saved", () => {
      render(<AnalysisDisplay {...mockProps} isSaved={true} />);

      expect(screen.getByText("reportSavedMessage")).toBeInTheDocument();
      expect(screen.getByText("goToDashboardButton")).toBeInTheDocument();
    });
  });
});
