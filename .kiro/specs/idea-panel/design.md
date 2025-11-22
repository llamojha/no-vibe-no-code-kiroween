# Design Document

## Overview

The Idea Panel MVP introduces a new data model that separates ideas from documents (analyses). This architectural change enables:

- Ideas to have multiple analyses (startup + hackathon)
- Future support for multiple document types (PRDs, Design Docs, Roadmaps)
- Cleaner separation between idea management and document generation
- Better support for Doctor Frankenstein (idea generator without analysis)

This MVP focuses on creating the foundational infrastructure with a clean interface that displays idea details, lists all associated documents, and provides basic project management features (status, notes, tags).

## Architecture

### High-Level Architecture

The Idea Panel follows hexagonal architecture with three primary layers:

**Domain Layer:**

- `Idea` aggregate root managing idea state and business rules
- `Document` entity representing analyses and future documents
- Value objects for `IdeaSource`, `DocumentType`, `ProjectStatus`
- Repository interfaces for data access contracts

**Application Layer:**

- Use cases for idea operations (create, update status, save metadata)
- Use cases for document operations (list, create)
- Query handlers for read operations
- Command handlers for write operations

**Infrastructure Layer:**

- Supabase repository implementations for persistence
- Data migration from `saved_analyses` to new tables
- Web controllers handling HTTP requests from Next.js routes

### Integration Points

1. **Dashboard Integration**: Idea cards display "Manage" button when feature is enabled
2. **Analyzer Integration**: Panel links to analyzer pages for creating new analyses
3. **Authentication**: Uses existing auth middleware for access control
4. **Analytics**: Tracks panel usage events
5. **Backward Compatibility**: Keeps `saved_analyses` table unchanged

## Components and Interfaces

### Domain Layer Components

#### Idea Entity (Aggregate Root)

```typescript
class Idea extends Entity<IdeaId> {
  private constructor(
    id: IdeaId,
    private readonly userId: UserId,
    private ideaText: string,
    private readonly source: IdeaSource,
    private projectStatus: ProjectStatus,
    private notes: string,
    private tags: string[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super(id);
  }

  // Factory methods
  static create(props: CreateIdeaProps): Idea;
  static reconstruct(props: IdeaProps): Idea;

  // Business methods
  updateStatus(newStatus: ProjectStatus): void;
  updateNotes(notes: string): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  getTags(): string[];
  getIdeaText(): string;
}
```

#### Document Entity

```typescript
class Document extends Entity<DocumentId> {
  private constructor(
    id: DocumentId,
    private readonly ideaId: IdeaId,
    private readonly userId: UserId,
    private readonly documentType: DocumentType,
    private title: string,
    private content: any,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super(id);
  }

  // Factory methods
  static create(props: CreateDocumentProps): Document;
  static reconstruct(props: DocumentProps): Document;

  // Getters
  getContent(): any;
  getType(): DocumentType;
}
```

#### Value Objects

```typescript
class IdeaSource {
  private constructor(private readonly _value: "manual" | "frankenstein") {}

  static MANUAL = new IdeaSource("manual");
  static FRANKENSTEIN = new IdeaSource("frankenstein");

  get value(): string {
    return this._value;
  }
  equals(other: IdeaSource): boolean;
}

class DocumentType {
  private constructor(
    private readonly _value: "startup_analysis" | "hackathon_analysis"
  ) {}

  static STARTUP_ANALYSIS = new DocumentType("startup_analysis");
  static HACKATHON_ANALYSIS = new DocumentType("hackathon_analysis");

  get value(): string {
    return this._value;
  }
  equals(other: DocumentType): boolean;
}

class ProjectStatus {
  private constructor(
    private readonly _value: "idea" | "in_progress" | "completed" | "archived"
  ) {}

  static IDEA = new ProjectStatus("idea");
  static IN_PROGRESS = new ProjectStatus("in_progress");
  static COMPLETED = new ProjectStatus("completed");
  static ARCHIVED = new ProjectStatus("archived");

  get value(): string {
    return this._value;
  }
  equals(other: ProjectStatus): boolean;
}
```

#### Repository Interfaces

```typescript
interface IIdeaRepository {
  // Commands
  save(idea: Idea): Promise<void>;
  update(idea: Idea): Promise<void>;
  delete(id: IdeaId): Promise<void>;

  // Queries
  findById(id: IdeaId): Promise<Idea | null>;
  findByUserId(userId: UserId): Promise<Idea[]>;
}

interface IDocumentRepository {
  // Commands
  save(document: Document): Promise<void>;
  delete(id: DocumentId): Promise<void>;

  // Queries
  findById(id: DocumentId): Promise<Document | null>;
  findByIdeaId(ideaId: IdeaId): Promise<Document[]>;
  findByUserId(userId: UserId): Promise<Document[]>;
}
```

