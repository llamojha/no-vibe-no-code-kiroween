# Implementation Plan

- [x] 1. Set up database schema for document versioning

  - Apply database migration using Supabase MCP
  - Add new document types to CHECK constraint (prd, technical_design, architecture, roadmap)
  - Add version column to documents table
  - Update unique constraint to include version
  - Add indexes for version queries
  - Verify migration using Supabase MCP
  - _Requirements: All requirements depend on this foundation_

- [x] 2. Extend domain layer with new value objects and entities

  - [x] 2.1 Extend DocumentType value object

    - Add PRD, TECHNICAL_DESIGN, ARCHITECTURE, ROADMAP types
    - Add helper methods (isAnalysis, isGeneratedDocument, getDisplayName, getCreditCost, getIcon, getColor)
    - Helper methods MUST delegate to DOCUMENT_TYPE_CONFIGS (single source of truth - no duplication)
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

  - [x] 2.2 Create DocumentVersion value object

    - Implement validation (must be >= 1)
    - Add create and initial factory methods
    - Add increment method
    - Add equals method
    - _Requirements: 11.4, 12.3, 13.4_

  - [x] 2.3 Extend Document entity with version management

    - Add version field
    - Add updateContent method (returns new document with incremented version)
    - Add getVersion and isLatestVersion methods
    - _Requirements: 11.4, 12.3, 13.4_

  - [x] 2.4 Write property test for version increment
    - **Property 10: Version creation on save**
    - **Validates: Requirements 11.4**

- [x] 3. Create document configuration system

  - [x] 3.1 Create document type configuration

    - Create DocumentTypeConfig interface
    - Define DOCUMENT_TYPE_CONFIGS with all 4 types
    - Include display names, icons, colors, credit costs, prompt templates, dependencies, order
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [x] 3.2 Create document utility functions
    - Implement getDocumentDisplayName (delegates to DocumentType.getDisplayName())
    - Implement getDocumentCreditCost (delegates to DocumentType.getCreditCost())
    - Implement getDocumentIcon (delegates to DocumentType.getIcon())
    - Implement getDocumentColor (delegates to DocumentType.getColor())
    - Implement getGeneratorRoute (maps type to static route)
    - Implement getRecommendedNextDocument (checks workflow order)
    - Implement calculateProgress (returns 0-100 based on completed documents)
    - All functions delegate to config or DocumentType methods (no duplication)
    - _Requirements: 1.4, 3.4, 5.4, 7.4, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Create AI prompt templates

  - [x] 4.1 Create PRD prompt template

    - Define PRD_PROMPT_TEMPLATE with sections (Problem Statement, Users, Features, Metrics, Out of Scope)
    - Include placeholders for idea text, analysis scores, analysis feedback
    - _Requirements: 2.1, 17.1, 17.2_

  - [x] 4.2 Create Technical Design prompt template

    - Define TECHNICAL_DESIGN_PROMPT_TEMPLATE with sections (Architecture, Tech Stack, Data Models, APIs, Security, Deployment)
    - Include placeholders for idea text and existing PRD
    - _Requirements: 4.1, 17.1, 17.3_

  - [x] 4.3 Create Architecture prompt template

    - Define ARCHITECTURE_PROMPT_TEMPLATE with sections (System Architecture, Components, Data Flow, Integrations, Scalability)
    - Include placeholders for idea text and existing Technical Design
    - _Requirements: 6.1, 17.1, 17.5_

  - [x] 4.4 Create Roadmap prompt template
    - Define ROADMAP_PROMPT_TEMPLATE with sections (Milestones without timeframes, Prioritization, Dependencies, Resources, Risks)
    - Explicitly instruct AI to avoid specific dates/timeframes - focus on logical ordering and priorities
    - Include placeholders for idea text, existing PRD, and existing Technical Design
    - _Requirements: 8.1, 17.1, 17.4_

