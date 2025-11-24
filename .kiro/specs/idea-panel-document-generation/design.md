# Design Document

## Overview

The Idea Panel Document Generation feature enables users to transform analyzed startup ideas into professional, AI-generated project documentation. This feature provides dedicated generator pages for four document types (PRD, Technical Design, Architecture, Roadmap), each following the same pattern as existing analyzer pages.

**Core Architecture Principles:**

- Each document type has a dedicated generator page (similar to startup/hackathon analyzers)
- Generator pages follow the same UX pattern: display context → generate with AI → save to database → return to panel
- Documents are stored in the existing `documents` table with new document types
- Credit system integration for AI generation costs
- Version history for document edits and regenerations
- Extensible design for adding new document types

**Key Design Decisions:**

1. **Separate Generator Pages**: Each document type gets its own static route (`/generate/prd/[ideaId]`, `/generate/technical-design/[ideaId]`, etc.) for focused generation experience
2. **Reuse Existing Infrastructure**: Leverage existing document storage, credit system, and AI service adapters
3. **Recommended Workflow (Not Required)**: Visual indicator shows recommended order (Analysis → PRD → Technical Design → Architecture → Roadmap) as a suggestion, but users can generate any document at any time without blockers or dependencies
4. **Context-Aware Generation**: AI prompts include previous documents for coherent, connected documentation when available
5. **Version Control**: All edits and regenerations create new versions, preserving history

## Architecture

### High-Level Architecture

The feature follows hexagonal architecture with clear separation of concerns:

**Domain Layer (Pure Business Logic):**

- Extend `DocumentType` value object with new types (prd, technical_design, architecture, roadmap)
- Add `DocumentVersion` value object for version tracking
- Extend `Document` entity with version management methods
- Add domain services for document generation validation

**Application Layer (Use Case Orchestration):**

- `GenerateDocumentUseCase` - orchestrates AI generation, credit deduction, and persistence
- `UpdateDocumentUseCase` - handles document edits with version creation
- `RegenerateDocumentUseCase` - regenerates document with AI, preserving previous version
- `GetDocumentVersionsUseCase` - retrieves version history
- `RestoreDocumentVersionUseCase` - restores a previous version
- `ExportDocumentUseCase` - exports document in various formats

**Infrastructure Layer (External Integrations):**

- `GoogleAIDocumentGeneratorAdapter` - AI service for document generation
- `PDFExportAdapter` - PDF generation service
- Extend `SupabaseDocumentRepository` with version queries
- Add document generation prompts to `lib/prompts/`

**Feature Layer (UI Components):**

- Generator pages: `app/generate/[type]/[ideaId]/page.tsx`
- Generator view components: `features/document-generator/components/`
- Document progress indicator component
- Document viewer/editor components
- Export controls

### Integration Points

1. **Idea Panel Integration**: Add document progress indicator and generation buttons
2. **Credit System Integration**: Check balance, deduct credits, refund on failure
3. **AI Service Integration**: Use Google Gemini for document generation
4. **Analytics Integration**: Track document generation events, success/failure rates
5. **Feature Flag Integration**: Control feature availability via `ENABLE_DOCUMENT_GENERATION`

### Component Interaction Flow

```
User → Generator Page → GenerateDocumentUseCase → AI Service
                                ↓
                         Credit System (deduct)
                                ↓
                         Document Repository (save)
                                ↓
                         Idea Panel (display)
```

## Components and Interfaces

### Domain Layer Components

#### Extended DocumentType Value Object

```typescript
class DocumentType {
  private constructor(
    private readonly _value:
      | "startup_analysis"
      | "hackathon_analysis"
      | "prd"
      | "technical_design"
      | "architecture"
      | "roadmap"
  ) {}

  // Existing types
  static STARTUP_ANALYSIS = new DocumentType("startup_analysis");
  static HACKATHON_ANALYSIS = new DocumentType("hackathon_analysis");

  // New document types
  static PRD = new DocumentType("prd");
  static TECHNICAL_DESIGN = new DocumentType("technical_design");
  static ARCHITECTURE = new DocumentType("architecture");
  static ROADMAP = new DocumentType("roadmap");

  get value(): string {
    return this._value;
  }

  equals(other: DocumentType): boolean {
    return this._value === other._value;
  }

  // Helper methods that delegate to DOCUMENT_TYPE_CONFIGS (single source of truth)
  isAnalysis(): boolean {
    return (
      this._value === "startup_analysis" || this._value === "hackathon_analysis"
    );
  }

  isGeneratedDocument(): boolean {
    return !this.isAnalysis();
  }

  getDisplayName(): string {
    // Delegates to config - single source of truth
    return DOCUMENT_TYPE_CONFIGS[this._value]?.displayName || this._value;
  }

  getCreditCost(): number {
    // Delegates to config - single source of truth
    return DOCUMENT_TYPE_CONFIGS[this._value]?.creditCost || 0;
  }

  getIcon(): IconComponent {
    // Delegates to config - single source of truth
    return DOCUMENT_TYPE_CONFIGS[this._value]?.icon;
  }

  getColor(): string {
    // Delegates to config - single source of truth
    return DOCUMENT_TYPE_CONFIGS[this._value]?.color || "gray";
  }
}
```

#### DocumentVersion Value Object

```typescript
class DocumentVersion {
  private constructor(private readonly _value: number) {
    if (_value < 1) {
      throw new Error("Document version must be >= 1");
    }
  }

  static create(version: number): DocumentVersion;
  static initial(): DocumentVersion; // Returns version 1

  get value(): number {
    return this._value;
  }

  increment(): DocumentVersion; // Returns new version with value + 1
  equals(other: DocumentVersion): boolean;
}
```

#### Extended Document Entity

```typescript
class Document extends Entity<DocumentId> {
  private constructor(
    id: DocumentId, // Each version has its own unique ID
    private readonly ideaId: IdeaId,
    private readonly userId: UserId,
    private readonly documentType: DocumentType,
    private title: string,
    private content: any,
    private readonly version: DocumentVersion,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super(id);
  }

  // Factory methods
  static create(props: CreateDocumentProps): Document;
  static reconstruct(props: DocumentProps): Document;

  // Business methods
  // Creates a NEW document entity with a NEW ID and incremented version
  // The old version remains unchanged in the database
  updateContent(newContent: any): Document {
    return Document.create({
      ideaId: this.ideaId,
      userId: this.userId,
      documentType: this.documentType,
      title: this.title,
      content: newContent,
      version: this.version.increment(), // Version 2, 3, 4, etc.
    });
  }

  getContent(): any;
  getType(): DocumentType;
  getVersion(): DocumentVersion;
  isLatestVersion(): boolean;
}

/**
 * Versioning Semantics:
 * - Each version is a SEPARATE database row with its own unique DocumentId
 * - Versions are identified by (idea_id, document_type, version) tuple
 * - To get the latest version: SELECT * WHERE idea_id = ? AND document_type = ? ORDER BY version DESC LIMIT 1
 * - All versions are preserved (immutable history)
 * - updateContent() creates a new Document entity with a new ID, not an in-place update
 */
```

