# Design Document: Database Table Consolidation

## Overview

This design consolidates the `saved_analyses` and `saved_hackathon_analyses` tables into a single unified `saved_analyses` table with a type discriminator column. The key principle is **minimal schema changes** - we only add the `analysis_type` column and adapt the hackathon data to fit the existing structure.

The existing `idea` column will serve dual purpose:

- For 'idea' type: stores the startup idea text
- For 'hackathon' type: stores the project description

Hackathon-specific fields (category, kiro_usage, supporting_materials) will be stored within the `analysis` JSONB field, eliminating the need for additional columns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Use Cases (AnalyzeIdeaUseCase, etc.)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  IAnalysisRepository (Interface)                      │  │
│  │  - findByUserId(userId, type?)                        │  │
│  │  - findByUserIdAndType(userId, type)                  │  │
│  │  - save(analysis)                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SupabaseAnalysisRepository                           │  │
│  │  - Implements IAnalysisRepository                     │  │
│  │  - Uses AnalysisMapper for conversions               │  │
│  │  - Queries unified saved_analyses table              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AnalysisMapper                                       │  │
│  │  - toDAO(analysis) - detects type automatically      │  │
│  │  - toDomain(dao) - parses based on analysis_type     │  │
│  │  - Handles type-specific JSONB structure             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  saved_analyses (Unified Table)                       │  │
│  │  - id, user_id, created_at                            │  │
│  │  - analysis_type: 'idea' | 'hackathon' (NEW)         │  │
│  │  - idea (dual purpose: idea text OR project desc)    │  │
│  │  - analysis (jsonb with type-specific structure)     │  │
│  │  - audio_base64 (nullable)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Write Operations**: Application → Use Case → Repository → Mapper (detects type) → Database
2. **Read Operations**: Database → Mapper (parses based on type) → Repository → Use Case → Application
3. **Type Filtering**: Repository applies `analysis_type` filter in SQL queries

## Components and Interfaces

### 1. Database Schema

#### Schema Changes

```sql
-- Add the analysis_type discriminator column
ALTER TABLE public.saved_analyses
ADD COLUMN analysis_type TEXT NOT NULL DEFAULT 'idea'
CHECK (analysis_type IN ('idea', 'hackathon'));

-- Add indexes for performance
CREATE INDEX idx_saved_analyses_type ON public.saved_analyses(analysis_type);
CREATE INDEX idx_saved_analyses_user_type ON public.saved_analyses(user_id, analysis_type);

-- Existing table structure (no changes to these columns):
-- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
-- user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
-- idea TEXT NOT NULL (dual purpose: startup idea OR project description)
-- analysis JSONB NOT NULL (type-specific structured data)
-- audio_base64 TEXT
-- created_at TIMESTAMPTZ DEFAULT NOW()
```

#### Row Level Security Policies

Existing RLS policies remain unchanged - they already work correctly for the unified table:

```sql
-- These policies already exist and will continue to work
-- No changes needed

-- Owner access for SELECT
CREATE POLICY "saved_analyses_select_policy"
ON public.saved_analyses
FOR SELECT
USING (auth.uid() = user_id);

-- Owner access for INSERT
CREATE POLICY "saved_analyses_insert_policy"
ON public.saved_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owner access for UPDATE
CREATE POLICY "saved_analyses_update_policy"
ON public.saved_analyses
FOR UPDATE
USING (auth.uid() = user_id);

-- Owner access for DELETE
CREATE POLICY "saved_analyses_delete_policy"
ON public.saved_analyses
FOR DELETE
USING (auth.uid() = user_id);
```

### 2. Data Access Objects (DAOs)

#### Updated DAO Types