- [x] 5. Implement AI document generator adapter

  - [x] 5.1 Create IAIDocumentGeneratorService interface

    - Define generateDocument method with documentType and context parameters
    - Define DocumentGenerationContext interface
    - _Requirements: 2.1, 4.1, 6.1, 8.1_

  - [x] 5.2 Implement GoogleAIDocumentGeneratorAdapter

    - Implement generateDocument method
    - Implement buildPrompt method (selects template based on type)
    - Implement interpolateTemplate method
    - Handle AI service errors
    - _Requirements: 2.2, 4.2, 6.2, 8.2, 19.1, 19.2_

  - [x] 5.3 Write property test for prompt construction

    - **Property 15: Idea text in AI prompt**
    - **Validates: Requirements 17.1**

  - [x] 5.4 Write property test for contextual generation
    - **Property 16: Contextual document generation**
    - **Validates: Requirements 17.3**

- [x] 6. Extend infrastructure layer - repository

  - [x] 6.1 Extend IDocumentRepository interface

    - Add findByIdeaIdAndType method
    - Add findLatestVersion method
    - Add findAllVersions method
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 6.2 Extend SupabaseDocumentRepository implementation

    - Implement findByIdeaIdAndType query
    - Implement findLatestVersion query (ORDER BY version DESC LIMIT 1)
    - Implement findAllVersions query (ORDER BY version DESC)
    - Handle version-related database errors
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 6.3 Write property test for version queries
    - **Property 11: Version history ordering**
    - **Validates: Requirements 12.3**

- [x] 7. Implement application layer - use cases

  - [x] 7.1 Implement GenerateDocumentUseCase

    - Load idea and existing documents
    - Check credit balance
    - Deduct credits
    - Generate document with AI (include context from existing docs)
    - Save document to repository
    - Return document DTO
    - On error: refund credits and throw
    - _Requirements: 2.1, 2.2, 2.4, 4.1, 4.2, 4.4, 6.1, 6.2, 6.4, 8.1, 8.2, 8.4, 15.1, 15.2, 15.3, 15.4, 15.5, 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 7.2 Implement UpdateDocumentUseCase

    - Load current document (latest version by idea_id + document_type)
    - Call document.updateContent() to create NEW document entity with NEW UUID and incremented version
    - Save new document as a NEW ROW in database (old version preserved as separate row)
    - Return new document DTO with new ID and incremented version number
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 7.3 Implement RegenerateDocumentUseCase

    - Load idea and existing documents
    - Check credit balance
    - Deduct credits
    - Generate new content with AI
    - Create new version preserving old version
    - Save new version
    - Return document DTO
    - On error: refund credits and throw
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 7.4 Implement GetDocumentVersionsUseCase

    - Load all versions for document
    - Sort by version descending
    - Return DTOs
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 7.5 Implement RestoreDocumentVersionUseCase

    - Load specified version
    - Create new version with that content
    - Save as latest version
    - Return document DTO
    - _Requirements: 12.4, 12.5_

  - [x] 7.6 Implement ExportDocumentUseCase

    - Load document
    - Format based on export type (pdf/markdown)
    - Include metadata (title, version, date)
    - Return file buffer and metadata
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 7.7 Write property test for credit deduction

    - **Property 5: Credit deduction on generation**
    - **Validates: Requirements 2.2, 4.2, 6.2, 8.2**

  - [x] 7.8 Write property test for credit refund

    - **Property 17: Credit refund on generation failure**
    - **Validates: Requirements 19.1**

  - [x] 7.9 Write property test for no deduction on insufficient credits
    - **Property 14: No credit deduction on insufficient balance**
    - **Validates: Requirements 15.5**

- [x] 8. Checkpoint - Ensure all backend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement web layer - API routes and controllers

  - [x] 9.1 Create DocumentGeneratorController

    - Implement generateDocument handler
    - Implement updateDocument handler
    - Implement regenerateDocument handler
    - Implement getVersions handler
    - Implement restoreVersion handler
    - Implement exportDocument handler
    - Add authentication middleware
    - Add feature flag checks
    - _Requirements: 2.1, 4.1, 6.1, 8.1, 11.2, 12.1, 12.5, 13.1, 14.1, 21.1, 21.2_

  - [x] 9.2 Create Next.js API routes

    - Create POST /api/v2/documents/generate
    - Create PUT /api/v2/documents/[documentId]
    - Create POST /api/v2/documents/[documentId]/regenerate
    - Create GET /api/v2/documents/[documentId]/versions
    - Create POST /api/v2/documents/[documentId]/versions/[version]/restore
    - Create GET /api/v2/documents/[documentId]/export
    - _Requirements: 2.1, 4.1, 6.1, 8.1, 11.2, 12.1, 12.5, 13.1, 14.1_

  - [x] 9.3 Write integration tests for API routes
    - Test complete document generation flow
    - Test credit system integration
    - Test feature flag protection
    - Test error handling and rollback
    - Test version management
    - Test export functionality

