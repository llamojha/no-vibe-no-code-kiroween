# Document Generation Developer Guide

## Overview

This guide provides technical documentation for developers working with the Document Generation feature. It covers architecture, implementation details, and instructions for extending the system with new document types.

## Architecture

### Hexagonal Architecture Layers

The document generation feature follows hexagonal architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Web API   │  │  Database   │  │  AI Service         │  │
│  │ Controllers │  │ Repository  │  │  Adapter            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Use Cases  │  │  Handlers   │  │  Services           │  │
│  │  - Generate │  │             │  │  - AI Generator     │  │
│  │  - Update   │  │             │  │  - Export           │  │
│  │  - Version  │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Entities   │  │    Value    │  │   Repository        │  │
│  │  - Document │  │   Objects   │  │   Interfaces        │  │
│  │             │  │  - DocType  │  │                     │  │
│  │             │  │  - Version  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### Domain Layer

**Entities**:

- `Document`: Aggregate root with version management
- Each version is a separate entity with unique UUID

**Value Objects**:

- `DocumentType`: Strongly-typed document type (prd, technical_design, architecture, roadmap)
- `DocumentVersion`: Version number with validation (>= 1)

**Repository Interface**:

- `IDocumentRepository`: Data access contract for documents

#### Application Layer

**Use Cases**:

- `GenerateDocumentUseCase`: Orchestrates AI generation with credit management
- `UpdateDocumentUseCase`: Handles document edits with version creation
- `RegenerateDocumentUseCase`: Regenerates with AI, preserving previous version
- `GetDocumentVersionsUseCase`: Retrieves version history
- `RestoreDocumentVersionUseCase`: Restores previous version
- `ExportDocumentUseCase`: Exports to Markdown/PDF

**Services**:

- `IAIDocumentGeneratorService`: AI service interface (port)
- `IPDFExportService`: PDF export interface (port)
- `IMarkdownExportService`: Markdown export interface (port)

#### Infrastructure Layer

**Adapters**:

- `GoogleAIDocumentGeneratorAdapter`: Google Gemini AI integration
- `SupabaseDocumentRepository`: Database persistence
- `DocumentGeneratorController`: HTTP request handling

**Factories**:

- `ServiceFactory`: Service instantiation
- `UseCaseFactory`: Use case instantiation with dependencies

## Database Schema

### documents Table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'startup_analysis',
    'hackathon_analysis',
    'prd',
    'technical_design',
    'architecture',
    'roadmap'
  )),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one version per (idea_id, document_type, version)
CREATE UNIQUE INDEX documents_idea_type_version_idx
ON documents(idea_id, document_type, version);

-- Index for finding latest version efficiently
CREATE INDEX documents_latest_version_idx
ON documents(idea_id, document_type, version DESC);

-- Index for user queries
CREATE INDEX documents_user_id_idx ON documents(user_id);
```

### Versioning Semantics

**Key Concepts**:

- Each version is a **separate row** with its own unique `id` (UUID)
- The tuple `(idea_id, document_type, version)` uniquely identifies a specific version
- All versions are preserved (immutable history)
- Latest version: `SELECT * FROM documents WHERE idea_id = ? AND document_type = ? ORDER BY version DESC LIMIT 1`

**Version Creation**:

- When user edits: New row inserted with `version = old_version + 1` and new UUID
- When user regenerates: New row inserted with incremented version
- When user restores: New row inserted with content from old version

## Configuration System

### Document Type Configuration

All document types are configured in a single source of truth:

**Location**: `lib/documents/config.ts` (or similar)

```typescript
export interface DocumentTypeConfig {
  displayName: string;
  icon: IconComponent;
  color: string;
  creditCost: number;
  promptTemplate: string;
  dependencies?: DocumentType[]; // Optional: documents that provide context
  order: number; // For workflow ordering
}

