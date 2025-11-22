import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import en from "@/locales/en.json";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocale } from "@/features/locale/context/LocaleContext";
import KiroweenAnalyzerView from "../KiroweenAnalyzerView";

const translate = (key: string) =>
  (en as Record<string, string>)[key] ?? key;

// Mock the dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/locale/context/LocaleContext", () => ({
  useLocale: vi.fn(),
}));

vi.mock("@/features/kiroween-analyzer/api/analyzeHackathonProject", () => ({
  analyzeHackathonProject: vi.fn(),
}));

vi.mock("@/features/shared/api", () => ({
  getCreditBalance: vi.fn().mockResolvedValue({ credits: 5, tier: "free" as const }),
}));

// Mock the child components
vi.mock("../ProjectSubmissionForm", () => ({
  default: function MockProjectSubmissionForm({
    onSubmissionChange,
    submission,
  }: any) {
    return (
      <div data-testid="project-submission-form">
        <button
          onClick={() =>
            onSubmissionChange({
              ...submission,
              description:
                submission.description +
                "\n\n— Test Suggestion: Added via refinement",
            })
          }
        >
          Add Refinement
        </button>
      </div>
    );
  },
}));

vi.mock("../HackathonAnalysisDisplay", () => ({
  default: function MockHackathonAnalysisDisplay({
    onRefineSuggestion,
    addedSuggestions,
  }: any) {
    return (
      <div data-testid="hackathon-analysis-display">
        {onRefineSuggestion && (
          <button
            onClick={() =>
              onRefineSuggestion("Test suggestion text", "Test Suggestion", 0)
            }
            data-testid="refinement-suggestion"
          >
            Apply Suggestion
          </button>
        )}
        <div data-testid="added-suggestions">
          {JSON.stringify(addedSuggestions)}
        </div>
      </div>
    );
  },
}));

vi.mock("../SpookyLoader", () => ({
  default: function MockSpookyLoader() {
    return <div data-testid="spooky-loader">Loading...</div>;
  },
}));

vi.mock("../SpookyErrorMessage", () => ({
  default: function MockSpookyErrorMessage({ message }: any) {
    return <div data-testid="spooky-error">{message}</div>;
  },
}));

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};

const mockSearchParams = {
  get: vi.fn(),
};

const mockAuth = {
  session: { user: { id: "test-user" } },
  supabase: null,
  isLoading: false,
};

const mockLocale = {
  locale: "en" as const,
  t: vi.fn(translate),
  setLocale: vi.fn(),
};

