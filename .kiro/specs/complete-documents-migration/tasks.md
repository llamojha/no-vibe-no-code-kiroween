# Implementation Tasks: Complete Migration to Documents Table

## Task Breakdown

### Phase 0: Pre-Migration Verification

- [ ] 0. Verify Database Schema and Policies

  - [ ] 0.1 Verify ideas table schema

    - Check all columns exist (id, user_id, idea_text, source, project_status, notes, tags, created_at, updated_at)
    - Verify data types match design
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ] 0.2 Verify documents table schema

    - Check all columns exist (id, idea_id, user_id, document_type, title, content, created_at, updated_at)
    - Verify data types match design
    - Verify foreign key constraint (idea_id → ideas.id)
    - _Requirements: 8.1, 8.2_

  - [ ] 0.3 Verify database indexes

    - Check ideas(user_id) index exists
    - Check ideas(updated_at DESC) index exists
    - Check documents(idea_id) index exists
    - Check documents(user_id) index exists
    - Check documents(id, user_id) index exists
    - _Requirements: 10.3_

  - [ ] 0.4 Verify RLS policies on ideas table

    - Test SELECT policy (users can view own ideas)
    - Test INSERT policy (users can insert own ideas)
    - Test UPDATE policy (users can update own ideas)
    - Test DELETE policy (users can delete own ideas)
    - _Requirements: 8.1_

  - [ ] 0.5 Verify RLS policies on documents table

    - Test SELECT policy (users can view own documents)
    - Test INSERT policy (users can insert own documents)
    - Test UPDATE policy (users can update own documents)
    - Test DELETE policy (users can delete own documents)
    - _Requirements: 8.1_

  - [ ] 0.6 Test manual database operations

    - Manually create idea record
    - Manually create document record linked to idea
    - Verify foreign key constraint works
    - Verify cascade behavior (if configured)
    - Test with different users to verify RLS
    - _Requirements: 8.1, 8.2_

  - [ ] 0.7 Verify existing repositories work
    - Test IdeaRepository.save()
    - Test IdeaRepository.findById()
    - Test DocumentRepository.save()
    - Test DocumentRepository.findById()
    - Test DocumentRepository.findByIdeaId()
    - _Requirements: 10.1, 10.2_

### Phase 1: Update Save Operations

- [ ] 1. Update Kiroween Analyzer Save

  - [ ] 1.1 Update saveHackathonAnalysis.ts

    - Accept optional `ideaId` parameter
    - If `ideaId` provided: load existing idea, create document
    - If no `ideaId`: create new idea with source='manual', create document
    - Store audio in document content JSONB field
    - Return { ideaId, documentId, createdAt }
    - _Requirements: 1.3, 1.4, 1.7_

  - [ ] 1.2 Update KiroweenAnalyzerView.tsx

    - Pass `ideaId` to save function when available (from URL params)
    - Handle new response format with ideaId and documentId
    - Update URL after save to include ideaId
    - _Requirements: 1.7_

  - [ ] 1.3 Write unit tests for saveHackathonAnalysis
    - Test with ideaId provided
    - Test without ideaId (creates new idea)
    - Test error handling
    - _Requirements: 1.3, 1.4_

- [ ] 2. Update Classic Analyzer Save

  - [ ] 2.1 Update saveAnalysis.ts

    - Accept optional `ideaId` parameter
    - If `ideaId` provided: load existing idea, create document
    - If no `ideaId`: create new idea with source='manual', create document
    - Store audio in document content JSONB field
    - Return { ideaId, documentId, createdAt }
    - _Requirements: 1.1, 1.2, 1.7_

  - [ ] 2.2 Update AnalyzerView.tsx

    - Pass `ideaId` to save function when available (from URL params)
    - Handle new response format with ideaId and documentId
    - Update URL after save to include ideaId
    - _Requirements: 1.7_

  - [ ] 2.3 Write unit tests for saveAnalysis
    - Test with ideaId provided
    - Test without ideaId (creates new idea)
    - Test error handling
    - _Requirements: 1.1, 1.2_

- [ ] 3. Update Doctor Frankenstein Save

  - [ ] 3.1 Update saveFrankensteinIdea.ts

    - Create idea in ideas table with source='frankenstein'
    - Do NOT create document (no analysis yet)
    - Return { ideaId, createdAt }
    - _Requirements: 1.5, 5.1, 5.2_

  - [ ] 3.2 Update loadFrankensteinIdea.ts

    - Load from ideas table instead of saved_analyses
    - Return idea without documents
    - _Requirements: 5.1_

  - [ ] 3.3 Update updateFrankensteinIdea.ts

    - Update ideas table instead of saved_analyses
    - Update idea_text field
    - _Requirements: 5.5_

  - [ ] 3.4 Update Doctor Frankenstein UI components

    - Handle new response format
    - Pass ideaId when navigating to analyzers via URL params
    - Example: `router.push(\`/analyzer?ideaId=\${ideaId}\`)`
    - _Requirements: 5.3_

  - [ ] 3.5 Update Idea Panel AnalyzeButton component

    - Pass ideaId in URL when navigating to analyzers
    - Support both `/analyzer?ideaId=X` and `/kiroween-analyzer?ideaId=X`
    - _Requirements: 5.3, 6.5_

  - [ ] 3.6 Write unit tests for Frankenstein functions
    - Test idea creation
    - Test idea loading
    - Test idea updating
    - _Requirements: 5.1, 5.2, 5.5_

