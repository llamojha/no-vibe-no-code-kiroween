# Requirements Document

## Introduction

This specification adds save, share, and export capabilities to the Doctor Frankenstein feature, bringing it to feature parity with the existing Analyzer and Kiroween Analyzer features. Users will be able to save their generated ideas to their dashboard, share them via links, and export them in various formats (PDF, Markdown, JSON).

## Glossary

- **Doctor Frankenstein System**: The complete feature that combines technologies and generates startup ideas
- **Saved Frankenstein Idea**: A persisted record of a generated idea stored in the database
- **Dashboard**: The user's personal area showing all saved analyses and ideas
- **Export Control**: UI component providing export functionality in multiple formats
- **Shareable Link**: A unique URL that allows viewing a saved idea without authentication
- **Supabase**: The backend database and authentication service
- **Authentication System**: The user login and session management system

## Requirements

### Requirement 1

**User Story:** As a logged-in user, I want to save my generated Frankenstein ideas to my dashboard, so that I can review them later

#### Acceptance Criteria

1. WHEN a user generates a Frankenstein idea, THE Doctor Frankenstein System SHALL display a "Save Report" button
2. WHEN the user clicks "Save Report", THE Doctor Frankenstein System SHALL persist the idea to the database with user association
3. WHEN the save operation completes successfully, THE Doctor Frankenstein System SHALL display a "Report Saved" confirmation message
4. WHEN an idea is saved, THE Doctor Frankenstein System SHALL store the technology selections, mode, analysis content, and generation timestamp
5. WHEN the user is not logged in, THE Doctor Frankenstein System SHALL redirect to the login page when attempting to save

### Requirement 2

**User Story:** As a user, I want to view my saved Frankenstein ideas from my dashboard, so that I can access my previous generations

#### Acceptance Criteria

1. WHEN the user navigates to the dashboard, THE Dashboard SHALL display all saved Frankenstein ideas in a list
2. THE Dashboard SHALL show each idea's name, technologies used, mode, and creation date
3. WHEN the user clicks on a saved idea, THE Doctor Frankenstein System SHALL load and display the complete saved analysis
4. WHEN viewing a saved idea, THE Doctor Frankenstein System SHALL display a "Go to Dashboard" button instead of "Save Report"
5. THE Dashboard SHALL sort saved ideas by creation date with newest first

### Requirement 3

**User Story:** As a user, I want to share my Frankenstein ideas via a link, so that others can view my generated concepts

#### Acceptance Criteria

1. WHEN an idea is saved, THE Doctor Frankenstein System SHALL generate a unique shareable URL
2. WHEN the user clicks the "Share" button, THE Doctor Frankenstein System SHALL copy the shareable link to the clipboard
3. WHEN the link is copied, THE Doctor Frankenstein System SHALL display a "Link Copied" confirmation message for 2 seconds
4. WHEN someone accesses a shareable link, THE Doctor Frankenstein System SHALL display the saved idea without requiring authentication
5. THE shareable link SHALL include the saved idea ID in the URL format: `/doctor-frankenstein?savedId={id}`

### Requirement 4

**User Story:** As a user, I want to export my Frankenstein ideas in different formats, so that I can use them in other tools and documents

#### Acceptance Criteria

1. WHEN an idea is generated or loaded, THE Export Control SHALL display export options for PDF, Markdown, and JSON formats
2. WHEN the user clicks "Export as PDF", THE Export Control SHALL generate and download a formatted PDF document
3. WHEN the user clicks "Export as Markdown", THE Export Control SHALL generate and download a markdown file
4. WHEN the user clicks "Export as JSON", THE Export Control SHALL generate and download a JSON file with structured data
5. THE Export Control SHALL be available for both saved and unsaved ideas

### Requirement 5

**User Story:** As a user, I want the system to preserve my idea when I reload the page after saving, so that I don't lose my work

#### Acceptance Criteria

1. WHEN a user saves an idea, THE Doctor Frankenstein System SHALL update the URL with the saved ID parameter
2. WHEN the user reloads the page with a saved ID in the URL, THE Doctor Frankenstein System SHALL load the saved idea from the database
3. WHEN loading a saved idea, THE Doctor Frankenstein System SHALL restore the technology selections, mode, and analysis
4. WHEN loading fails, THE Doctor Frankenstein System SHALL display an error message and clear the invalid ID from the URL
5. WHILE loading a saved idea, THE Doctor Frankenstein System SHALL display a loading state

### Requirement 6

**User Story:** As a user, I want to refine a saved idea by regenerating it with modifications, so that I can iterate on concepts

#### Acceptance Criteria

1. WHEN viewing a saved idea, THE Doctor Frankenstein System SHALL display a "Refine" or "Spin Again" button
2. WHEN the user clicks the refine button, THE Doctor Frankenstein System SHALL enable the slot machine and spin button
3. WHEN the user generates a new analysis from a saved idea, THE Doctor Frankenstein System SHALL create a new save instead of overwriting
4. THE Doctor Frankenstein System SHALL preserve the original saved idea unchanged
5. WHEN refining, THE Doctor Frankenstein System SHALL allow changing the mode and technologies

### Requirement 7

**User Story:** As a developer, I want the save/share/export functionality to integrate with the existing authentication and database systems, so that implementation is consistent

#### Acceptance Criteria

1. THE Doctor Frankenstein System SHALL use the existing Supabase client for database operations
2. THE Doctor Frankenstein System SHALL use the existing authentication context for user session management
3. THE Doctor Frankenstein System SHALL follow the same database schema patterns as Analyzer and Kiroween Analyzer
4. THE Doctor Frankenstein System SHALL reuse existing API patterns for save and load operations
5. THE Doctor Frankenstein System SHALL handle local dev mode (without authentication) for development purposes

### Requirement 8

**User Story:** As a user, I want the PDF export to be well-formatted and professional, so that I can share it with stakeholders

#### Acceptance Criteria

1. THE PDF export SHALL include the idea name as the title
2. THE PDF export SHALL include both technology names and descriptions
3. THE PDF export SHALL include all analysis sections (description, key features, target market, value proposition)
4. THE PDF export SHALL use consistent formatting with proper headings and spacing
5. THE PDF export SHALL include the generation date and mode information

### Requirement 9

**User Story:** As a user, I want the Markdown export to be compatible with common markdown editors, so that I can edit and share it easily

#### Acceptance Criteria

1. THE Markdown export SHALL use standard markdown syntax
2. THE Markdown export SHALL include frontmatter with metadata (date, mode, technologies)
3. THE Markdown export SHALL format lists and sections properly
4. THE Markdown export SHALL be compatible with GitHub, Notion, and other markdown editors
5. THE Markdown export SHALL include the complete analysis content

### Requirement 10

**User Story:** As a developer, I want the JSON export to have a well-structured schema, so that it can be consumed by other applications

#### Acceptance Criteria

1. THE JSON export SHALL include all idea data in a structured format
2. THE JSON export SHALL include metadata (id, userId, createdAt, mode)
3. THE JSON export SHALL include technology details (names, descriptions, categories)
4. THE JSON export SHALL include the complete analysis object
5. THE JSON export SHALL be valid JSON that can be parsed by standard JSON parsers
