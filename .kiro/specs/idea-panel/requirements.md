# Requirements Document

## Introduction

The Idea Panel feature provides users with a dedicated workspace to view and manage their analyzed startup ideas. This MVP focuses on creating the foundational panel interface that displays analysis details, tracks basic status, and provides a structure for future enhancements. The panel integrates with existing analysis functionality (both standard and hackathon analyzers) and provides a centralized view of idea information.

## Glossary

- **Idea Panel**: A dedicated full-screen interface for viewing and managing a single analyzed startup idea
- **Analysis**: A previously completed startup idea evaluation with scores and feedback (either standard or hackathon type)
- **Project Status**: The current state of an idea in the workflow (idea, in_progress, completed)
- **System**: The No Vibe No Code application
- **User**: An authenticated person using the application
- **Dashboard**: The main interface showing all saved analyses
- **Analysis Card**: A UI component displaying summary information about a saved analysis
- **Panel Metadata**: Additional information stored about the panel state (notes, tags, etc.)

## Requirements

### Requirement 1

**User Story:** As a user, I want to open an Idea Panel from my saved analyses, so that I can view and manage my startup idea in a dedicated workspace.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the System SHALL display a "Manage" button on each Analysis Card
2. WHEN a user clicks the "Manage" button THEN the System SHALL navigate to the Idea Panel route at `/idea-panel/[analysisId]`
3. WHEN the Idea Panel loads THEN the System SHALL display the complete analysis data including idea description, scores, strengths, weaknesses, and recommendations
4. WHEN the Idea Panel loads THEN the System SHALL display breadcrumb navigation back to the Dashboard
5. WHEN a user clicks the breadcrumb THEN the System SHALL navigate back to the Dashboard

### Requirement 2

**User Story:** As a user, I want to see my idea organized in a clear layout, so that I can easily understand all aspects of the analysis.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show the idea title and description prominently
2. WHEN the Idea Panel displays THEN the System SHALL show all analysis scores in a visual format
3. WHEN the Idea Panel displays THEN the System SHALL display strengths in a dedicated section
4. WHEN the Idea Panel displays THEN the System SHALL display weaknesses in a dedicated section
5. WHEN the Idea Panel displays THEN the System SHALL display recommendations in a dedicated section

### Requirement 3

**User Story:** As a user, I want to track the status of my idea, so that I can understand where it is in my workflow.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show the current Project Status (idea, in_progress, or completed)
2. WHEN a user views the panel THEN the System SHALL allow updating the Project Status
3. WHEN a user changes the Project Status THEN the System SHALL persist the new status to the database
4. WHEN a user changes the Project Status THEN the System SHALL update the status indicator immediately
5. WHEN the panel loads THEN the System SHALL display the analysis creation date and last updated timestamp

### Requirement 4

**User Story:** As a user, I want to add notes to my idea, so that I can capture thoughts and track progress over time.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show a notes section
2. WHEN a user adds or edits notes THEN the System SHALL enable a save button
3. WHEN a user saves notes THEN the System SHALL persist the notes to the panel_metadata field
4. WHEN a user saves notes THEN the System SHALL update the last modified timestamp
5. WHEN the panel loads THEN the System SHALL display any previously saved notes

### Requirement 5

**User Story:** As a user, I want to add tags to my idea, so that I can categorize and organize my analyses.

#### Acceptance Criteria

1. WHEN the Idea Panel displays THEN the System SHALL show a tags section
2. WHEN a user adds a tag THEN the System SHALL add the tag to the panel_metadata field
3. WHEN a user removes a tag THEN the System SHALL remove the tag from the panel_metadata field
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

1. WHEN the ENABLE_IDEA_PANEL feature flag is false THEN the System SHALL hide the "Manage" button on Analysis Cards
2. WHEN the ENABLE_IDEA_PANEL feature flag is false THEN the System SHALL return a 404 error for Idea Panel routes
3. WHEN the ENABLE_IDEA_PANEL feature flag is true THEN the System SHALL display the "Manage" button on Analysis Cards
4. WHEN the ENABLE_IDEA_PANEL feature flag is true THEN the System SHALL allow access to Idea Panel routes
5. WHEN the feature flag changes THEN the System SHALL reflect the change without requiring application restart

### Requirement 8

**User Story:** As a user, I want the Idea Panel to work with both standard and hackathon analyses, so that I can manage all my ideas in one place.

#### Acceptance Criteria

1. WHEN a user opens a panel for a standard analysis THEN the System SHALL display standard analysis fields (viability, innovation, market scores)
2. WHEN a user opens a panel for a hackathon analysis THEN the System SHALL display hackathon-specific fields (technical, creativity, impact scores)
3. WHEN the panel loads THEN the System SHALL detect the analysis type automatically
4. WHEN displaying scores THEN the System SHALL use appropriate labels for the analysis type
5. WHEN displaying recommendations THEN the System SHALL show type-specific recommendations