### Application Layer Components

#### Use Cases

```typescript
// Document Generation
class GenerateDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ideaRepository: IIdeaRepository,
    private readonly aiService: IAIDocumentGeneratorService,
    private readonly creditService: ICreditService
  ) {}

  async execute(command: GenerateDocumentCommand): Promise<DocumentDTO> {
    // 1. Load idea and existing documents
    // 2. Check credit balance
    // 3. Deduct credits
    // 4. Generate document with AI (include context from existing docs)
    // 5. Save document to repository
    // 6. Return document DTO
    // 7. On error: refund credits and throw
  }
}

// Document Editing
class UpdateDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(command: UpdateDocumentCommand): Promise<DocumentDTO> {
    // 1. Load current document
    // 2. Create new version with updated content
    // 3. Save new version
    // 4. Return updated document DTO
  }
}
```

```typescript
// Document Regeneration
class RegenerateDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ideaRepository: IIdeaRepository,
    private readonly aiService: IAIDocumentGeneratorService,
    private readonly creditService: ICreditService
  ) {}

  async execute(command: RegenerateDocumentCommand): Promise<DocumentDTO> {
    // 1. Load idea and existing documents
    // 2. Check credit balance
    // 3. Deduct credits
    // 4. Generate new content with AI
    // 5. Create new version preserving old version
    // 6. Save new version
    // 7. Return document DTO
    // 8. On error: refund credits and throw
  }
}

// Version Management
class GetDocumentVersionsUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(query: GetDocumentVersionsQuery): Promise<DocumentDTO[]> {
    // 1. Load all versions for document
    // 2. Sort by version descending
    // 3. Return DTOs
  }
}

class RestoreDocumentVersionUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(command: RestoreDocumentVersionCommand): Promise<DocumentDTO> {
    // 1. Load specified version
    // 2. Create new version with that content
    // 3. Save as latest version
    // 4. Return document DTO
  }
}
```

```typescript
// Document Export
class ExportDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly pdfExporter: IPDFExportService,
    private readonly markdownExporter: IMarkdownExportService
  ) {}

  async execute(command: ExportDocumentCommand): Promise<ExportResult> {
    // 1. Load document
    // 2. Format based on export type (pdf/markdown)
    // 3. Include metadata (title, version, date)
    // 4. Return file buffer and metadata
  }
}
```

### Infrastructure Layer Components

#### AI Document Generator Adapter

```typescript
interface DocumentGenerationContext {
  ideaText: string;
  analysisScores?: any;
  analysisFeedback?: string;
  existingPRD?: string;
  existingTechnicalDesign?: string;
  existingArchitecture?: string;
}

interface IAIDocumentGeneratorService {
  generateDocument(
    documentType: DocumentType,
    context: DocumentGenerationContext
  ): Promise<string>;
}

class GoogleAIDocumentGeneratorAdapter implements IAIDocumentGeneratorService {
  constructor(private readonly geminiClient: GoogleGenerativeAI) {}

  async generateDocument(
    documentType: DocumentType,
    context: DocumentGenerationContext
  ): Promise<string> {
    const prompt = this.buildPrompt(documentType, context);
    const result = await this.geminiClient.generateContent(prompt);
    return result.response.text();
  }

  private buildPrompt(
    type: DocumentType,
    context: DocumentGenerationContext
  ): string {
    // Single method that selects the right prompt template
    const template = PROMPT_TEMPLATES[type.value];
    return this.interpolateTemplate(template, context);
  }

  private interpolateTemplate(
    template: string,
    context: DocumentGenerationContext
  ): string {
    // Replace placeholders in template with context values
    return template
      .replace("{ideaText}", context.ideaText)
      .replace("{analysisScores}", JSON.stringify(context.analysisScores || {}))
      .replace("{analysisFeedback}", context.analysisFeedback || "")
      .replace("{existingPRD}", context.existingPRD || "Not yet created")
      .replace(
        "{existingTechnicalDesign}",
        context.existingTechnicalDesign || "Not yet created"
      )
      .replace(
        "{existingArchitecture}",
        context.existingArchitecture || "Not yet created"
      );
  }
}
```

#### Repository Extensions

```typescript
interface IDocumentRepository {
  // Existing methods
  save(document: Document): Promise<void>;
  delete(id: DocumentId): Promise<void>;
  findById(id: DocumentId): Promise<Document | null>;
  findByIdeaId(ideaId: IdeaId): Promise<Document[]>;
  findByUserId(userId: UserId): Promise<Document[]>;

  // New methods for version management
  findByIdeaIdAndType(ideaId: IdeaId, type: DocumentType): Promise<Document[]>;
  findLatestVersion(
    ideaId: IdeaId,
    type: DocumentType
  ): Promise<Document | null>;
  findAllVersions(ideaId: IdeaId, type: DocumentType): Promise<Document[]>;
}
```

#### Web Controllers

```typescript
class DocumentGeneratorController {
  constructor(
    private readonly generateDocumentUseCase: GenerateDocumentUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly regenerateDocumentUseCase: RegenerateDocumentUseCase,
    private readonly getVersionsUseCase: GetDocumentVersionsUseCase,
    private readonly restoreVersionUseCase: RestoreDocumentVersionUseCase,
    private readonly exportDocumentUseCase: ExportDocumentUseCase
  ) {}

  async generateDocument(req: NextRequest): Promise<NextResponse>;
  async updateDocument(req: NextRequest): Promise<NextResponse>;
  async regenerateDocument(req: NextRequest): Promise<NextResponse>;
  async getVersions(req: NextRequest): Promise<NextResponse>;
  async restoreVersion(req: NextRequest): Promise<NextResponse>;
  async exportDocument(req: NextRequest): Promise<NextResponse>;
}
```

## Data Models

### Database Schema Updates

#### documents Table (Extended)

```sql
-- Add new document types to CHECK constraint
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE documents
ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN (
  'startup_analysis',
  'hackathon_analysis',
  'prd',
  'technical_design',
  'architecture',
  'roadmap'
));

-- Add version column
ALTER TABLE documents
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Update unique constraint to include version
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_idea_id_document_type_key;

CREATE UNIQUE INDEX documents_idea_type_version_idx
ON documents(idea_id, document_type, version);

-- Add index for finding latest version efficiently
CREATE INDEX documents_latest_version_idx
ON documents(idea_id, document_type, version DESC);
```

**Versioning Semantics:**

