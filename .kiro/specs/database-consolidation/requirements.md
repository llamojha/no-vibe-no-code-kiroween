# Requirements Document

## Introduction

This document outlines the requirements for consolidating the two separate database tables (`saved_analyses` and `saved_hackathon_analyses`) into a single unified table with a type discriminator column. This consolidation will simplify the data model, reduce code duplication, and improve maintainability while preserving all existing functionality and data integrity.

## Glossary

- **Saved Analyses Table**: The existing `saved_analyses` database table that stores standard startup idea analyses
- **Saved Hackathon Analyses Table**: The existing `saved_hackathon_analyses` database table that stores hackathon project analyses
- **Unified Analyses Table**: The new consolidated `saved_analyses` table that will store both types of analyses with a type discriminator
- **Type Discriminator**: A column (`analysis_type`) that identifies whether a record is a standard idea analysis or a hackathon analysis
- **Analysis Repository**: The domain repository interface and implementation that handles data access for analyses
- **Data Migration**: The process of moving existing data from the separate tables into the unified table structure
- **Row Level Security (RLS)**: Supabase security policies that control data access at the row level
- **DAO (Data Access Object)**: The database representation of an entity used for persistence
- **Domain Entity**: The business logic representation of an analysis in the application layer

## Requirements

### Requirement 1: Database Schema Consolidation

**User Story:** As a database administrator, I want a single unified table for all analyses with minimal schema changes, so that the schema is simpler and easier to maintain.

#### Acceptance Criteria

1. THE Unified Analyses Table SHALL contain an `analysis_type` column with values 'idea' or 'hackathon'
2. THE Unified Analyses Table SHALL retain all existing columns (id, user_id, idea, analysis, audio_base64, created_at) without modification
3. THE Unified Analyses Table SHALL NOT add new columns for hackathon-specific fields
4. WHEN analysis_type is 'idea', THE `idea` column SHALL store the startup idea text
5. WHEN analysis_type is 'hackathon', THE `idea` column SHALL store the project description text

### Requirement 2: Data Migration

**User Story:** As a system operator, I want all existing analysis data preserved during consolidation, so that no user data is lost.

#### Acceptance Criteria

1. THE Data Migration SHALL copy all records from Saved Analyses Table to Unified Analyses Table with analysis_type set to 'idea'
2. THE Data Migration SHALL copy all records from Saved Hackathon Analyses Table to Unified Analyses Table with analysis_type set to 'hackathon'
3. THE Data Migration SHALL preserve all column values including timestamps, user associations, and JSON data
4. THE Data Migration SHALL maintain referential integrity with the auth.users table
5. WHEN Data Migration completes successfully, THE system SHALL verify record counts match between source and destination tables

### Requirement 3: Row Level Security Policies

**User Story:** As a security administrator, I want RLS policies updated for the unified table, so that data access remains properly secured.

#### Acceptance Criteria

1. THE Unified Analyses Table SHALL have RLS enabled
2. THE Unified Analyses Table SHALL enforce owner-only access for SELECT operations WHERE auth.uid() equals user_id
3. THE Unified Analyses Table SHALL enforce owner-only access for INSERT operations WHERE auth.uid() equals user_id
4. THE Unified Analyses Table SHALL enforce owner-only access for UPDATE operations WHERE auth.uid() equals user_id
5. THE Unified Analyses Table SHALL enforce owner-only access for DELETE operations WHERE auth.uid() equals user_id

### Requirement 4: Repository Interface Updates

**User Story:** As a developer, I want repository interfaces that work with the unified table, so that I can access both types of analyses through a consistent API.

#### Acceptance Criteria

1. THE Analysis Repository SHALL provide methods to query analyses filtered by analysis_type
2. THE Analysis Repository SHALL accept an optional type parameter in findByUserId methods
3. THE Analysis Repository SHALL validate that hackathon-specific fields are only populated for hackathon-type analyses
4. THE Analysis Repository SHALL validate that idea-specific fields are only populated for idea-type analyses
5. THE Analysis Repository SHALL maintain backward compatibility with existing method signatures

