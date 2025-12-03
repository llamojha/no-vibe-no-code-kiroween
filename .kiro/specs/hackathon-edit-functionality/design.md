# Design Document: Hackathon Edit Functionality

## Overview

This design document outlines the implementation of edit functionality for saved Kiroween Hackathon analysis reports. The feature enables users to refine their project descriptions by incorporating AI-generated improvement suggestions, bringing feature parity with the existing Idea Analyzer edit workflow. The implementation follows hexagonal architecture principles and maintains consistency with existing patterns in the codebase.

### Goals

1. Enable users to edit saved hackathon analyses from the dashboard
2. Support iterative project refinement through AI suggestion integration
3. Maintain security through proper authorization checks
4. Provide a consistent user experience matching the Idea Analyzer edit flow
5. Follow hexagonal architecture and existing code patterns

### Non-Goals

- Editing analysis results or scores (only project description is editable)
- Batch editing multiple analyses simultaneously
- Version history or rollback functionality
- Real-time collaborative editing

## Architecture

### Layer Responsibilities

Following hexagonal architecture, the implementation spans three layers:

**Domain Layer** (`src/domain/`)

- No changes required - existing entities and value objects support the edit workflow
- `Analysis` entity already has methods for validation and business rules
- Repositoryfaces already define update operations

**Application Layer** (`src/application/`)

- New use case: `UpdateHackathonAnalysisUseCase` - orchestrates the update workflow
- Validates user ownership before allowing updates
- Coordinates with AI service for re-analysis
- Handles business logic for suggestion tracking

**Infrastructure Layer** (`src/infrastructure/`)

- Repository implementation: Update `SupabaseHackathonAnalysisRepository` with update method
- API endpoint: New PATCH route at `/api/v2/hackathon/[id]`
- Controller: `HackathonController` handles HTTP requests and responses

**Feature Layer** (`features/`)

- UI components: Enhance `KiroweenAnalyzerView` to support edit mode
- Client API: New `updateHackathonAnalysis` function for API calls
- State management: Track edit mode, added suggestions, and update status

### Data Flow

```
User clicks "Edit" on Dashboard
  ↓
Dashboard navigates to /kiroween-analyzer?savedId={id}&mode=refine
  ↓
KiroweenAnalyzerView loads saved analysis
  ↓
User modifies description and/or adds suggestions
  ↓
User clicks "Analyze" button
  ↓
Client calls updateHackathonAnalysis API
  ↓
PATCH /api/v2/hackathon/[id] endpoint
  ↓
HackathonController validates request
  ↓
UpdateHackathonAnalysisUseCase orchestrates update
  ↓
Validates ownership → Re-analyzes project → Updates repository
  ↓
Returns updated analysis to client
  ↓
UI displays success notification and new results
```

## Components and Interfaces

### 1. Application Layer - Use Case

**File**: `src/application/use-cases/UpdateHackathonAnalysisUseCase.ts`

```typescript
export interface UpdateHackathonAnalysisInput {
  analysisId: AnalysisId;
  userId: UserId;
  projectDescription: string;
  supportingMaterials?: Record<string, string>;
}

export interface UpdateHackathonAnalysisOutput {
  analysis: Analysis;
  updatedAt: Date;
}

export class UpdateHackathonAnalysisUseCase {
  constructor(
    private readonly hackathonRepository: IHackathonAnalysisRepository,
    private readonly aiService: IAIAnalysisService,
    private readonly validationService: AnalysisValidationService
  ) {}

  async execute(
    input: UpdateHackathonAnalysisInput
  ): Promise<Result<UpdateHackathonAnalysisOutput, Error>>;
}
```

**Design Decisions**:

- Use case receives dependencies through constructor injection (DI pattern)
- Validates ownership before proceeding with update
- Delegates AI analysis to `IAIAnalysisService` for separation of concerns
- Returns domain entity, not DTO (conversion happens at infrastructure boundary)

### 2. Infrastructure Layer - Repository

**File**: `src/infrastructure/database/supabase/repositories/SupabaseHackathonAnalysisRepository.ts`

Add method to existing repository:

```typescript
async updateHackathonAnalysis(
  id: AnalysisId,
  userId: UserId,
  projectDescription: string,
  analysis: Analysis,
  supportingMaterials?: Record<string, string>
): Promise<Result<Analysis, Error>>
```

**Design Decisions**:

