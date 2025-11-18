# Design Document

## Overview

The Idea Panel MVP provides a dedicated workspace for users to view and manage their analyzed startup ideas. This initial version focuses on creating a solid foundation with a clean interface that displays analysis details, allows status tracking, and supports basic metadata management (notes and tags). The panel integrates with both standard and hackathon analysis types.

This MVP intentionally excludes document generation features (PRD, Design Doc, Roadmap, Architecture), which will be added in a future iteration. The focus is on establishing the core panel infrastructure, data model, and user interface patterns that will support future enhancements.

## Architecture

### High-Level Architecture

The Idea Panel follows hexagonal architecture with three primary layers:

**Domain Layer:**

- `IdeaPanel` aggregate root managing panel state and business rules
- Value objects for `ProjectStatus`
- Repository interfaces for data access contracts

**Application Layer:**

- Use cases for panel operations (open, update status, save metadata)
- Query handlers for read operations (get panel data)
- Command handlers for write operations (update status, save notes/tags)

**Infrastructure Layer:**

- Supabase repository implementation for persistence
- Web controllers handling HTTP requests from Next.js routes

### Integration Points

1. **Dashboard Integration**: Analysis cards display "Manage" button when feature is enabled
2. **Analysis Integration**: Panel loads data from existing saved_analyses table
3. **Authentication**: Uses existing auth middleware for access control
4. **Analytics**: Tracks panel usage events

## Components and Interfaces

### Domain Layer Components

#### IdeaPanel Entity (Aggregate Root)

```typescript
class IdeaPanel extends Entity<IdeaPanelId> {
  private constructor(
    id: IdeaPanelId,
    private readonly analysisId: AnalysisId,
    private readonly userId: UserId,
    private projectStatus: ProjectStatus,
    private notes: string,
    private tags: string[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super(id);
  }

  // Factory methods
  static create(props: CreateIdeaPanelProps): IdeaPanel;
  static reconstruct(props: IdeaPanelProps): IdeaPanel;

  // Business methods
  updateStatus(newStatus: ProjectStatus): void;
  updateNotes(notes: string): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  getTags(): string[];
}
```

#### Value Objects

```typescript
class ProjectStatus {
  private constructor(
    private readonly _value: "idea" | "in_progress" | "completed"
  ) {}

  static IDEA = new ProjectStatus("idea");
  static IN_PROGRESS = new ProjectStatus("in_progress");
  static COMPLETED = new ProjectStatus("completed");

  get value(): string {
    return this._value;
  }
  equals(other: ProjectStat): boolean;
}
```

#### Repository Interfaces

```typescript
interface IIdeaPanelRepository {
  // Commands
  save(panel: IdeaPanel): Promise<void>;
  update(panel: IdeaPanel): Promise<void>;

  // Queries
  findById(id: IdeaPanelId): Promise<IdeaPanel | null>;
  findByAnalysisId(analysisId: AnalysisId): Promise<IdeaPanel | null>;
  findByUserId(userId: UserId): Promise<IdeaPanel[]>;
}
```

### Application Layer Components

#### Use Cases

```typescript
// Panel Management
class OpenIdeaPanelUseCase {
  constructor(
    private readonly panelRepository: IIdeaPanelRepository,
    private readonly analysisRepository: IAnalysisRepository
  ) {}

  async execute(command: OpenIdeaPanelCommand): Promise<IdeaPanelDTO>;
}

class UpdatePanelStatusUseCase {
  constructor(private readonly panelRepository: IIdeaPanelRepository) {}

  async execute(command: UpdateStatusCommand): Promise<void>;
}

class SavePanelMetadataUseCase {
  constructor(private readonly panelRepository: IIdeaPanelRepository) {}

  async execute(command: SaveMetadataCommand): Promise<void>;
}

class GetPanelDataUseCase {
  constructor(
    private readonly panelRepository: IIdeaPanelRepository,
    private readonly analysisRepository: IAnalysisRepository
  ) {}

  async execute(query: GetPanelDataQuery): Promise<PanelDataDTO>;
}
```

### Infrastructure Layer Components

#### Repository Implementation