export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  prd: {
    displayName: "Product Requirements Document",
    icon: FileTextIcon,
    color: "blue",
    creditCost: 50,
    promptTemplate: PRD_PROMPT_TEMPLATE,
    dependencies: [], // Uses analysis only
    order: 1,
  },
  technical_design: {
    displayName: "Technical Design Document",
    icon: CodeIcon,
    color: "purple",
    creditCost: 75,
    promptTemplate: TECHNICAL_DESIGN_PROMPT_TEMPLATE,
    dependencies: [DocumentType.PRD], // References PRD if available
    order: 2,
  },
  architecture: {
    displayName: "Architecture Document",
    icon: LayersIcon,
    color: "green",
    creditCost: 75,
    promptTemplate: ARCHITECTURE_PROMPT_TEMPLATE,
    dependencies: [DocumentType.TECHNICAL_DESIGN], // References Tech Design
    order: 3,
  },
  roadmap: {
    displayName: "Project Roadmap",
    icon: MapIcon,
    color: "orange",
    creditCost: 50,
    promptTemplate: ROADMAP_PROMPT_TEMPLATE,
    dependencies: [DocumentType.PRD, DocumentType.TECHNICAL_DESIGN],
    order: 4,
  },
};
```

### DocumentType Value Object

The `DocumentType` value object delegates to the configuration:

```typescript
export class DocumentType {
  private constructor(
    private readonly _value:
      | "startup_analysis"
      | "hackathon_analysis"
      | "prd"
      | "technical_design"
      | "architecture"
      | "roadmap"
  ) {}

  // Static instances
  static PRD = new DocumentType("prd");
  static TECHNICAL_DESIGN = new DocumentType("technical_design");
  static ARCHITECTURE = new DocumentType("architecture");
  static ROADMAP = new DocumentType("roadmap");

  get value(): string {
    return this._value;
  }

  // Delegates to config - single source of truth
  getDisplayName(): string {
    return DOCUMENT_TYPE_CONFIGS[this._value]?.displayName || this._value;
  }

  getCreditCost(): number {
    return DOCUMENT_TYPE_CONFIGS[this._value]?.creditCost || 0;
  }

  getIcon(): IconComponent {
    return DOCUMENT_TYPE_CONFIGS[this._value]?.icon;
  }

