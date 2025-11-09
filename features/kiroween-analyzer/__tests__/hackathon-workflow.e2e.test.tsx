import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import KiroweenAnalyzerView from "../components/KiroweenAnalyzerView";
import { analyzeHackathonProject } from "../api/analyzeHackathonProject";
import { saveHackathonAnalysis } from "../api/saveHackathonAnalysis";

// Mock the API functions
jest.mock("../api/analyzeHackathonProject");
jest.mock("../api/saveHackathonAnalysis");

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock auth context
jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    session: { user: { id: "test-user" } },
    supabase: null,
    isLoading: false,
  }),
}));

// Mock locale context
jest.mock("@/features/locale/context/LocaleContext", () => ({
  useLocale: () => ({
    locale: "en" as const,
  }),
}));

const mockAnalysis = {
  finalScore: 4.2,
  finalScoreExplanation:
    "The final score of 4.2/5 is calculated as the average of all criteria",
  viabilitySummary:
    "This project shows strong potential for success in the hackathon",
  detailedSummary:
    "Detailed analysis of the project's strengths and areas for improvement",
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
      {
        category: "skeleton-crew",
        fitScore: 4.8,
        explanation: "Moderate fit for Skeleton Crew category",
        improvementSuggestions: ["Focus more on framework aspects"],
      },
      {
        category: "costume-contest",
        fitScore: 7.3,
        explanation: "Strong visual design elements",
        improvementSuggestions: ["Add more Halloween-themed elements"],
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
        justification: "Strong market potential",
        subScores: {
          "Market Uniqueness": {
            score: 4.2,
            explanation: "Highly unique approach",
          },
          "UI Intuitiveness": {
            score: 3.8,
            explanation: "Good user experience",
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
            explanation: "Wide variety used",
          },
          "Depth of Understanding": {
            score: 4.0,
            explanation: "Good understanding",
          },
          "Strategic Integration": {
            score: 4.4,
            explanation: "Strategic approach",
          },
        },
      },
      {
        name: "Quality and Design",
        score: 4.3,
        justification: "High quality with creative elements",
        subScores: {
          Creativity: { score: 4.2, explanation: "Creative approach" },
          Originality: { score: 4.1, explanation: "Original concept" },
          Polish: { score: 4.6, explanation: "Well-polished" },
        },
      },
    ],
    finalScore: 4.2,
    finalScoreExplanation: "Average of all three criteria scores",
  },
  hackathonSpecificAdvice: {
    categoryOptimization: ["Focus on legacy technology revival"],
    kiroIntegrationTips: ["Utilize more Kiro automation features"],
    competitionStrategy: ["Highlight unique value proposition"],
  },
  competitors: [],
  nextSteps: [
    {
      title: "Enhance UI Design",
      description: "Improve the user interface polish",
    },
  ],
  improvementSuggestions: [
    {
      title: "Legacy Integration",
      description: "Focus more on legacy technology integration",
    },
  ],
};

