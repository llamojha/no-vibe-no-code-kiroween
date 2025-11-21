# Implementation Plan

- [x] 1. Set up database schema and migrations

  - [x] 1.1 Apply migration using Supabase MCP `apply_migration` tool

    - Create `ideas` table with proper schema
    - Create `documents` table with proper schema
    - Create indexes for performance (user_id, status, updated_at, idea_id)
    - Migrate all ideas from `saved_analyses` to `ideas` table
    - Migrate all analyses from `saved_analyses` to `documents` table
    - Enable Row Level Security (RLS) on both tables
    - Create RLS policies for both tables
    - Create triggers for auto-updating `updated_at` timestamps
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.2 Verify migration using Supabase MCP `list_tables` tool

    - Confirm `ideas` table exists
    - Confirm `documents` table exists
    - _Requirements: 8.1, 8.2_

  - [x] 1.3 Verify migration counts using Supabase MCP `execute_sql` tool

    - Confirm ideas_count = saved_analyses_count
    - Confirm documents_count = saved_analyses_count - frankenstein_count
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 1.4 Verify foreign key constraints using Supabase MCP `execute_sql` tool

    - Confirm FK from ideas.user_id to auth.users.id
    - Confirm FK from documents.idea_id to ideas.id
    - Confirm FK from documents.user_id to auth.users.id
    - _Requirements: 8.3_

  - [x] 1.5 Verify RLS policies using Supabase MCP `execute_sql` tool

    - Confirm 2 policies exist (1 for ideas, 1 for documents)
    - _Requirements: All_

  - [x] 1.6 Verify triggers using Supabase MCP `execute_sql` tool

    - Confirm `trigger_update_ideas_timestamp` exists
    - Confirm `trigger_update_documents_timestamp` exists
    - _Requirements: 3.4, 4.4_

  - [x] 1.7 Verify data integrity using Supabase MCP `execute_sql` tool
    - Confirm no orphaned documents (documents without ideas)
    - _Requirements: 8.3, 8.4_

- [x] 2. Implement domain layer entities and value objects

  - [x] 2.1 Create value objects

    - Create IdeaSource value object (MANUAL, FRANKENSTEIN)
    - Create DocumentType value object (STARTUP_ANALYSIS, HACKATHON_ANALYSIS)
    - Create ProjectStatus value object (IDEA, IN_PROGRESS, COMPLETED, ARCHIVED)
    - Add equality comparison methods
    - _Requirements: 3.1, 9.4_

  - [x] 2.2 Create Idea aggregate root entity

    - Implement create and reconstruct factory methods
    - Add updateStatus method (validates status transitions)
    - Add updateNotes method
    - Add addTag and removeTag methods
    - Add getTags and getIdeaText methods
    - Encapsulate IdeaId and UserId as value objects
    - _Requirements: 1.3, 3.1, 3.3, 4.3, 5.2, 5.3, 9.2_

  - [x] 2.3 Create Document entity

    - Implement create and reconstruct factory methods
    - Add getContent and getType methods
    - Encapsulate DocumentId, IdeaId, and UserId as value objects
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 2.4 Write property test for notes round-trip

    - **Property: Notes round-trip**
    - **Validates: Requirements 4.5**

  - [x] 2.5 Write property test for tags round-trip
    - **Property: Tags round-trip**
    - **Validates: Requirements 5.5**

- [x] 3. Implement domain repository interfaces

  - Create IIdeaRepository interface
  - Define save, update, delete methods
  - Define findById, findByUserId query methods
  - Create IDocumentRepository interface
  - Define save, delete methods
  - Define findById, findByIdeaId, findByUserId query methods
  - _Requirements: 1.3, 2.1, 3.3, 4.3, 5.4, 8.3_

- [x] 4. Implement domain errors

  - Create IdeaNotFoundError
  - Create DocumentNotFoundError
  - Create InvalidProjectStatusError
  - Create FeatureDisabledError
  - Create UnauthorizedAccessError
  - _Requirements: 3.1, 7.2_