```typescript
class SupabaseIdeaPanelRepository implements IIdeaPanelRepository {
  construn new DocumentVersion(1);
  }private readonly client: SupabaseClient,
    private readonly mapper: IdeaPanelMapper
  ) {}

  async save(panel: IdeaPanel): Promise<void>
  async update(panel: IdeaPanel): Promise<void>
  async findById(id: IdeaPanelId): Promise<IdeaPanel | null>
  async findByAnalysisId(analysisId: AnalysisId): Promise<IdeaPanel | null>
  async findByUserId(userId: UserId): Promise<IdeaPanel[]>
}
```

#### Web Controllers

```typescript
class IdeaPanelController {
  constructor(
    private readonly openPanelUseCase: OpenIdeaPanelUseCase,
    private readonly getPanelDataUseCase: GetPanelDataUseCase,
    private readonly updateStatusUseCase: UpdatePanelStatusUseCase,
    private readonly saveMetadataUseCase: SavePanelMetadataUseCase
  ) {}

  async openPanel(req: NextRequest): Promise<NextResponse>;
  async getPanelData(req: NextRequest): Promise<NextResponse>;
  async updateStatus(req: NextRequest): Promise<NextResponse>;
  async saveMetadata(req: NextRequest): Promise<NextResponse>;
}
```

## Data Models

### Database Schema

#### saved_analyses Table Extensions

```sql
ALTER TABLE saved_analyses ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'idea' CHECK (project_status IN ('idea', 'in_progress', 'completed'));
ALTER TABLE saved_analyses ADD COLUMN IF NOT EXISTS panel_metadata JSONB DEFAULT '{"notes": "", " []}';
```

### Data Transfer Objects (DTOs)

```typescript
interface IdeaPanelDTO {
  id: string;
  analysisId: string;
  userId: string;
  projectStatus: "idea" | "in_progress" | "completed";
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PanelDataDTO {
  panel: IdeaPanelDTO;
  analysis: AnalysisDTO;
}

interface AnalysisDTO {
  id: string;
  idea: string;
  category: string;
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: string;
}
```

### Domain to DAO Mapping

