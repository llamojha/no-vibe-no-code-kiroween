# Design Document

## Overview

The Unified Analyzer Improvements design focuses on creating a cohesive user experience across both the startup idea analyzer and Kiroween hackathon analyzer. The design introduces a background animation toggle on the home page, ensures equal prominence for both analyzer options, and consolidates all user analyses into a single dashboard with clear categorization.

The implementation leverages existing components and architecture while introducing minimal new components to achieve the unified experience. The design maintains the current functionality of both analyzers while improving navigation and organization.

## Architecture

### Component Changes Overview

The improvements focus on enhancing existing components rather than creating new architecture:

### Component Structure

The improvements follow the existing feature-based architecture with minimal additions:

```
features/
├── home/
│   ├── components/
│   │   ├── HomeHero.tsx (enhanced)
│   │   ├── BackgroundAnimation.tsx (enhanced)
│   │   └── AnimationToggle.tsx (new)
├── dashboard/
│   ├── components/
│   │   ├── UserDashboard.tsx (enhanced)
│   │   ├── AnalysisCard.tsx (enhanced)
│   │   └── AnalysisFilter.tsx (new)
└── shared/
    ├── components/
    │   └── AnalyzerButton.tsx (new)
    └── hooks/
        └── useAnimationPreference.tsx (new)
```

## Components and Interfaces

### 1. Enhanced Home Page with Animation Toggle

**Purpose**: Provide unified entry point with background animation options and equal analyzer prominence

**Key Features**:

- Toggle control for switching between normal and spooky background animations
- Two equally-sized analyzer buttons with consistent styling
- Persistent animation preference using local storage
- Smooth transitions between animation states

**Interface**:

```typescript
interface AnimationToggleProps {
  currentMode: "normal" | "spooky";
  onToggle: (mode: "normal" | "spooky") => void;
}

interface AnalyzerButtonProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  variant: "primary" | "secondary";
}

interface BackgroundAnimationProps {
  mode: "normal" | "spooky";
  className?: string;
}
```

### 2. Animation Toggle Component

**Purpose**: Allow users to switch between normal and spooky background animations

**Design Elements**:

- Toggle switch with clear visual indicators
- Icons representing normal (standard) and spooky (Halloween) modes
- Positioned prominently but not intrusively on the home page
- Smooth animation transitions when toggling

**Implementation Details**:

- Uses React state and localStorage for persistence
- Integrates with existing BackgroundAnimation component
- Provides accessibility support with proper ARIA labels

### 3. Equal Analyzer Buttons

**Purpose**: Present both analyzers with identical prominence and styling

**Design Specifications**:

- Identical button dimensions (e.g., 300px width, 200px height)
- Consistent typography, spacing, and visual hierarchy
- Clear icons and descriptions for each analyzer type
- Hover effects and interactive states
- Responsive design maintaining equal sizing across screen sizes

**Layout**:

- Side-by-side layout on desktop
- Stacked layout on mobile with maintained equal sizing
- Centered alignment with consistent spacing

### 4. Unified Dashboard

**Purpose**: Consolidate all user analyses into a single interface with clear categorization

**Key Features**:

- Single dashboard displaying both startup idea and hackathon analyses
- Category labels ('idea' and 'kiroween') on analysis cards
- Filtering system to view specific analysis types
- Consistent card design across both analysis types
- Unified actions (view, delete, share) for all analyses

**Interface**:

```typescript
interface UnifiedAnalysis {
  id: string;
  title: string;
  category: "idea" | "kiroween";
  createdAt: string;
  finalScore: number;
  summary: string;
  analysisType: "startup" | "hackathon";
}

interface AnalysisCardProps {
  analysis: UnifiedAnalysis;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

interface AnalysisFilterProps {
  currentFilter: "all" | "idea" | "kiroween";
  onFilterChange: (filter: "all" | "idea" | "kiroween") => void;
  counts: {
    total: number;
    idea: number;
    kiroween: number;
  };
}
```

### 5. Enhanced Analysis Cards

**Purpose**: Display analysis information with clear category identification

**Design Elements**:

- Category badge prominently displayed (colored differently for 'idea' vs 'kiroween')
- Consistent card layout regardless of analysis type
- Key metrics displayed (score, date, summary)
- Action buttons for view, delete, and share
- Visual indicators for analysis completion status

**Category Styling**:

- 'idea' category: Blue/teal color scheme matching startup theme
- 'kiroween' category: Orange/purple color scheme matching Halloween theme
- Clear typography and iconography for easy identification

## Data Models

### Enhanced Data Types

```typescript
// Extend existing types to support unified dashboard
interface UnifiedAnalysisRecord {
  id: string;
  userId: string;
  category: "idea" | "kiroween";
  analysisType: "startup" | "hackathon";
  title: string; // Derived from idea text or project description
  createdAt: string;
  finalScore: number;
  summary: string; // Brief summary for card display
  fullAnalysis: Analysis | HackathonAnalysis;
  audioBase64?: string | null;
}

// Animation preference storage
interface AnimationPreference {
  mode: "normal" | "spooky";
  lastUpdated: string;
}

// Dashboard filter state
interface DashboardState {
  filter: "all" | "idea" | "kiroween";
  sortBy: "date" | "score" | "title";
  sortOrder: "asc" | "desc";
}
```

### Database Schema Updates