- [x] 5. Implement infrastructure layer - database repositories

  - [x] 5.1 Create IdeaMapper for entity/DAO/DTO conversions

    - Implement toDAO method (entity → database format)
    - Implement toDomain method (database → entity)
    - Implement toDTO method (entity → API response)
    - Map structured fields (notes, tags) directly
    - _Requirements: 1.3, 3.1, 4.3, 5.4, 9.2, 9.3, 9.4, 9.5_

  - [x] 5.2 Create DocumentMapper for entity/DAO/DTO conversions

    - Implement toDAO method (entity → database format)
    - Implement toDomain method (database → entity)
    - Implement toDTO method (entity → API response)
    - Handle JSONB content field
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 5.3 Implement SupabaseIdeaRepository

    - Implement save method (INSERT new idea)
    - Implement update method (UPDATE existing idea, updated_at handled by trigger)
    - Implement delete method (DELETE idea)
    - Implement findById query (single idea by id)
    - Implement findByUserId query (all ideas for user, ordered by updated_at DESC)
    - Use Supabase MCP `execute_sql` tool to test repository methods during development
    - Handle database errors and convert to domain errors
    - _Requirements: 1.3, 3.3, 4.3, 5.4, 9.1_

  - [x] 5.4 Implement SupabaseDocumentRepository

    - Implement save method (INSERT new document)
    - Implement delete method (DELETE document)
    - Implement findById query (single document by id)
    - Implement findByIdeaId query (all documents for idea, ordered by created_at DESC)
    - Implement findByUserId query (all documents for user)
    - Use Supabase MCP `execute_sql` tool to test repository methods during development
    - Handle database errors and convert to domain errors
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 5.5 Write property test for status persistence

    - **Property: Status updates are persisted**
    - **Validates: Requirements 3.3**

  - [x] 5.6 Write property test for metadata persistence
    - **Property: Notes are persisted**
    - **Property: Tags are persisted**
    - **Validates: Requirements 4.3, 5.4**

- [x] 6. Implement application layer - use cases

  - [x] 6.1 Implement GetIdeaWithDocumentsUseCase

    - Verify user owns the idea (authorization check)
    - Load idea by id
    - Load all documents for idea
    - Return combined IdeaWithDocumentsDTO
    - Handle errors (IdeaNotFoundError, UnauthorizedAccessError)
    - _Requirements: 1.2, 1.3, 2.1, 2.2_

  - [x] 6.2 Implement UpdateIdeaStatusUseCase

    - Load idea by id
    - Validate new status (use ProjectStatus value object)
    - Update idea status using domain method
    - Persist changes (updated_at handled by database trigger)
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 6.3 Implement SaveIdeaMetadataUseCase

    - Load idea by id
    - Update notes using domain method (if provided)
    - Update tags using domain methods (addTag/removeTag if provided)
    - Persist changes (updated_at handled by database trigger)
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3, 5.4_

  - [x] 6.4 Implement GetUserIdeasUseCase

    - Load all ideas for user
    - Load document counts for each idea
    - Return array of IdeaWithDocumentsDTO
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.5 Implement GetDocumentsByIdeaUseCase

    - Load all documents for idea
    - Return array of DocumentDTO
    - _Requirements: 2.1, 2.2_

  - [x] 6.6 Write property test for document type detection
    - **Property: Document type is detected correctly**
    - **Validates: Requirements 2.3, 2.4**

