# Requirements Document

## Introduction

This specification defines the fix for the score gauge visualization inconsistency between the Idea Analyzer and Kiroween Hackathon Analyzer. Currently, the hackathon gauge doesn't fill completely at maximum score (5.0/5.0), creating visual confusion and undermining the achievement of a perfect score. The solution will create a shared gauge component to ensure visual consistency across both analyzers and prevent future inconsistencies.

## Glossary

- **Score Gauge**: A circular SVG visualization component that displays a score from 0 to 5 as a partially filled circle with color-coded feedback
- **Idea Analyzer**: The startup idea evaluation tool that uses a 0-5 scoring system
- **Kiroween Hackathon Analyzer**: The hackathon project evaluation tool that uses a 0-5 scoring system
- **Circle-Based Gauge**: An SVG circle element with stroke-dasharray that fills proportionally based on score percentage
- **Features Layer**: The UI layer in hexagonal architecture containing React components and client-side logic

## Requirements

### Requirement 1: Shared Score Gauge Component

**User Story:** As a developer, I want a single reusable ScoreGauge component, so that both analyzers display scores consistently and future gauge implementations don't diverge.

#### Acceptance Criteria

1. WHEN the ScoreGauge component is created, THE Features_Layer SHALL place it in features/shared/components/ScoreGauge.tsx
2. THE ScoreGauge component SHALL accept score (0-5), size, and optional color overrides as props
3. THE ScoreGauge component SHALL use circle-based geometry with stroke-dasharray for consistent rendering
4. THE ScoreGauge component SHALL display the score value centered within the gauge
5. THE ScoreGauge component SHALL apply color coding: green (≥4.0), yellow (≥3.5), orange (≥2.5), red (<2.5)

### Requirement 2: Complete Fill at Maximum Score

**User Story:** As a user viewing analysis results, I want the gauge to fill completely when a project receives a perfect 5.0 score, so that the visual representation accurately reflects the achievement.

#### Acceptance Criteria

1. WHEN the score equals 5.0, THE ScoreGauge component SHALL fill the entire visible circle completely
2. THE ScoreGauge component SHALL calculate stroke-dasharray as (score / 5) \* circumference where circumference = 2 × π × radius
3. THE ScoreGauge component SHALL use a circle element with radius 32 units for consistent geometry
4. THE ScoreGauge component SHALL animate the fill transition over 1 second with ease-out timing
5. THE ScoreGauge component SHALL maintain rounded stroke line caps for smooth appearance

### Requirement 3: Visual Consistency Across Analyzers

**User Story:** As a user, I want both analyzers to display scores identically, so that I can compare results across different analysis types without confusion.

#### Acceptance Criteria

1. WHEN AnalysisDisplay renders a gauge, THE Idea_Analyzer SHALL use the shared ScoreGauge component
2. WHEN HackathonAnalysisDisplay renders a gauge, THE Hackathon_Analyzer SHALL use the shared ScoreGauge component
3. THE ScoreGauge component SHALL maintain a 160px × 160px container size (w-40 h-40)
4. THE ScoreGauge component SHALL display the score with text shadow glow effect matching current styling
5. THE ScoreGauge component SHALL preserve all existing color thresholds and visual specifications

### Requirement 4: Component Testing

**User Story:** As a developer, I want comprehensive tests for the ScoreGauge component, so that future changes don't break the gauge behavior or visual consistency.

#### Acceptance Criteria

1. WHEN the ScoreGauge test suite runs, THE Test_System SHALL verify rendering at scores 0, 2.5, 4.0, 4.5, and 5.0
2. THE Test_System SHALL verify the gauge fills completely (no gap) when score equals 5.0
3. THE Test_System SHALL verify correct color classes are applied at each threshold (4.0, 3.5, 2.5)
4. THE Test_System SHALL verify the stroke-dasharray calculation produces correct arc fill percentages
5. THE Test_System SHALL verify the component accepts and applies custom size and color props

### Requirement 5: Integration Testing

**User Story:** As a developer, I want integration tests that verify both analyzers use the shared component correctly, so that the fix is validated in actual usage contexts.

#### Acceptance Criteria

1. WHEN AnalysisDisplay integration tests run, THE Test_System SHALL verify the ScoreGauge component renders with correct props
2. WHEN HackathonAnalysisDisplay integration tests run, THE Test_System SHALL verify the ScoreGauge component renders with correct props
3. THE Test_System SHALL verify gauge displays correctly within the full analysis display context
4. THE Test_System SHALL verify no visual regressions in existing analyzer layouts
5. THE Test_System SHALL verify responsive behavior on mobile viewport sizes

### Requirement 6: Backward Compatibility

**User Story:** As a user with existing saved analyses, I want my historical analysis results to display correctly with the new gauge, so that past work remains accessible and accurate.

#### Acceptance Criteria

1. WHEN existing analysis data is loaded, THE ScoreGauge component SHALL handle undefined or null scores gracefully
2. THE ScoreGauge component SHALL display "—" when score is 0 or invalid
3. THE ScoreGauge component SHALL validate score is between 0 and 5
4. THE ScoreGauge component SHALL format score display to one decimal place
5. THE ScoreGauge component SHALL maintain all existing data-testid attributes for test compatibility