- [x] 10. Implement feature layer - client-side API wrappers

  - Create document generation API client functions
  - Implement generateDocument function
  - Implement updateDocument function
  - Implement regenerateDocument function
  - Implement getDocumentVersions function
  - Implement restoreDocumentVersion function
  - Implement exportDocument function
  - _Requirements: 2.1, 4.1, 6.1, 8.1, 11.2, 12.1, 12.5, 13.1, 14.1_

- [x] 11. Implement shared generator components

  - [x] 11.1 Create DocumentGenerator component (shared by all generator pages)

    - Display idea context section (idea text, analysis summary)
    - Display existing documents section (show related docs if available)
    - Display credit cost
    - Implement generate button with loading state
    - Implement credit balance check
    - Implement generation flow with progress feedback
    - Handle errors and display user-friendly messages
    - Navigate back to Idea Panel on success
    - Reuse existing analyzer component styles
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5, 5.3, 5.4, 5.5, 6.2, 6.3, 6.4, 6.5, 7.3, 7.4, 7.5, 8.2, 8.3, 8.4, 8.5, 15.1, 15.2, 15.3, 15.4, 16.1, 16.2, 16.3, 16.4, 16.5, 19.3, 19.4, 19.5_

  - [x] 11.2 Create generator page routes

    - Create app/generate/prd/[ideaId]/page.tsx
    - Create app/generate/technical-design/[ideaId]/page.tsx
    - Create app/generate/architecture/[ideaId]/page.tsx
    - Create app/generate/roadmap/[ideaId]/page.tsx
    - All pages use DocumentGenerator component with different documentType
    - _Requirements: 1.2, 3.2, 5.2, 7.2_

  - [x] 11.3 Write property test for generator page navigation

    - **Property 1: Generator page navigation**
    - **Validates: Requirements 1.2, 3.2, 5.2, 7.2**

  - [x] 11.4 Write property test for context display

    - **Property 2: Context display on generator pages**
    - **Validates: Requirements 1.3, 3.3, 5.3, 7.3**

  - [x] 11.5 Write property test for credit cost display
    - **Property 3: Credit cost display**
    - **Validates: Requirements 1.4, 3.4, 5.4, 7.4**

- [x] 12. Implement document display components

  - [x] 12.1 Create DocumentCard component (shared for all document types)

    - Display document type with icon and color
    - Display document creation date and last updated
    - Display content preview
    - Support expand/collapse for full content
    - Display Edit button
    - Display Regenerate button
    - Display Version History button
    - Display Export button
    - Adapt display based on document type
    - Reuse existing card styles
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 12.1, 13.1, 14.1_

  - [x] 12.2 Create DocumentEditor component

    - Implement markdown editor with syntax highlighting
    - Add preview mode
    - Add auto-save (debounced)
    - Add character count
    - Add save status indicator
    - Add undo/redo
    - Add keyboard shortcuts
    - Support accessibility (keyboard navigation, ARIA labels)
    - Reuse existing input styles
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 12.3 Create VersionHistoryModal component

    - Display all versions with timestamps
    - Show version numbers in descending order
    - Allow selecting and viewing previous versions
    - Add Restore button for each version
    - Reuse existing modal styles
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 12.4 Create ExportControls component

    - Display Export button
    - Show format options (Markdown, PDF)
    - Handle export download
    - Show loading state during export
    - Reuse existing button styles
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 12.5 Write property test for edit button visibility

    - **Property 9: Edit button visibility**
    - **Validates: Requirements 11.1**

  - [x] 12.6 Write property test for export format
    - **Property 13: Export format correctness**
    - **Validates: Requirements 14.3**