### Application Layer Components

#### Use Cases

```typescript
// Idea Management
class GetIdeaWithDocumentsUseCase {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  async execute(
    query: GetIdeaWithDocumentsQuery
  ): Promise<IdeaWithDocumentsDTO>;
}

class UpdateIdeaStatusUseCase {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(command: UpdateIdeaStatusCommand): Promise<void>;
}

class SaveIdeaMetadataUseCase {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(command: SaveIdeaMetadataCommand): Promise<void>;
}

class GetUserIdeasUseCase {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  async execute(query: GetUserIdeasQuery): Promise<IdeaWithDocumentsDTO[]>;
}

// Document Management
class GetDocumentsByIdeaUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(query: GetDocumentsByIdeaQuery): Promise<DocumentDTO[]>;
}
```

### Infrastructure Layer Components

#### Repository Implementations

```typescript
class SupabaseIdeaRepository implements IIdeaRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly mapper: IdeaMapper
  ) {}

  async save(idea: Idea): Promise<void>;
  async update(idea: Idea): Promise<void>;
  async delete(id: IdeaId): Promise<void>;
  async findById(id: IdeaId): Promise<Idea | null>;
  async findByUserId(userId: UserId): Promise<Idea[]>;
}

class SupabaseDocumentRepository implements IDocumentRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly mapper: DocumentMapper
  ) {}

  async save(document: Document): Promise<void>;
  async delete(id: DocumentId): Promise<void>;
  async findById(id: DocumentId): Promise<Document | null>;
  async findByIdeaId(ideaId: IdeaId): Promise<Document[]>;
  async findByUserId(userId: UserId): Promise<Document[]>;
}
```

#### Web Controllers

```typescript
class IdeaPanelController {
  constructor(
    private readonly getIdeaWithDocumentsUseCase: GetIdeaWithDocumentsUseCase,
    private readonly updateStatusUseCase: UpdateIdeaStatusUseCase,
    private readonly saveMetadataUseCase: SaveIdeaMetadataUseCase
  ) {}

  async getIdeaPanel(req: NextRequest): Promise<NextResponse>;
  async updateStatus(req: NextRequest): Promise<NextResponse>;
  async saveMetadata(req: NextRequest): Promise<NextResponse>;
}
```

## Data Models

### Database Schema

#### Table Relationships

```
ideas (1) → (many) documents
  ├─ startup_analysis documents
  └─ hackathon_analysis documents

saved_analyses (UNCHANGED - backward compatibility)
```

**Design Rationale:**

- `ideas` table stores all ideas with panel management data
- `documents` table stores all analyses linked to ideas
- `saved_analyses` remains unchanged for backward compatibility
- Clean separation enables future document types (PRDs, Design Docs, etc.)

#### ideas Table (New)

```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core idea data
  idea_text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'frankenstein')),

  -- Panel management data
  project_status TEXT NOT NULL DEFAULT 'idea'
    CHECK (project_status IN ('idea', 'in_progress', 'completed', 'archived')),
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ideas_user ON ideas(user_id);
CREATE INDEX idx_ideas_status ON ideas(user_id, project_status);
CREATE INDEX idx_ideas_updated ON ideas(updated_at DESC);
```

