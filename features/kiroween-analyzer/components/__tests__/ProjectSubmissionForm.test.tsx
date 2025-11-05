import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectSubmissionForm from "../ProjectSubmissionForm";
import { ProjectSubmission } from "@/lib/types";

const mockSubmission: ProjectSubmission = {
  description: "",
  selectedCategory: "resurrection",
  kiroUsage: "",
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
    expect(screen.getByText(/competition category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/how you used kiro/i)).toBeInTheDocument();
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
    expect(
      screen.getByText(/please explain how you used kiro/i)
    ).toBeInTheDocument();
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
});