- Each version is aate row\*\* with its own unique `id` (UUID)
- The tuple `(idea_id, document_type, version)` uniquely identifies a specific version
- To get the latest version: `SELECT * FROM documents WHERE idea_id = ? AND document_type = ? ORDER BY version DESC LIMIT 1`
- All versions are preserved (immutable history)
- When a user edits a document, a **new row** is inserted with `version = old_version + 1` and a **new UUID**
- The `id` field in DocumentDTO refers to the **version-specific ID**, not a "logical document ID"

### Data Transfer Objects (DTOs)

```typescript
interface DocumentDTO {
  id: string; // Version-specific UUID (each version has its own unique ID)
  ideaId: string;
  userId: string;
  documentType:
    | "prd"
    | "technical_design"
    | "architecture"
    | "roadmap"
    | "startup_analysis"
    | "hackathon_analysis";
  title: string;
  content: any;
  version: number; // Version number (1, 2, 3, ...)
  createdAt: string;
  updatedAt: string;
}

interface DocumentProgressDTO {
  hasAnalysis: boolean;
  hasPRD: boolean;
  hasTechnicalDesign: boolean;
  hasArchitecture: boolean;
  hasRoadmap: boolean;
  progressPercentage: number;
  nextRecommended: string | null;
}
```

### Command and Query Types

```typescript
// Commands
interface GenerateDocumentCommand {
  ideaId: string;
  userId: string;
  documentType: "prd" | "technical_design" | "architecture" | "roadmap";
}

interface UpdateDocumentCommand {
  documentId: string;
  userId: string;
  content: any;
}

interface RegenerateDocumentCommand {
  ideaId: string;
  userId: string;
  documentType: "prd" | "technical_design" | "architecture" | "roadmap";
}

interface RestoreDocumentVersionCommand {
  ideaId: string;
  userId: string;
  documentType: string;
  version: number;
}

interface ExportDocumentCommand {
  documentId: string;
  userId: string;
  format: "markdown" | "pdf";
}

// Queries
interface GetDocumentVersionsQuery {
  ideaId: string;
  userId: string;
  documentType: string;
}
```

## AI Prompt Templates

### PRD Generation Prompt

```typescript
const PRD_PROMPT_TEMPLATE = `
You are an expert product manager. Generate a comprehensive Product Requirements Document (PRD) for the following startup idea.

IDEA:
{ideaText}

ANALYSIS SCORES:
{analysisScores}

ANALYSIS FEEDBACK:
{analysisFeedback}

Generate a PRD with the following sections:
1. Problem Statement
2. Target Users & Personas
3. User Stories
4. Features & Requirements
5. Success Metrics
6. Out of Scope
7. Assumptions & Dependencies

Format the output in Markdown.
`;
```

### Technical Design Prompt

```typescript
const TECHNICAL_DESIGN_PROMPT_TEMPLATE = `
You are an expert software architect. Generate a comprehensive Technical Design Document for the following startup idea.

IDEA:
{ideaText}

PRD (if available):
{existingPRD}

Generate a Technical Design Document with the following sections:
1. Architecture Overview
2. Technology Stack Recommendations
3. Data Models & Database Schema
4. API Specifications
5. Security Considerations
6. Scalability & Performance
7. Deployment Strategy
8. Third-party Integrations

Format the output in Markdown with Mermaid diagrams where appropriate.
`;
```

### Architecture Document Prompt

```typescript
const ARCHITECTURE_PROMPT_TEMPLATE = `
You are an expert system architect. Generate a comprehensive Architecture Document for the following startup idea.

IDEA:
{ideaText}

TECHNICAL DESIGN (if available):
{existingTechnicalDesign}

Generate an Architecture Document with the following sections:
1. System Architecture Diagram
2. Component Breakdown
3. Data Flow
4. Integration Points
5. Infrastructure Requirements
6. Scalability Considerations
7. Disaster Recovery & Backup
8. Monitoring & Observability

Format the output in Markdown with Mermaid diagrams.
`;
```

### Roadmap Prompt

```typescript
const ROADMAP_PROMPT_TEMPLATE = `
You are an expert product strategist. Generate a comprehensive Project Roadmap for the following startup idea.

IDEA:
{ideaText}

PRD (if available):
{existingPRD}

TECHNICAL DESIGN (if available):
{existingTechnicalDesign}

