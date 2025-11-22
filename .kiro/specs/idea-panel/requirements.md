# Requirements Document

## Introduction

The Idea Panel feature introduces a new data model that separates **ideas** from **documents** (analyses). This enables users to manage ideas in a dedicated workspace, view all associated analyses, and track project status with notes and tags. The panel provides a foundation for future enhancements like PRDs, Design Docs, and Roadmaps.

This MVP focuses on:

- Extracting ideas from `saved_analyses` into a new `ideas` table
- Moving analyses to a new `documents` table
- Creating a panel interface to view and manage ideas
- Maintaining backward compatibility with existing `saved_analyses` table

## Glossary

- **Idea**: A startup concept or project idea, stored in the `ideas` table. Can be manually entered or generated via Doctor Frankenstein.
- **Idea Panel**: A dedicated full-screen interface for viewing and managing a single idea and all its associated documents.
- **Document**: An analysis or generated document related to an idea, stored in the `documents` table. For MVP: startup_analysis and hackathon_analysis only.
- **Document Type**: The type of document - `startup_analysis` (standard startup analysis) or `hackathon_analysis` (hackathon project analysis). Future: `prd`, `design_doc`, `roadmap`, `architecture`.
- **Idea Source**: How the idea was created - `manual` (user-entered) or `frankenstein` (Doctor Frankenstein generated).
- **Project Status**: The current state of an idea in the workflow (idea, in_progress, completed, archived).
- **System**: The No Vibe No Code application.
- **User**: An authenticated person using the application.
- **Dashboard**: The main interface showing all ideas (migrated from saved_analyses).
- **Idea Card**: A UI component displaying summary information about an idea.
- **saved_analyses Table**: Existing database table - kept unchanged for backward compatibility.
- **ideas Table**: New database table storing all ideas with panel management data.
- **documents Table**: New database table storing all documents (analyses) linked to ideas.

## Requirements

### Requirement 1

**User Story:** As a user, I want to open an Idea Panel from my dashboard, so that I can view and manage my idea in a dedicated workspace.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the System SHALL display a "Manage" button on each Idea Card
2. WHEN a user clicks the "Manage" button THEN the System SHALL navigate to the Idea Panel route at `/idea-panel/[ideaId]`
3. WHEN the Idea Panel loads THEN the System SHALL display the idea text prominently
4. WHEN the Idea Panel loads THEN the System SHALL display breadcrumb navigation back to the Dashboard
5. WHEN a user clicks the breadcrumb THEN the System SHALL navigate back to the Dashboard

### Requirement 2

**User Story:** As a user, I want to see all documents (analyses) associated with my idea, so that I can review all evaluations in one place.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show a list of all documents for the idea
2. WHEN the Idea Panel displays an idea with no documents THEN the System SHALL show "No analyses yet" message
3. WHEN the Idea Panel displays a startup_analysis document THEN the System SHALL show startup-specific fields (viability, innovation, market scores)
4. WHEN the Idea Panel displays a hackathon_analysis document THEN the System SHALL show hackathon-specific fields (technical, creativity, impact scores)
5. WHEN the Idea Panel displays a document THEN the System SHALL show the document creation date

### Requirement 3

**User Story:** As a user, I want to track the status of my idea, so that I can understand where it is in my workflow.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show the current Project Status (idea, in_progress, completed, or archived)
2. WHEN a user views the panel THEN the System SHALL allow updating the Project Status
3. WHEN a user changes the Project Status THEN the System SHALL persist the new status to the ideas table
4. WHEN a user changes the Project Status THEN the System SHALL update the status indicator immediately
5. WHEN the panel loads THEN the System SHALL display the idea creation date and last updated timestamp

### Requirement 4

**User Story:** As a user, I want to add notes to my idea, so that I can capture thoughts and track progress over time.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show a notes section
2. WHEN a user types in the notes field THEN the System SHALL automatically save the notes after 1 second of inactivity
3. WHEN notes are being saved THEN the System SHALL display a saving indicator
4. WHEN notes are successfully saved THEN the System SHALL display a "Saved" indicator
5. WHEN notes fail to save THEN the System SHALL display an error message and allow manual retry
6. WHEN a user saves notes THEN the System SHALL persist the notes to the ideas.notes field
7. WHEN a user saves notes THEN the System SHALL update the last modified timestamp (via database trigger)
8. WHEN the panel loads THEN the System SHALL display any previously saved notes