- [x] 7. Checkpoint - Ensure all backend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement web layer - API routes

  - [x] 8.1 Create IdeaPanelController

    - Implement getIdeaPanel handler
    - Implement updateStatus handler
    - Implement saveMetadata handler
    - Add authentication middleware
    - Add feature flag checks
    - _Requirements: 1.2, 1.3, 3.3, 4.3, 5.4, 7.1, 7.2_

  - [x] 8.2 Create Next.js API routes for ideas

    - Create /api/v2/ideas/route.ts (GET for list, POST for create)
    - Create /api/v2/ideas/[ideaId]/route.ts (GET for single idea with documents)
    - Create /api/v2/ideas/[ideaId]/status/route.ts (PUT for status update)
    - Create /api/v2/ideas/[ideaId]/metadata/route.ts (PUT for notes/tags)
    - _Requirements: 1.2, 3.3, 4.3, 5.4, 9.1_

  - [x] 8.3 Create Next.js API routes for documents

    - Create /api/v2/ideas/[ideaId]/documents/route.ts (GET for list)
    - _Requirements: 2.1_

  - [x] 8.4 Write integration tests for API routes
    - Test complete idea creation flow
    - Test status update flow
    - Test metadata save flow
    - Test document listing flow
    - Test feature flag protection
    - Test authentication and authorization

- [x] 9. Implement feature layer - client-side API wrappers

  - Create idea panel API client functions
  - Implement getIdeaWithDocuments function
  - Implement getUserIdeas function
  - Implement updateStatus function
  - Implement saveMetadata function
  - Implement getDocumentsByIdea function
  - _Requirements: 1.2, 2.1, 3.3, 4.3, 5.4, 9.1_

- [x] 10. Implement feature layer - UI components (Panel structure)

  - [x] 10.1 Create IdeaPanelLayout component

    - Implement full-screen layout
    - Add breadcrumb navigation
    - Make responsive for mobile
    - Add ARIA labels for accessibility
    - _Requirements: 1.4, 1.5, 6.2, 6.3_

  - [x] 10.2 Create IdeaDetailsSection component

    - Display idea text prominently
    - Display idea source (manual or frankenstein)
    - Display creation date
    - _Requirements: 1.3, 9.2, 9.4_

  - [x] 10.3 Create DocumentsListSection component

    - Display list of all documents
    - Show "No analyses yet" when no documents
    - Display document type (startup_analysis or hackathon_analysis)
    - Display document creation date
    - Support expandable/collapsible document details
    - Display startup analysis fields (viability, innovation, market scores)
    - Display hackathon analysis fields (technical, creativity, impact scores)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 10.4 Create ProjectStatusControl component

    - Display current status
    - Provide status update dropdown/buttons
    - Update status indicator immediately on change
    - Display last updated timestamp
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 10.5 Create AnalyzeButton component
    - Display "Analyze" button
    - Show dropdown with analysis type options (Startup, Hackathon)
    - Navigate to appropriate analyzer page with idea pre-filled
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 11. Implement feature layer - UI components (Metadata management)

  - [x] 11.1 Create NotesSection component

    - Display notes textarea
    - Enable save button on edit
    - Handle save action
    - Display previously saved notes
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 11.2 Create TagsSection component
    - Display tags list
    - Provide add tag input
    - Provide remove tag buttons
    - Handle tag save action
    - Display previously saved tags
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 12. Implement feature layer - main page components

  - [x] 12.1 Create IdeaPanelView component

    - Integrate IdeaPanelLayout
    - Integrate IdeaDetailsSection
    - Integrate DocumentsListSection
    - Integrate ProjectStatusControl
    - Integrate AnalyzeButton
    - Integrate NotesSection
    - Integrate TagsSection
    - Manage component state and data flow
    - Handle feature flag checks
    - _Requirements: 1.3, 2.1, 3.1, 4.1, 5.1, 7.1, 10.1_

  - [x] 12.2 Update Dashboard to show ideas

    - Update to fetch from ideas table (not saved_analyses)
    - Create IdeaCard component
    - Display idea text
    - Display document count
    - Display idea source badge (manual/frankenstein)
    - Display project status
    - Add "Manage" button when ENABLE_IDEA_PANEL is true
    - Handle navigation to panel route
    - Add touch-friendly button sizing for mobile
    - _Requirements: 1.1, 1.2, 6.4, 7.1, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 12.3 Create Next.js page route
    - Create app/idea-panel/[ideaId]/page.tsx
    - Implement server-side data loading
    - Add authentication check
    - Add feature flag check
    - Return 404 if feature disabled
    - _Requirements: 1.2, 7.2_