Generate a Roadmap with the following sections:
1. Milestones (without specific timeframes - let the user decide based on their resources and velocity)
2. Feature Prioritization (MoSCoW method: Must have, Should have, Could have, Won't have)
3. Dependencies & Blockers (what needs to be done before what)
4. Resource Considerations (team size, skills needed)
5. Risk Mitigation Strategies
6. Success Criteria per Milestone
7. Go-to-Market Strategy

Note: Do not include specific dates or timeframes. Focus on logical ordering, dependencies, and priorities.
The user will determine their own timeline based on their team's velocity and available resources.

Format the output in Markdown.
`;
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Acceptence Criteria Testing Prework

1.1 WHEN a user views the Idea Panel THEN the System SHALL display a "Generate PRD" button
Thoughts: This is a UI requirement about what should be displayed. We can test this by checking that the button exists when the panel is rendered with the feature flag enabled.
Testable: yes - example

1.2 WHEN a user clicks "Generate PRD" THEN the System SHALL navigate to `/generate/prd/[ideaId]`
Thoughts: This is testing navigation behavior. For any idea ID, clicking the button should navigate to the correct URL.
Testable: yes - property

1.3 WHEN the PRD generator page loads THEN the System SHALL display the idea text and analysis summary
Thoughts: This is testing that specific content is displayed on page load. We can test this across different ideas.
Testable: yes - property

1.4 WHEN the PRD generator page loads THEN the System SHALL display a "Generate" button with credit cost
Thoughts: This is a UI requirement that should hold for all generator pages.
Testable: yes - property

2.1 WHEN a user clicks "Generate" on the PRD generator page THEN the System SHALL check the user's credit balance
Thoughts: This is testing that credit checking happens before generation. We can test this by mocking the credit service and verifying it's called.
Testable: yes - property

2.2 WHEN the user has sufficient credits THEN the System SHALL deduct credits and start AI generation
Thoughts: This is testing the credit deduction flow. For any user with sufficient credits, deduction should occur.
Testable: yes - property

2.3 WHEN PRD generation is in progress THEN the System SHALL display a loading indicator with progress feedback
Thoughts: This is a UI requirement during the generation process.
Testable: yes - example

2.4 WHEN PRD generation completes THEN the System SHALL save the document to the documents table
Thoughts: This is testing persistence. For any generated document, it should be saved to the database.
Testable: yes - property

2.5 WHEN PRD generation completes THEN the System SHALL navigate back to the Idea Panel showing the new document
Thoughts: This is testing navigation and display after generation.
Testable: yes - property

9.1 WHEN a user views the Idea Panel THEN the System SHALL display a document progress indicator
Thoughts: This is a UI requirement that should always be present.
Testable: yes - example

9.2 WHEN displaying the progress indicator THEN the System SHALL show the recommended workflow order
Thoughts: This is testing that the workflow order is displayed correctly.
Testable: yes - example

9.3 WHEN a document has been generated THEN the System SHALL mark it as complete in the progress indicator
Thoughts: For any generated document, the progress indicator should reflect its completion.
Testable: yes - property

11.1 WHEN a user views a generated document THEN the System SHALL display an "Edit" button
Thoughts: This is a UI requirement for all generated documents.
Testable: yes - property

11.4 WHEN a user clicks "Save" THEN the System SHALL create a new version and persist the changes
Thoughts: This is testing version creation on save. For any document edit, a new version should be created.
Testable: yes - property

12.3 WHEN a user views version history THEN the System SHALL show version numbers in descending order
Thoughts: For any document with multiple versions, they should be sorted correctly.
Testable: yes - property

13.4 WHEN regeneration completes THEN the System SHALL create a new version preserving the previous version
Thoughts: This is testing that regeneration creates a new version without deleting the old one.
Testable: yes - property

14.3 WHEN a user selects Markdown export THEN the System SHALL download a .md file with the document content
Thoughts: This is testing export functionality. For any document, exporting should produce the correct format.
Testable: yes - property

15.1 WHEN a user attempts to generate a document with insufficient credits THEN the System SHALL display an error message
Thoughts: This is testing error handling for insufficient credits. This is an edge case we need to handle.
Testable: edge-case

15.5 WHEN a user has insufficient credits THEN the System SHALL NOT deduct any credits
Thoughts: This is testing that no credits are deducted when balance is insufficient. This is a critical invariant.
Testable: yes - property

17.1 WHEN generating a PRD THEN the System SHALL include the original idea text in the AI prompt
Thoughts: This is testing that the AI prompt contains the idea text. We can verify the prompt construction.
Testable: yes - property

17.3 WHEN generating a Technical Design THEN the System SHALL reference the PRD content if it exists
Thoughts: This is testing contextual generation. If a PRD exists, it should be included in the prompt.
Testable: yes - property

19.1 WHEN document generation fails due to AI service error THEN the System SHALL refund the deducted credits
Thoughts: This is testing error handling and credit refunds. This is a critical invariant for user trust.
Testable: yes - property

19.3 WHEN document generation fails THEN the System SHALL display a user-friendly error message
Thoughts: This is testing error message display on failure.
Testable: yes - example

21.1 WHEN the ENABLE_DOCUMENT_GENERATION feature flag is false THEN the System SHALL hide all document generation buttons
Thoughts: This is testing feature flag behavior. When disabled, buttons should not be visible.
Testable: yes - property

### Property Reflection

After reviewing all testable properties, I've identified the following consolidations:

- Properties 1.2, 3.2, 5.2, 7.2 (navigation for each document type) can be combined into one property about generator page navigation
- Properties 1.3, 3.3, 5.3, 7.3 (displaying idea context) can be combined into one property about context display
- Properties 1.4, 3.4, 5.4, 7.4 (generate button with credit cost) can be combined into one property about credit cost display
- Properties 2.1, 4.1, 6.1, 8.1 (credit balance check) can be combined into one property about credit checking
- Properties 2.2, 4.2, 6.2, 8.2 (credit deduction) can be combined into one property about credit deduction
- Properties 2.4, 4.4, 6.4, 8.4 (document persistence) can be combined into one property about document saving
- Properties 2.5, 4.5, 6.5, 8.5 (navigation back to panel) can be combined into one property about post-generation navigation

This reduces redundancy while maintaining comprehensive coverage.

### Correctness Properties

Property 1: Generator page navigation
_For any_ idea ID and document type (PRD, Technical Design, Architecture, Roadmap), clicking the generate button should navigate to `/generate/[type]/[ideaId]`
**Validates: Requirements 1.2, 3.2, 5.2, 7.2**

Property 2: Context display on generator pages
_For any_ idea and document type, the generator page should display the idea text and analysis summary
**Validates: Requirements 1.3, 3.3, 5.3, 7.3**

Property 3: Credit cost display
_For any_ document type, the generator page should display the generate button with the correct credit cost
**Validates: Requirements 1.4, 3.4, 5.4, 7.4**

Property 4: Credit balance check before generation
_For any_ document generation request, the system should check the user's credit balance before proceeding
**Validates: Requirements 2.1, 4.1, 6.1, 8.1**

Property 5: Credit deduction on generation
_For any_ user with sufficient credits, generating a document should deduct the correct amount of credits
**Validates: Requirements 2.2, 4.2, 6.2, 8.2**

Property 6: Document persistence
_For any_ successfully generated document, the system should save it to the documents table with correct metadata
**Validates: Requirements 2.4, 4.4, 6.4, 8.4**

Property 7: Post-generation navigation
_For any_ completed document generation, the system should navigate back to the Idea Panel and display the new document
**Validates: Requirements 2.5, 4.5, 6.5, 8.5**

Property 8: Progress indicator completion marking
_For any_ generated document, the progress indicator should mark that document type as complete
**Validates: Requirements 9.3**

Property 9: Edit button visibility
_For any_ generated document (PRD, Technical Design, Architecture, Roadmap), the system should display an "Edit" button
**Validates: Requirements 11.1**

Property 10: Version creation on save
_For any_ document edit, saving should create a new version with incremented version number while preserving the previous version
**Validates: Requirements 11.4**

Property 11: Version history ordering
_For any_ document with multiple versions, the version history should display versions in descending order (newest first)
**Validates: Requirements 12.3**

Property 12: Regeneration preserves previous versions
_For any_ document regeneration, the system should create a new version without deleting any previous versions
**Validates: Requirements 13.4**

Property 13: Export format correctness
_For any_ document and export format (Markdown/PDF), the exported file should contain the document content in the correct format
**Validates: Requirements 14.3**

Property 14: No credit deduction on insufficient balance
_For any_ user with insufficient credits, attempting to generate a document should not deduct any credits
**Validates: Requirements 15.5**

Property 15: Idea text in AI prompt
_For any_ document generation, the AI prompt should include the original idea text
**Validates: Requirements 17.1**

Property 16: Contextual document generation
_For any_ Technical Design generation, if a PRD exists, the AI prompt should include the PRD content
**Validates: Requirements 17.3**

Property 17: Credit refund on generation failure
_For any_ document generation that fails due to AI service or network error, the system should refund the deducted credits
**Validates: Requirements 19.1**

Property 18: Feature flag controls button visibility
_For any_ idea panel view, when ENABLE_DOCUMENT_GENERATION is false, all document generation buttons should be hidden
**Validates: Requirements 21.1**

## Error Handling

### Domain Errors

```typescript
class InsufficientCreditsError extends DomainError {
  readonly code = "INSUFFICIENT_CREDITS";
  constructor(
    public readonly required: number,
    public readonly available: number
  ) {
    super(`Insufficient credits: required ${required}, available ${available}`);
  }
}

class DocumentGenerationFailedError extends DomainError {
  readonly code = "DOCUMENT_GENERATION_FAILED";
  constructor(
    public readonly documentType: string,
    public readonly reason: string
  ) {
    super(`Document generation failed for ${documentType}: ${reason}`);
  }
}

class DocumentVersionNotFoundError extends DomainError {
  readonly code = "DOCUMENT_VERSION_NOT_FOUND";
  constructor(
    public readonly documentId: string,
    public readonly version: number
  ) {
    super(`Document version not found: ${documentId} v${version}`);
  }
}

class FeatureDisabledError extends DomainError {
  readonly code = "FEATURE_DISABLED";
  constructor(feature: string) {
    super(`Feature is disabled: ${feature}`);
  }
}
```

### Error Handling Strategy

1. **Credit Errors**: Check balance before deduction, refund on failure
2. **AI Service Errors**: Catch and convert to domain errors, refund credits, allow retry
3. **Network Errors**: Implement retry logic with exponential backoff, refund credits on final failure
4. **Validation Errors**: Validate inputs before processing, return clear error messages
5. **Feature Flag Errors**: Return 403 Forbidden when feature is disabled

### HTTP Error Mapping

- `InsufficientCreditsError` → 402 Payment Required
- `DocumentGenerationFailedError` → 500 Internal Server Error
- `DocumentVersionNotFoundError` → 404 Not Found
- `FeatureDisabledError` → 403 Forbidden
- `UnauthorizedAccessError` → 403 Forbidden

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Domain Layer Tests:**

- DocumentType value object validation and methods
- DocumentVersion value object validation and increment logic
- Document entity version management
- DocumentGenerationService validation logic

**Application Layer Tests:**

- Use case orchestration with mocked dependencies
- Credit checking and deduction logic
- Error handling and credit refunds
- Version creation and restoration logic

**Infrastructure Layer Tests:**

- AI prompt template construction
- Repository version queries
- PDF and Markdown export formatting

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library. Each test will run a minimum of 100 iterations.

**Configuration:**

```typescript
import fc from "fast-check";

const propertyTestConfig = { numRuns: 100 };
```

**Property Test Examples:**

```typescript
// Property: Generator page navigation
describe("Document Generation Navigation", () => {
  it("Feature: idea-panel-document-generation, Property 1: Generator page navigation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom("prd", "technical_design", "architecture", "roadmap"),
        async (ideaId, documentType) => {
          const button = getGenerateButton(documentType);
          const expectedUrl = `/generate/${documentType}/${ideaId}`;

          await button.click();

          expect(getCurrentUrl()).toBe(expectedUrl);
        }
      ),
      propertyTestConfig
    );
  });
});

