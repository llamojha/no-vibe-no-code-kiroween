import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectSubmissionForm from "../ProjectSubmissionForm";
import { ProjectSubmission } from "@/lib/types";

const mockSubmission: ProjectSubmission = {
  description: "",
  supportingMaterials: {},
};

const mockProps = {
  submission: mockSubmission,
  onSubmissionChange: jest.fn(),
  onAnalyze: jest.fn(),
  isLoading: false,
};

describe("ProjectSubmissionForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form elements correctly", () => {
    render(<ProjectSubmissionForm {...mockProps} />);

    expect(screen.getByLabelText(/project description/i)).toBeInTheDocument();
    // Category and Kiro usage fields have been removed
    expect(
      screen.getByRole("button", { name: /analyze my project/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", () => {
    render(<ProjectSubmissionForm {...mockProps} />);

    const submitButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/project description is required/i)
    ).toBeInTheDocument();
    // No Kiro usage validation anymore
  });

  it("calls onSubmissionChange when form fields are updated", () => {
    render(<ProjectSubmissionForm {...mockProps} />);

    const descriptionField = screen.getByLabelText(/project description/i);
    fireEvent.change(descriptionField, {
      target: { value: "Test project description" },
    });

    expect(mockProps.onSubmissionChange).toHaveBeenCalledWith({
      ...mockSubmission,
      description: "Test project description",
    });
  });

  // Kiro usage field removed

  it("calls onAnalyze when form is valid and submitted", async () => {
    const validSubmission = {
      ...mockSubmission,
      description: "Valid project description that is sufficiently long to pass validation with more than 50 characters.",
    };

    render(
      <ProjectSubmissionForm {...mockProps} submission={validSubmission} />
    );

    const submitButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onAnalyze).toHaveBeenCalled();
    });
  });

  it("disables submit button when loading", () => {
    render(<ProjectSubmissionForm {...mockProps} isLoading={true} />);

    const submitButton = screen.getByRole("button", {
      name: /analyzing/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("shows loading state correctly", () => {
    render(<ProjectSubmissionForm {...mockProps} isLoading={true} />);

    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
  });

  it("validates minimum description length", () => {
    const shortSubmission = {
      ...mockSubmission,
      description: "Too short",
    };

    render(
      <ProjectSubmissionForm {...mockProps} submission={shortSubmission} />
    );

    const submitButton = screen.getByRole("button", {
      name: /analyze my project/i,
    });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/project description must be at least/i)
    ).toBeInTheDocument();
  });

  // Minimum Kiro usage validation removed
});
