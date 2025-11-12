import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import InsufficientCreditsError from "../InsufficientCreditsError";
import { LocaleProvider } from "@/features/locale/context/LocaleContext";

// Mock the LocaleContext
const MockLocaleProvider = ({ children }: { children: React.ReactNode }) => {
  return <LocaleProvider>{children}</LocaleProvider>;
};

describe("InsufficientCreditsError", () => {
  describe("Rendering", () => {
    it("should render the component with error message", () => {
      render(
        <MockLocaleProvider>
          <InsufficientCreditsError credits={0} />
        </MockLocaleProvider>
      );

      expect(
        screen.getByTestId("insufficient-credits-error")
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should display the correct credit count in message", () => {
      render(
        <MockLocaleProvider>
          <InsufficientCreditsError credits={0} />
        </MockLocaleProvider>
      );

      expect(screen.getByText(/0 credits/i)).toBeInTheDocument();
    });

    it("should display get more credits button", () => {
      render(
        <MockLocaleProvider>
          <InsufficientCreditsError credits={0} />
        </MockLocaleProvider>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("should call onGetMoreCredits when button is clicked", () => {
      const mockCallback = vi.fn();

      render(
        <MockLocaleProvider>
          <InsufficientCreditsError
            credits={0}
            onGetMoreCredits={mockCallback}
          />
        </MockLocaleProvider>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should handle missing onGetMoreCredits callback gracefully", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(
        <MockLocaleProvider>
          <InsufficientCreditsError credits={0} />
        </MockLocaleProvider>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(consoleSpy).toHaveBeenCalledWith("Get more credits clicked");
      consoleSpy.mockRestore();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(
        <MockLocaleProvider>
          <InsufficientCreditsError credits={0} />
        </MockLocaleProvider>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
    });

    it("should have accessible button label", () => {
      render(
        <MockLocaleProvider>
          <InsufficientCreditsError credits={0} />
        </MockLocaleProvider>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label");
    });
  });
});