```typescript
/**
 * Analysis type discriminator
 */
export type AnalysisType = "idea" | "hackathon";

/**
 * Unified Analysis DAO - same structure for both types
 * Type-specific data is stored in the analysis JSONB field
 */
export interface AnalysisDAO {
  id: string;
  user_id: string;
  created_at: string | null;
  analysis_type: AnalysisType;
  idea: string; // For 'idea': startup idea; For 'hackathon': project description
  analysis: Json; // Contains type-specific structured data
  audio_base64: string | null;
}

/**
 * Idea-specific analysis data structure (stored in analysis JSONB field)
 */
export interface IdeaAnalysisData {
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string;
}

/**
 * Hackathon-specific analysis data structure (stored in analysis JSONB field)
 */
export interface HackathonAnalysisData {
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string;
  // Hackathon-specific fields embedded in JSONB
  selectedCategory:
    | "resurrection"
    | "frankenstein"
    | "skeleton-crew"
    | "costume-contest";
  kiroUsage: string;
  supportingMaterials?: {
    githubRepo?: string;
    demoUrl?: string;
    videoUrl?: string;
    screenshots?: string[];
    additionalNotes?: string;
  };
}

/**
 * Type guard for idea analysis data
 */
export function isIdeaAnalysisData(data: any): data is IdeaAnalysisData {
  return !("selectedCategory" in data) && !("kiroUsage" in data);
}

/**
 * Type guard for hackathon analysis data
 */
export function isHackathonAnalysisData(
  data: any
): data is HackathonAnalysisData {
  return "selectedCategory" in data && "kiroUsage" in data;
}
```

### 3. Mapper Updates

#### Enhanced AnalysisMapper

```typescript
export class AnalysisMapper {
  /**
   * Convert Analysis domain entity to DAO for database persistence
   * Automatically determines type based on domain entity properties
   */
  toDAO(analysis: Analysis): AnalysisDAO {
    const isHackathon = this.isHackathonAnalysis(analysis);

    return {
      id: analysis.id.value,
      user_id: analysis.userId.value,
      created_at: analysis.createdAt.toISOString(),
      analysis_type: isHackathon ? "hackathon" : "idea",
      idea: analysis.idea, // Works for both types
      analysis: isHackathon
        ? this.mapHackathonAnalysisData(analysis)
        : this.mapIdeaAnalysisData(analysis),
      audio_base64: null,
    };
  }

  /**
   * Convert DAO from database to Analysis domain entity
   * Parses based on analysis_type discriminator
   */
  toDomain(dao: AnalysisDAO): Analysis {
    const analysisData = dao.analysis as unknown as
      | IdeaAnalysisData
      | HackathonAnalysisData;

    const baseProps = {
      id: AnalysisId.reconstruct(dao.id),
      userId: UserId.reconstruct(dao.user_id),
      idea: dao.idea,
      score: Score.reconstruct(analysisData.score || 0),
      locale: Locale.fromString(analysisData.locale || "en"),
      feedback: analysisData.detailedSummary || undefined,
      suggestions: this.extractSuggestions(analysisData),
      createdAt: new Date(dao.created_at || Date.now()),
      updatedAt: new Date(dao.created_at || Date.now()),
    };

    if (
      dao.analysis_type === "hackathon" &&
      isHackathonAnalysisData(analysisData)
    ) {
      return Analysis.reconstruct({
        ...baseProps,
        category: Category.fromString(analysisData.selectedCategory),
        kiroUsage: analysisData.kiroUsage,
        supportingMaterials: analysisData.supportingMaterials,
      });
    } else {
      return Analysis.reconstruct(baseProps);
    }
  }

  /**
   * Determine if analysis is hackathon type based on domain properties
   */
  private isHackathonAnalysis(analysis: Analysis): boolean {
    return !!(
      analysis.category ||
      analysis.kiroUsage ||
      analysis.supportingMaterials
    );
  }

  /**
   * Map idea analysis to JSONB structure
   */
  private mapIdeaAnalysisData(analysis: Analysis): IdeaAnalysisData {
    return {
      score: analysis.score.value,
      detailedSummary: analysis.feedback || "",
      criteria: analysis.suggestions.map((suggestion, index) => ({
        name: `Criterion ${index + 1}`,
        score: analysis.score.value,
        justification: suggestion,
      })),
      locale: analysis.locale.value,
    };
  }

  /**
   * Map hackathon analysis to JSONB structure
   */
  private mapHackathonAnalysisData(analysis: Analysis): HackathonAnalysisData {
    return {
      score: analysis.score.value,
      detailedSummary: analysis.feedback || "",
      criteria: analysis.suggestions.map((suggestion, index) => ({
        name: `Criterion ${index + 1}`,
        score: analysis.score.value,
        justification: suggestion,
      })),
      locale: analysis.locale.value,
      selectedCategory: (analysis.category?.value as any) || "costume-contest",
      kiroUsage: analysis.kiroUsage || "",
      supportingMaterials: analysis.supportingMaterials,
    };
  }

  /**
   * Extract suggestions from analysis data
   */
  private extractSuggestions(
    analysisData: IdeaAnalysisData | HackathonAnalysisData
  ): string[] {
    return analysisData.criteria?.map((c) => c.justification) || [];
  }
}
```