#### documents Table (New)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document metadata
  document_type TEXT NOT NULL
    CHECK (document_type IN ('startup_analysis', 'hackathon_analysis')),
  title TEXT,
  content JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_idea ON documents(idea_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(idea_id, document_type);
```

#### Auto-update Triggers

```sql
-- Trigger for ideas table
CREATE OR REPLACE FUNCTION update_ideas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ideas_timestamp
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_ideas_timestamp();

-- Trigger for documents table
CREATE OR REPLACE FUNCTION update_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documents_timestamp
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_timestamp();
```

#### Row Level Security Policies

```sql
-- Ideas table RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ideas"
  ON ideas FOR ALL
  USING (auth.uid() = user_id);

-- Documents table RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id);
```

### Data Transfer Objects (DTOs)

```typescript
interface IdeaDTO {
  id: string;
  userId: string;
  ideaText: string;
  source: "manual" | "frankenstein";
  projectStatus: "idea" | "in_progress" | "completed" | "archived";
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentDTO {
  id: string;
  ideaId: string;
  userId: string;
  documentType: "startup_analysis" | "hackathon_analysis";
  title: string;
  content: any;
  createdAt: string;
  updatedAt: string;
}

interface IdeaWithDocumentsDTO {
  idea: IdeaDTO;
  documents: DocumentDTO[];
}
```

### Domain to DAO Mapping

```typescript
interface IdeaDAO {
  id: string;
  user_id: string;
  idea_text: string;
  soerty: string;
  project_status: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface DocumentDAO {
  id: string;
  idea_id: string;
  user_id: string;
  document_type: string;
  title: string | null;
  content: any;
  created_at: string;
  updated_at: string;
}
```

### Query Pattern: Get Idea with Documents

```typescript
// Get idea
const { data: ideaData } = await supabase
  .from('ideas')
  .select('*')
  .eq('id', ideaId)
  .single();

// Get documents for idea
const { data: documentsData } = await supabase
  .from('documents')
  .select('*')
  .eq('idea_id', ideaId)
  .order('created_at', { ascending: false });

// Result structure:
{
  idea: {
    id: 'idea-uuid',
    user_id: 'user-uuid',
    idea_text: 'My startup idea',
    source: 'manual',
    project_status: 'idea',
    notes: '',
    tags: [],
    created_at: '...',
    updated_at: '...'
  },
  documents: [
    {
      id: 'doc-uuid-1',
      idea_id: 'idea-uuid',
      document_type: 'startup_analysis',
      content: { viability: 85, innovation: 90, ... },
      created_at: '...'
    },
    {
      id: 'doc-uuid-2',
      idea_id: 'idea-uuid',
      document_type: 'hackathon_analysis',
      content: { technical: 88, creativity: 92, ... },
      created_at: '...'
    }
  ]
}
```

## Data Migration

### Migration Strategy

Since there are fewer than 100 existing analyses (all test data), we will:

1. **Create new tables** (`ideas`, `documents`)
2. **Migrate all data** from `saved_analyses` to new tables
3. **Keep `saved_analyses` unchanged** for backward compatibility
4. **Update application code** to use new tables

### Complete Migration SQL

```sql
-- Migration: create_ideas_and_documents_tables

-- Step 1: Create ideas table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'frankenstein')),
  project_status TEXT NOT NULL DEFAULT 'idea'
    CHECK (project_status IN ('idea', 'in_progress', 'completed', 'archived')),
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('startup_analysis', 'hackathon_analysis')),
  title TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_ideas_user ON ideas(user_id);
CREATE INDEX idx_ideas_status ON ideas(user_id, project_status);
CREATE INDEX idx_ideas_updated ON ideas(updated_at DESC);

CREATE INDEX idx_documents_idea ON documents(idea_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(idea_id, document_type);

-- Step 4: Migrate ideas from saved_analyses
-- Create a temporary mapping table to track old analysis_id to new idea_id
CREATE TEMP TABLE idea_mapping AS
SELECT
  sa.id as old_analysis_id,
  gen_random_uuid() as new_idea_id,
  sa.user_id,
  sa.idea as idea_text,
  CASE
    WHEN sa.analysis_type = 'frankenstein' THEN 'frankenstein'
    ELSE 'manual'
  END as source,
  sa.created_at,
  sa.updated_at
FROM saved_analyses sa;

-- Insert ideas
INSERT INTO ideas (id, user_id, idea_text, source, created_at, updated_at)
SELECT new_idea_id, user_id, idea_text, source, created_at, updated_at
FROM idea_mapping;

-- Step 5: Migrate documents (only for entries with analysis)
INSERT INTO documents (idea_id, user_id, document_type, content, created_at, updated_at)
SELECT
  im.new_idea_id,
  sa.user_id,
  CASE
    WHEN sa.analysis_type = 'idea' THEN 'startup_analysis'
    WHEN sa.analysis_type = 'hackathon' THEN 'hackathon_analysis'
  END as document_type,
  sa.analysis as content,
  sa.created_at,
  sa.updated_at
FROM saved_analyses sa
JOIN idea_mapping im ON im.old_analysis_id = sa.id
WHERE sa.analysis_type IN ('idea', 'hackathon')
  AND sa.analysis IS NOT NULL
  AND sa.analysis != 'null'::jsonb;

-- Step 6: Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Users can manage their own ideas"
  ON ideas FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id);

-- Step 8: Create triggers
CREATE OR REPLACE FUNCTION update_ideas_timestamp()
RETURNS TRIGGER AS $ round-trip
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ideas_timestamp
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_ideas_timestamp();

CREATE OR REPLACE FUNCTION update_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documents_timestamp
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_timestamp();
```

### Migration Application Using MCP

```typescript
// Step 1: Apply the migration
await mcp_supabase_apply_migration({
  name: "create_ideas_and_documents_tables",
  query: `/* Complete SQL from above */`,
});

