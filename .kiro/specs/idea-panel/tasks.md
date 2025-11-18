# Implementation Plan

- [ ] 1. Set up database schema and migrations

  - Use Supabase MCP `apply_migration` tool to create migration for saved_analyses table extensions (project_status, panel_metadata columns)
  - Use Supabase MCP `apply_migration` tool to create index for faster panel lookups by user and status
  - Use Supabase MCP `list_tables` and `execute_sql` tools to verify migrations applied correctly
  - Test that existing analyses are not affected by schema changes
  - _Requirements: 3.1, 3.3, 4.3, 5.4_

- [ ] 2. Implement domain layer entities and value objects

  - [ ] 2.1 Create ProjectStatus value object

    - Implement IDEA, IN_PROGRESS, COMPLETED constants
    - Add equality comparison method
    - _Requirements: 3.1, 3.3_

  - [ ] 2.2 Create IdeaPanel aggregate root entity

    - Implement create and reconstruct factory methods
    - Add updateStatus method
    - Add updateNotes method
    - Add addTag and removeTag methods
    - Add getTags method
    - _Requirements: 1.3, 3.1, 3.3, 4.3, 5.2, 5.3_

  - [ ]\* 2.3 Write property test for notes round-trip

    - **Property 12: Notes round-trip**
    - **Validates: Requirements 4.5**

  - [ ]\* 2.4 Write property test for tags round-trip
    - **Property 17: Tags round-trip**
    - **Validates: Requirements 5.5**

- [ ] 3. Implement domain repository interface

  - Create IIdeaPanelRepository interface
  - Define save, update methods
  - Define findById, findByAnalysisId, findByUserId query methods
  - _Requirements: 1.3, 3.3, 4.3, 5.4_

- [ ] 4. Implement domain errors

  - Create IdeaPanelNotFoundError
  - Create InvalidProjectStatusError
  - Create FeatureDisabledError
  - Create UnauthorizedAccessError
  - _Requirements: 3.1, 7.2_

- [ ] 5. Implement infrastructure layer - database repository

  - [ ] 5.1 Create IdeaPanelMapper for entity/DAO/DTO conversions

    - Implement toDAO method
    - Implement toDomain method
    - Implement toDTO method
    - Handle panel_metadata JSON serialization
    - _Requirements: 1.3, 3.1, 4.3, 5.4_

  - [ ] 5.2 Implement SupabaseIdeaPanelRepository

    - Implement save method
    - Implement update method with optimistic locking
    - Implement findById query
    - Implement findByAnalysisId query (create panel if not exists)
    - Implement findByUserId query
    - Use Supabase MCP `execute_sql` tool to test repository methods during development
    - _Requirements: 1.3, 3.3, 4.3, 5.4_

  - [ ]\* 5.3 Write property test for status persistence

    - **Property 5: Status updates are persisted**
    - **Validates: Requirements 3.3**

  - [ ]\* 5.4 Write property test for metadata persistence
    - **Property 10: Notes are persisted**
    - **Property 16: Tags are persisted**
    - **Validates: Requirements 4.3, 5.4**

- [ ] 6. Implement application layer - use cases

  - [ ] 6.1 Implement OpenIdeaPanelUseCase

    - Check if panel exists for analysis, create if not
    - Load analysis data
    - Return panel DTO with analysis data
    - _Requirements: 1.2, 1.3_

  - [ ] 6.2 Implement GetPanelDataUseCase

    - Load panel data
    - Load analysis data
    - Combine into PanelDataDTO
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 6.3 Implement UpdatePanelStatusUseCatabase repositories

- Validate new status

  - Update panel status
  - Persist changes
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 6.4 Implement SavePanelMetadataUseCase

  - Update notes and/or tags
  - Update timestamp
  - Persist changes
  - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3, 5.4_

- [ ]\* 6.5 Write property test for analysis type detection

  - **Property 25: Analysis type is detected automatically**
  - **Validates: Requirements 8.3**

