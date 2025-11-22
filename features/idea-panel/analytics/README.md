# Idea Panel Analytics Tracking

This module provides comprehensive analytics tracking for the Idea Panel feature using PostHog.

## Overview

The Idea Panel analytics tracking captures user interactions and behaviors within the Idea Panel interface, providing insights into how users manage their ideas, documents, and project workflows.

## Tracked Events

### 1. Idea Panel View (`idea_panel_viewed`)

Tracks when a user opens an Idea Panel.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `idea_source`: How the idea was created (`manual` or `frankenstein`)
- `project_status`: Current project status (`idea`, `in_progress`, `completed`, `archived`)
- `document_count`: Number of documents associated with the idea
- `has_notes`: Whether the idea has notes
- `tag_count`: Number of tags on the idea
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackIdeaPanelView } from "@/features/idea-panel/analytics";

trackIdeaPanelView({
  ideaId: "uuid",
  ideaSource: "manual",
  projectStatus: "idea",
  documentCount: 2,
  hasNotes: true,
  tagCount: 3,
});
```

### 2. Status Update (`idea_status_updated`)

Tracks when a user changes the project status of an idea.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `previous_status`: Status before the update
- `new_status`: Status after the update
- `idea_source`: How the idea was created
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackStatusUpdate } from "@/features/idea-panel/analytics";

trackStatusUpdate({
  ideaId: "uuid",
  previousStatus: "idea",
  newStatus: "in_progress",
  ideaSource: "manual",
});
```

### 3. Notes Save (`idea_notes_saved`)

Tracks when a user saves notes for an idea.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `notes_length`: Length of the saved notes in characters
- `had_previous_notes`: Whether the idea had notes before this save
- `idea_source`: How the idea was created
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackNotesSave } from "@/features/idea-panel/analytics";

trackNotesSave({
  ideaId: "uuid",
  notesLength: 150,
  hadPreviousNotes: false,
  ideaSource: "manual",
});
```

### 4. Tags Management (`idea_tags_managed`)

Tracks when a user manages tags (add, remove, or save).

**Properties:**

- `idea_id`: Unique identifier of the idea
- `action`: Type of action (`add`, `remove`, `save`)
- `tag_count`: Current number of tags
- `previous_tag_count`: Number of tags before the action (optional)
- `idea_source`: How the idea was created
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackTagsManagement } from "@/features/idea-panel/analytics";

trackTagsManagement({
  ideaId: "uuid",
  action: "save",
  tagCount: 5,
  previousTagCount: 3,
  ideaSource: "manual",
});
```

### 5. Document View (`idea_document_viewed`)

Tracks when a user expands or collapses a document in the panel.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `document_id`: Unique identifier of the document
- `document_type`: Type of document (`startup_analysis` or `hackathon_analysis`)
- `action`: Action performed (`expand` or `collapse`)
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackDocumentView } from "@/features/idea-panel/analytics";

trackDocumentView({
  ideaId: "uuid",
  documentId: "doc-uuid",
  documentType: "startup_analysis",
  action: "expand",
});
```

### 6. Analyze Button Click (`idea_analyze_clicked`)

Tracks when a user clicks the Analyze button to create a new analysis.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `analysis_type`: Type of analysis selected (`startup` or `hackathon`)
- `idea_source`: How the idea was created
- `existing_document_count`: Number of existing documents before creating new one
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackAnalyzeButtonClick } from "@/features/idea-panel/analytics";

trackAnalyzeButtonClick({
  ideaId: "uuid",
  analysisType: "startup",
  ideaSource: "frankenstein",
  existingDocumentCount: 1,
});
```

## Implementation Details

### PostHog Integration

All tracking functions use the PostHog client from `posthog-js`. The tracking module:

1. Checks if PostHog is available and loaded before tracking
2. Logs events to console for debugging (can be removed in production)
3. Handles errors gracefully without breaking the user experience
4. Includes timestamps for all events

### Error Handling

The tracking functions are designed to fail silently. If PostHog is not available or an error occurs during tracking, the functions will:

1. Log the error to the console
2. Continue execution without throwing
3. Not impact the user experience

### Testing

Unit tests are provided in `__tests__/tracking.test.ts` to verify:

- Correct event names are used
- Properties are properly formatted
- PostHog capture is called with correct arguments
- Graceful handling when PostHog is not available

## Analytics Insights

This tracking enables analysis of:

1. **Panel Usage**: How often users view and interact with the Idea Panel
2. **Project Workflow**: How ideas progress through different statuses
3. **Documentation Patterns**: How users document their ideas with notes and tags
4. **Analysis Behavior**: Which types of analyses users prefer and when they create them
5. **Engagement Metrics**: Which features are most used and which need improvement

## Requirements Coverage

This implementation satisfies the following requirements from the Idea Panel spec:

- **Requirement 1**: Track idea panel opens
- **Requirement 3**: Track status updates
- **Requirement 4**: Track notes saves
- **Requirement 5**: Track tags management
- **Requirement 2**: Track document views
- **Requirement 10**: Track analyze button clicks

All requirements for observability are covered.
