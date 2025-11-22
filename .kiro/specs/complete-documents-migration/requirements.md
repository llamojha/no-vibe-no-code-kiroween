# Requirements Document: Complete Migration to Documents Table

## Introduction

Complete the migration from `saved_analyses` table to the new `ideas` and `documents` table architecture. All analysis creation, loading, updating, and deletion operations must use the new tables exclusively.

## Glossary

- **saved_analyses Table**: Legacy table storing analyses directly (to be deprecated)
- **ideas Table**: New table storing ideas with metadata (status, notes, tags)
- **documents Table**: New table storing analyses linked to ideas via foreign key
- **Analysis**: A startup or hackathon evaluation (stored as document)
- **Idea**: The concept being analyzed (stored in ideas table)
- **Doctor Frankenstein**: Feature that generates mashup ideas
- **System**: The No Vibe No Code application

## Requirements

### Requirement 1: Save Operations

**User Story:** As a user, when I create any analysis, the System SHALL save it to the ideas and documents tables, not saved_analyses.

#### Acceptance Criteria

1. WHEN a user creates a startup analysis THEN the System SHALL create an idea record in ideas table
2. WHEN a user creates a startup analysis THEN the System SHALL create a document record in documents table with type 'startup_analysis'
3. WHEN a user creates a hackathon analysis THEN the System SHALL create an idea record in ideas table
4. WHEN a user creates a hackathon analysis THEN the System SHALL create a document record in documents table with type 'hackathon_analysis'
5. WHEN Doctor Frankenstein generates an idea THEN the System SHALL create an idea record with source='frankenstein'
6. WHEN Doctor Frankenstein generates an idea THEN the System SHALL NOT create a document record (no analysis yet)
7. WHEN a user analyzes a Frankenstein idea THEN the System SHALL link the document to the existing idea record

### Requirement 2: Load Operations

**User Story:** As a user, when I view any analysis, the System SHALL load it from the documents table with fallback to saved_analyses for legacy data.

#### Acceptance Criteria

1. WHEN a user views a single analysis THEN the System SHALL try loading from documents table first
2. WHEN a document is not found in documents table THEN the System SHALL try loading from saved_analyses table
3. WHEN a user lists their analyses THEN the System SHALL load from ideas table with document counts
4. WHEN loading fails from both tables THEN the System SHALL show a user-friendly error message
5. WHEN a legacy analysis is loaded THEN the System SHALL display it correctly without migration

### Requirement 3: Update Operations

**User Story:** As a user, when I update an analysis, the System SHALL update the correct table based on where the data exists.

#### Acceptance Criteria

1. WHEN a user updates audio for a document THEN the System SHALL update the documents table
2. WHEN a user updates audio for a legacy analysis THEN the System SHALL update the saved_analyses table
3. WHEN a user updates idea metadata THEN the System SHALL update the ideas table
4. WHEN an update fails THEN the System SHALL show a user-friendly error message
5. WHEN updating a document THEN the System SHALL update the updated_at timestamp automatically

### Requirement 4: Delete Operations

**User Story:** As a user, when I delete an analysis, the System SHALL delete it from the correct table.

#### Acceptance Criteria

1. WHEN a user deletes a document THEN the System SHALL delete from documents table
2. WHEN a user deletes a legacy analysis THEN the System SHALL delete from saved_analyses table
3. WHEN a user deletes an idea THEN the System SHALL cascade delete all associated documents
4. WHEN deletion fails THEN the System SHALL show a user-friendly error message
5. WHEN a document is deleted THEN the System SHALL NOT delete the parent idea (idea can exist without documents)

### Requirement 5: Doctor Frankenstein Integration

**User Story:** As a user, when I use Doctor Frankenstein, the System SHALL create ideas that can be analyzed later.

#### Acceptance Criteria

1. WHEN Doctor Frankenstein generates an idea THEN the System SHALL create a record in ideas table with source='frankenstein'
2. WHEN a Frankenstein idea is created THEN the System SHALL NOT create a document (no analysis yet)
3. WHEN a user analyzes a Frankenstein idea THEN the System SHALL create a document linked to the existing idea
4. WHEN a user views Frankenstein ideas in dashboard THEN the System SHALL show them with document_count=0
5. WHEN a user updates a Frankenstein idea THEN the System SHALL update the ideas table

### Requirement 6: Dashboard Integration

**User Story:** As a user, when I view my dashboard, the System SHALL show all my ideas from the ideas table.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the System SHALL load ideas from ideas table
2. WHEN displaying an idea card THEN the System SHALL show the document count
3. WHEN an idea has no documents THEN the System SHALL show "No analyses yet"
4. WHEN an idea has documents THEN the System SHALL show the count (e.g., "2 analyses")
5. WHEN a user clicks "Manage" THEN the System SHALL navigate to the Idea Panel

### Requirement 7: Backward Compatibility

**User Story:** As a user with legacy analyses, I want to continue accessing them while new analyses use the new system.

#### Acceptance Criteria

1. WHEN loading a single analysis THEN the System SHALL check documents table first, then saved_analyses
2. WHEN listing analyses THEN the System SHALL show both new ideas and legacy analyses
3. WHEN a legacy analysis is displayed THEN the System SHALL show it with the same UI as new documents
4. WHEN a legacy analysis is updated THEN the System SHALL update saved_analyses table
5. WHEN a legacy analysis is deleted THEN the System SHALL delete from saved_analyses table

### Requirement 8: Data Integrity

**User Story:** As a system administrator, I want to ensure data integrity during the migration.

#### Acceptance Criteria

1. WHEN creating a document THEN the System SHALL validate the idea_id exists in ideas table
2. WHEN creating a document THEN the System SHALL validate the document_type is valid
3. WHEN creating an idea THEN the System SHALL validate the source is 'manual' or 'frankenstein'
4. WHEN creating an idea THEN the System SHALL validate the project_status is valid
5. WHEN any database operation fails THEN the System SHALL log the error with context

### Requirement 9: API Consistency

**User Story:** As a developer, I want consistent API patterns across all analysis operations.

#### Acceptance Criteria

1. WHEN any save operation succeeds THEN the System SHALL return the created record with ID
2. WHEN any load operation succeeds THEN the System SHALL return the record in consistent DTO format
3. WHEN any operation fails THEN the System SHALL return error in format { data: null, error: string }
4. WHEN using local dev mode THEN the System SHALL use localStorage instead of database
5. WHEN any operation completes THEN the System SHALL track analytics event

### Requirement 10: Repository Layer Updates

**User Story:** As a developer, I want the repository layer to use the new tables exclusively for new data.

#### Acceptance Criteria

1. WHEN IdeaRepository saves an idea THEN the System SHALL insert into ideas table
2. WHEN DocumentRepository saves a document THEN the System SHALL insert into documents table
3. WHEN repositories query data THEN the System SHALL use proper indexes for performance
4. WHEN repositories handle errors THEN the System SHALL convert to domain errors
5. WHEN repositories map data THEN the System SHALL use proper mappers (DAO ↔ Entity ↔ DTO)