// Step 2: Verify tables were created
await mcp_supabase_list_tables({
  schemas: ["public"],
});
// Should show ideas and documents in the list

// Step 3: Verify migration counts
await mcp_supabase_execute_sql({
  query: `
    SELECT
      (SELECT COUNT(*) FROM saved_analyses) as saved_analyses_count,
      (SELECT COUNT(*) FROM ideas) as ideas_count,
      (SELECT COUNT(*) FROM documents) as documents_count,
      (SELECT COUNT(*) FROM saved_analyses WHERE analysis_type = 'frankenstein') as frankenstein_count;
  `,
});
// ideas_count should equal saved_analyses_count
// documents_count should equal saved_analyses_count - frankenstein_count

// Step 4: Verify foreign key constraints
await mcp_supabase_execute_sql({
  query: `
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name IN ('ideas', 'documents')
      AND tc.constraint_type = 'FOREIGN KEY';
  `,
});

// Step 5: Verify RLS policies
await mcp_supabase_execute_sql({
  query: `
    SELECT
      tablename,
      policyname,
      cmd
    FROM pg_policies
    WHERE tablename IN ('ideas', 'documents');
  `,
});
// Should show 2 policies (1 per table)

// Step 6: Verify triggers exist
await mcp_supabase_execute_sql({
  query: `
    SELECT
      trigger_name,
      event_object_table
    FROM information_schema.triggers
    WHERE event_object_table IN ('ideas', 'documents');
  `,
});
// Should show 2 triggers (1 per table)

// Step 7: Verify data integrity
await mcp_supabase_execute_sql({
  query: `
    -- Check for orphaned documents
    SELECT COUNT(*) as orphaned_documents
    FROM documents d
    LEFT JOIN ideas i ON i.id = d.idea_id
    WHERE i.id IS NULL;
  `,
});
// Should return 0
```

### Verification Checklist

After migration, verify using MCP tools:

- [ ] `mcp_supabase_list_tables` shows `ideas` and `documents` tables exist
- [ ] `mcp_supabase_execute_sql` confirms ideas_count = saved_analyses_count
- [ ] `mcp_supabase_execute_sql` confirms documents_count = saved_analyses_count - frankenstein_count
- [ ] `mcp_supabase_execute_sql` confirms foreign key constraints exist
- [ ] `mcp_supabase_execute_sql` confirms RLS policies exist (2 total)
- [ ] `mcp_supabase_execute_sql` confirms triggers exist (2 total)
- [ ] `mcp_supabase_execute_sql` confirms no orphaned documents (0 rows)

### Rollback Plan (If Needed)

```sql
-- Use mcp_supabase_execute_sql to rollback if needed
DROP TRIGGER IF EXISTS trigger_update_documents_timestamp ON documents;
DROP TRIGGER IF EXISTS trigger_update_ideas_timestamp ON ideas;
DROP FUNCTION IF EXISTS update_documents_timestamp();
DROP FUNCTION IF EXISTS update_ideas_timestamp();
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
```

## Error Handling

### Domain Errors

```typescript
class IdeaNotFoundError extends DomainError {
  readonly code = "IDEA_NOT_FOUND";
  constructor(ideaId: string) {
    super(`Idea not found: ${ideaId}`);
  }
}

class DocumentNotFoundError extends DomainError {
  readonly code = "DOCUMENT_NOT_FOUND";
  constructor(documentId: string) {
    super(`Document not found: ${documentId}`);
  }
}

class InvalidProjectStatusError extends DomainError {
  readonly code = "INVALID_PROJECT_STATUS";
  constructor(status: string) {
    super(`Invalid project status: ${status}`);
  }
}

class FeatureDisabledError extends DomainError {
  readonly code = "FEATURE_DISABLED";
  constructor(feature: string) {
    super(`Feature is disabled: ${feature}`);
  }
}

class UnauthorizedAccessError extends DomainError {
  readonly code = "UNAUTHORIZED_ACCESS";
  constructor(userId: string, resourceId: string) {
    super(`User ${userId} is not authorized to access resource ${resourceId}`);
  }
}
```

### Error Handling Strategy

1. **Domain Layer**: Throw domain-specific errors for business rule violations
2. **Application Layer**: Catch domain errors and tanvert to appropriate result types
3. **Infrastructure Layer**: Catch infrastructure errors (database) and convert to domain errors
4. **Web Layer**: Convert domain errors to appropriate HTTP responses with user-friendly messages

### HTTP Error Mapping

- `IdeaNotFoundError` → 404 Not Found
- `DocumentNotFoundError` → 404 Not Found
- `InvalidProjectStatusError` → 400 Bad Request
- `FeatureDisabledError` → 403 Forbidden
- `UnauthorizedAccessError` → 403 Forbidden

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Domain Layer Tests:**

- Entity creation and reconstruction
- Value object validation
- Business rule enforcement (status transitions)
- Notes and tags management

**Application Layer Tests:**

- Use case orchestration with mocked dependencies
- Idea and document retrieval logic
- Status update logic
- Metadata save logic

**Infrastructure Layer Tests:**

- Repository implementations with test database
- Mapper conversions (entity ↔ DAO ↔ DTO)
- Migration scripts

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library. Each test will run a minimum of 100 iterations.

**Configuration:**

```typescript
import fc from "fast-check";