- [ ] 13. Implement document progress indicator

  - [x] 13.1 Create DocumentProgressIndicator component

    - Display workflow steps (Analysis → PRD → Technical Design → Architecture → Roadmap)
    - Mark completed documents
    - Mark pending documents
    - Highlight next recommended document
    - Display progress percentage
    - Reuse existing progress bar styles
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 13.2 Create document generation buttons

    - Create GeneratePRDButton
    - Create GenerateTechnicalDesignButton
    - Create GenerateArchitectureButton
    - Create GenerateRoadmapButton
    - All buttons navigate to appropriate generator page
    - All buttons are always enabled (no dependencies - users can generate any document at any time)
    - Hide buttons when feature flag is disabled
    - Reuse existing button styles
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 5.1, 5.2, 7.1, 7.2, 21.1, 21.3_

  - [x] 13.3 Write property test for progress indicator

    - **Property 8: Progress indicator completion marking**
    - **Validates: Requirements 9.3**

  - [x] 13.4 Write property test for feature flag
    - **Property 18: Feature flag controls button visibility**
    - **Validates: Requirements 21.1**

- [x] 14. Integrate with Idea Panel

  - [x] 14.1 Update IdeaPanelView component

    - Add DocumentProgressIndicator
    - Add document generation buttons section
    - Extend DocumentsList to show generated documents
    - Use DocumentCard for displaying generated documents
    - Maintain existing layout and styles
    - _Requirements: 1.1, 9.1, 10.1, 10.2_

  - [x] 14.2 Update Idea Panel navigation
    - Ensure navigation from generator pages back to panel works correctly
    - Display newly generated documents after navigation
    - _Requirements: 2.5, 4.5, 6.5, 8.5_

- [x] 15. Implement service factory updates

  - [x] 15.1 Update RepositoryFactory

    - Ensure document repository supports new methods
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 15.2 Update ServiceFactory

    - Add createAIDocumentGeneratorService method
    - Add createPDFExportService method
    - Add createMarkdownExportService method
    - _Requirements: 2.1, 4.1, 6.1, 8.1, 14.1_

  - [x] 15.3 Update UseCaseFactory
    - Add createGenerateDocumentUseCase method
    - Add createUpdateDocumentUseCase method
    - Add createRegenerateDocumentUseCase method
    - Add createGetDocumentVersionsUseCase method
    - Add createRestoreDocumentVersionUseCase method
    - Add createExportDocumentUseCase method
    - _Requirements: 2.1, 4.1, 6.1, 8.1, 11.2, 12.1, 12.5, 13.1, 14.1_

- [x] 16. Configure feature flags

  - Add ENABLE_DOCUMENT_GENERATION to feature flags config
  - Set default to true for initial deployment
  - Document feature flag usage
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [x] 17. Checkpoint - Ensure all frontend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Write E2E tests for critical user workflows

  - Test complete document generation flow (navigate to generator → generate PRD → view in panel)
  - Test insufficient credits error handling
  - Test feature flag behavior (buttons hidden when disabled)
  - _Requirements: Core requirements validation (1.2, 2.1-2.5, 15.1-15.5, 21.1)_

- [x] 19. Add analytics tracking

  - Track document generation requests (by type)
  - Track document generation success/failure rates
  - Track credit usage per document type
  - Track document editing events
  - Track version history usage
  - Track document regeneration events
  - Track export functionality usage (by format)
  - Track feature flag adoption
  - _Requirements: All requirements for observability_

- [x] 20. Update documentation

  - [x] 20.1 Update API documentation

    - Document new API endpoints
    - Document request/response formats
    - Document error codes
    - _Requirements: All requirements for maintainability_

  - [x] 20.2 Update feature documentation

    - Add user guide for document generation
    - Document workflow (Analysis → PRD → Technical Design → Architecture → Roadmap)
    - Document editing and version management
    - Document export functionality
    - _Requirements: All requirements for maintainability_

  - [x] 20.3 Update developer documentation
    - Document how to add new document types
    - Document configuration system
    - Document AI prompt templates
    - Document credit system integration
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 21. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify database migration completed successfully
  - Verify all 4 document types can be generated
  - Verify credit system integration works correctly
  - Verify version management works correctly
  - Verify export functionality works for both formats
  - Verify feature flag controls access correctly
  - Verify UI matches existing design system
  - Verify accessibility compliance
  - Verify mobile responsiveness
  - Verify analytics tracking is working
  - Verify documentation is complete