```typescript
interface IdeaPanelDAO {
  id: string;
  analysis_id: string;
  user_id: string;
  project_status: string;
  panel_metadata: {
    notes: string;
    tags: string[];
  };
  created_at: string;
  updated_at: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, several consolidation opportunities emerged:

**Feature Flag Pattern**: Requirements 7.1 and 7.3 test the same behavior (button visibility) with opposite flag values. Similarly, 7.2 and 7.4 test route access. These can be consolidated into single properties that test both states.

**Display Pattern**: Requirements 2.1-2.5 all test that different sections are displayed. These can be consolidated into a single property that verifies all required sections are present.

**Persistence Pattern**: Requirements 4.3 and 5.4 both test persistence to panel_metadata. These follow the same pattern and can be consolidated.

**Round-trip Pattern**: Requirements 4.5 and 5.5 both test that saved data is retrieved correctly. These are round-trip properties.

### Correctness Properties

Property 1: Dashboard displays manage button for all analyses
_For any_ dashboard view containing analyses, when ENABLE_IDEA_PANEL is true, each analysis card should display a "Manage" button
**Validates: Requirements 1.1, 7.3**

Property 2: Manage button navigates to correct panel route
_For any_ analysis, clicking the "Manage" button should navigate to `/idea-panel/[analysisId]` with the correct analysis ID
**Validates: Requirements 1.2**

Property 3: Panel displays complete analysis data
_For any_ idea panel, the displayed content should include idea description, all scores, strengths, weaknesses, and recommendations
**Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.4, 2.5**

Property 4: Panel displays current status
_For any_ idea panel, the system should display the current project status (idea, in_progress, or completed)
**Validates: Requirements 3.1**

Property 5: Status updates are persisted
_For any_ idea panel, when the project status is changed, the new status should be persisted to the database
**Validates: Requirements 3.3**

Property 6: Status indicator updates immediately
_For any_ idea panel, when the project status is changed, the status indicator should reflect the new status without page reload
**Validates: Requirements 3.4**

Property 7: Panel displays timestamps
_For any_ idea panel, the system should display the analysis creation date and last updated timestamp
**Validates: Requirements 3.5**

Property 8: Notes section is displayed
_For any_ idea panel, a notes section should be displayed
**Validates: Requirements 4.1**

Property 9: Editing notes enables save button
_For any_ idea panel, when notes are added or edited, the save button should be enabled
**Validates: Requirements 4.2**

Property 10: Notes are persisted
_For any_ idea panel, when notes are saved, they should be persisted to the panel_metadata field in the database
**Validates: Requirements 4.3**

Property 11: Saving updates timestamp
_For any_ idea panel, when notes are saved, the last modified timestamp should be updated
**Validates: Requirements 4.4**

Property 12: Notes round-trip
_For any_ idea panel with saved notes, loading the panel should display the previously saved notes
**Validates: Requirements 4.5**

Property 13: Tags section is displayed
_For any_ idea panel, a tags section should be displayed
**Validates: Requirements 5.1**

Property 14: Adding tag updates metadata
_For any_ idea panel, when a tag is added, it should be added to the panel_metadata field
**Validates: Requirements 5.2**

Property 15: Removing tag updates metadata
_For any_ idea panel, when a tag is removed, it should be removed from the panel_metadata field
**Validates: Requirements 5.3**

Property 16: Tags are persisted
_For any_ idea panel, when tags are saved, they should be persisted to the database
**Validates: Requirements 5.4**

Property 17: Tags round-trip
_For any_ idea panel with saved tags, loading the panel should display the previously saved tags
**Validates: Requirements 5.5**

Property 18: ARIA labels present on interactive elements
_For any_ interactive element in the idea panel, appropriate ARIA labels should be present for screen reader accessibility
**Validates: Requirements 6.2**

Property 19: Responsive layout adapts to viewport
_For any_ idea panel viewed on mobile viewport, the layout should adapt to the screen size
**Validates: Requirements 6.3**

Property 20: Touch targets meet minimum size
_For any_ button in the idea panel on mobile viewport, the tap target should meet minimum size requirements (44x44 pixels)
**Validates: Requirements 6.4**

Property 21: Feature flag controls manage button visibility
_For any_ dashboard view, the "Manage" button should be displayed when ENABLE_IDEA_PANEL is true and hidden when false
**Validates: Requirements 7.1, 7.3**

Property 22: Feature flag protects panel routes
_For any_ request to idea panel routes, the system should allow access when ENABLE_IDEA_PANEL is true and return 404 when false
**Validates: Requirements 7.2, 7.4**

Property 23: Standard analysis displays standard fields
_For any_ standard analysis, the panel should display viability, innovation, and market scores
**Validates: Requirements 8.1**

Property 24: Hackathon analysis displays hackathon fields
_For any_ hackathon analysis, the panel should display technical, creativity, and impact scores
**Validates: Requirements 8.2**

Property 25: Analysis type is detected automatically
_For any_ analysis, the system should correctly detect whether it is a standard or hackathon type
**Validates: Requirements 8.3**

Property 26: Score labels match analysis type
_For any_ analysis, the displayed score labels should match the analysis type (standard or hackathon)
**Validates: Requirements 8.4**

Property 27: Type-specific recommendations are displayed
_For any_ analysis, the panel should display recommendations appropriate to the analysis type
**Validates: Requirements 8.5**

## Error Handling

### Domain Errors

```typescript
class IdeaPanelNotFoundError extends DomainError {
  readonly code = "IDEA_PANEL_NOT_FOUND";
  constructor(analysisId: string) {
    super(`Idea panel not found for analysis: ${analysisId}`);
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
  constructor(userId: string, panelId: string) {
    super(`User ${userId} is not authorized to access panel ${panelId}`);
  }
}
```

### Error Handling Strategy

1. **Domain Layer**: Throw domain-specific errors for business rule violations
2. **Application Layer**: Catch domain errors and convert to appropriate result types
3. **Infrastructure Layer**: Catch infrastructure errors (database) and convert to domain errors
4. **Web Layer**: Convert domain errors to appropriate HTTP responses with user-friendly messages

### HTTP Error Mapping

- `IdeaPanelNotFoundError` → 404 Not Found
- `InvalidProjectStatusError` → 400 Bad Request
- `FeatureDisabledError` → 403 Forbidden
- `UnauthorizedAccessError` → 403 Forbidden

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Domain Layer Tests:**

- Entity creation and reconstruction
- ProjectStatus value object validation
- Business rule enforcement (status transitions)
- Notes and tags management

**Application Layer Tests:**

- Use case orchestration with mocked dependencies
- Panel creation and retrieval logic
- Status update logic
- Metadata save logic

**Infrastructure Layer Tests:**

- Repository implementations with test database
- Mapper conversions (entity ↔ DAO ↔ DTO)

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library. Each test will run a minimum of 100 iterations.

**Configuration:**

```typescript
import fc from "fast-check";

const propertyTestConfig = { numRuns: 100 };
```

**Property Test Examples:**

```typescript
// Property 12: Notes round-trip
describe("Panel Metadata Properties", () => {
  it("Feature: idea-panel, Property 12: Notes round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 1000 }),
        async (notes) => {
          const panel = await createPanelWithNotes(notes);
          const savedPanel = await savePanel(panel);
          const loadedPanel = await loadPanel(savedPanel.id);

          expect(loadedPanel.notes).toBe(notes);
        }
      ),
      propertyTestConfig
    );
  });
});