// Property: Credit deduction on generation
describe("Credit System Integration", () => {
  it("Feature: idea-panel-document-generation, Property 5: Credit deduction on generation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000 }),
        fc.constantFrom("prd", "technical_design", "architecture", "roadmap"),
        async (initialCredits, documentType) => {
          const user = await createUserWithCredits(initialCredits);
          const creditCost = getDocumentCreditCost(documentType);

          await generateDocument(user.id, documentType);

          const finalCredits = await getUserCredits(user.id);
          expect(finalCredits).toBe(initialCredits - creditCost);
        }
      ),
      propertyTestConfig
    );
  });
});
```

```typescript
// Property: Version creation on save
describe("Document Version Management", () => {
  it("Feature: idea-panel-document-generation, Property 10: Version creation on save", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 100, maxLength: 5000 }),
        fc.string({ minLength: 100, maxLength: 5000 }),
        async (originalContent, editedContent) => {
          const document = await createDocument(originalContent);
          const originalVersion = document.version;

          const updatedDocument = await updateDocument(
            document.id,
            editedContent
          );

          expect(updatedDocument.version).toBe(originalVersion + 1);

          // Verify original version still exists
          const versions = await getDocumentVersions(document.id);
          expect(versions).toContainEqual(
            expect.objectContaining({
              version: originalVersion,
              content: originalContent,
            })
          );
        }
      ),
      propertyTestConfig
    );
  });
});

// Property: Credit refund on generation failure
describe("Error Handling", () => {
  it("Feature: idea-panel-document-generation, Property 17: Credit refund on generation failure", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000 }),
        fc.constantFrom("prd", "technical_design", "architecture", "roadmap"),
        async (initialCredits, documentType) => {
          const user = await createUserWithCredits(initialCredits);

          // Mock AI service to fail
          mockAIServiceFailure();

          try {
            await generateDocument(user.id, documentType);
          } catch (error) {
            // Expected to fail
          }

          const finalCredits = await getUserCredits(user.id);
          expect(finalCredits).toBe(initialCredits); // Credits refunded
        }
      ),
      propertyTestConfig
    );
  });
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

- Complete document generation flow (PRD, Technical Design, Architecture, Roadmap)
- Credit system integration (check, deduct, refund)
- Document editing and version creation
- Version history retrieval and restoration
- Document export in multiple formats
- Feature flag protection
- Error handling and rollback

### E2E Testing

End-to-end tests using Playwright will verify user workflows:

- Navigate from Idea Panel to generator page
- Generate each document type
- View generated documents in panel
- Edit document and verify version creation
- View version history and restore previous version
- Regenerate document and verify new version
- Export document in Markdown and PDF formats
- Verify insufficient credits error handling
- Verify feature flag behavior
- Test responsive design on mobile viewport
- Test keyboard navigation and accessibility

## Performance Considerations

### Database Optimization

- Add indexes on `(idea_id, document_type, version DESC)` for fast latest version queries
- Use database transactions for atomic operations (credit deduction + document save)
- Implement connection pooling for Supabase client
- Cache document type metadata (credit costs, display names)

### Frontend Optimization

- Use React Server Components for initial data loading
- Implement optimistic UI updates for better perceived performance
- Show progress indicators during AI generation (estimated time remaining)
- Lazy load document editor component
- Cache generated documents in client-side state
- Debounce document edits before saving
- Stream AI responses for real-time feedback (future enhancement)

### AI Service Optimization

- Implement request queuing to prevent rate limiting
- Add timeout handling (30 seconds default, show "still working" message)
- Cache AI prompts for regeneration scenarios
- Implement retry logic with exponential backoff
- Monitor AI service response times and adjust timeouts

### Credit System Performance

- Cache user credit balance in session
- Invalidate cache on credit operations
- Use optimistic updates for credit deduction (show immediately, rollback on error)
- Batch credit operations where possible

## Security Considerations

### Authentication and Authorization

- Verify user authentication on all API endpoints
- Ensure users can only generate documents for their own ideas
- Validate ownership before allowing document operations
- Implement rate limiting on generation endpoints (prevent abuse)

### Input Validation