- [ ] 13. Update analyzer pages to save to new tables

  - [ ] 13.1 Update startup analyzer

    - When analysis completes, check if idea exists in ideas table
    - If not, create idea entry (source='manual')
    - Create document entry (type='startup_analysis')
    - Link document to idea via idea_id
    - _Requirements: 8.1, 8.2, 8.3, 10.4_

  - [ ] 13.2 Update hackathon analyzer

    - When analysis completes, check if idea exists in ideas table
    - If not, create idea entry (source='manual')
    - Create document entry (type='hackathon_analysis')
    - Link document to idea via idea_id
    - _Requirements: 8.1, 8.2, 8.3, 10.4_

  - [ ] 13.3 Update Doctor Frankenstein

    - When idea is generated, create idea entry (source='frankenstein')
    - Do NOT create document entry (no analysis yet)
    - User can analyze later from panel or analyzer pages
    - _Requirements: 8.1, 8.2, 9.4_

  - [ ] 13.4 Add pre-fill functionality to analyzers
    - Accept ideaId query parameter
    - Load idea text from ideas table
    - Pre-fill analyzer form with idea text
    - After analysis, link document to existing idea
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 14. Implement feature flag configuration

  - Add ENABLE_IDEA_PANEL to featureFlags.config.ts
  - Add environment variable checks
  - Document feature flag usage
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 15. Implement service factory updates

  - [ ] 15.1 Update RepositoryFactory

    - Add createIdeaRepository method
    - Add createDocumentRepository method
    - _Requirements: 1.3, 2.1_

  - [ ] 15.2 Update UseCaseFactory
    - Add createGetIdeaWithDocumentsUseCase method
    - Add createUpdateIdeaStatusUseCase method
    - Add createSaveIdeaMetadataUseCase method
    - Add createGetUserIdeasUseCase method
    - Add createGetDocumentsByIdeaUseCase method
    - _Requirements: 1.2, 2.1, 3.3, 4.3, 5.4, 9.1_

- [ ] 16. Checkpoint - Ensure all frontend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 17. Write E2E tests for complete user workflows

  - Test navigation from dashboard to idea panel
  - Test viewing idea details and documents in panel
  - Test status updates
  - Test notes management
  - Test tags management
  - Test feature flag behavior
  - Test responsive design on mobile viewport
  - Test keyboard navigation and accessibility
  - Test creating new analysis from panel
  - Test Doctor Frankenstein → Idea Panel flow
  - Test manual idea → analysis → panel flow

- [ ] 18. Add analytics tracking

  - Track idea panel opens
  - Track status updates
  - Track notes saves
  - Track tags management
  - Track document views
  - Track analyze button clicks
  - _Requirements: All requirements for observability_

- [ ] 19. Update feature-specific documentation

  - Update API documentation with new endpoints
  - Document feature flag configuration
  - Add user guide for Idea Panel feature
  - Document database schema changes (ideas and documents tables)
  - Document migration process
  - Document the relationship between ideas and documents
  - _Requirements: All requirements for maintainability_

- [ ] 20. Update project-level documentation

  - Update PRD.md to include Idea Panel feature description
  - Update README.md with Idea Panel feature overview
  - Update any architecture documentation with new routes and components
  - Document the new data model (ideas → documents)
  - Document backward compatibility with saved_analyses
  - Add Idea Panel to feature list in project documentation
  - _Requirements: All requirements for maintainability_

- [ ] 21. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify migration completed successfully
  - Verify backward compatibility maintained
  - Verify feature flag works correctly