- Method includes `userId` parameter for ownership verification at database level
- Uses `HackathonAnalysisMapper` to convert between domain entities and DAOs
- Implements optimistic locking through `updated_at` timestamp comparison
- Returns updated domain entity after successful persistence

### 3. Infrastructure Layer - API Endpoint

**File**: `app/api/v2/hackathon/[id]/route.ts`

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response>;
```

**Request Schema** (Zod):

```typescript
const UpdateHackathonAnalysisSchema = z.object({
  projectDescription: z.string().min(10).max(5000),
  supportingMaterials: z.record(z.string()).optional(),
});
```

**Response Format**:

```typescript
{
  success: true,
  data: {
    id: string;
    projectDescription: string;
    analysis: HackathonAnalysis;
    supportingMaterials: Record<string, string>;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Design Decisions**:

- RESTful PATCH endpoint for partial updates
- Uses dynamic route parameter `[id]` for analysis ID
- Validates request body with Zod schema before processing
- Returns full updated analysis in response
- Follows existing v2 API patterns for consistency

### 4. Infrastructure Layer - Controller

**File**: `src/infrastructure/web/controllers/HackathonController.ts`

Add method to existing controller:

```typescript
async updateAnalysis(
  analysisId: string,
  userId: string,
  updateData: UpdateHackathonAnalysisDTO
): Promise<Result<HackathonAnalysisDTO, Error>>
```

**Design Decisions**:

- Controller handles HTTP concerns (status codes, headers, error formatting)
- Converts DTOs to domain types before calling use case
- Converts domain entities back to DTOs for response
- Centralizes error handling and logging

### 5. Feature Layer - Client API

**File**: `features/kiroween-analyzer/api/updateHackathonAnalysis.ts`

```typescript
export async function updateHackathonAnalysis(
  analysisId: string,
  projectDescription: string,
  supportingMaterials?: Record<string, string>
): Promise<{ data: SavedHackathonAnalysis | null; error: string | null }>;
```

**Design Decisions**:

- Follows existing API function patterns in the codebase
- Returns consistent `{ data, error }` structure
- Handles network errors and API error responses
- Includes proper TypeScript types for request and response

### 6. Feature Layer - UI Component Updates

**File**: `features/kiroween-analyzer/components/KiroweenAnalyzerView.tsx`

**State Additions**:

```typescript
const [isUpdating, setIsUpdating] = useState(false);
const [updateSuccess, setUpdateSuccess] = useState(false);
```

**Handler Updates**:

```typescript
const handleAnalyze = useCallback(async () => {
  // Check if in edit mode (savedId exists)
  if (savedId) {
    // Call update API instead of create
    const result = await updateHackathonAnalysis(
      savedId,
      submission.description,
      submission.supportingMaterials
    );
    // Handle success/error
  } else {
    // Existing create flow
  }
}, [savedId, submission]);
```

**Design Decisions**:

- Reuses existing `handleAnalyze` function with conditional logic
- Maintains existing state management patterns
- Shows success notification for 3 seconds after update
- Disables analyze button during update operation
- Preserves edit mode URL parameters during navigation

### 7. Feature Layer - Dashboard Updates

**File**: `features/dashboard/components/AnalysisCard.tsx`

Add edit button for hackathon analyses:

```typescript
{
  analysis.category === "kiroween" && (
    <button
      onClick={() =>
        router.push(`/kiroween-analyzer?savedId=${analysis.id}&mode=refine`)
      }
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-orange-400 text-orange-300 rounded hover:bg-orange-400/10 transition-colors"
      aria-label={t("editAnalysis")}
    >
      <EditIcon className="h-4 w-4" />
      <span>{t("edit")}</span>
    </button>
  );
}
```

**Design Decisions**:

- Matches existing edit button styling from Idea Analyzer cards
- Uses `mode=refine` query parameter to indicate edit mode
- Conditional rendering based on analysis category
- Accessible with proper ARIA labels

## Data Models

### Database Schema

No changes required to existing `saved_hackathon_analyses` table. The table already supports updates through:

- `project_description` (text) - stores the editable project description
- `analysis` (jsonb) - stores the complete analysis results
- `supporting_materials` (jsonb) - stores optional supporting materials
- `updated_at` (timestamp) - automatically updated on changes
- `user_id` (uuid) - used for ownership verification

### Domain Entities

**Analysis Entity** (`src/domain/entities/Analysis.ts`)

No changes required. Existing entity already supports:

- Ownership validation through `belongsToUser(userId: UserId): boolean`
- Category management through `setCategory(category: Category): void`
- Score access through `getOverallScore(): Score`

### DTOs

**UpdateHackathonAnalysisDTO** (`src/infrastructure/web/dto/HackathonDTO.ts`)

```typescript
export interface UpdateHackathonAnalysisDTO {
  projectDescription: string;
  supportingMaterials?: Record<string, string>;
}

export interface HackathonAnalysisResponseDTO {
  id: string;
  projectDescription: string;
  analysis: HackathonAnalysisDTO;
  supportingMaterials: Record<string, string>;
  audioBase64: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}
```

## Error Handling

### Authorization Errors

**Scenario**: User attempts to edit analysis they don't own

**Handling**:

1. Repository verifies `user_id` matches authenticated user
2. Returns `BusinessRuleViolationError` if mismatch
3. Controller converts to 403 Forbidden response
4. UI displays error message: "You don't have permission to edit this analysis"

### Validation Errors

**Scenario**: Project description is too short or empty

**Handling**:

1. Zod schema validation catches invalid input
2. Returns 400 Bad Request with validation details
3. UI displays field-specific error messages
4. Analyze button remains disabled until valid

### Not Found Errors

**Scenario**: Analysis ID doesn't exist or was deleted

**Handling**:

1. Repository returns `EntityNotFoundError`
2. Controller converts to 404 Not Found response
3. UI redirects to dashboard with error notification
4. Dashboard refreshes to show current analyses

### Concurrent Update Errors

**Scenario**: Analysis was modified by another session

**Handling**:

1. Repository detects `updated_at` timestamp mismatch
2. Returns `ConcurrentModificationError`
3. Controller converts to 409 Conflict response
4. UI prompts user to refresh and try again

### AI Service Errors

**Scenario**: AI analysis fails during re-analysis

**Handling**:

1. Use case catches AI service errors
2. Logs error details for debugging
3. Returns user-friendly error message
4. UI displays: "Analysis failed. Please try again."
5. Original analysis remains unchanged

## Testing Strategy

### Unit Tests

**Domain Layer**:

- No new tests required (existing entities support edit workflow)

**Application Layer** (`src/application/use-cases/__tests__/UpdateHackathonAnalysisUseCase.test.ts`):

- Test successful update with valid input
- Test ownership validation rejection
- Test validation error handling
- Test AI service error handling
- Test concurrent modification detection
- Mock all dependencies (repository, AI service, validation service)

**Infrastructure Layer** (`src/infrastructure/database/supabase/repositories/__tests__/SupabaseHackathonAnalysisRepository.test.ts`):

- Test update method with valid data
- Test ownership verification at database level
- Test optimistic locking behavior
- Test error handling for database failures
- Use test database or mocked Supabase client

### Integration Tests

**API Endpoint** (`tests/integration/api-routes.test.ts`):

- Test PATCH /api/v2/hackathon/[id] with authenticated user
- Test authorization rejection for non-owner
- Test validation error responses
- Test 404 for non-existent analysis
- Test successful update flow end-to-end

### E2E Tests

**Edit Workflow** (`tests/e2e/hackathon-edit.spec.ts`):

- Test complete edit flow from dashboard to updated analysis
- Test suggestion integration into project description
- Test success notification display
- Test navigation back to dashboard
- Test edit button visibility and functionality
- Use Playwright for browser automation

## Security Considerations

### Authentication

- All edit operations require authenticated session
- Unauthenticated requests redirect to login page
- Session validation happens at middleware level

### Authorization

- Ownership verification at multiple levels:
  1. Use case validates `userId` matches analysis owner
  2. Repository includes `user_id` in WHERE clause
  3. Database RLS policies enforce row-level security

### Input Validation

- Zod schemas validate all user input
- Project description length limits prevent abuse
- Supporting materials validated for structure and size
- SQL injection prevented through parameterized queries

### Rate Limiting

- API endpoints protected by existing rate limiting middleware
- Prevents abuse through excessive update requests
- Configured per-user limits in infrastructure layer

## Performance Considerations

### Database Queries

- Update operation uses indexed `id` and `user_id` columns
- Single UPDATE query with WHERE clause for ownership check
- No N+1 query problems (single round-trip to database)

### AI Service Calls

- Re-analysis required for each update (unavoidable)
- Loading indicator shown during AI processing
- Timeout configured at 30 seconds
- Error handling prevents indefinite waiting

### Caching

- No caching of analysis results (always fresh data)
- Dashboard refreshes after successful update
- Browser cache headers prevent stale data display

### Optimistic UI Updates

- Not implemented initially (wait for server confirmation)
- Future enhancement: optimistic update with rollback on error
- Current approach prioritizes data consistency over perceived speed

## Accessibility

### Keyboard Navigation

- Edit button accessible via Tab key
- Form inputs support keyboard entry
- Success/error notifications announced to screen readers
- Focus management during modal dialogs

### Screen Reader Support

- ARIA labels on all interactive elements
- Live regions for dynamic content updates
- Semantic HTML structure maintained
- Error messages associated with form fields

### Visual Indicators

- Edit mode badge clearly visible
- Loading states with spinner and text
- Success notification with checkmark icon
- Error messages with warning icon
- High contrast colors for readability

## Internationalization

### Translation Keys

New translation keys required:

```typescript
{
  "editAnalysis": "Edit Analysis",
  "editMode": "Edit Mode",
  "updateSuccess": "Analysis updated successfully",
  "updateError": "Failed to update analysis",
  "unauthorized": "You don't have permission to edit this analysis",
  "analysisNotFound": "Analysis not found or has been deleted"
}
```

### Locale Support

- All user-facing text uses translation system
- Error messages localized based on user preference
- Date/time formatting respects locale settings
- Supports existing English and Spanish locales

## Migration and Rollout

### Database Migrations

No database migrations required. Existing schema supports all edit functionality.

### Feature Flags

Optional feature flag for gradual rollout:

```typescript
FF_ENABLE_HACKATHON_EDIT = true;
```

- Disabled by default during initial testing
- Enabled for beta users first
- Full rollout after validation period

### Backward Compatibility

- Existing saved analyses work without changes
- Old URLs continue to function (view mode)
- No breaking changes to API contracts
- Dashboard handles both old and new analysis formats

### Rollback Plan

If issues arise:

1. Disable feature flag to hide edit buttons
2. API endpoint remains but returns 503 Service Unavailable
3. Existing view functionality unaffected
4. No data loss or corruption risk

## Future Enhancements

### Out of Scope for Initial Implementation

1. **Version History**: Track all edits with rollback capability
2. **Collaborative Editing**: Multiple users editing same analysis
3. **Auto-save**: Periodic saving of draft changes
4. **Diff View**: Show changes between versions
5. **Bulk Edit**: Edit multiple analyses simultaneously
6. **Edit Notifications**: Notify team members of changes
7. **Audit Log**: Detailed tracking of who edited what and when

These enhancements can be added in future iterations based on user feedback and business priorities.

## Design Rationale

### Why PATCH Instead of PUT?

PATCH is semantically correct for partial updates. We're only updating the project description and analysis results, not replacing the entire resource. This follows REST best practices and makes the API more intuitive.

### Why Re-analyze Instead of Just Saving Description?

The analysis results are tightly coupled to the project description. Allowing users to change the description without updating the analysis would create inconsistency. Re-analyzing ensures the scores and feedback remain accurate and relevant.

### Why Not Allow Editing Analysis Results Directly?

Analysis results are AI-generated and represent objective evaluation. Allowing manual editing would compromise the integrity of the scoring system and create opportunities for gaming the leaderboard. Users can influence results by improving their project description.

### Why Reuse Existing Components?

The Idea Analyzer edit flow is well-tested and familiar to users. Reusing the same patterns reduces development time, maintains consistency, and leverages existing user knowledge. This follows the DRY principle and improves maintainability.

### Why Hexagonal Architecture?

Hexagonal architecture provides clear separation of concerns, making the code more testable and maintainable. Business logic in the domain layer remains independent of infrastructure details. This allows us to change databases, frameworks, or UI libraries without affecting core business rules.

### Why Constructor Injection for Dependencies?

Constructor injection makes dependencies explicit and enables easy testing through mocking. It follows SOLID principles (Dependency Inversion) and is the standard pattern used throughout the codebase. This maintains consistency and improves code quality.

## Conclusion

This design provides a comprehensive blueprint for implementing hackathon edit functionality while maintaining architectural integrity, security, and user experience consistency. The implementation follows established patterns in the codebase and can be extended with future enhancements as needed.