- Validate all user inputs using Zod schemas
- Sanitize document content before storage
- Validate document type enum values
- Validate version numbers (must be positive integers)
- Validate export format enum values
- Limit document content size (prevent abuse)

### Data Protection

- Store documents with user_id association for access control
- Use RLS policies to enforce row-level security
- Encrypt sensitive data at rest (handled by Supabase)
- Audit log for document operations (future enhancement)
- Implement CSRF protection on API endpoints

### AI Service Security

- Never expose API keys in client-side code
- Validate AI responses before storage
- Implement content filtering for inappropriate content
- Rate limit AI requests per user
- Monitor for abuse patterns

## Deployment Strategy

### Feature Flag Configuration

```typescript
// lib/featureFlags.config.ts
export const featureFlags = {
  ENABLE_DOCUMENT_GENERATION:
    process.env.FF_ENABLE_DOCUMENT_GENERATION === "true",
};
```

### Database Migration

```sql
-- Migration: add_document_generation_types_and_versioning

-- Step 1: Add new document types
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE documents
ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN (
  'startup_analysis',
  'hackathon_analysis',
  'prd',
  'technical_design',
  'architecture',
  'roadmap'
));

-- Step 2: Add version column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Step 3: Update unique constraint
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_idea_id_document_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS documents_idea_type_version_idx
ON documents(idea_id, document_type, version);

-- Step 4: Add index for latest version queries
CREATE INDEX IF NOT EXISTS documents_latest_version_idx
ON documents(idea_id, document_type, version DESC);
```

### Rollout Plan

1. **Phase 1**: Deploy with feature flag disabled, run database migrations
2. **Phase 2**: Enable for internal testing (admin users only)
3. **Phase 3**: Enable for beta users (10% rollout)
4. **Phase 4**: Gradual rollout to all users (25%, 50%, 100%)

### Monitoring and Observability

- Track document generation requests and success/failure rates
- Monitor AI service response times and error rates
- Track credit usage patterns per document type
- Monitor database query performance
- Track feature flag usage and adoption rates
- Monitor export functionality usage
- Track version history usage patterns

### Rollback Strategy

- Feature flag allows instant disable without code deployment
- Database migrations are additive (no data loss on rollback)
- New document types can be hidden via feature flag
- Version column defaults to 1 (backward compatible)
- Can revert to previous code version if needed

## API Routes

### Document Generation Routes

```
POST /api/v2/documents/generate
  Body: { ideaId, documentType }
  Response: { document: DocumentDTO }

PUT /api/v2/documents/[documentId]
  Body: { content }
  Response: { document: DocumentDTO }

POST /api/v2/documents/[documentId]/regenerate
  Response: { document: DocumentDTO }

GET /api/v2/documents/[documentId]/versions
  Response: { versions: DocumentDTO[] }

POST /api/v2/documents/[documentId]/versions/[version]/restore
  Response: { document: DocumentDTO }

GET /api/v2/documents/[documentId]/export
  Query: { format: 'markdown' | 'pdf' }
  Response: File download
```

### Page Routes

```
/generate/prd/[ideaId] - PRD generator page
/generate/technical-design/[ideaId] - Technical Design generator page
/generate/architecture/[ideaId] - Architecture generator page
/generate/roadmap/[ideaId] - Roadmap generator page
```

## UI Component Structure

### Generator Page Components

```
GeneratorPageLayout
├── GeneratorHeader (breadcrumb, title)
├── IdeaContextSection (idea text, analysis summary)
├── ExistingDocumentsSection (show related docs if available)
├── GeneratorForm
│   ├── CreditCostDisplay
│   ├── GenerateButton
│   └── LoadingIndicator
└── GeneratedDocumentPreview (after generation)
```

### Idea Panel Components (Extended)

```
IdeaPanelView
├── IdeaPanelLayout
├── DocumentProgressIndicator (NEW)
│   ├── ProgressBar
│   ├── WorkflowSteps
│   └── NextRecommendation
├── DocumentGenerationButtons (NEW)
│   ├── GeneratePRDButton
│   ├── GenerateTechnicalDesignButton
│   ├── GenerateArchitectureButton
│   └── GenerateRoadmapButton
├── DocumentsList (EXTENDED)
│   ├── AnalysisDocuments (existing)
│   └── GeneratedDocuments (NEW)
│       ├── DocumentCard
│       │   ├── DocumentHeader
│       │   ├── DocumentContent
│       │   ├── EditButton
│       │   ├── RegenerateButton
│       │   ├── VersionHistoryButton
│       │   └── ExportButton
│       └── DocumentEditor (modal/inline)
└── ... (existing components)
```

### Document Editor Component

```typescript
interface DocumentEditorProps {
  document: DocumentDTO;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

function DocumentEditor({ document, onSave, onCancel }: DocumentEditorProps) {
  // Markdown editor with:
  // - Syntax highlighting
  // - Preview mode
  // - Auto-save (debounced)
  // - Character count
  // - Save status indicator
  // - Undo/redo
  // - Keyboard shortcuts
  // - Accessibility support
}
```

### Document Progress Indicator Component

```typescript
import {
  calculateProgress,
  getRecommendedNextDocument,
} from "@/lib/documents/progress";

interface DocumentProgressIndicatorProps {
  documents: DocumentDTO[];
}

interface WorkflowStep {
  type: "analysis" | "prd" | "technical_design" | "architecture" | "roadmap";
  label: string;
  completed: boolean;
  recommended: boolean;
}

function DocumentProgressIndicator({
  documents,
}: DocumentProgressIndicatorProps) {
  // Use utility functions for progress calculation
  const progress = calculateProgress(documents);
  const recommendedNext = getRecommendedNextDocument(documents);

  const steps: WorkflowStep[] = [
    {
      type: "analysis",
      label: "Analysis",
      completed: documents.some(
        (d) =>
          d.documentType === "startup_analysis" ||
          d.documentType === "hackathon_analysis"
      ),
      recommended: false,
    },
    {
      type: "prd",
      label: "PRD",
      completed: documents.some((d) => d.documentType === "prd"),
      recommended: recommendedNext?.value === "prd",
    },
    {
      type: "technical_design",
      label: "Technical Design",
      completed: documents.some((d) => d.documentType === "technical_design"),
      recommended: recommendedNext?.value === "technical_design",
    },
    {
      type: "architecture",
      label: "Architecture",
      completed: documents.some((d) => d.documentType === "architecture"),
      recommended: recommendedNext?.value === "architecture",
    },
    {
      type: "roadmap",
      label: "Roadmap",
      completed: documents.some((d) => d.documentType === "roadmap"),
      recommended: recommendedNext?.value === "roadmap",
    },
  ];

  return (
    <div className="document-progress">
      <ProgressBar percentage={progress} />
      <WorkflowSteps steps={steps} />
      {recommendedNext && <NextRecommendation documentType={recommendedNext} />}
    </div>
  );
}
```

## Credit System Integration

### Credit Costs

