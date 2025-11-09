# Implementation Plan

- [x] 1. Execute database schema migration using Supabase MCP

  - Use mcp_supabase_apply_migration to add analysis_type column to saved_analyses table
  - Add check constraint for analysis_type values ('idea' or 'hackathon')
  - Create indexes for analysis_type and composite user_id + analysis_type
  - Set default value to 'idea' for existing records
  - Verify schema changes using mcp_supabase_list_tables
  - _Requirements: 1.1, 1.2_

- [x] 2. Update DAO type definitions

  - [x] 2.1 Update AnalysisDAO interface to include analysis_type field

    - Add analysis_type: 'idea' | 'hackathon' to AnalysisDAO
    - Keep existing fields unchanged (id, user_id, idea, analysis, audio_base64, created_at)
    - _Requirements: 5.1, 5.2_

  - [x] 2.2 Create IdeaAnalysisData interface for JSONB structure

    - Define interface with score, detailedSummary, criteria, locale fields
    - Document that this represents the analysis JSONB structure for idea type
    - _Requirements: 5.3, 5.4_

  - [x] 2.3 Create HackathonAnalysisData interface for JSONB structure

    - Extend IdeaAnalysisData structure with selectedCategory, kiroUsage, supportingMaterials
    - Define supportingMaterials nested structure (githubRdemoUrl, videoUrl, screenshots, additionalNotes)
    - _Requirements: 5.3, 5.5_

  - [x] 2.4 Create type guard functions
    - Implement isIdeaAnalysisData() type guard
    - Implement isHackathonAnalysisData() type guard
    - _Requirements: 5.1_

- [x] 3. Update AnalysisMapper implementation

  - [x] 3.1 Update toDAO() method to detect and set analysis_type

    - Implement isHackathonAnalysis() helper to detect type from domain entity
    - Set analysis_type based on presence of category, kiroUsage, or supportingMaterials
    - Store idea text in idea column for both types
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.2 Create mapIdeaAnalysisData() helper method

    - Map domain entity to IdeaAnalysisData JSONB structure
    - Include score, detailedSummary, criteria array, locale
    - _Requirements: 6.4_

  - [x] 3.3 Create mapHackathonAnalysisData() helper method

    - Map domain entity to HackathonAnalysisData JSONB structure
    - Include all idea fields plus selectedCategory, kiroUsage, supportingMaterials
    - _Requirements: 6.4_

  - [x] 3.4 Update toDomain() method to parse based on analysis_type
    - Check analysis_type discriminator from DAO
    - Parse JSONB as IdeaAnalysisData or HackathonAnalysisData accordingly
    - Reconstruct domain entity with appropriate fields
    - _Requirements: 6.5_

- [x] 4. Update SupabaseAnalysisRepository implementation

  - [x] 4.1 Update findByUserId() to support optional type filter

    - Add optional type parameter to method signature
    - Apply .eq('analysis_type', type) filter when type is provided
    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Implement findByUserIdAndType() method

    - Create method that calls findByUserId() with type parameter
    - _Requirements: 7.1_

  - [x] 4.3 Implement getAnalysisCountsByType() method

    - Query total count for user
    - Query count with analysis_type = 'idea'
    - Query count with analysis_type = 'hackathon'
    - Return object with total, idea, and hackathon counts
    - _Requirements: 7.4_

  - [x] 4.4 Update save() method to work with unified table

    - Verify mapper.toDAO() correctly sets analysis_type
    - Insert into saved_analyses table
    - _Requirements: 4.1, 4.2_

  - [x] 4.5 Update other query methods to handle both types
    - Update findByUserIdPaginated() to accept optional type filter
    - Update searchByUser() to accept optional type filter
    - _Requirements: 7.2, 7.3_

- [x] 5. Execute data migration for hackathon analyses using Supabase MCP

  - [x] 5.1 Migrate hackathon data to unified table

    - Use mcp_supabase_execute_sql to select all records from saved_hackathon_analyses
    - Transform data: map project_description to idea column
    - Build HackathonAnalysisData JSONB structure with selectedCategory, kiroUsage, supportingMaterials
    - Use mcp_supabase_execute_sql to insert into saved_analyses with analysis_type = 'hackathon'
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 5.2 Verify migration data integrity using Supabase MCP
    - Use mcp_supabase_execute_sql to count records in saved_hackathon_analyses
    - Use mcp_supabase_execute_sql to count records in saved_analyses where analysis_type = 'hackathon'
    - Compare counts and verify they match
    - Spot check sample records for data correctness
    - _Requirements: 2.5_

- [x] 6. Update API routes to work with unified table

  - [x] 6.1 Update analysis save endpoints

    - Verify endpoints use repository.save() which now handles both types
    - Ensure no code changes needed due to mapper auto-detection
    - _Requirements: 8.1, 8.2_

  - [x] 6.2 Update analysis query endpoints

    - Update dashboard endpoints to filter by type if needed
    - Update search endpoints to support type filtering
    - _Requirements: 8.3, 8.4_

  - [x] 6.3 Verify response formats remain unchanged
    - Test idea analysis endpoints return same format
    - Test hackathon analysis endpoints return same format
    - _Requirements: 8.5, 9.3_

- [x] 7. Update database types and Supabase client

  - [x] 7.1 Regenerate Supabase types

    - Run Supabase type generation after schema migration
    - Update Database type imports
    - _Requirements: 5.1_

  - [x] 7.2 Update SavedAnalysesRow type references
    - Ensure all code using SavedAnalysesRow includes analysis_type
    - Update any type assertions or casts
    - _Requirements: 5.1_

- [ ] 8. Verify migration and test application

  - [x] 8.1 Verify schema changes using Supabase MCP

    - Use mcp_supabase_list_tables to confirm analysis_type column exists
    - Use mcp_supabase_execute_sql to verify indexes were created
    - Check that default value 'idea' is set correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 8.2 Verify data migration using Supabase MCP

    - Use mcp_supabase_execute_sql to query sample records from both types
    - Verify JSONB structure is correct for both idea and hackathon types
    - Confirm all hackathon-specific fields are in analysis JSONB
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 8.3 Test application with migrated data
    - Test idea analysis creation and retrieval
    - Test hackathon analysis creation and retrieval
    - Test dashboard with mixed analysis types
    - Test filtering by type
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Production deployment (manual coordination required)

  - [x] 9.1 Coordinate production database backup

    - Ensure production database backup is created before migration
    - Verify backup integrity
    - _Requirements: 9.5_

  - [x] 9.2 Execute production migration using Supabase MCP

    - Use mcp_supabase_apply_migration for schema changes
    - Use mcp_supabase_execute_sql for data migration
    - Verify data integrity with count queries
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [x] 9.3 Deploy updated application code

    - Deploy new code with updated mappers and repositories
    - Monitor application logs for errors
    - _Requirements: 9.1, 9.2_

  - [x] 9.4 Verify production functionality using Supabase MCP
    - Use mcp_supabase_execute_sql to query both analysis types
    - Test idea analysis workflows through application
    - Test hackathon analysis workflows through application
    - Monitor error rates and performance metrics
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 10. Documentation

  - [x] 10.1 Update documentation

    - Document the unified table structure in README or docs
    - Update API documentation to reflect unified table
    - Document migration process and steps taken
    - _Requirements: 10.3_

  - [x] 10.2 Archive old schema definitions
    - Save old table schema SQL for reference
    - Update database schema documentation
    - _Requirements: 10.4, 10.5_