// Property 17: Tags round-trip
describe("Panel Tags Properties", () => {
  it("Feature: idea-panel, Property 17: Tags round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        async (tags) => {
          const panel = await createPanelWithTags(tags);
          const savedPanel = await savePanel(panel);
          const loadedPanel = await loadPanel(savedPanel.id);

          expect(loadedPanel.getTags()).toEqual(tags);
        }
      ),
      propertyTestConfig
    );
  });
});

// Property 25: Analysis type detection
describe("Analysis Type Properties", () => {
  it("Feature: idea-panel, Property 25: Analysis type is detected automatically", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("general", "hackathon"),
        async (category) => {
          const analysis = createAnalysisWithCategory(category);
          const detectedType = detectAnalysisType(analysis);

          const expectedType =
            category === "hackathon" ? "hackathon" : "standard";
          expect(detectedType).toBe(expectedType);
        }
      ),
      propertyTestConfig
    );
  });
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

- Complete panel creation flow (analysis → panel creation → data loading)
- Status update flow (change status → persist → verify)
- Metadata management flow (save notes/tags → persist → retrieve)
- Feature flag integration with UI and API
- Authentication and authorization checks

### E2E Testing

End-to-end tests using Playwright will verify user workflows:

- Navigate from dashboard to idea panel
- View analysis details in panel
- Update project status
- Add and save notes
- Add and remove tags
- Verify responsive design on mobile viewport
- Verify accessibility with keyboard navigation
- Test feature flag behavior

## Performance Considerations

### Database Optimization

- Use existing indexes on `saved_analyses` table
- Implement connection pooling for Supabase client
- Use database transactions for atomic operations

### Frontend Optimization

- Use React Server Components for initial panel data loading
- Implement optimistic UI updates for better perceived performance
- Cache panel data in client-side state management
- Lazy load heavy components

### Caching Strategy

- Cache panel data for 5 minutes
- Invalidate cache on updates
- Use SWR (stale-while-revalidate) pattern for data fetching

## Security Considerations

### Authentication and Authorization

- Verify user authentication on all API endpoints
- Ensure users can only access their own idea panels
- Validate analysis ownership before allowing panel access

### Input Validation

- Validate all user inputs using Zod schemas
- Sanitize notes content before storage
- Validate project status enum values
- Validate tag format and length

### Data Protection

- Store panels with user_id association for access control
- Audit log for panel modifications
- Encrypt sensitive metadata fields if needed

## Deployment Strategy

### Database Migrations

**Use Supabase MCP tools for all database operations:**

- Use `mcp_supabase_apply_migration` tool to apply migrations
- Use `mcp_supabase_list_tables` tool to verify schema changes
- Use `mcp_supabase_execute_sql` tool to test queries during development

```sql
-- Migration: add_idea_panel_support
-- Add columns to saved_analyses table
ALTER TABLE saved_analyses
  ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'idea' CHECK (project_status IN ('idea', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS panel_metadata JSONB DEFAULT '{"notes": "", "tags": []}';

-- Create index for faster panel lookups
CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_status ON saved_analyses(user_id, project_status);
```

**Migration Application:**

```typescript
// Use Supabase MCP tool
await mcp_supabase_apply_migration({
  name: "add_idea_panel_support",
  query: `
    ALTER TABLE saved_analyses
      ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'idea' CHECK (project_status IN ('idea', 'in_progress', 'completed')),
      ADD COLUMN IF NOT EXISTS panel_metadata JSONB DEFAULT '{"notes": "", "tags": []}';

    CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_status ON saved_analyses(user_id, project_status);
  `,
});
```

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
- Monitor panel creation success/failure rates
- Track status update patterns
- Monitor database query performance
- Track feature flag usage and adoption rates

### Rollback Strategy

- Feature flag allows instant disable without code deployment
- Database migrations are additive (no data loss on rollback)
- Panel creation failures don't affect existing analyses