### Requirement 5: Data Access Object Updates

**User Story:** As a developer, I want updated DAO types that reflect the unified schema, so that TypeScript provides accurate type checking.

#### Acceptance Criteria

1. THE AnalysisDAO type SHALL include the analysis_type discriminator field
2. THE AnalysisDAO type SHALL use the same structure for both idea and hackathon types
3. THE AnalysisDAO type SHALL define separate interfaces for IdeaAnalysisData and HackathonAnalysisData stored in the analysis JSONB field
4. THE IdeaAnalysisData interface SHALL contain standard analysis fields (score, detailedSummary, criteria, locale)
5. THE HackathonAnalysisData interface SHALL extend IdeaAnalysisData with hackathon-specific fields (selectedCategory, kiroUsage, supportingMaterials)

### Requirement 6: Mapper Implementation Updates

**User Story:** As a developer, I want mappers that correctly handle both analysis types, so that domain entities are properly converted to and from database records.

#### Acceptance Criteria

1. THE AnalysisMapper SHALL automatically detect analysis type based on domain entity properties (presence of category, kiroUsage, or supportingMaterials)
2. THE AnalysisMapper SHALL set analysis_type to 'idea' WHEN mapping standard idea analyses to DAO
3. THE AnalysisMapper SHALL set analysis_type to 'hackathon' WHEN mapping hackathon analyses to DAO
4. THE AnalysisMapper SHALL store hackathon-specific fields (selectedCategory, kiroUsage, supportingMaterials) within the analysis JSONB field
5. THE AnalysisMapper SHALL parse the analysis JSONB field based on analysis_type WHEN converting DAO to domain entity

### Requirement 7: Query Method Updates

**User Story:** As a developer, I want query methods that can filter by analysis type, so that I can retrieve specific types of analyses efficiently.

#### Acceptance Criteria

1. THE Analysis Repository SHALL provide a findByUserIdAndType method accepting userId and analysis_type parameters
2. THE Analysis Repository SHALL update findByUserIdPaginated to accept an optional type filter
3. THE Analysis Repository SHALL update searchByUser to accept an optional type filter
4. THE Analysis Repository SHALL update getAnalysisCountsByUser to return counts separated by type
5. THE Analysis Repository SHALL maintain existing query methods for backward compatibility

### Requirement 8: API Route Updates

**User Story:** As a frontend developer, I want API routes that work with the unified table, so that my application continues to function correctly.

#### Acceptance Criteria

1. THE API routes SHALL continue to accept the same request payloads as before consolidation
2. THE API routes SHALL internally specify the correct analysis_type when saving records
3. THE API routes SHALL filter results by analysis_type when appropriate
4. THE API routes SHALL return responses in the same format as before consolidation
5. THE API routes SHALL handle errors consistently across both analysis types

### Requirement 9: Backward Compatibility

**User Story:** As a product owner, I want the consolidation to be transparent to end users, so that no functionality is disrupted.

#### Acceptance Criteria

1. THE system SHALL maintain all existing API endpoints without breaking changes
2. THE system SHALL preserve all existing query capabilities for both analysis types
3. THE system SHALL maintain the same response formats for all API calls
4. THE system SHALL support all existing dashboard and analyzer features
5. THE system SHALL complete the migration without requiring application downtime

### Requirement 10: Cleanup and Deprecation

**User Story:** As a database administrator, I want old tables removed after successful migration, so that the database remains clean and efficient.

#### Acceptance Criteria

1. WHEN Data Migration is verified successful, THE system SHALL drop the Saved Hackathon Analyses Table
2. WHEN Data Migration is verified successful, THE system SHALL remove RLS policies from the dropped table
3. THE system SHALL document the migration process for future reference
4. THE system SHALL provide rollback procedures in case of migration issues
5. THE system SHALL archive the old table schema definitions for historical reference
