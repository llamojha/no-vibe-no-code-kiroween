# Implementation Plan

## Kiro Setup Export Feature

This implementation plan covers the export functionality that transforms generated project documentation (PRD, Design Document, Tech Architecture, Roadmap) into a ready-to-use Kiro workspace setup.

---

- [ ] 1. Set up project dependencies and infrastructure foundation

  - [ ] 1.1 Install JSZip library for ZIP file generation
    - Run `npm install jszip@^3.10.1`
    - Add type definitions if needed
    - _Requirements: 1.2, 11.1_
  - [ ] 1.2 Create export infrastructure folder structure
    - Create `src/infrastructure/export/` directory
    - Create index.ts for exports
    - _Requirements: 1.2_

- [ ] 2. Implement Document Validation Service

  - [ ] 2.1 Create DocumentValidator service
    - Create `src/application/services/DocumentValidator.ts`
    - Implement validation for document existence (PRD, Design, Tech Architecture, Roadmap)
    - Implement validation for non-empty document content
    - Return ValidationResult with missing/empty document lists
    - _Requirements: 9.1, 9.2, 9.4, 9.5_
  - [ ]\* 2.2 Write property test for validation correctness
    - **Property 6: Validation Correctness**
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.5**
  - [ ]\* 2.3 Write unit tests for DocumentValidator
    - Test validation with complete document sets
    - Test validation with missing documents
    - Test validation with empty documents
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ] 3. Implement Document Parsing Infrastructure

  - [ ] 3.1 Create DocumentParser service
    - Create `src/infrastructure/export/DocumentParser.ts`
    - Implement markdown parsing to extract structure (headings, sections, content)
    - Return ParsedDocument with title, sections, and metadata
    - _Requirements: 2.2, 3.2, 4.2, 8.2_
  - [ ] 3.2 Create RoadmapParser service
    - Create `src/infrastructure/export/RoadmapParser.ts`
    - Implement roadmap item extraction with descriptions and goals
    - Identify first roadmap item for example spec generation
    - Return ParsedRoadmap with items array and firstItem
    - _Requirements: 6.1, 8.3, 8.4_
  - [ ]\* 3.3 Write unit tests for DocumentParser
    - Test parsing valid markdown documents
    - Test parsing documents with various structures
    - Test handling malformed markdown
    - Test section extraction
    - _Requirements: 2.2, 3.2, 4.2_
  - [ ]\* 3.4 Write property test for first roadmap item identification
    - **Property 9: First Roadmap Item Identification**
    - **Validates: Requirements 6.1**

- [ ] 4. Implement Content Extraction Service

  - [ ] 4.1 Create ContentExtractor service
    - Create `src/infrastructure/export/ContentExtractor.ts`
    - Implement extraction from PRD (vision, mission, users, metrics, constraints, value proposition)
    - Implement extraction from Tech Architecture (stack, dependencies, setup, build config)
    - Implement extraction from Design Document (patterns, layers, conventions, naming)
    - Return ExtractedContent with product, tech, architecture, and roadmap data
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5_
  - [ ]\* 4.2 Write property test for content extraction completeness
    - **Property 2: Content Extraction Completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5**
  - [ ]\* 4.3 Write unit tests for ContentExtractor
    - Test extraction from PRD sections
    - Test extraction from Tech Architecture sections
    - Test extraction from Design Document sections
    - Test handling missing sections gracefully
    - _Requirements: 2.2, 3.2, 4.2_

- [ ] 5. Implement Template Engine

  - [ ] 5.1 Create TemplateEngine service
    - Create `src/infrastructure/export/TemplateEngine.ts`
    - Implement template loading from predefined templates
    - Implement variable substitution with extracted content
    - Handle conditional rendering for optional sections
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 7.1_
  - [ ] 5.2 Create steering file templates
    - Create `src/infrastructure/export/templates/product.md.template`
    - Create `src/infrastructure/export/templates/tech.md.template`
    - Create `src/infrastructure/export/templates/architecture.md.template`
    - Create `src/infrastructure/export/templates/spec-generation.md.template` with frontmatter "inclusion: manual"
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 5.2_
  - [ ] 5.3 Create README and spec templates
    - Create `src/infrastructure/export/templates/README.md.template`
    - Create `src/infrastructure/export/templates/example-spec/requirements.md.template`
    - Create `src/infrastructure/export/templates/example-spec/design.md.template`
    - Create `src/infrastructure/export/templates/example-spec/tasks.md.template`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]\* 5.4 Write property test for spec generation frontmatter
    - **Property 10: Spec Generation Frontmatter**
    - **Validates: Requirements 5.2**
  - [ ]\* 5.5 Write property test for README content completeness
    - **Property 11: README Content Completeness**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**
  - [ ]\* 5.6 Write unit tests for TemplateEngine
    - Test template loading
    - Test variable substitution
    - Test conditional rendering
    - Test handling missing template variables
    - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [ ] 6. Implement File Generator

  - [ ] 6.1 Create FileGenerator service
    - Create `src/infrastructure/export/FileGenerator.ts`
    - Implement steering file generation (product.md, tech.md, architecture.md, spec-generation.md)
    - Implement example spec generation from first roadmap item
    - Implement README generation
    - Implement roadmap copying with preserved formatting
    - Ensure file references use correct format `#[[file:path]]`
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.2, 6.3, 6.4, 6.5, 7.1, 8.1, 8.2, 8.3, 8.4, 12.1, 12.2, 12.3, 12.4_
  - [ ]\* 6.2 Write property test for complete file generation
    - **Property 1: Complete File Generation**
    - **Validates: Requirements 2.1, 3.1, 4.1, 5.1, 6.2, 6.3, 6.4, 6.5, 7.1, 8.1**
  - [ ]\* 6.3 Write property test for roadmap preservation (round-trip)
    - **Property 3: Roadmap Preservation (Round-trip)**
    - **Validates: Requirements 8.2, 8.3, 8.4**
  - [ ]\* 6.4 Write property test for file reference validity
    - **Property 5: File Reference Validity**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
  - [ ]\* 6.5 Write unit tests for FileGenerator
    - Test steering file generation
    - Test example spec generation
    - Test README generation
    - Test roadmap copying
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.2, 7.1, 8.1_

