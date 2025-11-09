# Database Consolidation Documentation

## Overview

This document describes the database consolidation that unified the `saved_analyses` and `saved_hackathon_analyses` tables into a single `saved_analyses` table with a type discriminator column. This consolidation simplifies the data model, reduces code duplication, and improves maintainability while preserving all existing functionality.

## Table of Contents

1. [Migration Summary](#migration-summary)
2. [Unified Table Structure](#unified-table-structure)
3. [Data Model Changes](#data-model-changes)
4. [Repository Updates](#repository-updates)
5. [API Changes](#api-changes)
6. [Migration Process](#migration-process)
7. [Rollback Procedures](#rollback-procedures)
8. [Performance Considerations](#performance-considerations)

## Migration Summary

**Migration Date**: 2024-01-15
**Status**: Completed
**Impact**: Zero downtime, backward compatible

### Key Changes

- Added `analysis_type` discriminator column to `saved_analyses` table
- Migrated all hackathon analyses from `saved_hackathon_analyses` to unified table
- Updated mappers to handle both analysis types automatically
- Enhanced repository with type filtering capabilities
- Maintained all existing API endpoints and response formats

### Benefits

- **Simplified Schema**: Single table instead of two separate tables
- **Reduced Code Duplication**: Unified repository and mapper logic
- **Better Maintainability**: Easier to add new analysis types in the future
- **Improved Query Performance**: Better index utilization with composite indexes
- **Consistent Data Access**: Single source of truth for all analyses

## Unified Table Structure

### Schema Definition

```sql
CREATE TABLE public.saved_analyses (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type discriminator (NEW)
  analysis_type TEXT NOT NULL DEFAULT 'idea'
    CHECK (analysis_type IN ('idea', 'hackathon')),

  -- Dual-purpose text field
  idea TEXT NOT NULL,  -- For 'idea': startup idea text
                       -- For 'hackathon': project description

  -- Type-specific structured data
  analysis JSONB NOT NULL,  -- Contains IdeaAnalysisData or HackathonAnalysisData

  -- Optional audio data
  audio_base64 TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- User-based queries
CREATE INDEX idx_saved_analyses_user_id
  ON public.saved_analyses(user_id);

-- Type filtering
CREATE INDEX idx_saved_analyses_type
  ON public.saved_analyses(analysis_type);

-- Composite index for user + type queries
CREATE INDEX idx_saved_analyses_user_type
  ON public.saved_analyses(user_id, analysis_type);

-- Timestamp ordering
CREATE INDEX idx_saved_analyses_created_at
  ON public.saved_analyses(created_at DESC);
```

### Row Level Security

```sql
-- Enable RLS
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

-- Owner-only SELECT
CREATE POLICY "saved_analyses_select_policy"
  ON public.saved_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Owner-only INSERT
CREATE POLICY "saved_analyses_insert_policy"
  ON public.saved_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner-only UPDATE
CREATE POLICY "saved_analyses_update_policy"
  ON public.saved_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Owner-only DELETE
CREATE POLICY "saved_analyses_delete_policy"
  ON public.saved_analyses
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Data Model Changes

### Analysis Type Discriminator

The `analysis_type` column identifies whether a record is a standard idea analysis or a hackathon analysis:

- `'idea'`: Standard startup idea analysis
- `'hackathon'`: Hackathon project analysis

### Dual-Purpose Idea Column

The `idea` column serves different purposes based on the analysis type:

| Analysis Type | Purpose                        | Example                                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------------------------- |
| `idea`        | Stores the startup idea text   | "A mobile app that connects dog owners with local dog walkers"            |
| `hackathon`   | Stores the project description | "EcoTracker - A mobile app that helps users track their carbon footprint" |

### JSONB Structure

The `analysis` JSONB field contains type-specific structured data:

#### IdeaAnalysisData Structure

```typescript
interface IdeaAnalysisData {
  score: number; // Overall score (0-100)
  detailedSummary: string; // Detailed analysis summary
  criteria: Array<{
    // Evaluation criteria
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string; // Language locale ('en', 'es')
}
```

**Example**:

```json
{
  "score": 78,
  "detailedSummary": "This is a solid marketplace idea with clear value proposition...",
  "criteria": [
    {
      "name": "Market Size",
      "score": 85,
      "justification": "Large and growing pet care market..."
    },
    {
      "name": "Technical Feasibility",
      "score": 75,
      "justification": "Standard mobile app technology stack..."
    }
  ],
  "locale": "en"
}
```

#### HackathonAnalysisData Structure

```typescript
interface HackathonAnalysisData extends IdeaAnalysisData {
  selectedCategory:
    | "resurrection"
    | "frankenstein"
    | "skeleton-crew"
    | "costume-contest";
}
```

**Example**:

```json
{
  "score": 82,
  "detailedSummary": "Innovative approach to carbon tracking with strong technical implementation...",
  "criteria": [
    {
      "name": "Innovation",
      "score": 85,
      "justification": "Novel approach to carbon tracking..."
    }
  ],
  "locale": "en",
  "selectedCategory": "frankenstein",
  
}
```

### Type Guards

```typescript
// Type guard for idea analysis data
export function isIdeaAnalysisData(data: any): data is IdeaAnalysisData {
  return !("selectedCategory" in data);
}

// Type guard for hackathon analysis data
export function isHackathonAnalysisData(
  data: any
): data is HackathonAnalysisData {
  return "selectedCategory" in data;
}
```

## Repository Updates

### Enhanced Repository Interface

```typescript
export interface IAnalysisRepository {
  // Command operations
  save(analysis: Analysis): Promise<Result<Analysis, Error>>;
  update(analysis: Analysis): Promise<Result<Analysis, Error>>;
  delete(id: AnalysisId): Promise<Result<void, Error>>;

  // Query operations with optional type filtering
  findById(id: AnalysisId): Promise<Result<Analysis | null, Error>>;

  findByUserId(
    userId: UserId,
    params: PaginationParams,
    type?: "idea" | "hackathon" // NEW: Optional type filter
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  findByUserIdAndType( // NEW: Type-specific query
    userId: UserId,
    type: "idea" | "hackathon",
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  getAnalysisCountsByType(userId: UserId): Promise< // NEW: Get counts by type
    Result<
      {
        total: number;
        idea: number;
        hackathon: number;
      },
      Error
    >
  >;

  searchByUser(
    userId: UserId,
    query: string,
    params: PaginationParams,
    type?: "idea" | "hackathon" // NEW: Optional type filter
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
}
```

### Automatic Type Detection

The mapper automatically detects the analysis type based on domain entity properties:

```typescript
export class AnalysisMapper {
  toDAO(analysis: Analysis): AnalysisDAO {
    const isHackathon = this.isHackathonAnalysis(analysis);

    return {
      id: analysis.id.value,
      user_id: analysis.userId.value,
      analysis_type: isHackathon ? "hackathon" : "idea", // Auto-detected
      idea: analysis.idea,
      analysis: isHackathon
        ? this.mapHackathonAnalysisData(analysis)
        : this.mapIdeaAnalysisData(analysis),
      audio_base64: null,
      created_at: analysis.createdAt.toISOString(),
    };
  }

  private isHackathonAnalysis(analysis: Analysis): boolean {
    return !!(analysis.category);
  }
}
```

### Type-Based Parsing

The mapper parses the JSONB data based on the `analysis_type` discriminator:

```typescript
export class AnalysisMapper {
  toDomain(dao: AnalysisDAO): Analysis {
    const analysisData = dao.analysis as
      | IdeaAnalysisData
      | HackathonAnalysisData;

    const baseProps = {
      id: AnalysisId.reconstruct(dao.id),
      userId: UserId.reconstruct(dao.user_id),
      idea: dao.idea,
      score: Score.reconstruct(analysisData.score || 0),
      locale: Locale.fromString(analysisData.locale || "en"),
      feedback: analysisData.detailedSummary,
      suggestions: this.extractSuggestions(analysisData),
      createdAt: new Date(dao.created_at || Date.now()),
    };

    // Parse based on type discriminator
    if (
      dao.analysis_type === "hackathon" &&
      isHackathonAnalysisData(analysisData)
    ) {
      return Analysis.reconstruct({
        ...baseProps,
        category: Category.fromString(analysisData.selectedCategory),
      });
    } else {
      return Analysis.reconstruct(baseProps);
    }
  }
}
```

## API Changes

### Backward Compatibility

All existing API endpoints maintain the same request and response formats. The consolidation is transparent to API consumers.

### Endpoint Behavior

#### POST /api/analyze

Creates a standard idea analysis (automatically sets `analysis_type = 'idea'`).

**Request**:

```json
{
  "idea": "A mobile app that connects dog owners with local dog walkers",
  "locale": "en"
}
```

**Response**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "idea": "A mobile app that connects dog owners with local dog walkers",
  "score": 78,
  "detailedSummary": "This is a solid marketplace idea...",
  "criteria": [...],
  "locale": "en"
}
```

#### POST /api/v2/hackathon/analyze

Creates a hackathon analysis (automatically sets `analysis_type = 'hackathon'`).

**Request**:

```json
{
  "projectDescription": "EcoTracker - A mobile app for carbon tracking",
  "selectedCategory": "frankenstein",
  "locale": "en"
}
```

**Response**:

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "projectDescription": "EcoTracker - A mobile app for carbon tracking",
  "score": 82,
  "selectedCategory": "frankenstein",
  "criteria": [...],
  "locale": "en"
}
```

#### GET /api/v2/dashboard/analyses

Retrieves all analyses for the user (both types).

**Query Parameters**:

- `type` (optional): Filter by type ('idea' or 'hackathon')
- `page` (optional): Page number
- `limit` (optional): Results per page

**Example with type filter**:

```
GET /api/v2/dashboard/analyses?type=hackathon&page=1&limit=10
```

### Internal Implementation

Controllers use the repository's type filtering capabilities:

```typescript
export class DashboardController {
  async listAnalyses(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "idea" | "hackathon" | undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await this.listAnalysesHandler.handle({
      userId,
      params: { page, limit, offset: (page - 1) * limit },
      type, // Optional type filter
    });

    return NextResponse.json(result.data);
  }
}
```

## Migration Process

### Phase 1: Schema Update

1. **Add analysis_type column**:

```sql
ALTER TABLE public.saved_analyses
ADD COLUMN analysis_type TEXT NOT NULL DEFAULT 'idea'
CHECK (analysis_type IN ('idea', 'hackathon'));
```

2. **Create indexes**:

```sql
CREATE INDEX idx_saved_analyses_type
  ON public.saved_analyses(analysis_type);

CREATE INDEX idx_saved_analyses_user_type
  ON public.saved_analyses(user_id, analysis_type);
```

3. **Verify schema changes**:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'saved_analyses'
AND column_name = 'analysis_type';
```

### Phase 2: Data Migration

1. **Count source records**:

```sql
SELECT COUNT(*) FROM saved_hackathon_analyses;
```

2. **Migrate hackathon analyses**:

```sql
INSERT INTO saved_analyses (
  id,
  user_id,
  analysis_type,
  idea,
  analysis,
  audio_base64,
  created_at
)
SELECT
  id,
  user_id,
  'hackathon' as analysis_type,
  project_description as idea,
  jsonb_build_object(
    'score', (analysis->>'score')::numeric,
    'detailedSummary', analysis->>'detailedSummary',
    'criteria', analysis->'criteria',
    'locale', analysis->>'locale',
    'selectedCategory', selected_category
  ) as analysis,
  audio_base64,
  created_at
FROM saved_hackathon_analyses;
```

3. **Verify migration**:

```sql
-- Check counts match
SELECT
  (SELECT COUNT(*) FROM saved_hackathon_analyses) as source_count,
  (SELECT COUNT(*) FROM saved_analyses WHERE analysis_type = 'hackathon') as target_count;

-- Spot check sample records
SELECT id, analysis_type, idea, analysis->>'selectedCategory' as category
FROM saved_analyses
WHERE analysis_type = 'hackathon'
LIMIT 5;
```

### Phase 3: Code Deployment

1. Deploy updated application code with new mappers and repositories
2. Monitor application logs for errors
3. Verify both analysis types work correctly through API

### Phase 4: Verification

1. **Test idea analysis workflow**:

   - Create new idea analysis
   - Retrieve idea analysis
   - List idea analyses

2. **Test hackathon analysis workflow**:

   - Create new hackathon analysis
   - Retrieve hackathon analysis
   - List hackathon analyses

3. **Test mixed queries**:
   - List all analyses (both types)
   - Filter by type
   - Search across both types

### Phase 5: Cleanup

1. **Drop old table** (after verification):

```sql
DROP TABLE IF EXISTS saved_hackathon_analyses CASCADE;
```

2. **Remove old RLS policies**:

```sql
-- Policies are automatically dropped with the table
```

3. **Update documentation** (this document)

## Rollback Procedures

### If Issues Discovered During Migration

1. **Stop application deployment**

2. **Restore hackathon table from backup**:

```sql
-- Restore from backup
pg_restore -d database_name backup_file.dump -t saved_hackathon_analyses
```

3. **Remove analysis_type column**:

```sql
ALTER TABLE saved_analyses DROP COLUMN IF EXISTS analysis_type;
```

4. **Revert code changes**:

```bash
git revert <migration-commit-hash>
git push origin main
```

5. **Redeploy previous version**

### If Issues Discovered Post-Migration

1. **Recreate hackathon table**:

```sql
CREATE TABLE saved_hackathon_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_description TEXT NOT NULL,
  selected_category TEXT NOT NULL,
  kiro_usage TEXT NOT NULL,
  supporting_materials JSONB,
  analysis JSONB NOT NULL,
  audio_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Migrate data back**:

```sql
INSERT INTO saved_hackathon_analyses
SELECT
  id,
  user_id,
  idea as project_description,
  analysis->>'selectedCategory' as selected_category,
  
  jsonb_build_object(
    'score', analysis->'score',
    'detailedSummary', analysis->'detailedSummary',
    'criteria', analysis->'criteria',
    'locale', analysis->'locale'
  ) as analysis,
  audio_base64,
  created_at
FROM saved_analyses
WHERE analysis_type = 'hackathon';
```

3. **Remove hackathon records from unified table**:

```sql
DELETE FROM saved_analyses WHERE analysis_type = 'hackathon';
```

4. **Revert code and redeploy**

## Performance Considerations

### Index Strategy

The consolidation includes optimized indexes for common query patterns:

1. **User-based queries**: `idx_saved_analyses_user_id`

   - Used for: "Get all analyses for user X"

2. **Type filtering**: `idx_saved_analyses_type`

   - Used for: "Get all hackathon analyses"

3. **Composite user + type**: `idx_saved_analyses_user_type`

   - Used for: "Get all hackathon analyses for user X"
   - Most efficient for filtered queries

4. **Timestamp ordering**: `idx_saved_analyses_created_at`
   - Used for: "Get recent analyses"

### Query Performance

**Before consolidation** (two tables):

```sql
-- Required UNION for mixed queries
SELECT * FROM saved_analyses WHERE user_id = $1
UNION ALL
SELECT * FROM saved_hackathon_analyses WHERE user_id = $1
ORDER BY created_at DESC;
```

**After consolidation** (single table):

```sql
-- Single table scan with index
SELECT * FROM saved_analyses
WHERE user_id = $1
ORDER BY created_at DESC;
```

### JSONB Performance

For frequently queried JSONB fields, consider adding GIN indexes:

```sql
-- Index for searching within analysis JSONB
CREATE INDEX idx_saved_analyses_analysis_gin
  ON saved_analyses USING GIN (analysis);

-- Index for specific JSONB path
CREATE INDEX idx_saved_analyses_category
  ON saved_analyses ((analysis->>'selectedCategory'))
  WHERE analysis_type = 'hackathon';
```

### Caching Strategy

Implement application-level caching for frequently accessed data:

```typescript
// Cache analysis counts by type
const cacheKey = `analysis_counts:${userId}`;
const cached = await cache.get(cacheKey);

if (!cached) {
  const counts = await repository.getAnalysisCountsByType(userId);
  await cache.set(cacheKey, counts, { ttl: 300 }); // 5 minutes
  return counts;
}

return cached;
```

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Query Performance**:

   - Average query time for `findByUserId`
   - Average query time for `findByUserIdAndType`
   - Index usage statistics

2. **Data Distribution**:

   - Count of idea analyses vs hackathon analyses
   - Growth rate of each type
   - JSONB size distribution

3. **Error Rates**:
   - Mapper conversion errors
   - Type validation errors
   - Database constraint violations

### Maintenance Tasks

1. **Regular vacuum** (PostgreSQL):

```sql
VACUUM ANALYZE saved_analyses;
```

2. **Index maintenance**:

```sql
REINDEX TABLE saved_analyses;
```

3. **Monitor table size**:

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('saved_analyses')) as total_size,
  pg_size_pretty(pg_relation_size('saved_analyses')) as table_size,
  pg_size_pretty(pg_indexes_size('saved_analyses')) as indexes_size;
```

## Future Enhancements

### Adding New Analysis Types

The unified structure makes it easy to add new analysis types:

1. **Update type constraint**:

```sql
ALTER TABLE saved_analyses
DROP CONSTRAINT saved_analyses_analysis_type_check;

ALTER TABLE saved_analyses
ADD CONSTRAINT saved_analyses_analysis_type_check
CHECK (analysis_type IN ('idea', 'hackathon', 'new_type'));
```

2. **Define new JSONB structure**:

```typescript
interface NewTypeAnalysisData extends IdeaAnalysisData {
  newTypeField: string;
  // ... additional fields
}
```

3. **Update mapper**:

```typescript
private isNewTypeAnalysis(analysis: Analysis): boolean {
  return !!(analysis.newTypeField);
}
```

4. **Update repository queries** (if needed)

### Potential Optimizations

1. **Partitioning**: Partition table by `analysis_type` for very large datasets
2. **Materialized Views**: Create views for common aggregations
3. **Read Replicas**: Use read replicas for dashboard queries
4. **Archive Strategy**: Archive old analyses to separate table

## References

- [Requirements Document](../.kiro/specs/database-consolidation/requirements.md)
- [Design Document](../.kiro/specs/database-consolidation/design.md)
- [Implementation Tasks](../.kiro/specs/database-consolidation/tasks.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)

## Changelog

### 2024-01-15 - Initial Migration

- Added `analysis_type` discriminator column
- Migrated hackathon analyses to unified table
- Updated mappers and repositories
- Deployed to production
- Verified data integrity

### 2024-01-16 - Post-Migration Cleanup

- Dropped `saved_hackathon_analyses` table
- Updated documentation
- Archived old schema definitions