- [ ] 7. Checkpoint - Ensure all backend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement web layer - API routes

  - [ ] 8.1 Create IdeaPanelController

    - Implement openPanel handler
    - Implement getPanelData handler
    - Implement updateStatus handler
    - Implement saveMetadata handler
    - Add authentication middleware
    - Add feature flag checks
    - _Requirements: 1.2, 1.3, 3.3, 4.3, 5.4, 7.1, 7.2_

  - [ ] 8.2 Create Next.js API routes

    - Create /api/v2/idea-panel/[analysisId]/route.ts (GET for panel data)
    - Create /api/v2/idea-panel/[analysisId]/status/route.ts (PUT for status update)
    - Create /api/v2/idea-panel/[analysisydata/route.ts (PUT for notes/tags)
    - _Requirements: 1.2, 3.3, 4.3, 5.4_

  - [ ]\* 8.3 Write integration tests for API routes
    - Test complete panel creation flow
    - Test status update flow
    - Test metadata save flow
    - Test feature flag protection
    - Test authentication and authorization

- [ ] 9. Implement feature layer - client-side API wrappers

  - Create idea panel API client functions
  - Implement openIdeaPanel function
  - Implement getPanelData function
  - Implement updateStatus function
  - Implement saveMetadata function
  - _Requirements: 1.2, 3.3, 4.3, 5.4_

- [ ] 10. Implement feature layer - UI components (Panel structure)

  - [ ] 10.1 Create IdeaPanelLayout component

    - Implement full-screen layout
    - Add breadcrumb navigation
    - Make responsive for mobile
    - Add ARIA labels for accessibility
    - _Requirements: 1.4, 1.5, 6.2, 6.3_

  - [ ] 10.2 Create AnalysisDetailsSection component

    - Display idea title and description prominently
    - Display all analysis scores in visual format
    - Display strengths section
    - Display weaknesses section
    - Display recommendations section
    - Support both standard and hackathon analysis types
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.4, 8.5_

  - [ ] 10.3 Create ProjectStatusControl component
    - Display current status
    - Provide status update dropdown/buttons
    - Update status indicator immediately on c
    - Display creation date and last updated timestamp
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 11. Implement feature layer - UI components (Metadata management)

  - [ ] 11.1 Create NotesSection component

    - Display notes textarea
    - Enable save button on edit
    - Handle save action
    - Display previously saved notes
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 11.2 Create TagsSection component
    - Display tags list
    - Provide add tag input
    - Provide remove tag buttons
    - Handle tag save action
    - Display previously saved tags
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 12. Implement feature layer - main page components

  - [ ] 12.1 Create IdeaPanelView component

    - Integrate IdeaPanelLayout
    - Integrate AnalysisDetailsSection
    - Integrate ProjectStatusControl
    - Integrate NotesSection
    - Integrate TagsSection
    - Manage component state and data flow
    - Handle feature flag checks
    - _Requirements: 1.3, 2.1, 3.1, 4.1, 5.1, 7.1_

  - [ ] 12.2 Update AnalysisCard component

    - Add "Manage" button when ENABLE_IDEA_PANEL is true
    - Handle navigatioa panel route
    - Add touch-friendly button sizing for mobile
    - _Requirements: 1.1, 1.2, 6.4, 7.1_

  - [ ] 12.3 Create Next.js page route
    - Create app/idea-panel/[analysisId]/page.tsx
    - Implement server-side data loading
    - Add authentication check
    - Add feature flag check
    - Return 404 if feature disabled
    - _Requirements: 1.2, 7.2_

- [ ] 13. Implement feature flag configuration

  - Add ENABLE_IDEA_PANEL to featureFlags.config.ts
  - Add environment variable checks
  - Document feature flag usage
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. Implement service factory updates

  - [ ] 14.1 Update RepositoryFactory

    - Add createIdeaPanelRepository method
    - _Requirements: 1.3_

  - [ ] 14.2 Update UseCaseFactory
    - Add createOpenIdeaPanelUseCase method
      -etPanelDataUseCase method
    - Add createUpdatePanelStatusUseCase method
    - Add createSavePanelMetadataUseCase method
    - _Requirements: 1.2, 3.3, 4.3, 5.4_

- [ ] 15. Checkpoint - Ensure all frontend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 16. Write E2E tests for complete user workflows

  - Test navigation from dashboard to idea panel
  - Test viewing analysis details
  - Test status updates
  - Test notes management
  - Test tags management
  - Test feature flag behavior
  - Test responsive design on mobile viewport
  - Test keyboard navigation and accessibility
  - Test both standard and hackathon analysis types

- [ ] 17. Add analytics tracking

  - Track idea panel opens
  - Track status updates
  - Track notes saves
  - Track tags management
  - _Requirements: All requirements for observability_

- [ ] 18. Update feature-specific documentation

  - Update API documentation with new endpoints
  - Document feature flag configuration
  - Add user guide for Idea Panel feature
  - Document database schema changes
  - _Requirements: All requirements for maintainability_

- [ ] 19. Update project-level documentation

  - Update PRD.md to include Idea Panel feature description
  - Update README.md with Idea Panel feature overview
  - Update any architecture documentation with new routes and components
  - Document the relationship between analyses and idea panels
  - Add Ideaature list in project documentation
  - _Requirements: All requirements for maintainability_

- [ ] 20. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