```sql
-- No new tables needed, but views for unified dashboard
CREATE VIEW unified_analyses AS
SELECT
  id,
  user_id,
  'idea' as category,
  'startup' as analysis_type,
  SUBSTRING(idea, 1, 50) as title,
  created_at,
  (analysis->>'finalScore')::numeric as final_score,
  analysis->>'viabilitySummary' as summary,
  analysis,
  audio_base64
FROM saved_analyses
UNION ALL
SELECT
  id,
  user_id,
  'kiroween' as category,
  'hackathon' as analysis_type,
  SUBSTRING(project_description, 1, 50) as title,
  created_at,
  (analysis->>'finalScore')::numeric as final_score,
  analysis->>'viabilitySummary' as summary,
  analysis,
  audio_base64
FROM saved_hackathon_analyses;
```

## Error Handling

### Animation Toggle Errors

- **localStorage unavailable**: Graceful fallback to session-only preference
- **Animation rendering issues**: Fallback to static background
- **Performance issues**: Option to disable animations entirely

### Dashboard Loading Errors

- **Database connection issues**: Show cached analyses with sync indicator
- **Mixed analysis type errors**: Display partial results with error notification
- **Filter state corruption**: Reset to default 'all' filter with user notification

### Navigation Errors

- **Analyzer routing issues**: Fallback navigation with breadcrumb trail
- **State persistence errors**: Clear corrupted state and restart session
- **Cross-analyzer navigation**: Maintain user context across analyzer switches

## Testing Strategy

### Unit Tests

- Animation toggle functionality and persistence
- Dashboard filtering and sorting logic
- Analysis card rendering with different categories
- Button sizing and responsive behavior

### Integration Tests

- Home page navigation to both analyzers
- Dashboard data loading from both analysis types
- Animation state persistence across sessions
- Filter state management and URL synchronization

### Component Tests

- AnimationToggle component with different modes
- AnalyzerButton component with equal sizing
- AnalysisCard component with category indicators
- UserDashboard component with unified data

### End-to-End Tests

- Complete user flow from home page to analysis completion
- Dashboard filtering and analysis management
- Animation toggle persistence across browser sessions
- Cross-analyzer navigation maintaining user state

## Visual Design Specifications

### Home Page Layout

```
┌─────────────────────────────────────────┐
│  [Logo]              [Animation Toggle] │
│                                         │
│           Welcome Message               │
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Startup   │    │  Kiroween   │    │
│  │    Idea     │    │  Hackathon  │    │
│  │  Analyzer   │    │  Analyzer   │    │
│  │             │    │             │    │
│  │  [Icon]     │    │  [Icon]     │    │
│  │ Description │    │ Description │    │
│  └─────────────┘    └─────────────┘    │
│                                         │
│         [Background Animation]          │
└─────────────────────────────────────────┘
```

### Dashboard Layout

```
┌─────────────────────────────────────────┐
│  Dashboard                    [Profile] │
│                                         │
│  [All] [Ideas] [Kiroween]    [Sort ▼]  │
│                                         │
│  ┌─────────────┐ ┌─────────────┐       │
│  │ [idea] Card │ │[kiroween]   │       │
│  │ Title       │ │ Card Title  │       │
│  │ Score: 8.5  │ │ Score: 7.2  │       │
│  │ Date        │ │ Date        │       │
│  │ [View][Del] │ │ [View][Del] │       │
│  └─────────────┘ └─────────────┘       │
│                                         │
│  ┌─────────────┐ ┌─────────────┐       │
│  │ [idea] Card │ │ [idea] Card │       │
│  │ ...         │ │ ...         │       │
│  └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────┘
```

### Color Scheme

**Animation Toggle**:

- Normal mode indicator: Blue (#3B82F6)
- Spooky mode indicator: Orange (#F97316)
- Toggle background: Dark gray (#374151)

**Category Indicators**:

- 'idea' category: Teal (#14B8A6) with blue accent
- 'kiroween' category: Orange (#F97316) with purple accent
- Neutral elements: Consistent with existing design system

### Responsive Behavior

**Desktop (≥1024px)**:

- Side-by-side analyzer buttons (300px each)
- Dashboard grid layout (3-4 cards per row)
- Animation toggle in top-right corner

**Tablet (768px-1023px)**:

- Side-by-side analyzer buttons (250px each)
- Dashboard grid layout (2-3 cards per row)
- Animation toggle remains accessible

**Mobile (<768px)**:

- Stacked analyzer buttons (full width, equal height)
- Dashboard single column layout
- Animation toggle repositioned for mobile accessibility

## Performance Considerations

### Animation Optimization

- Use CSS transforms and GPU acceleration for smooth transitions
- Implement animation frame throttling for performance
- Provide reduced motion support for accessibility
- Lazy load complex 3D animations

### Dashboard Performance

- Implement virtual scrolling for large analysis lists
- Use React.memo for analysis card components
- Implement efficient filtering without full re-renders
- Cache dashboard state in localStorage

### State Management

- Use React Context for animation preference
- Implement efficient state updates for dashboard filters
- Minimize re-renders with proper dependency arrays
- Use React Query for server state management

## Accessibility Considerations

### Animation Toggle

- Provide clear labels and descriptions
- Support keyboard navigation
- Respect user's motion preferences
- Ensure sufficient color contrast

### Dashboard Navigation

- Implement proper focus management
- Provide screen reader announcements for filter changes
- Ensure keyboard accessibility for all actions
- Use semantic HTML for proper structure

### Visual Design

- Maintain WCAG 2.1 AA compliance
- Provide alternative text for decorative elements
- Ensure sufficient contrast ratios for category indicators
- Support high contrast mode preferences