### Requirement 5

**User Story:** As a user, I want to add tags to my idea, so that I can categorize and organize my ideas.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show a tags section
2. WHEN a user adds a tag THEN the System SHALL add the tag to the ideas.tags array
3. WHEN a user removes a tag THEN the System SHALL remove the tag from the ideas.tags array
4. WHEN a user saves tags THEN the System SHALL persist the tags to the database
5. WHEN the panel loads THEN the System SHALL display any previously saved tags

### Requirement 6

**User Story:** As a user, I want the Idea Panel to be accessible and responsive, so that I can use it effectively on any device and with assistive technologies.

#### Acceptance Criteria

1. WHEN a user navigates the Idea Panel with keyboard THEN the System SHALL support full keyboard navigation with visible focus indicators
2. WHEN a user accesses the Idea Panel with a screen reader THEN the System SHALL provide appropriate ARIA labels for all interactive elements
3. WHEN a user views the Idea Panel on mobile THEN the System SHALL display a responsive layout that adapts to screen size
4. WHEN a user views the Idea Panel on mobile THEN the System SHALL provide touch-friendly buttons with adequate tap targets
5. WHEN the panel displays content THEN the System SHALL maintain readability and proper spacing on all screen sizes

### Requirement 7

**User Story:** As a system administrator, I want to control Idea Panel access with a feature flag, so that I can enable or disable the feature as needed.

#### Acceptance Criteria

1. WHEN the ENABLE_IDEA_PANEL feature flag is false THEN the System SHALL hide the "Manage" button on Idea Cards
2. WHEN the ENABLE_IDEA_PANEL feature flag is false THEN the System SHALL return a 404 error for Idea Panel routes
3. WHEN the ENABLE_IDEA_PANEL feature flag is true THEN the System SHALL display the "Manage" button on Idea Cards
4. WHEN the ENABLE_IDEA_PANEL feature flag is true THEN the System SHALL allow access to Idea Panel routes
5. WHEN the feature flag changes THEN the System SHALL reflect the change without requiring application restart

### Requirement 8

**User Story:** As a user, I want my existing analyses to be migrated to the new system, so that I don't lose any data.

#### Acceptance Criteria

1. WHEN the migration runs THEN the System SHALL extract all ideas from saved_analyses into the ideas table
2. WHEN the migration runs THEN the System SHALL extract all analyses from saved_analyses into the documents table
3. WHEN the migration runs THEN the System SHALL link documents to ideas via idea_id foreign key
4. WHEN the migration runs THEN the System SHALL preserve all original data (idea text, analysis results, timestamps)
5. WHEN the migration runs THEN the System SHALL keep the saved_analyses table unchanged for backward compatibility

### Requirement 9

**User Story:** As a user, I want the dashboard to show my ideas (not analyses), so that I can see all my ideas in one place regardless of whether they've been analyzed.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the System SHALL display ideas from the ideas table
2. WHEN a user views an idea card THEN the System SHALL show the idea text
3. WHEN a user views an idea card THEN the System SHALL show the count of associated documents
4. WHEN a user views an idea card THEN the System SHALL show the idea source (manual or frankenstein)
5. WHEN a user views an idea card THEN the System SHALL show the project status

### Requirement 10

**User Story:** As a user, I want to create new analyses from the Idea Panel, so that I can analyze my ideas without leaving the panel.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show an "Analyze" button
2. WHEN a user clicks "Analyze" THEN the System SHALL show options for analysis types (Startup Analysis, Hackathon Analysis)
3. WHEN a user selects an analysis type THEN the System SHALL navigate to the appropriate analyzer page with the idea pre-filled
4. WHEN a user completes an analysis THEN the System SHALL create a document in the documents table linked to the idea
5. WHEN a user returns to the Idea Panel THEN the System SHALL display the newly created document