describe("Hackathon Evaluation Workflow E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (analyzeHackathonProject as jest.Mock).mockResolvedValue(mockAnalysis);
    (saveHackathonAnalysis as jest.Mock).mockResolvedValue({
      data: { id: "saved-analysis-123" },
      error: null,
    });
  });

  it("completes full evaluation workflow from submission to results", async () => {
    render(<KiroweenAnalyzerView />);

    // Step 1: Fill out the project submission form
    const descriptionField = screen.getByLabelText(/project description/i);

    fireEvent.change(descriptionField, {
      target: {
        value:
          "A revolutionary project that revives legacy COBOL systems with modern web interfaces using AI-powered translation",
      },
    });

    // Kiro usage field removed from form

    // Step 2: Submit the form for analysis
    const analyzeButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(analyzeButton);

    // Step 3: Wait for loading state
    expect(screen.getByTestId("spooky-loader")).toBeInTheDocument();

    // Step 4: Wait for analysis results to appear
    await waitFor(() => {
      expect(screen.getByText("4.2")).toBeInTheDocument();
    });

    // Step 5: Verify all analysis sections are displayed
    expect(screen.getByText(/viability summary/i)).toBeInTheDocument();
    expect(screen.getByText(/category analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/criteria breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/resurrection/i)).toBeInTheDocument();
    expect(screen.getByText(/potential value/i)).toBeInTheDocument();

    // Step 6: Test refinement suggestion functionality
    const suggestionButton = screen.getByText(/legacy integration/i);
    fireEvent.click(suggestionButton);

    // Verify suggestion was applied to description
    await waitFor(() => {
      expect(descriptionField).toHaveValue(
        expect.stringContaining("Legacy Integration")
      );
    });

    // Step 7: Test save functionality
    const saveButton = screen.getByRole("button", { name: /save analysis/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveHackathonAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          projectDescription: expect.stringContaining("Legacy Integration"),
          analysis: mockAnalysis,
        })
      );
    });

    // Verify save success message
    expect(
      screen.getByText(/analysis saved successfully/i)
    ).toBeInTheDocument();
  });

  it("handles analysis errors gracefully", async () => {
    (analyzeHackathonProject as jest.Mock).mockRejectedValue(
      new Error("Analysis service unavailable")
    );

    render(<KiroweenAnalyzerView />);

    // Fill out form
    const descriptionField = screen.getByLabelText(/project description/i);

    fireEvent.change(descriptionField, {
      target: {
        value:
          "Test project description that meets minimum length requirements",
      },
    });
    // Kiro usage field removed from form

    // Submit form
    const analyzeButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(analyzeButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId("spooky-error")).toBeInTheDocument();
      expect(
        screen.getByText(/analysis service unavailable/i)
      ).toBeInTheDocument();
    });

    // Verify retry button is available
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("validates form before submission", async () => {
    render(<KiroweenAnalyzerView />);

    // Try to submit empty form
    const analyzeButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(analyzeButton);

    // Verify validation errors appear
    expect(
      screen.getByText(/project description is required/i)
    ).toBeInTheDocument();
    // No Kiro usage validation anymore

    // Verify analysis was not called
    expect(analyzeHackathonProject).not.toHaveBeenCalled();
  });

  it("allows re-evaluation after refinement", async () => {
    render(<KiroweenAnalyzerView />);

    // Initial submission
    const descriptionField = screen.getByLabelText(/project description/i);

    fireEvent.change(descriptionField, {
      target: {
        value: "Initial project description that meets minimum requirements",
      },
    });
    // Kiro usage field removed from form

    const analyzeButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText("4.2")).toBeInTheDocument();
    });

    // Apply a refinement suggestion
    const suggestionButton = screen.getByText(/legacy integration/i);
    fireEvent.click(suggestionButton);

    // Re-analyze with refined description
    fireEvent.click(analyzeButton);

    // Verify second analysis call
    await waitFor(() => {
      expect(analyzeHackathonProject).toHaveBeenCalledTimes(2);
    });

    // Verify the second call includes the refined description
    const secondCall = (analyzeHackathonProject as jest.Mock).mock.calls[1];
    expect(secondCall[0].description).toContain("Legacy Integration");
  });

  it("handles save errors gracefully", async () => {
    (saveHackathonAnalysis as jest.Mock).mockResolvedValue({
      data: null,
      error: "Failed to save analysis",
    });

    render(<KiroweenAnalyzerView />);

    // Complete analysis workflow
    const descriptionField = screen.getByLabelText(/project description/i);

    fireEvent.change(descriptionField, {
      target: { value: "Test project description that meets requirements" },
    });
    // Kiro usage field removed from form

    const analyzeButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText("4.2")).toBeInTheDocument();
    });

    // Try to save
    const saveButton = screen.getByRole("button", { name: /save analysis/i });
    fireEvent.click(saveButton);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/failed to save analysis/i)).toBeInTheDocument();
    });
  });
});