const propertyTestConfig = { numRuns: 100 };
```

**Property Test Examples:**

```typescript
// Property: Notes round-trip
describe("Idea Metadata Properties", () => {
  it("Feature: idea-panel, Property: Notes round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 1000 }),
        async (notes) => {
          const idea = await createIdeaWithNotes(notes);
          const savedIdea = await saveIdea(idea);
          const loadedIdea = await loadIdea(savedIdea.id);

          expect(loadedIdea.notes).toBe(notes);
        }
      ),
      propertyTestConfig
    );
  });
});

// Property: Tags round-trip
describe("Idea Tags Properties", () => {
  it("Feature: idea-panel, Property: Tags round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        async (tags) => {
          const idea = await createIdeaWithTags(tags);
          const savedIdea = await saveIdea(idea);
          const loadedIdea = await loadIdea(savedIdea.id);

          expect(loadedIdea.getTags()).toEqual(tags);
        }
      ),
      propertyTestConfig
    );
  });
});

// Property: Document type detection
describe("Document Type Properties", () => {
  it("Feature: idea-panel, Property: Document type is detected correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("startup_analysis", "hackathon_analysis"),
        async (documentType) => {
          const document = createDocumentWithType(documentType);
          const detectedType = document.getType().value;

          expect(detectedType).toBe(documentType);
        }
      ),
      propertyTestConfig
    );
  });
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

- Complete idea creation flow
- Status update flow
- Metadata management flow (save notes/tags)
- Document listing flow
- Feature flag integration with UI and API
- Authentication and authorization checks
- Migration data integrity

### E2E Testing

End-to-end tests using Playwright will verify user workflows:

- Navigate from dashboard to idea panel
- View idea details and documents in panel
- Update project status
- Add and save notes
- Add and remove tags
- Verify responsive design on mobile viewport
- Verify accessibility with keyboard navigation
- Test feature flag behavior

## Performance Considerations

### Database Optimization

- Use indexes on foreign keys and frequently queried columns
- Implement connection pooling for Supabase client
- Use database transactions for atomic operations
- Optimize queries with proper JOINs

### Frontend Optimization

- Use React Server Components for initial data loading
- Implement optimistic UI updates for better perceived performance
- Cache idea and document data in client-side state management
- Lazy load heavy components

### Caching Strategy

- Cache idea data for 5 minutes
- Invalidate cache on updates
- Use SWR (stale-while-revalidate) pattern for data fetching

## Security Considerations

### Authentication and Authorization

- Verify user authentication on all API endpoints
- Ensure users can only access their own ideas and documents
- Validate ownership before allowing operations

### Input Validation

- Validate all user inputs using Zod schemas
- Sanitize notes content before storage
- Validate project status enum values
- Validate tag format and length
- Validate document type enum values

### Data Protection

- Store ideas and documents with user_id association for access control
- Use RLS policies to enforce row-level security
- Audit log for modifications (future enhancement)

## Deployment Strategy

### Feature Flag Configuration

```typescript
// lib/featureFlags.config.ts
export const featureFlags = {
  ENABLE_IDEA_PANEL: process.env.FF_ENABLE_IDEA_PANEL === "true",
};
```

### Rollout Plan

1. **Phase 1**: Deploy with feature flag disabled, run database migrations
2. **Phase 2**: Enable for internal testing
3. **Phase 3**: Enable for beta users (10% rollout)
4. **Phase 4**: Gradual rollout to all users (25%, 50%, 100%)

### Monitoring and Observability

- Track panel opens and usage
- Monitor idea creation success/failure rates
- Track status update patterns
- Monitor database query performance
- Track feature flag usage and adoption rates
- Monitor migration success

### Rollback Strategy

- Feature flag allows instant disable without code deployment
- Database migrations are additive (no data loss on rollback)
- `saved_analyses` table remains unchanged (can revert to old code)
- New tables can be dropped if needed (rollback SQL provided)