describe("KiroweenAnalyzerView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as Mock).mockReturnValue(mockRouter);
    (useSearchParams as unknown as Mock).mockReturnValue(mockSearchParams);
    (useAuth as unknown as Mock).mockReturnValue(mockAuth);
    (useLocale as unknown as Mock).mockReturnValue(mockLocale);
    mockSearchParams.get.mockReturnValue(null);
  });

  it("renders the main components correctly", () => {
    render(<KiroweenAnalyzerView />);

    expect(
      screen.getByText("Kiroween Hackathon Analyzer")
    ).toBeInTheDocument();
    expect(screen.getByText(/spooky feedback/i)).toBeInTheDocument();
    expect(screen.getByTestId("project-submission-form")).toBeInTheDocument();
  });

  it("handles refinement suggestions correctly", async () => {
    // Mock analysis data to show the analysis display
    const mockAnalysis = {
      finalScore: 4.2,
      viabilitySummary: "Test summary",
      improvementSuggestions: [
        { title: "Test Suggestion", description: "Test suggestion text" },
      ],
      categoryAnalysis: {
        evaluations: [],
        bestMatch: "resurrection",
        bestMatchReason: "test",
      },
      criteriaAnalysis: {
        scores: [],
        finalScore: 4.2,
        finalScoreExplanation: "test",
      },
      hackathonSpecificAdvice: {
        categoryOptimization: [],
        kiroIntegrationTips: [],
        competitionStrategy: [],
      },
      competitors: [],
      nextSteps: [],
      detailedSummary: "Test detailed summary",
    };

    // Create a component with analysis data
    const TestComponent = () => {
      const [analysis, setAnalysis] = React.useState(mockAnalysis);
      const [addedSuggestions, setAddedSuggestions] = React.useState<number[]>(
        []
      );
      const [submission, setSubmission] = React.useState({
        description: "Initial description",
        supportingMaterials: {},
      });

      const handleRefineSuggestion = (
        suggestionText: string,
        suggestionTitle: string,
        index: number
      ) => {
        setSubmission((prev) => ({
          ...prev,
          description: `${prev.description.trim()}\n\n— ${suggestionTitle}: ${suggestionText}`,
        }));
        setAddedSuggestions((prev) => [...prev, index]);
      };

      return (
        <div>
          <div data-testid="project-submission-form">
            <div data-testid="description">{submission.description}</div>
          </div>
          <div data-testid="hackathon-analysis-display">
            <button
              onClick={() =>
                handleRefineSuggestion(
                  "Test suggestion text",
                  "Test Suggestion",
                  0
                )
              }
              data-testid="refinement-suggestion"
            >
              Apply Suggestion
            </button>
            <div data-testid="added-suggestions">
              {JSON.stringify(addedSuggestions)}
            </div>
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    // Check initial state
    expect(screen.getByTestId("description")).toHaveTextContent(
      "Initial description"
    );
    expect(screen.getByTestId("added-suggestions")).toHaveTextContent("[]");

    // Click the refinement suggestion
    fireEvent.click(screen.getByTestId("refinement-suggestion"));

    // Check that the suggestion was applied
    await waitFor(() => {
      expect(screen.getByTestId("description")).toHaveTextContent(
        /Initial description\s+— Test Suggestion: Test suggestion text/
      );
      expect(screen.getByTestId("added-suggestions")).toHaveTextContent("[0]");
    });
  });

  it("tracks multiple applied suggestions", async () => {
    const TestComponent = () => {
      const [addedSuggestions, setAddedSuggestions] = React.useState<number[]>(
        []
      );
      const [submission, setSubmission] = React.useState({
        description: "Initial description",
        supportingMaterials: {},
      });

      const handleRefineSuggestion = (
        suggestionText: string,
        suggestionTitle: string,
        index: number
      ) => {
        setSubmission((prev) => ({
          ...prev,
          description: `${prev.description.trim()}\n\n— ${suggestionTitle}: ${suggestionText}`,
        }));
        setAddedSuggestions((prev) => [...prev, index]);
      };

      return (
        <div>
          <button
            onClick={() =>
              handleRefineSuggestion("First suggestion", "Suggestion 1", 0)
            }
            data-testid="suggestion-0"
          >
            Apply Suggestion 1
          </button>
          <button
            onClick={() =>
              handleRefineSuggestion("Second suggestion", "Suggestion 2", 1)
            }
            data-testid="suggestion-1"
          >
            Apply Suggestion 2
          </button>
          <div data-testid="added-suggestions">
            {JSON.stringify(addedSuggestions)}
          </div>
          <div data-testid="description">{submission.description}</div>
        </div>
      );
    };

    render(<TestComponent />);

    // Apply first suggestion
    fireEvent.click(screen.getByTestId("suggestion-0"));
    await waitFor(() => {
      expect(screen.getByTestId("added-suggestions")).toHaveTextContent("[0]");
    });

    // Apply second suggestion
    fireEvent.click(screen.getByTestId("suggestion-1"));
    await waitFor(() => {
      expect(screen.getByTestId("added-suggestions")).toHaveTextContent(
        "[0,1]"
      );
      expect(screen.getByTestId("description")).toHaveTextContent(
        /Initial description\s+— Suggestion 1: First suggestion\s+— Suggestion 2: Second suggestion/
      );
    });
  });
});