### Phase 2: Update Load Operations

- [ ] 4. Update List Operations

  - [ ] 4.1 Update loadUserHackathonAnalyses.ts

    - Load from ideas table with document counts
    - Filter for ideas with hackathon_analysis documents
    - Return in unified format
    - Use JOIN with GROUP BY to avoid N+1 queries
    - _Requirements: 2.3, 6.1, 6.2_

  - [ ] 4.2 Verify dashboard uses getUserIdeas()

    - Check UserDashboard.tsx imports
    - Ensure no references to loadUnifiedAnalyses
    - Test dashboard displays ideas correctly
    - Verify document counts show correctly
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 4.3 Mark loadUnifiedAnalyses.ts as deprecated

    - Add deprecation comment
    - Point to getUserIdeas() from idea-panel API
    - Keep for backward compatibility if used elsewhere
    - _Requirements: 6.1_

  - [ ] 4.4 Write unit tests for list operations
    - Test loading ideas with document counts
    - Test filtering by document type
    - Test query uses JOIN (not N+1)
    - _Requirements: 2.3, 6.1_

### Phase 3: Update Modify Operations

- [ ] 5. Update Audio Operations

  - [ ] 5.1 Update updateHackathonAnalysisAudio.ts

    - Try updating documents table first (update content JSONB)
    - Fallback to saved_analyses for legacy data
    - Return success/error
    - _Requirements: 3.1, 3.2_

  - [ ] 5.2 Update updateAnalysisAudio.ts (classic analyzer)

    - Try updating documents table first (update content JSONB)
    - Fallback to saved_analyses for legacy data
    - Return success/error
    - _Requirements: 3.1, 3.2_

  - [ ] 5.3 Write unit tests for audio updates
    - Test updating new documents
    - Test updating legacy analyses
    - Test error handling
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 6. Update Delete Operations

  - [ ] 6.1 Update deleteHackathonAnalysis.ts

    - Try deleting from documents table first
    - Fallback to saved_analyses for legacy data
    - Do NOT delete parent idea
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 6.2 Update delete functionality in classic analyzer

    - Try deleting from documents table first
    - Fallback to saved_analyses for legacy data
    - Do NOT delete parent idea
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 6.3 Write unit tests for delete operations
    - Test deleting new documents
    - Test deleting legacy analyses
    - Test that parent idea is not deleted
    - _Requirements: 4.1, 4.2, 4.5_

### Phase 4: Update Backend Controllers

- [ ] 7. Update AnalysisController

  - [ ] 7.1 Update saveAnalysis() method

    - Accept optional ideaId parameter
    - Create idea if not provided
    - Create document linked to idea
    - Return both IDs
    - _Requirements: 1.1, 1.2, 9.1_

  - [ ] 7.2 Update updateAnalysis() method

    - Try updating documents table first
    - Fallback to saved_analyses for legacy
    - _Requirements: 3.1, 3.2, 9.2_

  - [ ] 7.3 Update deleteAnalysis() method

    - Try deleting from documents table first
    - Fallback to saved_analyses for legacy
    - _Requirements: 4.1, 4.2, 9.2_

  - [ ] 7.4 Write integration tests for controller
    - Test all CRUD operations
    - Test fallback logic
    - Test error handling
    - _Requirements: 9.1, 9.2, 9.3_

### Phase 5: Update Repository Layer

- [ ] 8. Update Repository Documentation

  - [ ] 8.1 Add deprecation comments to SupabaseAnalysisRepository

    - Mark save methods as deprecated
    - Direct to DocumentRepository for new code
    - Keep for legacy read operations
    - _Requirements: 10.1, 10.2_

  - [ ] 8.2 Verify IdeaRepository implementation

    - Ensure all methods work correctly
    - Verify indexes are used
    - Test error handling
    - _Requirements: 10.1, 10.3, 10.4_

  - [ ] 8.3 Verify DocumentRepository implementation
    - Ensure all methods work correctly
    - Verify indexes are used
    - Test error handling
    - _Requirements: 10.2, 10.3, 10.4_

### Phase 6: Integration and Testing

