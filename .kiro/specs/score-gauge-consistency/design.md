# Design Document

## Overview

This design addresses the score gauge visualization inconsistency by creating a shared, reusable ScoreGauge component that uses full circle geometry with stroke-dasharray for consistent visualization. The solution creates a standardized circular gauge that can be used across all analyzers, ensuring visual consistency and maintainability.

## Architecture

### Component Location

```
features/
├── shared/
│   └── components/
│       ├── ScoreGauge.tsx           # New shared gauge component
│       └── __tests__/
│           └── ScoreGauge.test.tsx  # Component unit tests
├── analyzer/
│   └── components/
│       ├── AnalysisDisplay.tsx      # Updated to use ScoreGauge
│       └── __tests__/
│           └── AnalysisDisplay.test.tsx  # Integration tests
└── kiroween-analyzer/
    └── components/
        ├── HackathonAnalysisDisplay.tsx  # Updated to use ScoreGauge
        └── __tests__/
            └── HackathonAnalysisDisplay.test.tsx  # Integration tests
```

### Design Principles

1. **Single Source of Truth**: One gauge component eliminates divergent implementations
2. **Circle-Based Geometry**: Use SVG circle with stroke-dasharray for simple, reliable rendering
3. **Configurable Defaults**: Sensible defaults with override capability for flexibility
4. **Zero Business Logic**: Pure presentation component with no domain concerns
5. **Features Layer Only**: No changes to domain, application, or infrastructure layers

## Components and Interfaces

### 1. ScoreGauge Component

**Purpose**: Reusable circular gauge visualization for 0-5 scores with color-coded feedback

**Props Interface**:

```typescript
interface ScoreGaugeProps {
  score: number; // Score value (0-5)
  size?: number; // Container size in pixels (default: 160)
  showValue?: boolean; // Display score text (default: true)
  className?: string; // Additional CSS classes
  colorOverrides?: {
    // Optional color overrides
    excellent?: string; // ≥4.0 (default: green-400)
    good?: string; // ≥3.5 (default: yellow-400)
    fair?: string; // ≥2.5 (default: orange-400)
    poor?: string; // <2.5 (default: red-400)
  };
}
```

**Implementation Structure**:

```typescript
export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 160,
  showValue = true,
  className = "",
  colorOverrides = {},
}) => {
  // Validate and normalize score
  const validScore =
    typeof score === "number" && !isNaN(score)
      ? Math.max(0, Math.min(5, score))
      : 0;

  // Calculate fill percentage
  const percentage = (validScore / 5) * 100;

  // Determine color based on thresholds
  const getColorClass = (type: "stroke" | "text") => {
    const prefix = type === "stroke" ? "stroke-" : "text-";
    if (validScore >= 4)
      return `${prefix}${colorOverrides.excellent || "green-400"}`;
    if (validScore >= 3.5)
      return `${prefix}${colorOverrides.good || "yellow-400"}`;
    if (validScore >= 2.5)
      return `${prefix}${colorOverrides.fair || "orange-400"}`;
    return `${prefix}${colorOverrides.poor || "red-400"}`;
  };

  // Full circle gauge: circumference = 2 * π * r
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${
    (percentage / 100) * circumference
  } ${circumference}`;
  const strokeDashoffset = circumference / 4; // Start from top

  const fontSize = size / 4;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showValue && (
        <div
          data-testid="score-value"
          className={`absolute font-bold font-mono ${getColorClass("text")}`}
          style={{
            fontSize: `${fontSize}px`,
            textShadow: "0 0 10px currentColor",
          }}
        >
          {validScore === 0 ? "—" : validScore.toFixed(1)}
        </div>
      )}

      <svg className="w-full h-full" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />

        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={getColorClass("stroke")}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 1s ease-out",
            transform: "rotate(-90deg)",
            transformOrigin: "40px 40px",
          }}
        />
      </svg>
    </div>
  );
};
```

**Key Design Decisions**:

- **Circle-based geometry**: Uses SVG circle element with stroke-dasharray for reliable rendering
- **Percentage calculation**: `(score / 5) * 100` ensures 5.0 = 100% fill
- **Stroke-dasharray**: `${(percentage / 100) * circumference} ${circumference}` fills the circle proportionally
- **Score validation**: Clamps to 0-5 range, handles NaN/undefined gracefully
- **Responsive sizing**: SVG viewBox scales to any container size
- **Color thresholds**: Matches existing analyzer color coding exactly
- **Full circle visualization**: Complete 360° circle that fills clockwise from top

### 2. AnalysisDisplay Integration

**Current Implementation** (to be replaced):

```typescript
const FinalScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  // ... 50+ lines of gauge implementation
};
```

**New Implementation**:

```typescript
import { ScoreGauge } from "@/features/shared/components/ScoreGauge";

