# PostHog Events Reference

This document lists all PostHog events captured in the application, organized by category.

## Event Naming Convention

Events use **snake_case** naming convention:

- ✅ `report_generated`
- ✅ `frankenstein_roll`
- ✅ `homepage_interaction`

## All Events Captured

### 1. Report Generation Events

#### `report_generated`

**Triggered when**: User generates any type of analysis report

**Properties**:

- `report_type`: `"startup"` | `"kiroween"` | `"frankenstein"`
- `idea_length`: number (length of input text)
- `user_id`: string (user UUID)
- `timestamp`: ISO 8601 timestamp

**Locations**:

- `features/analyzer/components/AnalyzerView.tsx` (startup analysis)
- `features/kiroween-analyzer/components/KiroweenAnalyzerView.tsx` (hackathon analysis)
- `features/doctor-frankenstein/components/DoctorFrankensteinView.tsx` (frankenstein ideas)

---

### 2. Dr. Frankenstein Events

#### `frankenstein_roll`

**Triggered when**: User clicks "Create Frankenstein" button to spin the slot machine

**Properties**:

- `mode`: `"aws"` | `"tech_companies"`
- `slot_count`: `3` | `4`
- `roll_count`: number (optional)
- `timestamp`: ISO 8601 timestamp

**Location**: `features/doctor-frankenstein/components/DoctorFrankensteinView.tsx`

#### `frankenstein_mode_select`

**Triggered when**: User switches between AWS Services and Tech Companies modes

**Properties**:

- `mode`: `"aws"` | `"tech_companies"`
- `timestamp`: ISO 8601 timestamp

**Location**: `features/doctor-frankenstein/components/DoctorFrankensteinView.tsx`

#### `frankenstein_slot_config`

**Triggered when**: User changes the number of slots (3 or 4)

**Properties**:

- `slot_count`: `3` | `4`
- `timestamp`: ISO 8601 timestamp

**Location**: `features/doctor-frankenstein/components/DoctorFrankensteinView.tsx`

---

### 3. Export Events

#### `report_exported`

**Triggered when**: User exports a report in any format

**Properties**:

- `format`: `"pdf"` | `"markdown"` | `"json"` | `"txt"`
- `report_type`: `"startup"` | `"kiroween"` | `"frankenstein"`
- `success`: boolean
- `error_message`: string (only if `success: false`)
- `timestamp`: ISO 8601 timestamp

**Locations**:

- `features/analyzer/components/ExportControl.tsx` (markdown, txt)
- `features/kiroween-analyzer/components/HackathonExportControl.tsx` (markdown, txt)
- `features/doctor-frankenstein/components/FrankensteinExportControl.tsx` (pdf, markdown, json)

---

### 4. Homepage Events

#### `homepage_interaction`

**Triggered when**: User toggles the animation mode on the homepage

**Properties**:

- `action`: `"animation_toggle"`
- `animation_state`: `"enabled"` | `"disabled"`
- `device_type`: `"mobile"` | `"tablet"` | `"desktop"`
- `timestamp`: ISO 8601 timestamp

**Location**: `features/home/components/AnimationToggle.tsx`

---

### 5. Idea Enhancement Events

#### `idea_enhancement`

**Triggered when**: User adds suggestions or modifies their idea

**Properties**:

- `action`: `"add_suggestion"` | `"modify_idea"`
- `analysis_type`: `"startup"` | `"kiroween"`
- `suggestion_length`: number (optional, for add_suggestion)
- `change_type`: string (optional, for modify_idea)
- `timestamp`: ISO 8601 timestamp

**Locations**:

- `features/analyzer/components/AnalyzerView.tsx` (add suggestion)
- `features/analyzer/components/IdeaInputForm.tsx` (modify idea)
- `features/kiroween-analyzer/components/KiroweenAnalyzerView.tsx` (add suggestion)
- `features/kiroween-analyzer/components/ProjectSubmissionForm.tsx` (modify idea)

---

### 6. Legacy Events (Using posthogClient)

These events use the legacy `posthogClient` instead of the new tracking utilities. Consider migrating them to use the tracking utilities for consistency.

#### `analysis_started`

**Triggered when**: User clicks "Analyze" button

**Properties**:

- `locale`: `"en"` | `"es"`
- `has_saved_id`: boolean

**Location**: `features/analyzer/components/AnalyzerView.tsx`

#### `analysis_saved`

**Triggered when**: User saves an analysis report

**Properties**:

- `analysis_id`: string (UUID)
- `locale`: `"en"` | `"es"`

**Location**: `features/analyzer/components/AnalyzerView.tsx`

#### `tts_generated`

**Triggered when**: Text-to-speech audio is generated

**Properties**:

- `locale`: `"en"` | `"es"`
- `length_chars`: number

**Location**: `features/analyzer/components/TTSPlayer.tsx`

#### `dashboard_view`

**Triggered when**: User views the main dashboard

**Properties**: None

**Location**: `features/dashboard/components/UserDashboard.tsx`