- [ ] 9. Integration Testing

  - [ ] 9.1 Test complete startup analysis flow

    - Create analysis without ideaId
    - Verify idea created in ideas table
    - Verify document created in documents table
    - Load analysis and verify data
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [ ] 9.2 Test complete hackathon analysis flow

    - Create analysis without ideaId
    - Verify idea created in ideas table
    - Verify document created in documents table
    - Load analysis and verify data
    - _Requirements: 1.3, 1.4, 2.1, 2.2_

  - [ ] 9.3 Test Doctor Frankenstein flow

    - Generate Frankenstein idea
    - Verify idea created with source='frankenstein'
    - Verify no document created
    - Analyze the idea
    - Verify document linked to existing idea
    - _Requirements: 1.5, 1.6, 1.7, 5.1, 5.2, 5.3_

  - [ ] 9.4 Test Idea Panel flow

    - Create idea from analyzer
    - Navigate to Idea Panel
    - Create second analysis for same idea
    - Verify both documents linked to same idea
    - _Requirements: 1.7, 6.1, 6.2_

  - [ ] 9.5 Test legacy data compatibility
    - Load legacy startup analysis
    - Load legacy hackathon analysis
    - Update legacy analysis
    - Delete legacy analysis
    - Verify all operations work
    - _Requirements: 2.2, 3.2, 4.2, 7.1, 7.2, 7.3_

- [ ] 10. End-to-End Testing

  - [ ] 10.1 Test user journey: Create startup analysis

    - Navigate to analyzer
    - Enter idea
    - Generate analysis
    - Verify saved to new tables
    - View in dashboard
    - Open Idea Panel
    - _Requirements: All_

  - [ ] 10.2 Test user journey: Create hackathon analysis

    - Navigate to kiroween analyzer
    - Enter project description
    - Generate analysis
    - Verify saved to new tables
    - View in dashboard
    - Open Idea Panel
    - _Requirements: All_

  - [ ] 10.3 Test user journey: Doctor Frankenstein

    - Generate mashup idea
    - Verify appears in dashboard
    - Click "Analyze" from Idea Panel
    - Generate analysis
    - Verify document linked to idea
    - _Requirements: All_

  - [ ] 10.4 Test error scenarios
    - Network failure during save
    - Invalid ideaId provided
    - Database constraint violations
    - Verify user-friendly error messages
    - _Requirements: 3.4, 4.4, 8.5, 9.3_

### Phase 7: Documentation and Cleanup

- [ ] 11. Update Documentation

  - [ ] 11.1 Update API documentation

    - Document new save function signatures
    - Document ideaId parameter usage
    - Document response formats
    - _Requirements: 9.1, 9.2_

  - [ ] 11.2 Update architecture documentation

    - Update data flow diagrams
    - Document table relationships
    - Document migration strategy
    - _Requirements: All_

  - [ ] 11.3 Update README

    - Document new data model
    - Update setup instructions if needed
    - Document backward compatibility
    - _Requirements: All_

  - [ ] 11.4 Create migration guide
    - Document what changed
    - Document how to handle legacy data
    - Document testing checklist
    - _Requirements: All_

- [ ] 12. Code Cleanup

  - [ ] 12.1 Remove unused imports

    - Clean up analyzer files
    - Clean up API files
    - _Requirements: All_

  - [ ] 12.2 Add TypeScript types

    - Ensure all functions have proper types
    - Add JSDoc comments
    - _Requirements: 9.1, 9.2_

  - [ ] 12.3 Run linter and fix issues
    - Fix any ESLint warnings
    - Format code consistently
    - _Requirements: All_

### Phase 8: Final Verification

- [ ] 13. Production Readiness

  - [ ] 13.1 Verify all tests pass

    - Unit tests
    - Integration tests
    - E2E tests
    - _Requirements: All_

  - [ ] 13.2 Verify database indexes exist

    - Check ideas table indexes
    - Check documents table indexes
    - _Requirements: 10.3_

  - [ ] 13.3 Verify RLS policies work

    - Test with different users
    - Verify authorization checks
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 13.4 Performance testing

    - Test with multiple ideas
    - Test with multiple documents per idea
    - Verify query performance
    - _Requirements: 10.3_

  - [ ] 13.5 Manual testing checklist
    - Create startup analysis
    - Create hackathon analysis
    - Generate Frankenstein idea
    - Analyze Frankenstein idea
    - View dashboard
    - Open Idea Panel
    - Update analysis
    - Delete analysis
    - Test with legacy data
    - _Requirements: All_

## Estimated Effort

- Phase 1: 4-6 hours
- Phase 2: 2-3 hours
- Phase 3: 3-4 hours
- Phase 4: 2-3 hours
- Phase 5: 1-2 hours
- Phase 6: 4-6 hours
- Phase 7: 2-3 hours
- Phase 8: 2-3 hours

**Total: 20-30 hours**

## Dependencies

- Idea Panel implementation (already complete)
- Document loading fix (already complete)
- Database migration (already complete)

## Risks

1. **Data Integrity**: Ensure foreign key constraints don't break existing flows
2. **Performance**: Multiple table queries might be slower than single table
3. **Backward Compatibility**: Legacy data must continue to work
4. **User Experience**: Errors must be user-friendly

## Success Criteria

- [ ] All new analyses save to ideas + documents tables
- [ ] All legacy analyses continue to load correctly
- [ ] Dashboard shows all ideas with document counts
- [ ] Idea Panel works with all document types
- [ ] Doctor Frankenstein creates ideas without documents
- [ ] All tests pass
- [ ] No breaking changes to existing functionality
