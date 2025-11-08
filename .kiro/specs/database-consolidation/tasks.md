# Implementation Plan

- [ ] 1. Create database migration script

  - Create migration file to add analysis_type column to saved_analyses table
  - Add check constraint for analysis_type values ('idea' or 'hackathon')
  - Create indexes for analysis_type and composite user_id + analysis_type
  - Set default value to 'idea' for existing records
  - _Requirements: 1.1, 1.2_

- [ ] 2. Update DAO type definitions

  - [ ] 2.1 Update AnalysisDAO interface to include analysis_type field

    - Add analysis_type: 'idea' | 'hackathon' to AnalysisDAO
    - Keep existing fields unchanged (id, user_id, idea, analysis, audio_base64, created_at)
    - _Requirements: 5.1, 5.2_

  - [ ] 2.2 Create IdeaAnalysisData interface for JSONB structure

    - Define interface with score, detailedSummary, criteria, locale fields
    - Document that this represents the analysis JSONB structure for idea type
    - _Requirements: 5.3, 5.4_

  - [ ] 2.3 Create HackathonAnalysisData interface for JSONB structure

    - Extend IdeaAnalysisData structure with selectedCategory, kiroUsage, supportingMaterials
    - Define supportingMaterials nested structure (githubRdemoUrl, videoUrl, screenshots, additionalNotes)
    - _Requirements: 5.3, 5.5_

  - [ ] 2.4 Create type guard functions
    - Implement isIdeaAnalysisData() type guard
    - Implement isHackathonAnalysisData() type guard
    - _Requirements: 5.1_

- [ ] 3. Update AnalysisMapper implementation

  - [ ] 3.1 Update toDAO() method to detect and set analysis_type

    - Implement isHackathonAnalysis() helper to detect type from domain entity
    - Set analysis_type based on presence of category, kiroUsage, or supportingMaterials
    - Store idea text in idea column for both types
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 3.2 Create mapIdeaAnalysisData() helper method

    - Map domain entity to IdeaAnalysisData JSONB structure
    - Include score, detailedSummary, criteria array, locale
    - _Requirements: 6.4_

  - [ ] 3.3 Create mapHackathonAnalysisData() helper method

    - Map domain entity to HackathonAnalysisData JSONB structure
    - Include all idea fields plus selectedCategory, kiroUsage, supportingMaterials
    - _Requirements: 6.4_

  - [ ] 3.4 Update toDomain() method to parse based on analysis_type
    - Check analysis_type discriminator from DAO
    - Parse JSONB as IdeaAnalysisData or HackathonAnalysisData accordingly
    - Reconstruct domain entity with appropriate fields
    - _Requirements: 6.5_

- [ ] 4. Update SupabaseAnalysisRepository implementation

  - [ ] 4.1 Update findByUserId() to support optional type filter

    - Add optional type parameter to method signature
    - Apply .eq('analysis_type', type) filter when type is provided
    - _Requirements: 7.1, 7.2_

  - [ ] 4.2 Implement findByUserIdAndType() method

    - Create method that calls findByUserId() with type parameter
    - _Requirements: 7.1_

  - [ ] 4.3 Implement getAnalysisCountsByType() method

    - Query total count for user
    - Query count with analysis_type = 'idea'
    - Query count with analysis_type = 'hackathon'
    - Return object with total, idea, and hackathon counts
    - _Requirements: 7.4_

  - [ ] 4.4 Update save() method to work with unified table

    - Verify mapper.toDAO() correctly sets analysis_type
    - Insert into saved_analyses table
    - _Requirements: 4.1, 4.2_

  - [ ] 4.5 Update other query methods to handle both types
    - Update findByUserIdPaginated() to accept optional type filter
    - Update searchByUser() to accept optional type filter
    - _Requirements: 7.2, 7.3_

- [ ] 5. Create data migration script for hackathon analyses

  - [ ] 5.1 Write migration script to copy hackathon data

    - Select all records from saved_hackathon_analyses
    - Map project_description to idea column
    - Create HackathonAnalysisData structure in analysis JSONB
    - Set analysis_type to 'hackathon'
    - Insert into saved_analyses table
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 5.2 Add verification step to migration script
    - Count records in saved_hackathon_analyses
    - Count records in saved_analyses where analysis_type = 'hackathon'
    - Verify counts match
    - Log any discrepancies
    - _Requirements: 2.5_

- [ ] 6. Update API routes to work with unified table

  - [ ] 6.1 Update analysis save endpoints

    - Verify endpoints use repository.save() which now handles both types
    - Ensure no code changes needed due to mapper auto-detection
    - _Requirements: 8.1, 8.2_

  - [ ] 6.2 Update analysis query endpoints

    - Update dashboard endpoints to filter by type if needed
    - Update search endpoints to support type filtering
    - _Requirements: 8.3, 8.4_

  - [ ] 6.3 Verify response formats remain unchanged
    - Test idea analysis endpoints return same format
    - Test hackathon analysis endpoints return same format
    - _Requirements: 8.5, 9.3_

- [ ] 7. Update database types and Supabase client

  - [ ] 7.1 Regenerate Supabase types

    - Run Supabase type generation after schema migration
    - Update Database type imports
    - _Requirements: 5.1_

  - [ ] 7.2 Update SavedAnalysesRow type references
    - Ensure all code using SavedAnalysesRow includes analysis_type
    - Update any type assertions or casts
    - _Requirements: 5.1_

- [ ] 8. Run migration and verify data integrity

  - [ ] 8.1 Execute schema migration in staging

    - Run ALTER TABLE to add analysis_type column
    - Create indexes
    - Verify schema changes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 8.2 Execute data migration in staging

    - Run hackathon data migration script
    - Verify record counts
    - Spot check migrated data for correctness
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 8.3 Test application with migrated data
    - Test idea analysis creation and retrieval
    - Test hackathon analysis creation and retrieval
    - Test dashboard with mixed analysis types
    - Test filtering by type
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9. Deploy to production

  - [ ] 9.1 Backup production database

    - Create full database backup
    - Verify backup can be restored
    - _Requirements: 9.5_

  - [ ] 9.2 Run production migration

    - Execute schema migration
    - Execute data migration
    - Verify data integrity
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [ ] 9.3 Deploy updated application code

    - Deploy new code with updated mappers and repositories
    - Monitor for errors
    - _Requirements: 9.1, 9.2_

  - [ ] 9.4 Verify production functionality
    - Test idea analysis workflows
    - Test hackathon analysis workflows
    - Monitor error rates and performance
    - _Requirements: 9.3, 9.4, 9.5_

- [ ] 10. Cleanup and documentation

  - [ ] 10.1 Drop saved_hackathon_analyses table

    - Verify all data successfully migrated
    - Drop RLS policies on saved_hackathon_analyses
    - Drop saved_hackathon_analyses table
    - _Requirements: 10.1, 10.2_

  - [ ] 10.2 Update documentation

    - Document the unified table structure
    - Update API documentation
    - Document migration process
    - _Requirements: 10.3_

  - [ ] 10.3 Archive old schema definitions
    - Save old table schema for reference
    - Document rollback procedures
    - _Requirements: 10.4, 10.5_