// In AnalysisDisplay component:
<ScoreGauge score={analysis.finalScore} size={192} />;
```

**Changes**:

- Remove `FinalScoreGauge` component definition (50+ lines)
- Import and use shared `ScoreGauge` component
- Pass `size={192}` to match current 48 (w-48 = 192px) sizing
- Maintain all surrounding layout and styling

### 3. HackathonAnalysisDisplay Integration

**Current Implementation** (to be replaced):

```typescript
const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  // ... circle-based implementation with gap at 100%
};
```

**New Implementation**:

```typescript
import { ScoreGauge } from "@/features/shared/components/ScoreGauge";

// In HackathonAnalysisDisplay component:
<ScoreGauge score={finalScore} size={160} />;
```

**Changes**:

- Remove local `ScoreGauge` component definition
- Import and use shared `ScoreGauge` component
- Pass `size={160}` to match current 40 (w-40 = 160px) sizing
- Maintain all surrounding layout and styling

## Data Models

### Score Value Object

```typescript
type Score = number; // 0-5 range, validated in component
```

### Color Configuration

```typescript
interface ColorThresholds {
  excellent: number; // 4.0
  good: number; // 3.5
  fair: number; // 2.5
  poor: number; // < 2.5
}

interface ColorClasses {
  excellent: string; // 'green-400'
  good: string; // 'yellow-400'
  fair: string; // 'orange-400'
  poor: string; // 'red-400'
}
```

## Error Handling

### Invalid Score Values

```typescript
// Handle undefined, null, NaN
const validScore =
  typeof score === "number" && !isNaN(score)
    ? Math.max(0, Math.min(5, score))
    : 0;