```typescript
const DOCUMENT_CREDIT_COSTS = {
  prd: 50,
  technical_design: 75,
  architecture: 75,
  roadmap: 50,
} as const;
```

### Credit Flow

1. **Pre-Generation Check**:

   - Query user's current credit balance
   - Compare with document type cost
   - Display cost to user
   - Prevent generation if insufficient

2. **Generation Flow**:

   - Deduct credits immediately
   - Generate document with AI
   - Save document to database
   - On success: keep deduction
   - On failure: refund credits

3. **Refund Scenarios**:
   - AI service error
   - Network timeout
   - Database save failure
   - User cancellation (before AI call)

## Extensibility

### Adding New Document Types

To add a new document type (e.g., "User Stories"):

1. **Domain Layer**: Add to `DocumentType` value object

```typescript
static USER_STORIES = new DocumentType('user_stories');
```

2. **Database**: Add to CHECK constraint

```sql
ALTER TABLE documents
DROP CONSTRAINT documents_document_type_check;

ALTER TABLE documents
ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN (..., 'user_stories'));
```

3. **AI Prompts**: Add prompt template

```typescript
const USER_STORIES_PROMPT_TEMPLATE = `...`;
```

4. **AI Service**: Add generation method

```typescript
async generateUserStories(context: DocumentGenerationContext): Promise<string>
```

5. **UI**: Add generator page and button

```typescript
// app/generate/user-stories/[ideaId]/page.tsx
// features/document-generator/components/GenerateUserStoriesButton.tsx
```

6. **Credit Cost**: Add to cost configuration

```typescript
user_stories: 40,
```

That's it! The existing infrastructure handles the rest.

## Code Reuse and Modularity

### Shared Generator Infrastructure

All document generator pages share the same infrastructure to avoid duplication:

#### Shared Generator Component

```typescript
interface DocumentGeneratorProps {
  ideaId: string;
  documentType: DocumentType;
  creditCost: number;
  contextDocuments?: DocumentDTO[];
}

function DocumentGenerator({
  ideaId,
  documentType,
  creditCost,
  contextDocuments,
}: DocumentGeneratorProps) {
  // Shared logic for:
  // - Loading idea and analysis
  // - Displaying context
  // - Credit balance check
  // - Generation flow
  // - Error handling
  // - Navigation back to panel
  // This component is reused by all generator pages
}
```

#### Generator Page Template

Each document type has its own static route file that uses the shared DocumentGenerator component:

```typescript
// app/generate/prd/[ideaId]/page.tsx
export default function PRDGeneratorPage({
  params,
}: {
  params: { ideaId: string };
}) {
  return (
    <DocumentGenerator
      ideaId={params.ideaId}
      documentType={DocumentType.PRD}
      creditCost={DOCUMENT_CREDIT_COSTS.prd}
    />
  );
}

// app/generate/technical-design/[ideaId]/page.tsx
export default function TechnicalDesignGeneratorPage({
  params,
}: {
  params: { ideaId: string };
}) {
  return (
    <DocumentGenerator
      ideaId={params.ideaId}
      documentType={DocumentType.TECHNICAL_DESIGN}
      creditCost={DOCUMENT_CREDIT_COSTS.technical_design}
    />
  );
}

// app/generate/architecture/[ideaId]/page.tsx
export default function ArchitectureGeneratorPage({
  params,
}: {
  params: { ideaId: string };
}) {
  return (
    <DocumentGenerator
      ideaId={params.ideaId}
      documentType={DocumentType.ARCHITECTURE}
      creditCost={DOCUMENT_CREDIT_COSTS.architecture}
    />
  );
}

// app/generate/roadmap/[ideaId]/page.tsx
export default function RoadmapGeneratorPage({
  params,
}: {
  params: { ideaId: string };
}) {
  return (
    <DocumentGenerator
      ideaId={params.ideaId}
      documentType={DocumentType.ROADMAP}
      creditCost={DOCUMENT_CREDIT_COSTS.roadmap}
    />
  );
}
```

This means:

- **One component** handles all document generation
- **One API endpoint** handles all document types
- **One use case** handles all generation logic
- Adding a new document type requires minimal code

### Shared Document Display Components

Document viewing and editing components are also shared:

```typescript
interface DocumentCardProps {
  document: DocumentDTO;
  onEdit: (documentId: string) => void;
  onRegenerate: (documentId: string) => void;
  onExport: (documentId: string, format: "markdown" | "pdf") => void;
  onViewVersions: (documentId: string) => void;
}

function DocumentCard({ document, ...handlers }: DocumentCardProps) {
  // Shared component for displaying any document type
  // Handles: PRD, Technical Design, Architecture, Roadmap, Analysis
  // Adapts display based on document.documentType
}
```

### Reusable Utilities

```typescript
// lib/documents/utils.ts
// All utility functions delegate to DOCUMENT_TYPE_CONFIGS (single source of truth)
export function getDocumentDisplayName(type: DocumentType): string {
  return type.getDisplayName(); // Delegates to config
}

export function getDocumentCreditCost(type: DocumentType): number {
  return type.getCreditCost(); // Delegates to config
}

export function getDocumentIcon(type: DocumentType): IconComponent {
  return type.getIcon(); // Delegates to config
}

export function getDocumentColor(type: DocumentType): string {
  return type.getColor(); // Delegates to config
}

export function getGeneratorRoute(type: DocumentType, ideaId: string): string {
  // Maps document type to static route
  const routeMap: Record<string, string> = {
    prd: `/generate/prd/${ideaId}`,
    technical_design: `/generate/technical-design/${ideaId}`,
    architecture: `/generate/architecture/${ideaId}`,
    roadmap: `/generate/roadmap/${ideaId}`,
  };
  return routeMap[type.value] || `/idea-panel/${ideaId}`;
}

// lib/documents/progress.ts
export function getRecommendedNextDocument(
  existingDocuments: DocumentDTO[]
): DocumentType | null {
  // Recommended workflow order: Analysis → PRD → Technical Design → Architecture → Roadmap
  // Note: This is just a suggestion - users can generate any document at any time
  const hasAnalysis = existingDocuments.some(
    (d) =>
      d.documentType === "startup_analysis" ||
      d.documentType === "hackathon_analysis"
  );
  const hasPRD = existingDocuments.some((d) => d.documentType === "prd");
  const hasTechnicalDesign = existingDocuments.some(
    (d) => d.documentType === "technical_design"
  );
  const hasArchitecture = existingDocuments.some(
    (d) => d.documentType === "architecture"
  );
  const hasRoadmap = existingDocuments.some(
    (d) => d.documentType === "roadmap"
  );

  // Recommend analysis first if none exists (but don't block other documents)
  if (!hasAnalysis) return null; // Show "Consider creating an analysis first" message

  // Then recommend following the logical order, butt enforce it
  if (!hasPRD) return DocumentType.PRD;
  if (!hasTechnicalDesign) return DocumentType.TECHNICAL_DESIGN;
  if (!hasArchitecture) return DocumentType.ARCHITECTURE;
  if (!hasRoadmap) return DocumentType.ROADMAP;
  return null; // All documents generated
}

export function calculateProgress(existingDocuments: DocumentDTO[]): number {
  // 5 total steps: Analysis, PRD, Technical Design, Architecture, Roadmap
  const steps = [
    existingDocuments.some(
      (d) =>
        d.documentType === "startup_analysis" ||
        d.documentType === "hackathon_analysis"
    ),
    existingDocuments.some((d) => d.documentType === "prd"),
    existingDocuments.some((d) => d.documentType === "technical_design"),
    existingDocuments.some((d) => d.documentType === "architecture"),
    existingDocuments.some((d) => d.documentType === "roadmap"),
  ];
  const completedSteps = steps.filter(Boolean).length;
  return Math.round((completedSteps / steps.length) * 100);
}

// lib/documents/validation.ts
export function validateDocumentContent(
  type: DocumentType,
  content: any
): boolean;
export function sanitizeDocumentContent(content: any): any;

// lib/documents/formatting.ts
export function formatDocumentForExport(
  document: DocumentDTO,
  format: "markdown" | "pdf"
): string;
export function parseMarkdownContent(content: string): ParsedContent;
```

