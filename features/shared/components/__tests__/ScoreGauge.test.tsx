import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ScoreGauge } from "../ScoreGauge";

describe("ScoreGauge", () => {
  describe("Score Display", () => {
    it("should display score value with one decimal place formatting", () => {
      render(<ScoreGauge score={4.2} />);
      expect(screen.getByTestId("score-value")).toHaveTextContent("4.2");
    });

    it('should display "—" for zero score', () => {
      render(<ScoreGauge score={0} />);
      expect(screen.getByTestId("score-value")).toHaveTextContent("—");
    });

    it("should handle invalid scores gracefully (NaN)", () => {
      render(<ScoreGauge score={NaN} />);
      expect(screen.getByTestId("score-value")).toHaveTextContent("—");
    });

    it("should handle invalid scores gracefully (undefined)", () => {
      render(<ScoreGauge score={undefined as any} />);
      expect(screen.getByTestId("score-value")).toHaveTextContent("—");
    });

    it("should handle invalid scores gracefully (null)", () => {
      render(<ScoreGauge score={null as any} />);
      expect(screen.getByTestId("score-value")).toHaveTextContent("—");
    });

    it("should display data-testid attribute", () => {
      render(<ScoreGauge score={3.5} />);
      expect(screen.getByTestId("score-value")).toBeInTheDocument();
    });
  });

  describe("Arc Fill Calculation", () => {
    it("should fill completely at maximum score (stroke-dasharray: 188.5 188.5)", () => {
      const { container } = render(<ScoreGauge score={5.0} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.getAttribute("stroke-dasharray")).toBe("188.5 188.5");
    });

    it("should fill 50% at mid score (stroke-dasharray: 94.25 188.5)", () => {
      const { container } = render(<ScoreGauge score={2.5} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.getAttribute("stroke-dasharray")).toBe("94.25 188.5");
    });

    it("should fill 0% at zero score (stroke-dasharray: 0 188.5)", () => {
      const { container } = render(<ScoreGauge score={0} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.getAttribute("stroke-dasharray")).toBe("0 188.5");
    });
  });

  describe("Color Thresholds", () => {
    it("should apply green color for excellent scores (≥4.0)", () => {
      const { container } = render(<ScoreGauge score={4.5} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-green-400")).toBe(true);
    });

    it("should apply green color at threshold boundary (4.0)", () => {
      const { container } = render(<ScoreGauge score={4.0} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-green-400")).toBe(true);
    });

    it("should apply yellow color for good scores (≥3.5)", () => {
      const { container } = render(<ScoreGauge score={3.7} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-yellow-400")).toBe(true);
    });

    it("should apply yellow color at threshold boundary (3.5)", () => {
      const { container } = render(<ScoreGauge score={3.5} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-yellow-400")).toBe(true);
    });

    it("should apply orange color for fair scores (≥2.5)", () => {
      const { container } = render(<ScoreGauge score={3.0} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-orange-400")).toBe(true);
    });

    it("should apply orange color at threshold boundary (2.5)", () => {
      const { container } = render(<ScoreGauge score={2.5} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-orange-400")).toBe(true);
    });

    it("should apply red color for poor scores (<2.5)", () => {
      const { container } = render(<ScoreGauge score={2.0} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-red-400")).toBe(true);
    });

    it("should apply red color for very low scores", () => {
      const { container } = render(<ScoreGauge score={0.5} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-red-400")).toBe(true);
    });
  });

  describe("Customization", () => {
    it("should accept custom size prop", () => {
      const { container } = render(<ScoreGauge score={3.5} size={200} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.width).toBe("200px");
      expect(wrapper.style.height).toBe("200px");
    });

    it("should use default size when not specified", () => {
      const { container } = render(<ScoreGauge score={3.5} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.width).toBe("160px");
      expect(wrapper.style.height).toBe("160px");
    });

    it("should hide value when showValue is false", () => {
      render(<ScoreGauge score={4.0} showValue={false} />);
      expect(screen.queryByTestId("score-value")).not.toBeInTheDocument();
    });

    it("should show value by default", () => {
      render(<ScoreGauge score={4.0} />);
      expect(screen.getByTestId("score-value")).toBeInTheDocument();
    });

    it("should apply custom color overrides for excellent scores", () => {
      const { container } = render(
        <ScoreGauge score={4.5} colorOverrides={{ excellent: "blue-500" }} />
      );
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-blue-500")).toBe(true);
    });

    it("should apply custom color overrides for good scores", () => {
      const { container } = render(
        <ScoreGauge score={3.7} colorOverrides={{ good: "purple-500" }} />
      );
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-purple-500")).toBe(true);
    });

    it("should apply custom color overrides for fair scores", () => {
      const { container } = render(
        <ScoreGauge score={3.0} colorOverrides={{ fair: "pink-500" }} />
      );
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-pink-500")).toBe(true);
    });

    it("should apply custom color overrides for poor scores", () => {
      const { container } = render(
        <ScoreGauge score={2.0} colorOverrides={{ poor: "gray-500" }} />
      );
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.classList.contains("stroke-gray-500")).toBe(true);
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ScoreGauge score={3.5} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains("custom-class")).toBe(true);
    });
  });

  describe("SVG Structure", () => {
    it("should render background circles", () => {
      const { container } = render(<ScoreGauge score={3.5} />);
      const circles = container.querySelectorAll("circle");
      expect(circles).toHaveLength(2);
      expect(circles[0].getAttribute("r")).toBe("54");
      expect(circles[1].getAttribute("r")).toBe("40");
    });

    it("should render tick marks", () => {
      const { container } = render(<ScoreGauge score={3.5} />);
      const tickMarks = container.querySelectorAll("line");
      expect(tickMarks).toHaveLength(5); // 0%, 25%, 50%, 75%, 100%
    });

    it("should render background arc path", () => {
      const { container } = render(<ScoreGauge score={3.5} />);
      const paths = container.querySelectorAll("path");
      expect(paths).toHaveLength(2); // Background arc and filled arc
      expect(paths[0].getAttribute("d")).toBe(
        "M 30 90 A 42.42 42.42 0 1 1 90 90"
      );
    });

    it("should render filled arc path", () => {
      const { container } = render(<ScoreGauge score={3.5} />);
      const paths = container.querySelectorAll("path");
      expect(paths[1].getAttribute("d")).toBe(
        "M 30 90 A 42.42 42.42 0 1 1 90 90"
      );
    });
  });

  describe("Score Clamping", () => {
    it("should clamp scores above 5 to 5", () => {
      const { container } = render(<ScoreGauge score={7.5} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.getAttribute("stroke-dasharray")).toBe("188.5 188.5");
      expect(screen.getByTestId("score-value")).toHaveTextContent("5.0");
    });

    it("should clamp negative scores to 0", () => {
      const { container } = render(<ScoreGauge score={-2.5} />);
      const filledArc = container.querySelector(
        'path[stroke-dasharray]:not([stroke="rgba(255,255,255,0.1)"])'
      );
      expect(filledArc?.getAttribute("stroke-dasharray")).toBe("0 188.5");
      expect(screen.getByTestId("score-value")).toHaveTextContent("—");
    });
  });
});