- [ ] 7. Checkpoint - Ensure all infrastructure tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Export Packager

  - [ ] 8.1 Create ExportPackager service
    - Create `src/infrastructure/export/ExportPackager.ts`
    - Implement ZIP file creation using JSZip with correct folder structure (kiro-setup/steering/, kiro-setup/specs/, kiro-setup/docs/)
    - Implement individual file packaging with folder-prefixed names
    - Implement browser download trigger using Blob API
    - Generate filename using pattern "kiro-setup-{idea-name}-{timestamp}.zip"
    - _Requirements: 1.2, 1.3, 1.4, 11.1, 11.2, 11.3, 11.4, 11.5, 13.4, 13.5_
  - [ ]\* 8.2 Write property test for folder structure consistency
    - **Property 4: Folder Structure Consistency**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
  - [ ]\* 8.3 Write property test for filename pattern compliance
    - **Property 8: Filename Pattern Compliance**
    - **Validates: Requirements 1.4**
  - [ ]\* 8.4 Write property test for export format handling
    - **Property 12: Export Format Handling**
    - **Validates: Requirements 13.4, 13.5**
  - [ ]\* 8.5 Write unit tests for ExportPackager
    - Test ZIP file creation
    - Test individual file generation
    - Test filename generation
    - Test folder structure creation
    - _Requirements: 1.2, 1.4, 11.1, 13.4, 13.5_

- [ ] 9. Implement Export Use Case

  - [ ] 9.1 Create ExportKiroSetupUseCase
    - Create `src/application/use-cases/ExportKiroSetupUseCase.ts`
    - Orchestrate validation, parsing, extraction, generation, and packaging
    - Handle errors and provide user feedback
    - Return ExportKiroSetupResult with success status and download data
    - _Requirements: 1.2, 1.3, 9.1_
  - [ ]\* 9.2 Write property test for export package completeness
    - **Property 14: Export Package Completeness**
    - **Validates: Requirements 1.2**
  - [ ]\* 9.3 Write unit tests for ExportKiroSetupUseCase
    - Test successful export flow
    - Test error handling for missing documents
    - Test error handling for generation failures
    - _Requirements: 1.2, 9.1_

- [ ] 10. Checkpoint - Ensure all application layer tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Analytics Tracking

  - [ ] 11.1 Add export analytics tracking functions
    - Add to `features/idea-panel/analytics/tracking.ts`
    - Implement trackExportInitiated with idea identifier and timestamp
    - Implement trackExportCompleted with package size and generation duration
    - Implement trackExportFailed with error type and message
    - Include user identifier and document types in event metadata
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ]\* 11.2 Write property test for analytics event tracking
    - **Property 13: Analytics Event Tracking**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [ ] 12. Implement UI Components

  - [ ] 12.1 Create ExportToKiroButton component
    - Create `features/idea-panel/components/ExportToKiroButton.tsx`
    - Display enabled/disabled state based on document availability
    - Show tooltip with missing documents when disabled
    - Trigger export modal on click
    - Track button click analytics
    - _Requirements: 1.1, 1.5, 9.2, 9.3_
  - [ ]\* 12.2 Write property test for export button state consistency
    - **Property 7: Export Button State Consistency**
    - **Validates: Requirements 1.1, 1.5, 9.3**
  - [ ] 12.3 Create ExportOptionsModal component
    - Create `features/idea-panel/components/ExportOptionsModal.tsx`
    - Display format selection (ZIP or individual files)
    - Show export progress during generation
    - Handle user selection and initiate export
    - Display success/error messages
    - _Requirements: 13.1, 13.2, 13.3_
  - [ ]\* 12.4 Write property test for modal display behavior
    - **Property 15: Modal Display Behavior**
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [ ] 13. Integrate Export Feature into Idea Panel

  - [ ] 13.1 Update IdeaPanelView to include ExportToKiroButton
    - Import and add ExportToKiroButton component
    - Pass required documents and idea data
    - Position button in Generated Documents section
    - _Requirements: 1.1, 1.5_
  - [ ] 13.2 Update idea-panel components index
    - Export ExportToKiroButton and ExportOptionsModal from index.ts
    - _Requirements: 1.1_
  - [ ] 13.3 Wire up export flow with use case
    - Create API route or client-side handler for export
    - Connect UI components to ExportKiroSetupUseCase
    - Handle download trigger after successful export
    - _Requirements: 1.2, 1.3_

- [ ] 14. Checkpoint - Ensure all UI tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Final Integration and Documentation

  - [ ] 15.1 Update infrastructure exports
    - Add export services to `src/infrastructure/index.ts`
    - Add use case to `src/application/use-cases/index.ts`
    - _Requirements: 1.2_
  - [ ] 15.2 Add factory methods for export services
    - Update `src/infrastructure/factories/ServiceFactory.ts` with export service creation
    - Update `src/infrastructure/factories/UseCaseFactory.ts` with ExportKiroSetupUseCase creation
    - _Requirements: 1.2_

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