### 4. Repository Updates

#### Enhanced Repository Interface

```typescript
export interface IAnalysisRepository
  extends IAnalysisCommandRepository,
    IAnalysisQueryRepository {
  /**
   * Find analyses by user ID with optional type filter
   */
  findByUserId(
    userId: UserId,
    params: PaginationParams,
    type?: "idea" | "hackathon"
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Find analyses by user ID and specific type
   */
  findByUserIdAndType(
    userId: UserId,
    type: "idea" | "hackathon",
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Get analysis counts by type for a user
   */
  getAnalysisCountsByType(userId: UserId): Promise<
    Result<
      {
        total: number;
        idea: number;
        hackathon: number;
      },
      Error
    >
  >;
}
```

#### Repository Implementation

```typescript
export class SupabaseAnalysisRepository implements IAnalysisRepository {
  private readonly tableName = "saved_analyses";

  async findByUserId(
    userId: UserId,
    params: PaginationParams,
    type?: "idea" | "hackathon"
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      let query = this.client
        .from(this.tableName)
        .select("*", { count: "exact" })
        .eq("user_id", userId.value);

      // Apply type filter if specified
      if (type) {
        query = query.eq("analysis_type", type);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to fetch analyses", error, "SELECT")
        );
      }

      const analyses = (data || []).map((dao) =>
        this.mapper.toDomain(dao as AnalysisDAO)
      );

      return success(createPaginatedResult(analyses, count || 0, params));
    } catch (error) {
      return failure(error as Error);
    }
  }

  async getAnalysisCountsByType(
    userId: UserId
  ): Promise<
    Result<{ total: number; idea: number; hackathon: number }, Error>
  > {
    try {
      // Get total count
      const { count: totalCount, error: totalError } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId.value);

      if (totalError) {
        return failure(
          new DatabaseQueryError(
            "Failed to get total count",
            totalError,
            "SELECT"
          )
        );
      }

      // Get idea count
      const { count: ideaCount, error: ideaError } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId.value)
        .eq("analysis_type", "idea");

      if (ideaError) {
        return failure(
          new DatabaseQueryError(
            "Failed to get idea count",
            ideaError,
            "SELECT"
          )
        );
      }

      // Get hackathon count
      const { count: hackathonCount, error: hackathonError } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId.value)
        .eq("analysis_type", "hackathon");

      if (hackathonError) {
        return failure(
          new DatabaseQueryError(
            "Failed to get hackathon count",
            hackathonError,
            "SELECT"
          )
        );
      }

      return success({
        total: totalCount || 0,
        idea: ideaCount || 0,
        hackathon: hackathonCount || 0,
      });
    } catch (error) {
      return failure(error as Error);
    }
  }

  async save(analysis: Analysis): Promise<Result<Analysis, Error>> {
    try {
      const dao = this.mapper.toDAO(analysis);

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(dao)
        .select()
        .single();

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to save analysis", error, "INSERT")
        );
      }

      const savedAnalysis = this.mapper.toDomain(data as AnalysisDAO);
      return success(savedAnalysis);
    } catch (error) {
      return failure(error as Error);
    }
  }
}
```

## Data Models

### Domain Entity (Unchanged)

The `Analysis` domain entity remains unchanged, maintaining backward compatibility:

```typescript
export class Analysis extends Entity<AnalysisId> {
  constructor(
    id: AnalysisId,
    public readonly idea: string,
    public readonly userId: UserId,
    public readonly score: Score,
    public readonly locale: Locale,
    public readonly category?: Category,
    public readonly feedback?: string,
    public readonly suggestions: string[] = [],
    public readonly kiroUsage?: string,
    public readonly supportingMaterials?: any,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    super(id);
  }
}
```

### Database Schema Mapping

| Domain Property     | Database Column              | Storage Location | Notes                                          |
| ------------------- | ---------------------------- | ---------------- | ---------------------------------------------- |
| id                  | id                           | Column           | UUID primary key                               |
| userId              | user_id                      | Column           | Foreign key to auth.users                      |
| idea                | idea                         | Column           | Dual purpose: idea text OR project description |
| score               | analysis.score               | JSONB            | Nested in analysis field                       |
| locale              | analysis.locale              | JSONB            | Nested in analysis field                       |
| category            | analysis.selectedCategory    | JSONB            | Only for hackathon type                        |
| feedback            | analysis.detailedSummary     | JSONB            | Nested in analysis field                       |
| suggestions         | analysis.criteria            | JSONB            | Array in analysis field                        |
| kiroUsage           | analysis.kiroUsage           | JSONB            | Only for hackathon type                        |
| supportingMaterials | analysis.supportingMaterials | JSONB            | Only for hackathon type                        |
| createdAt           | created_at                   | Column           | Timestamp                                      |
| -                   | analysis_type                | Column           | Type discriminator (NEW)                       |
| -                   | audio_base64                 | Column           | Audio data (optional)                          |

## Error Handling

### Migration Errors

```typescript
export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly phase:
      | "validation"
      | "migration"
      | "verification"
      | "cleanup",
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "MigrationError";
  }
}
```

### Validation Errors

```typescript
export class AnalysisTypeValidationError extends Error {
  constructor(
    message: string,
    public readonly analysisType: string,
    public readonly missingFields: string[]
  ) {
    super(message);
    this.name = "AnalysisTypeValidationError";
  }
}
```

### Error Handling Strategy

1. **Pre-migration validation**: Verify data integrity before migration
2. **Transaction-based migration**: Use database transactions for atomicity
3. **Rollback capability**: Maintain ability to revert changes
4. **Detailed logging**: Log all migration steps and errors
5. **Graceful degradation**: Handle partial failures without data loss

## Testing Strategy

### Unit Tests

1. **Mapper Tests**

   - Test `toDAO()` correctly sets analysis_type based on domain properties
   - Test `toDAO()` creates correct JSONB structure for idea type
   - Test `toDAO()` creates correct JSONB structure for hackathon type
   - Test `toDomain()` correctly parses idea type from DAO
   - Test `toDomain()` correctly parses hackathon type from DAO
   - Test type detection logic (`isHackathonAnalysis`)
   - Test field validation and error handling

2. **Repository Tests**

   - Test `findByUserId()` with and without type filter
   - Test `findByUserIdAndType()` for both types
   - Test `getAnalysisCountsByType()`
   - Test `save()` for both types
   - Mock Supabase client responses

3. **DAO Type Tests**
   - Test type guards for analysis data
   - Test JSONB structure validation

### Integration Tests

1. **Database Tests**

   - Test actual database operations with test data
   - Test RLS policies still work correctly
   - Test indexes improve query performance
   - Test query performance with mixed types

2. **Migration Tests**

   - Test migration script with sample data
   - Test data integrity after migration
   - Test rollback procedures
   - Test edge cases (null values, special characters)

3. **End-to-End Tests**
   - Test complete flow from API to database
   - Test both idea and hackathon analysis workflows
   - Test dashboard queries with mixed types
   - Test filtering and pagination

### Test Data