  getColor(): string {
    return DOCUMENT_TYPE_CONFIGS[this._value]?.color || "gray";
  }
}
```

**Important**: All helper methods delegate to `DOCUMENT_TYPE_CONFIGS`. No duplication of display names, costs, or other metadata.

## AI Prompt Templates

### Template Structure

All prompt templates follow a consistent structure:

**Location**: `lib/prompts/documentGeneration.ts`

```typescript
export const PRD_PROMPT_TEMPLATE = `
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

### Template Variables

**Common Variables**:

- `{ideaText}`: Original idea text (always included)
- `{analysisScores}`: Analysis scores JSON (for PRD)
- `{analysisFeedback}`: Analysis feedback text (for PRD)
- `{existingPRD}`: PRD content if available (for Technical Design, Roadmap)
- `{existingTechnicalDesign}`: Technical Design content if available (for Architecture, Roadmap)
- `{existingArchitecture}`: Architecture content if available (for future use)

### Contextual Generation

The AI adapter builds context based on document dependencies:

```typescript
class GoogleAIDocumentGeneratorAdapter {
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
    const template = DOCUMENT_TYPE_CONFIGS[type.value].promptTemplate;
    return this.interpolateTemplate(template, context);
  }

  private interpolateTemplate(
    template: string,
    context: DocumentGenerationContext
  ): string {
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

## Credit System Integration

### Credit Costs

Credit costs are defined in `DOCUMENT_TYPE_CONFIGS`:

```typescript
const costs = {
  prd: 50,
  technical_design: 75,
  architecture: 75,
  roadmap: 50,
};
```

### Credit Flow

**Generation Flow**:

1. Check user credit balance
2. Deduct credits before AI generation
3. Generate document with AI
4. Save document to database
5. On error: Refund credits automatically

**Implementation**:

```typescript
class GenerateDocumentUseCase {
  async execute(command: GenerateDocumentCommand): Promise<DocumentDTO> {
    // 1. Load idea and existing documents
    const idea = await this.ideaRepository.findById(command.ideaId);
    const existingDocs = await this.documentRepository.findByIdeaId(
      command.ideaId
    );

    // 2. Check credit balance
    const creditCost = DocumentType.fromString(
      command.documentType
    ).getCreditCost();
    const balance = await this.creditService.getBalance(command.userId);

    if (balance < creditCost) {
      throw new InsufficientCreditsError(creditCost, balance);
    }

    // 3. Deduct credits
    await this.creditService.deduct(command.userId, creditCost, {
      reason: `Generate ${command.documentType}`,
      metadata: { ideaId: command.ideaId },
    });

    try {
      // 4. Generate document with AI
      const context = this.buildContext(idea, existingDocs);
      const content = await this.aiService.generateDocument(
        DocumentType.fromString(command.documentType),
        context
      );

      // 5. Save document
      const document = Document.create({
        ideaId: command.ideaId,
        userId: command.userId,
        documentType: DocumentType.fromString(command.documentType),
        title: DocumentType.fromString(command.documentType).getDisplayName(),
        content: { markdown: content },
        version: DocumentVersion.initial(),
      });

      await this.documentRepository.save(document);

      return DocumentMapper.toDTO(document);
    } catch (error) {
      // 6. Refund credits on error
      await this.creditService.refund(command.userId, creditCost, {
        reason: `Failed to generate ${command.documentType}`,
        metadata: { ideaId: command.ideaId, error: error.message },
      });

      throw error;
    }
  }
}
```

## Adding a New Document Type

Follow these steps to add a new document type to the system:

### Step 1: Update Database Schema

Add the new document type to the CHECK constraint:

```sql
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
  'roadmap',
  'user_stories'  -- New type
));
```

### Step 2: Extend DocumentType Value Object

Add the new type to the value object:

```typescript
// src/domain/value-objects/DocumentType.ts

export class DocumentType {
  private constructor(
    private readonly _value:
      | "startup_analysis"
      | "hackathon_analysis"
      | "prd"
      | "technical_design"
      | "architecture"
      | "roadmap"
      | "user_stories" // New type
  ) {}

  // Add static instance
  static USER_STORIES = new DocumentType("user_stories");

  // All other methods remain unchanged (they delegate to config)
}
```

### Step 3: Create AI Prompt Template

Add the prompt template:

```typescript
// lib/prompts/documentGeneration.ts

export const USER_STORIES_PROMPT_TEMPLATE = `
You are an expert product manager. Generate comprehensive user stories for the following startup idea.

IDEA:
{ideaText}

EXISTING PRD:
{existingPRD}

Generate user stories with the following format:
- As a [user type], I want [goal], so that [benefit]
- Include acceptance criteria for each story
- Prioritize stories (Must have, Should have, Could have)
- Estimate story points

Format the output in Markdown.
`;
```

### Step 4: Add Configuration

Add configuration to `DOCUMENT_TYPE_CONFIGS`:

```typescript
// lib/documents/config.ts

export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  // ... existing configs ...

  user_stories: {
    displayName: "User Stories",
    icon: UsersIcon,
    color: "indigo",
    creditCost: 40,
    promptTemplate: USER_STORIES_PROMPT_TEMPLATE,
    dependencies: [DocumentType.PRD], // References PRD if available
    order: 2.5, // Between PRD and Technical Design
  },
};
```

### Step 5: Create Generator Page

Create the Next.js page:

```typescript
// app/generate/user-stories/[ideaId]/page.tsx

import { DocumentGenerator } from "@/features/document-generator/components/DocumentGenerator";

export default function UserStoriesGeneratorPage({
  params,
}: {
  params: { ideaId: string };
}) {
  return (
    <DocumentGenerator ideaId={params.ideaId} documentType="user_stories" />
  );
}
```

### Step 6: Add Generation Button

Add button to Idea Panel:

```typescript
// features/idea-panel/components/DocumentGenerationButtons.tsx

export function DocumentGenerationButtons({ ideaId }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <GeneratePRDButton ideaId={ideaId} />
      <GenerateUserStoriesButton ideaId={ideaId} /> {/* New button */}
      <GenerateTechnicalDesignButton ideaId={ideaId} />
      <GenerateArchitectureButton ideaId={ideaId} />
      <GenerateRoadmapButton ideaId={ideaId} />
    </div>
  );
}
```

### Step 7: Update Progress Indicator

Update the workflow order:

```typescript
// lib/documents/utils.ts

export function getRecommendedNextDocument(
  completedTypes: DocumentType[]
): DocumentType | null {
  const workflow = [
    DocumentType.PRD,
    DocumentType.USER_STORIES, // New type in workflow
    DocumentType.TECHNICAL_DESIGN,
    DocumentType.ARCHITECTURE,
    DocumentType.ROADMAP,
  ];

  return workflow.find((type) => !completedTypes.includes(type)) || null;
}
```

### Step 8: Update TypeScript Types

Update DTOs and types:

```typescript
// src/infrastructure/web/dto/DocumentDTO.ts

export interface DocumentDTO {
  id: string;
  ideaId: string;
  userId: string;
  documentType:
    | "prd"
    | "technical_design"
    | "architecture"
    | "roadmap"
    | "user_stories" // New type
    | "startup_analysis"
    | "hackathon_analysis";
  title: string;
  content: any;
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

### Step 9: Test the Integration

1. **Unit Tests**: Test DocumentType value object
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete user workflow
4. **Property Tests**: Test document generation properties

### Step 10: Update Documentation

1. Update API documentation with new endpoint
2. Update feature guide with new document type
3. Update this developer guide with new example

## Testing

### Unit Tests

Test domain logic in isolation:

```typescript
// src/domain/value-objects/__tests__/DocumentType.test.ts

describe("DocumentType", () => {
  describe("getDisplayName", () => {
    it("should return correct display name for PRD", () => {
      const type = DocumentType.PRD;
      expect(type.getDisplayName()).toBe("Product Requirements Document");
    });
  });

  describe("getCreditCost", () => {
    it("should return correct credit cost for Technical Design", () => {
      const type = DocumentType.TECHNICAL_DESIGN;
      expect(type.getCreditCost()).toBe(75);
    });
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
// tests/integration/document-generation-api-routes.test.ts

describe("POST /api/v2/documents/generate", () => {
  it("should generate PRD document", async () => {
    const response = await request(app)
      .post("/api/v2/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ideaId: testIdeaId,
        documentType: "prd",
      });

    expect(response.status).toBe(201);
    expect(response.body.documentType).toBe("prd");
    expect(response.body.version).toBe(1);
  });

  it("should deduct credits on generation", async () => {
    const balanceBefore = await getCreditBalance(userId);

    await request(app)
      .post("/api/v2/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ideaId: testIdeaId,
        documentType: "prd",
      });

    const balanceAfter = await getCreditBalance(userId);
    expect(balanceAfter).toBe(balanceBefore - 50);
  });
});
```

### Property Tests

Test correctness properties:

```typescript
// tests/properties/document-generation.properties.test.ts

describe("Document Generation Properties", () => {
  it("Property: Credit deduction on generation", async () => {
    await forAll(
      generators.documentType(),
      generators.userId(),
      async (docType, userId) => {
        const balanceBefore = await getCreditBalance(userId);
        const creditCost = DocumentType.fromString(docType).getCreditCost();

        await generateDocument(userId, testIdeaId, docType);

        const balanceAfter = await getCreditBalance(userId);
        expect(balanceAfter).toBe(balanceBefore - creditCost);
      }
    );
  });

  it("Property: Version creation on save", async () => {
    await forAll(generators.document(), async (document) => {
      const updatedDoc = await updateDocument(document.id, {
        content: { markdown: "Updated content" },
      });

      expect(updatedDoc.version).toBe(document.version + 1);
      expect(updatedDoc.id).not.toBe(document.id); // New UUID
    });
  });
});
```

### E2E Tests

Test complete user workflows:

```typescript
// tests/e2e/document-generation.spec.ts

test("should generate and edit PRD document", async ({ page }) => {
  // Navigate to Idea Panel
  await page.goto(`/idea/${testIdeaId}`);

  // Click Generate PRD button
  await page.click('button:has-text("Generate PRD")');

  // Wait for generation to complete
  await page.waitForURL(`/idea/${testIdeaId}`);

  // Verify document appears
  await expect(
    page.locator('text="Product Requirements Document"')
  ).toBeVisible();

  // Click Edit button
  await page.click('button:has-text("Edit")');

  // Edit content
  await page.fill('textarea[name="content"]', "# Updated PRD\n\nNew content");

  // Save changes
  await page.click('button:has-text("Save")');

  // Verify version incremented
  await expect(page.locator('text="Version 2"')).toBeVisible();
});
```

## Deployment

### Environment Variables

Required environment variables:

```env
# Feature Flag
ENABLE_DOCUMENT_GENERATION=true

# AI Service
GEMINI_API_KEY=your-api-key

# Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Migration

Run migration to add document types:

```bash
# Using Supabase CLI
supabase db push

# Or apply SQL directly
psql -h your-db-host -U postgres -d your-db -f migrations/add_document_types.sql
```

### Feature Flag Control

Enable/disable feature:

```typescript
// lib/featureFlags.config.ts

export const featureFlags = {
  ENABLE_DOCUMENT_GENERATION: {
    enabled: process.env.ENABLE_DOCUMENT_GENERATION === "true",
    description: "Enable AI-powered document generation",
  },
};
```

## Performance Considerations

### AI Generation

**Optimization**:

- Cache prompt templates (already done via constants)
- Reuse AI client instance (singleton pattern)
- Set reasonable timeouts (60 seconds)

**Monitoring**:

- Track generation time per document type
- Monitor AI service errors and retry rates
- Alert on high failure rates

### Database Queries

**Optimization**:

- Use indexes for version queries
- Limit version history queries (e.g., last 10 versions)
- Use pagination for document lists

**Indexes**:

```sql
-- Already created in schema
CREATE INDEX documents_latest_version_idx
ON documents(idea_id, document_type, version DESC);
```

### Export Generation

**Optimization**:

- Generate exports asynchronously for large documents
- Cache generated PDFs (optional)
- Stream large files instead of loading into memory

## Security Considerations

### Authentication

All endpoints require authentication:

```typescript
// Middleware checks JWT token
const user = await getUser(request);
if (!user) {
  return new Response("Unauthorized", { status: 401 });
}
```

### Authorization

Users can only access their own documents:

```typescript
// Repository enforces user ownership
const document = await repository.findById(documentId);
if (document.userId !== currentUserId) {
  throw new ForbiddenError("Document belongs to another user");
}
```

### Input Validation

Validate all inputs using Zod schemas:

```typescript
const generateDocumentSchema = z.object({
  ideaId: z.string().uuid(),
  documentType: z.enum(["prd", "technical_design", "architecture", "roadmap"]),
});
```

### Rate Limiting

Implement rate limiting for AI generation:

```typescript
// Limit: 10 generations per hour per user
const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
});
```

## Troubleshooting

### Common Issues

**Issue**: AI generation fails with timeout

**Solution**:

- Increase timeout in AI adapter
- Check AI service status
- Verify API key is valid

**Issue**: Version conflicts

**Solution**:

- Ensure unique constraint on (idea_id, document_type, version)
- Use transactions for version creation
- Handle concurrent updates gracefully

**Issue**: Credit refunds not working

**Solution**:

- Verify credit service is called in error handler
- Check transaction logs
- Ensure proper error propagation

### Debugging

Enable debug logging:

```typescript
// lib/logger/Logger.ts

const logger = new Logger({
  level: "debug",
  context: "DocumentGeneration",
});

logger.debug("Generating document", {
  ideaId,
  documentType,
  userId,
});
```

## Best Practices

### Code Organization

1. **Single Responsibility**: Each class/function has one clear purpose
2. **Dependency Injection**: Use constructor injection for dependencies
3. **Interface Segregation**: Define focused interfaces (ports)
4. **Configuration Over Code**: Use `DOCUMENT_TYPE_CONFIGS` for metadata

### Error Handling

1. **Domain Errors**: Use custom error classes for business rules
2. **Infrastructure Errors**: Convert to domain errors at boundary
3. **User-Friendly Messages**: Provide clear error messages
4. **Automatic Recovery**: Refund credits on failures

### Testing

1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Property Tests**: Test universal properties across all inputs
3. **Integration Tests**: Test API endpoints with real dependencies
4. **E2E Tests**: Test critical user workflows

### Documentation

1. **Code Comments**: Explain why, not what
2. **API Documentation**: Keep API docs up to date
3. **Developer Guide**: Update when adding features
4. **Changelog**: Document all changes

## Resources

### Internal Documentation

- [API Documentation](./API.md)
- [Document Generation Feature Guide](./DOCUMENT_GENERATION_GUIDE.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Database Schema](./DATABASE_SCHEMA.md)

### External Resources

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For developer support:

- Review this guide and related documentation
- Check existing tests for examples
- Contact: dev-support@novibecode.com

---

_Last updated: January 15, 2024_