### Configuration-Driven Approach

Document types are configured in one place:

```typescript
// lib/documents/config.ts
export interface DocumentTypeConfig {
  type: DocumentType;
  displayName: string;
  icon: IconComponent;
  color: string;
  creditCost: number;
  promptTemplate: string;
  requiredDocuments?: DocumentType[]; // Dependencies
  order: number; // For workflow display
}

export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  prd: {
    type: DocumentType.PRD,
    displayName: "Product Requirements Document",
    icon: FileTextIcon,
    color: "blue",
    creditCost: 50,
    promptTemplate: PRD_PROMPT_TEMPLATE,
    requiredDocuments: [], // Can be generated first
    order: 1,
  },
  technical_design: {
    type: DocumentType.TECHNICAL_DESIGN,
    displayName: "Technical Design Document",
    icon: CodeIcon,
    color: "purple",
    creditCost: 75,
    promptTemplate: TECHNICAL_DESIGN_PROMPT_TEMPLATE,
    requiredDocuments: [DocumentType.PRD], // Recommended after PRD
    order: 2,
  },
  architecture: {
    type: DocumentType.ARCHITECTURE,
    displayName: "Architecture Document",
    icon: LayersIcon,
    color: "green",
    creditCost: 75,
    promptTemplate: ARCHITECTURE_PROMPT_TEMPLATE,
    requiredDocuments: [DocumentType.TECHNICAL_DESIGN],
    order: 3,
  },
  roadmap: {
    type: DocumentType.ROADMAP,
    displayName: "Project Roadmap",
    icon: MapIcon,
    color: "orange",
    creditCost: 50,
    promptTemplate: ROADMAP_PROMPT_TEMPLATE,
    requiredDocuments: [DocumentType.PRD, DocumentType.TECHNICAL_DESIGN],
    order: 4,
  },
};

// Adding a new document type is just adding a new config entry!
```

## Styling and Design System

### CSS Consistency

All document generation components use the existing design system:

#### Reuse Existing Styles

```typescript
// Reuse existing component styles from:
// - features/analyzer/components/ (for generator pages)
// - features/idea-panel/components/ (for panel integration)
// - features/shared/components/ (for common UI elements)

// Example: Generator page uses same layout as analyzer
import { AnalyzerView } from "@/features/analyzer/components/AnalyzerView";
import { IdeaInputForm } from "@/features/analyzer/components/IdeaInputForm";
import { Loader } from "@/features/analyzer/components/Loader";
import { ErrorMessage } from "@/features/analyzer/components/ErrorMessage";

// Document cards use same styling as analysis cards
import { AnalysisCard } from "@/features/dashboard/components/AnalysisCard";
```

#### Tailwind CSS Classes

Use existing Tailwind utility classes consistently:

```typescript
// Button styles (consistent with existing buttons)
const buttonClasses =
  "px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

// Card styles (consistent with existing cards)
const cardClasses =
  "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700";

// Input styles (consistent with existing inputs)
const inputClasses =
  "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent";

// Loading indicator (consistent with existing loaders)
const loaderClasses =
  "animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full";
```

#### Color Palette

Use the existingr palette from `tailwind.config.ts`:

```typescript
// Primary colors (purple theme)
- Primary: purple-600, purple-700, purple-500
- Secondary: gray-600, gray-700, gray-500
- Success: green-600, green-700, green-500
- Warning: orange-600, orange-700, orange-500
- Error: red-600, red-700, red-500

// Document type colors (from config)
- PRD: blue-600
- Technical Design: purple-600
- Architecture: green-600
- Roadmap: orange-600
```

#### Typography

Use existing typography scale:

```typescript
// Headings
- h1: text-4xl font-bold
- h2: text-3xl font-semibold
- h3: text-2xl font-semibold
- h4: text-xl font-medium

// Body text
- Large: text-lg
- Normal: text-base
- Small: text-sm
- Extra small: text-xs

// Font family (from globals.css)
- Primary: Rajdhani (existing font)
```

#### Spacing and Layout

Use existing spacing scale:

```typescript
// Container padding
- Mobile: px-4 py-6
- Desktop: px-8 py-8

// Card spacing
- Padding: p-6
- Gap between cards: gap-6

// Form spacing
- Input margin: mb-4
- Button margin: mt-6
```

#### Component Patterns

Follow existing component patterns:

```typescript
// Loading states (like analyzer)
{isLoading && <Loader message="Generating document..." />}

// Error states (like analyzer)
{error && <ErrorMessage message={error} onRetry={handleRetry} />}

// Success states (like analyzer)
{success && <SuccessMessage message="Document generated successfully!" />}

// Empty states (like dashboard)
{documents.length === 0 && (
  <EmptyState
    icon={FileTextIcon}
    title="No documents yet"
    description="Generate your first document to get started"
    action={<GenerateButton />}
  />
)}

// Progress indicators (like analyzer)
<ProgressBar percentage={progress} className="mb-4" />

// Buttons (like existing buttons)
<Button
  variant="primary"
  size="lg"
  onClick={handleGenerate}
  disabled={isGenerating}
  loading={isGenerating}
>
  Generate Document
</Button>
```

### Dark Mode Support

All components support dark mode using existing patterns:

```typescript
// Background colors
className = "bg-white dark:bg-gray-800";

// Text colors
className = "text-gray-900 dark:text-gray-100";

// Border colors
className = "border-gray-200 dark:border-gray-700";

// Hover states
className = "hover:bg-gray-100 dark:hover:bg-gray-700";
```
