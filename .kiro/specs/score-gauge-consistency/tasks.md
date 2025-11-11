# Implementation Plan

- [x] 1. Create shared ScoreGauge component

  - Create features/shared/components/ directory if it doesn't exist
  - Create ScoreGauge.tsx with TypeScript interface for props (score, size, showValue, className, colorOverrides)
  - Implement score validation and normalization (clamp to 0-5, handle NaN/undefined)
  - Implement percentage calculation: (validScore / 5) \* 100
  - Implement color threshold logic (≥4.0 green, ≥3.5 yellow, ≥2.5 orange, <2.5 red)
  - Create SVG structure with viewBox="0 0 80 80" for responsive scaling
  - Calculate circle circumference: 2 × π × radius (radius = 32)
  - Add background circle with radius 32 and light stroke
  - Add progress circle with stroke-dasharray: (percentage / 100) × circumference
  - Set stroke-dashoffset to circumference / 4 to start from top
  - Apply -90deg rotation to circle for clockwise fill from top
  - Add centered score text with conditional "—" for zero/invalid scores
  - Apply text shadow glow effect: textShadow: '0 0 10px currentColor'
  - Add 1s ease-out transition for stroke-dasharray animation
  - Export component with proper TypeScript types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Write ScoreGauge component tests

  - Create features/shared/components/**tests**/ScoreGauge.test.tsx
  - Write test for score display with one decimal place formatting
  - Write test for "—" display when score is 0
  - Write test for handling invalid scores (NaN, undefined, null)
  - Write test for complete fill at score 5.0 (stroke-dasharray fills entire circumference)
  - Write test for 50% fill at score 2.5 (stroke-dasharray fills half circumference)
  - Write test for 0% fill at score 0 (stroke-dasharray: "0 [circumference]")
  - Write test for green color class at score ≥4.0
  - Write test for yellow color class at score ≥3.5
  - Write test for orange color class at score ≥2.5
  - Write test for red color class at score <2.5
  - Write test for custom size prop application
  - Write test for showValue=false hiding score text
  - Write test for custom color overrides
  - Write test for data-testid="score-value" attribute presence
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Update AnalysisDisplay to use shared ScoreGauge

  - Import ScoreGauge from '@/features/shared/components/ScoreGauge'
  - Remove the FinalScoreGauge component definition (entire component, ~50 lines)
  - Replace <FinalScoreGauge score={analysis.finalScore} /> with <ScoreGauge score={analysis.finalScore} size={192} />
  - Verify surrounding layout and styling remain unchanged
  - Ensure data-testid attributes are preserved for existing tests
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 6.5_

- [x] 4. Update HackathonAnalysisDisplay to use shared ScoreGauge

  - Import ScoreGauge from '@/features/shared/components/ScoreGauge'
  - Remove the local ScoreGauge component definition (entire component)
  - Replace <ScoreGauge score={finalScore} /> with <ScoreGauge score={finalScore} size={160} />
  - Verify surrounding layout and styling remain unchanged
  - Ensure data-testid attributes are preserved for existing tests
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 6.5_

- [x] 5. Add integration tests for AnalysisDisplay

  - Update features/analyzer/components/**tests**/AnalysisDisplay.test.tsx
  - Add test to verify ScoreGauge renders with correct score prop
  - Add test to verify ScoreGauge renders with size={192}
  - Add test to verify gauge displays within full analysis context
  - Add test to verify no layout regressions in Final Score section
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 6. Add integration tests for HackathonAnalysisDisplay

  - Update features/kiroween-analyzer/components/**tests**/HackathonAnalysisDisplay.test.tsx
  - Add test to verify ScoreGauge renders with correct score prop
  - Add test to verify ScoreGauge renders with size={160}
  - Add test to verify gauge displays within full analysis context
  - Add test to verify no layout regressions in Final Score section
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 7. Manual verification and visual testing

  - Test Idea Analyzer gauge at scores: 0, 2.5, 4.0, 4.5, 5.0
  - Test Hackathon Analyzer gauge at scores: 0, 2.5, 4.0, 4.5, 5.0
  - Verify complete fill (no gap) at score 5.0 in both analyzers
  - Verify color transitions at thresholds: 2.5, 3.5, 4.0
  - Verify smooth animation when score changes
  - Test responsive behavior on mobile (320px width)
  - Test responsive behavior on desktop (1920px width)
  - Verify text shadow glow effect is visible
  - Verify tick marks are properly positioned
  - Load existing saved analyses to verify backward compatibility
  - _Requirements: 2.1, 3.3, 3.4, 3.5, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

- [x] 8. Update CategoryEvaluation to use shared ScoreGauge
  - Import ScoreGauge from '@/features/shared/components/ScoreGauge'
  - Remove the FitScoreGauge component definition (entire component)
  - Replace FitScoreGauge usage with ScoreGauge component
  - Convert 0-10 fitScore to 0-5 scale before passing to ScoreGauge: (fitScore / 2)
  - Pass size={96} to match current w-24 h-24 sizing (24 \* 4 = 96px)
  - Remove custom color prop since ScoreGauge handles color thresholds automatically
  - Verify gauge displays correctly within category evaluation cards
  - Ensure surrounding layout and styling remain unchanged
  - Test at various fit scores: 0, 5, 7, 8, 10 (which map to 0, 2.5, 3.5, 4.0, 5.0 on 0-5 scale)
  - _Requirements: 1.1, 2.1, 3.3, 3.4, 3.5, 6.5_