// Display placeholder for zero/invalid
{
  validScore === 0 ? "—" : validScore.toFixed(1);
}
```

### Missing Props

```typescript
// All optional props have sensible defaults
(size = 160), (showValue = true), (className = ""), (colorOverrides = {});
```

### SVG Rendering Issues

- Fallback to text-only display if SVG fails to render
- Maintain accessibility with ARIA labels
- Ensure contrast ratios meet WCAG standards

## Testing Strategy

### Unit Tests (ScoreGauge.test.tsx)

```typescript
describe("ScoreGauge", () => {
  describe("Score Display", () => {
    it("should display score value with one decimal place", () => {
      const { getByTestId } = render(<ScoreGauge score={4.2} />);
      expect(getByTestId("score-value")).toHaveTextContent("4.2");
    });

    it('should display "—" for zero score', () => {
      const { getByTestId } = render(<ScoreGauge score={0} />);
      expect(getByTestId("score-value")).toHaveTextContent("—");
    });

    it("should handle invalid scores gracefully", () => {
      const { getByTestId } = render(<ScoreGauge score={NaN} />);
      expect(getByTestId("score-value")).toHaveTextContent("—");
    });
  });

  describe("Arc Fill Calculation", () => {
    it("should fill completely at maximum score", () => {
      const { container } = render(<ScoreGauge score={5.0} />);
      const arc = container.querySelector("path[stroke-dasharray]");
      expect(arc?.getAttribute("stroke-dasharray")).toBe("188.5 188.5");
    });

    it("should fill 50% at mid score", () => {
      const { container } = render(<ScoreGauge score={2.5} />);
      const arc = container.querySelector("path[stroke-dasharray]");
      expect(arc?.getAttribute("stroke-dasharray")).toBe("94.25 188.5");
    });

    it("should fill 0% at zero score", () => {
      const { container } = render(<ScoreGauge score={0} />);
      const arc = container.querySelector("path[stroke-dasharray]");
      expect(arc?.getAttribute("stroke-dasharray")).toBe("0 188.5");
    });
  });

  describe("Color Thresholds", () => {
    it("should apply green color for excellent scores (≥4.0)", () => {
      const { container } = render(<ScoreGauge score={4.5} />);
      const arc = container.querySelector("path.stroke-green-400");
      expect(arc).toBeInTheDocument();
    });

    it("should apply yellow color for good scores (≥3.5)", () => {
      const { container } = render(<ScoreGauge score={3.7} />);
      const arc = container.querySelector("path.stroke-yellow-400");
      expect(arc).toBeInTheDocument();
    });

    it("should apply orange color for fair scores (≥2.5)", () => {
      const { container } = render(<ScoreGauge score={3.0} />);
      const arc = container.querySelector("path.stroke-orange-400");
      expect(arc).toBeInTheDocument();
    });

    it("should apply red color for poor scores (<2.5)", () => {
      const { container } = render(<ScoreGauge score={2.0} />);
      const arc = container.querySelector("path.stroke-red-400");
      expect(arc).toBeInTheDocument();
    });
  });

  describe("Customization", () => {
    it("should accept custom size prop", () => {
      const { container } = render(<ScoreGauge score={3.5} size={200} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.width).toBe("200px");
      expect(wrapper.style.height).toBe("200px");
    });

    it("should hide value when showValue is false", () => {
      const { queryByTestId } = render(
        <ScoreGauge score={4.0} showValue={false} />
      );
      expect(queryByTestId("score-value")).not.toBeInTheDocument();
    });

    it("should apply custom color overrides", () => {
      const { container } = render(
        <ScoreGauge score={4.5} colorOverrides={{ excellent: "blue-500" }} />
      );
      const arc = container.querySelector("path.stroke-blue-500");
      expect(arc).toBeInTheDocument();
    });
  });
});
```

### Integration Tests

**AnalysisDisplay.test.tsx**:

```typescript
it("should render ScoreGauge with correct score", () => {
  const analysis = { ...mockAnalysis, finalScore: 4.2 };
  const { getByTestId } = render(
    <AnalysisDisplay analysis={analysis} {...props} />
  );
  expect(getByTestId("score-value")).toHaveTextContent("4.2");
});
```

**HackathonAnalysisDisplay.test.tsx**:

```typescript
it("should render ScoreGauge with correct score", () => {
  const analysis = { ...mockHackathonAnalysis, finalScore: 3.8 };
  const { getByTestId } = render(
    <HackathonAnalysisDisplay analysis={analysis} {...props} />
  );
  expect(getByTestId("score-value")).toHaveTextContent("3.8");
});
```

### Visual Regression Testing

- Manual verification at scores: 0, 2.5, 4.0, 4.5, 5.0
- Verify complete fill at 5.0 with no visible gap
- Check responsive behavior on mobile (320px) and desktop (1920px)
- Verify smooth animation transitions
- Confirm color transitions at threshold boundaries

## Implementation Notes

### Migration Strategy

1. **Create shared component first**: Establish ScoreGauge in features/shared/components/
2. **Write comprehensive tests**: Ensure component works correctly in isolation
3. **Update Idea Analyzer**: Replace FinalScoreGauge with shared component
4. **Update Hackathon Analyzer**: Replace local ScoreGauge with shared component
5. **Run integration tests**: Verify both analyzers work correctly
6. **Manual verification**: Test at various scores in both analyzers

### Circle Geometry Explanation

The gauge uses a full circle with radius 32 units:

- **Center**: (40, 40) in an 80×80 viewBox
- **Radius**: 32 units
- **Circumference**: 2 × π × 32 ≈ 201.06 units
- **Start position**: Top of circle (12 o'clock)
- **Fill direction**: Clockwise

The circle is rotated -90° to start from the top, and stroke-dashoffset is set to circumference/4 to align the start position correctly.

### Stroke-Dasharray Calculation

```
Circumference = 2 × π × 32 ≈ 201.06 units
Percentage = (score / 5) * 100
Fill Length = (percentage / 100) * 201.06

Examples:
- Score 5.0: (5/5) * 100 = 100%, fill = 201.06 (complete circle)
- Score 2.5: (2.5/5) * 100 = 50%, fill = 100.53 (half circle)
- Score 0.0: (0/5) * 100 = 0%, fill = 0 (empty)
```

### Performance Considerations

- SVG rendering is hardware-accelerated
- CSS transitions are GPU-optimized
- Component is lightweight (~100 lines)
- No expensive calculations or re-renders
- Memoization not needed for this simple component

### Accessibility

- Maintain semantic HTML structure
- Ensure sufficient color contrast (WCAG AA)
- Add ARIA labels for screen readers
- Support keyboard navigation where applicable
- Test with screen readers (VoiceOver, NVDA)

### Future Enhancements

- Support for different score scales (0-10, 0-100)
- Animated score transitions
- Tooltip on hover with detailed breakdown
- Export as standalone package
- Storybook documentation