#### `hackathon_dashboard_view`

**Triggered when**: User views the hackathon dashboard

**Properties**: None

**Location**: `features/kiroween-analyzer/components/HackathonDashboard.tsx`

---

## Event Categories Summary

| Category              | Event Count | Events                                                                                              |
| --------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| **Report Generation** | 1           | `report_generated`                                                                                  |
| **Dr. Frankenstein**  | 3           | `frankenstein_roll`, `frankenstein_mode_select`, `frankenstein_slot_config`                         |
| **Export**            | 1           | `report_exported`                                                                                   |
| **Homepage**          | 1           | `homepage_interaction`                                                                              |
| **Idea Enhancement**  | 1           | `idea_enhancement`                                                                                  |
| **Legacy Events**     | 5           | `analysis_started`, `analysis_saved`, `tts_generated`, `dashboard_view`, `hackathon_dashboard_view` |
| **Total**             | **12**      |                                                                                                     |

---

## User Identification

### `posthog.identify()`

**Triggered when**: User logs in or session is restored

**Properties**:

- `email`: string
- `created_at`: ISO 8601 timestamp

**Location**: `features/auth/context/AuthContext.tsx`

---

## Server-Side Events

These events are captured on the server side using `posthog-node`.

### `server_analysis_request`

**Triggered when**: API receives an analysis request

**Properties**:

- `analysis_type`: `"startup"` | `"kiroween"` | `"frankenstein"`
- `timestamp`: ISO 8601 timestamp
- `source`: `"server"`

**Location**: `features/analytics/server-tracking.ts`

### `server_error`

**Triggered when**: Server encounters an error

**Properties**:

- `error_type`: string
- `error_message`: string
- `timestamp`: ISO 8601 timestamp
- `source`: `"server"`

**Location**: `features/analytics/server-tracking.ts`

---

## Property Naming Convention

Properties use **snake_case** naming:

- ✅ `report_type`
- ✅ `idea_length`
- ✅ `user_id`
- ✅ `animation_state`

---

## Migration Recommendations

### Legacy Events to Migrate

Consider creating tracking utility functions for these legacy events:

1. **`analysis_started`** → Create `trackAnalysisStarted()` in `tracking.ts`
2. **`analysis_saved`** → Create `trackAnalysisSaved()` in `tracking.ts`
3. **`tts_generated`** → Create `trackTTSGenerated()` in `tracking.ts`
4. **`dashboard_view`** → Create `trackDashboardView()` in `tracking.ts`
5. **`hackathon_dashboard_view`** → Create `trackHackathonDashboardView()` in `tracking.ts`

### Benefits of Migration

- **Type Safety**: TypeScript interfaces for all properties
- **Consistency**: All events use the same tracking pattern
- **Error Handling**: Centralized error handling
- **Testing**: Easier to test with utility functions
- **Documentation**: Self-documenting with JSDoc comments

---

## Testing Events

To test events in PostHog:

1. **Start dev server**: `npm run dev`
2. **Perform actions** that trigger events
3. **Check PostHog dashboard**: Events appear within 5-10 seconds
4. **Verify properties**: Click on events to see all properties

See `tests/integration/QUICK_START.md` for detailed testing instructions.

---

## Event Flow Examples

### Example 1: Complete Analysis Flow

```
1. User logs in
   → posthog.identify(userId, { email, created_at })

2. User navigates to analyzer
   → (no event)

3. User enters idea and clicks "Analyze"
   → capture("analysis_started", { locale, has_saved_id })

4. Analysis completes
   → capture("report_generated", { report_type: "startup", idea_length, user_id })

5. User clicks "Save Report"
   → capture("analysis_saved", { analysis_id, locale })

6. User clicks "Export as Markdown"
   → capture("report_exported", { format: "markdown", report_type: "startup", success: true })
```

### Example 2: Dr. Frankenstein Flow

```
1. User navigates to /doctor-frankenstein
   → (no event)

2. User switches to AWS mode
   → capture("frankenstein_mode_select", { mode: "aws" })

3. User changes to 3 slots
   → capture("frankenstein_slot_config", { slot_count: 3 })

4. User clicks "Create Frankenstein"
   → capture("frankenstein_roll", { mode: "aws", slot_count: 3 })

5. User accepts combination and generates idea
   → capture("report_generated", { report_type: "frankenstein", idea_length, user_id })

6. User exports as PDF
   → capture("report_exported", { format: "pdf", report_type: "frankenstein", success: true })
```

---

## PostHog Dashboard Queries

### Most Popular Report Types

```
Event: report_generated
Group by: report_type
```

### Export Success Rate

```
Event: report_exported
Filter: success = true vs false
```

### Dr. Frankenstein Mode Preference

```
Event: frankenstein_mode_select
Group by: mode
```

### Animation Toggle Usage

```
Event: homepage_interaction
Filter: action = "animation_toggle"
Group by: animation_state
```

---

**Last Updated**: November 12, 2025
**Total Events**: 12 unique event names
**Integration Status**: ✅ Complete