```typescript
const testIdeaAnalysis: AnalysisDAO = {
  id: "test-id-1",
  user_id: "user-1",
  analysis_type: "idea",
  idea: "Test startup idea",
  analysis: {
    score: 85,
    detailedSummary: "Good idea",
    criteria: [],
    locale: "en",
  },
  audio_base64: null,
  created_at: "2024-01-01T00:00:00Z",
};

const testHackathonAnalysis: AnalysisDAO = {
  id: "test-id-2",
  user_id: "user-1",
  analysis_type: "hackathon",
  idea: "Test hackathon project description",
  analysis: {
    score: 90,
    detailedSummary: "Great project",
    criteria: [],
    locale: "en",
    selectedCategory: "frankenstein",
    kiroUsage: "Used Kiro for code generation",
    supportingMaterials: {
      githubRepo: "https://github.com/test/repo",
    },
  },
  audio_base64: null,
  created_at: "2024-01-01T00:00:00Z",
};
```

## Migration Plan

### Phase 1: Schema Update

1. Add `analysis_type` column with default value 'idea'
2. Create indexes for performance
3. Verify schema changes in staging environment

### Phase 2: Data Migration

1. Set `analysis_type = 'idea'` for all existing `saved_analyses` records (already done by default)
2. Migrate data from `saved_hackathon_analyses` to `saved_analyses`:
   - Map `project_description` → `idea`
   - Map `selected_category`, `kiro_usage`, `supporting_materials` into `analysis` JSONB
   - Set `analysis_type = 'hackathon'`
3. Verify record counts match
4. Verify data integrity (no null values where required)

### Phase 3: Code Updates

1. Update DAO types to include `analysis_type`
2. Update AnalysisMapper to handle both types via JSONB structure
3. Update SupabaseAnalysisRepository with type filtering
4. Update API routes to work with unified table
5. Update use cases if needed

### Phase 4: Testing and Verification

1. Run unit tests for mappers and repositories
2. Run integration tests with real database
3. Test API endpoints for both types
4. Verify dashboard displays both types correctly
5. Performance testing with mixed data

### Phase 5: Cleanup

1. Drop `saved_hackathon_analyses` table
2. Remove old RLS policies from dropped table
3. Update documentation
4. Archive old schema definitions

### Rollback Plan

If issues are discovered:

1. Restore `saved_hackathon_analyses` table from backup
2. Revert code changes
3. Remove `analysis_type` column from `saved_analyses`
4. Restore original RLS policies

## Performance Considerations

### Indexes

- Existing `idx_saved_analyses_user_id`: Fast user-based queries
- New `idx_saved_analyses_type`: Fast type filtering
- New `idx_saved_analyses_user_type`: Composite index for user + type queries

### Query Optimization

- Use `analysis_type` filter in WHERE clauses
- Leverage composite indexes for common query patterns
- JSONB indexing for frequently queried fields within analysis
- Consider GIN indexes on analysis JSONB field if needed

### Caching Strategy

- Cache analysis counts by type per user
- Cache recent analyses for dashboard
- Invalidate cache on write operations
- Use Redis or similar for distributed caching

## Security Considerations

### Row Level Security

- Existing RLS policies continue to work without changes
- `analysis_type` doesn't affect security boundaries
- Test RLS with different user contexts
- Audit policy effectiveness

### Data Validation

- Validate `analysis_type` on insert/update
- Validate JSONB structure matches expected type
- Sanitize user input before storage
- Validate required fields in JSONB based on type

### Access Control

- Maintain user-based access control
- Log all data access attempts
- Monitor for suspicious patterns
- Implement rate limiting on API endpoints

## Deployment Strategy

### Pre-Deployment

1. Backup production database
2. Test migration on staging environment
3. Verify rollback procedures
4. Prepare monitoring and alerts

### Deployment Steps

1. Enable maintenance mode (optional)
2. Run migration script
3. Verify data integrity
4. Deploy updated application code
5. Run smoke tests
6. Monitor error rates and performance
7. Disable maintenance mode

### Post-Deployment

1. Monitor application logs
2. Check database performance metrics
3. Verify user-facing functionality
4. Collect user feedback
5. Document lessons learned

### Monitoring

- Track query performance
- Monitor error rates
- Alert on failed migrations
- Dashboard for migration progress
- User impact metrics
