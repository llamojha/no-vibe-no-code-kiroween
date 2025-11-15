import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CreditCounter } from "../CreditCounter";
import { UserTier } from "@/lib/types";

describe("CreditCounter", () => {
  describe("Credit Display", () => {
    it("should display numeric credit count for free tier users", () => {
      render(<CreditCounter credits={3} tier="free" />);
      expect(screen.getByTestId("credit-amount")).toHaveTextContent("3");
    });

    it("should display numeric credit count for paid tier users", () => {
      render(<CreditCounter credits={5} tier="paid" />);
      expect(screen.getByTestId("credit-amount")).toHaveTextContent("5");
    });

    it("should display numeric credit count for admin tier users", () => {
      render(<CreditCounter credits={3} tier="admin" />);
      expect(screen.getByTestId("credit-amount")).toHaveTextContent("3");
    });

    it("should display zero credits correctly", () => {
      render(<CreditCounter credits={0} tier="free" />);
      expect(screen.getByTestId("credit-amount")).toHaveTextContent("0");
    });

    it("should display single credit correctly", () => {
      render(<CreditCounter credits={1} tier="free" />);
      expect(screen.getByTestId("credit-amount")).toHaveTextContent("1");
    });
  });

  describe("Warning Display", () => {
    it("should show warning when credits are 1", () => {
      render(<CreditCounter credits={1} tier="free" />);
      expect(screen.getByTestId("credit-warning")).toBeInTheDocument();
      expect(screen.getByTestId("credit-warning")).toHaveTextContent(
        "You're running low on credits!"
      );
    });

    it("should not show warning when credits are 2 or more", () => {
      render(<CreditCounter credits={2} tier="free" />);
      expect(screen.queryByTestId("credit-warning")).not.toBeInTheDocument();
    });

    it("should not show warning when credits are 0", () => {
      render(<CreditCounter credits={0} tier="free" />);
      expect(screen.queryByTestId("credit-warning")).not.toBeInTheDocument();
    });

    it("should show warning for admin users when credits are 1", () => {
      render(<CreditCounter credits={1} tier="admin" />);
      expect(screen.getByTestId("credit-warning")).toBeInTheDocument();
    });
  });

  describe("Out of Credits Display", () => {
    it("should show out of credits message when credits are 0", () => {
      render(<CreditCounter credits={0} tier="free" />);
      expect(screen.getByTestId("credit-empty")).toBeInTheDocument();
      expect(screen.getByText("You're out of credits")).toBeInTheDocument();
    });

    it("should show Get More Credits button when credits are 0", () => {
      render(<CreditCounter credits={0} tier="free" />);
      expect(screen.getByText("Get More Credits")).toBeInTheDocument();
    });

    it("should not show out of credits message when credits are greater than 0", () => {
      render(<CreditCounter credits={1} tier="free" />);
      expect(screen.queryByTestId("credit-empty")).not.toBeInTheDocument();
    });

    it("should show out of credits message for admin users when credits are 0", () => {
      render(<CreditCounter credits={0} tier="admin" />);
      expect(screen.getByTestId("credit-empty")).toBeInTheDocument();
    });
  });

  describe("Label Display", () => {
    it("should show 'credits remaining' label for free tier users", () => {
      render(<CreditCounter credits={3} tier="free" />);
      expect(screen.getByText("credits remaining")).toBeInTheDocument();
    });

    it("should show 'credits remaining' label for paid tier users", () => {
      render(<CreditCounter credits={5} tier="paid" />);
      expect(screen.getByText("credits remaining")).toBeInTheDocument();
    });

    it("should show 'credits remaining' label for admin tier users", () => {
      render(<CreditCounter credits={3} tier="admin" />);
      expect(screen.getByText("credits remaining")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply warning styling when credits are low", () => {
      const { container } = render(<CreditCounter credits={1} tier="free" />);
      const creditCounter = container.querySelector(".credit-counter");
      expect(creditCounter?.className).toContain("border-yellow-500");
      expect(creditCounter?.className).toContain("bg-yellow-500/10");
    });

    it("should apply error styling when credits are 0", () => {
      const { container } = render(<CreditCounter credits={0} tier="free" />);
      const creditCounter = container.querySelector(".credit-counter");
      expect(creditCounter?.className).toContain("border-red-500");
      expect(creditCounter?.className).toContain("bg-red-500/10");
    });

    it("should apply normal styling when credits are sufficient", () => {
      const { container } = render(<CreditCounter credits={3} tier="free" />);
      const creditCounter = container.querySelector(".credit-counter");
      expect(creditCounter?.className).toContain("border-purple-500/30");
      expect(creditCounter?.className).toContain("bg-purple-500/5");
    });

    it("should apply error styling for admin users when credits are 0", () => {
      const { container } = render(<CreditCounter credits={0} tier="admin" />);
      const creditCounter = container.querySelector(".credit-counter");
      expect(creditCounter?.className).toContain("border-red-500");
      expect(creditCounter?.className).toContain("bg-red-500/10");
    });
  });

  describe("Icon Display", () => {
    it("should display lightning bolt icon", () => {
      const { container } = render(<CreditCounter credits={3} tier="free" />);
      const icon = container.querySelector(".credit-icon");
      expect(icon).toHaveTextContent("⚡");
    });

    it("should apply warning color to icon when credits are low", () => {
      const { container } = render(<CreditCounter credits={1} tier="free" />);
      const icon = container.querySelector(".credit-icon");
      expect(icon?.className).toContain("text-yellow-400");
    });

    it("should apply error color to icon when credits are 0", () => {
      const { container } = render(<CreditCounter credits={0} tier="free" />);
      const icon = container.querySelector(".credit-icon");
      expect(icon?.className).toContain("text-red-400");
    });

    it("should apply normal color to icon when credits are sufficient", () => {
      const { container } = render(<CreditCounter credits={3} tier="free" />);
      const icon = container.querySelector(".credit-icon");
      expect(icon?.className).toContain("text-purple-400");
    });
  });

  describe("Edge Cases", () => {
    it("should handle large credit numbers", () => {
      render(<CreditCounter credits={999} tier="free" />);
      expect(screen.getByTestId("credit-amount")).toHaveTextContent("999");
    });

    it("should handle paid tier with 0 credits", () => {
      render(<CreditCounter credits={0} tier="paid" />);
      expect(screen.getByTestId("credit-empty")).toBeInTheDocument();
    });

    it("should handle paid tier with 1 credit", () => {
      render(<CreditCounter credits={1} tier="paid" />);
      expect(screen.getByTestId("credit-warning")).toBeInTheDocument();
    });
  });

  describe("User Email Display", () => {
    it("should display user email when provided", () => {
      render(
        <CreditCounter credits={5} tier="free" userEmail="user@example.com" />
      );
      expect(screen.getByTestId("user-email")).toBeInTheDocument();
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "Logged in as user@example.com"
      );
    });

    it("should not display user email when not provided", () => {
      render(<CreditCounter credits={5} tier="free" />);
      expect(screen.queryByTestId("user-email")).not.toBeInTheDocument();
    });

    it("should display user email with warning state", () => {
      render(
        <CreditCounter credits={1} tier="free" userEmail="user@example.com" />
      );
      expect(screen.getByTestId("user-email")).toBeInTheDocument();
      expect(screen.getByTestId("credit-warning")).toBeInTheDocument();
    });

    it("should display user email with out of credits state", () => {
      render(
        <CreditCounter credits={0} tier="free" userEmail="user@example.com" />
      );
      expect(screen.getByTestId("user-email")).toBeInTheDocument();
      expect(screen.getByTestId("credit-empty")).toBeInTheDocument();
    });

    it("should truncate long email addresses", () => {
      const { container } = render(
        <CreditCounter
          credits={5}
          tier="free"
          userEmail="verylongemailaddress@example.com"
        />
      );
      const emailElement = container.querySelector(
        '[data-testid="user-email"]'
      );
      expect(emailElement?.className).toContain("truncate");
    });
  });
});
