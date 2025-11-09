# Archived Schema Definitions

This document contains the original schema definitions for the separate `saved_analyses` and `saved_hackathon_analyses` tables before the database consolidation on 2024-01-15.

## Archive Information

- **Archive Date**: 2024-01-15
- **Reason**: Database consolidation to unified table structure
- **Migration Document**: [DATABASE_CONSOLIDATION.md](../DATABASE_CONSOLIDATION.md)
- **Status**: Historical reference only - DO NOT USE

## Original saved_analyses Table

### Schema Definition

```sql
CREATE TABLE public.saved_analyses (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Startup idea text
  idea TEXT NOT NULL,

  -- Analysis results (JSONB)
  analysis JSONB NOT NULL,

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

### Analysis JSONB Structure

```typescript
interface OriginalAnalysisData {
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string;
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

## Original saved_hackathon_analyses Table

### Schema Definition

```sql
CREATE TABLE public.saved_hackathon_analyses (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Project description
  project_description TEXT NOT NULL,

  -- Hackathon category
  selected_category TEXT NOT NULL
    CHECK (selected_category IN (
      'resurrection',
      'frankenstein',
      'skeleton-crew',
      'costume-contest'
    )),

  -- Kiro usage description
  kiro_usage TEXT NOT NULL,

  -- Supporting materials (JSONB)
  supporting_materials JSONB,

  -- Analysis results (JSONB)
  analysis JSONB NOT NULL,

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
CREATE INDEX idx_saved_hackathon_analyses_user_id
  ON public.saved_hackathon_analyses(user_id);

-- Category filtering
CREATE INDEX idx_saved_hackathon_analyses_category
  ON public.saved_hackathon_analyses(selected_category);

-- Timestamp ordering
CREATE INDEX idx_saved_hackathon_analyses_created_at
  ON public.saved_hackathon_analyses(created_at DESC);
```

### Row Level Security

```sql
-- Enable RLS
ALTER TABLE public.saved_hackathon_analyses ENABLE ROW LEVEL SECURITY;

-- Owner-only SELECT
CREATE POLICY "saved_hackathon_analyses_select_policy"
  ON public.saved_hackathon_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Owner-only INSERT
CREATE POLICY "saved_hackathon_analyses_insert_policy"
  ON public.saved_hackathon_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner-only UPDATE
CREATE POLICY "saved_hackathon_analyses_update_policy"
  ON public.saved_hackathon_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Owner-only DELETE
CREATE POLICY "saved_hackathon_analyses_delete_policy"
  ON public.saved_hackathon_analyses
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Analysis JSONB Structure

```typescript
interface OriginalHackathonAnalysisData {
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string;
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
    },
    {
      "name": "Technical Feasibility",
      "score": 78,
      "justification": "Solid tech stack choice..."
    },
    {
      "name": "Kiro Integration",
      "score": 90,
      "justification": "Excellent use of Kiro for code generation..."
    }
  ],
  "locale": "en"
}
```

### Supporting Materials JSONB Structure

```typescript
interface SupportingMaterials {
  githubRepo?: string;
  demoUrl?: string;
  videoUrl?: string;
  screenshots?: string[];
  additionalNotes?: string;
}
```

**Example**:

```json
{
  "githubRepo": "https://github.com/user/ecotracker",
  "demoUrl": "https://ecotracker.demo.com",
  "videoUrl": "https://youtube.com/watch?v=xyz",
  "screenshots": [
    "https://storage.example.com/screenshots/1.png",
    "https://storage.example.com/screenshots/2.png"
  ],
  "additionalNotes": "Built during Kiroween 2024 hackathon"
}
```

## Original DAO Types

### AnalysisDAO (Original)

```typescript
export interface AnalysisDAO {
  id: string;
  user_id: string;
  idea: string;
  analysis: Json; // IdeaAnalysisData
  audio_base64: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### HackathonAnalysisDAO (Original)

```typescript
export interface HackathonAnalysisDAO {
  id: string;
  user_id: string;
  project_description: string;
  selected_category:
    | "resurrection"
    | "frankenstein"
    | "skeleton-crew"
    | "costume-contest";
  kiro_usage: string;
  supporting_materials: Json | null; // SupportingMaterials
  analysis: Json; // HackathonAnalysisData
  audio_base64: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

## Original Repository Interfaces

### IAnalysisRepository (Original)

```typescript
export interface IAnalysisRepository {
  // Command operations
  save(analysis: Analysis): Promise<Result<Analysis, Error>>;
  update(analysis: Analysis): Promise<Result<Analysis, Error>>;
  delete(id: AnalysisId): Promise<Result<void, Error>>;

  // Query operations
  findById(id: AnalysisId): Promise<Result<Analysis | null, Error>>;
  findByUserId(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
  searchByUser(
    userId: UserId,
    query: string,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
}
```

### IHackathonAnalysisRepository (Original)

```typescript
export interface IHackathonAnalysisRepository {
  // Command operations
  save(analysis: Analysis): Promise<Result<Analysis, Error>>;
  update(analysis: Analysis): Promise<Result<Analysis, Error>>;
  delete(id: AnalysisId): Promise<Result<void, Error>>;

  // Query operations
  findById(id: AnalysisId): Promise<Result<Analysis | null, Error>>;
  findByUserId(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
  findByCategory(
    category: Category,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
  searchByUser(
    userId: UserId,
    query: string,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
}
```

## Migration Mapping

### Column Mapping

| Old Table                  | Old Column             | New Table        | New Column                     | Notes                        |
| -------------------------- | ---------------------- | ---------------- | ------------------------------ | ---------------------------- |
| `saved_analyses`           | `id`                   | `saved_analyses` | `id`                           | Unchanged                    |
| `saved_analyses`           | `user_id`              | `saved_analyses` | `user_id`                      | Unchanged                    |
| `saved_analyses`           | `idea`                 | `saved_analyses` | `idea`                         | Unchanged                    |
| `saved_analyses`           | `analysis`             | `saved_analyses` | `analysis`                     | Unchanged                    |
| `saved_analyses`           | `audio_base64`         | `saved_analyses` | `audio_base64`                 | Unchanged                    |
| `saved_analyses`           | `created_at`           | `saved_analyses` | `created_at`                   | Unchanged                    |
| `saved_analyses`           | -                      | `saved_analyses` | `analysis_type`                | NEW: Set to 'idea'           |
| `saved_hackathon_analyses` | `id`                   | `saved_analyses` | `id`                           | Unchanged                    |
| `saved_hackathon_analyses` | `user_id`              | `saved_analyses` | `user_id`                      | Unchanged                    |
| `saved_hackathon_analyses` | `project_description`  | `saved_analyses` | `idea`                         | Renamed                      |
| `saved_hackathon_analyses` | `selected_category`    | `saved_analyses` | `analysis.selectedCategory`    | Moved to JSONB               |
| `saved_hackathon_analyses` | `kiro_usage`           | `saved_analyses` | `analysis.kiroUsage`           | Moved to JSONB               |
| `saved_hackathon_analyses` | `supporting_materials` | `saved_analyses` | `analysis.supportingMaterials` | Moved to JSONB               |
| `saved_hackathon_analyses` | `analysis`             | `saved_analyses` | `analysis`                     | Merged with hackathon fields |
| `saved_hackathon_analyses` | `audio_base64`         | `saved_analyses` | `audio_base64`                 | Unchanged                    |
| `saved_hackathon_analyses` | `created_at`           | `saved_analyses` | `created_at`                   | Unchanged                    |
| `saved_hackathon_analyses` | -                      | `saved_analyses` | `analysis_type`                | NEW: Set to 'hackathon'      |

### Data Transformation

**Idea Analysis** (no transformation needed):

```sql
-- Original record
SELECT id, user_id, idea, analysis, audio_base64, created_at
FROM saved_analyses;

-- Migrated record (just add analysis_type)
SELECT id, user_id, 'idea' as analysis_type, idea, analysis, audio_base64, created_at
FROM saved_analyses;
```

**Hackathon Analysis** (transformation required):

```sql
-- Original record
SELECT
  id,
  user_id,
  project_description,
  selected_category,
  kiro_usage,
  supporting_materials,
  analysis,
  audio_base64,
  created_at
FROM saved_hackathon_analyses;

-- Migrated record (merge into JSONB)
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
    'selectedCategory', selected_category,
    'kiroUsage', kiro_usage,
    'supportingMaterials', supporting_materials
  ) as analysis,
  audio_base64,
  created_at
FROM saved_hackathon_analyses;
```

## Reasons for Consolidation

### Problems with Separate Tables

1. **Code Duplication**:

   - Two separate repository implementations
   - Two separate mapper implementations
   - Duplicate query logic

2. **Complex Queries**:

   - Required UNION queries for mixed results
   - Difficult to implement unified search
   - Complex pagination across tables

3. **Maintenance Overhead**:

   - Schema changes needed in two places
   - RLS policies duplicated
   - Index management duplicated

4. **Limited Flexibility**:
   - Hard to add new analysis types
   - Difficult to query across all analyses
   - Complex dashboard aggregations

### Benefits of Unified Table

1. **Simplified Code**:

   - Single repository implementation
   - Single mapper with type detection
   - Unified query logic

2. **Better Performance**:

   - Single table scans
   - Better index utilization
   - Simpler query plans

3. **Easier Maintenance**:

   - Single schema to manage
   - One set of RLS policies
   - Centralized index management

4. **Greater Flexibility**:
   - Easy to add new types
   - Simple cross-type queries
   - Straightforward aggregations

## Restoration Procedure

If you need to restore the original two-table structure:

### Step 1: Recreate Original Tables

```sql
-- Recreate saved_hackathon_analyses table
CREATE TABLE public.saved_hackathon_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_description TEXT NOT NULL,
  selected_category TEXT NOT NULL
    CHECK (selected_category IN ('resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest')),
  kiro_usage TEXT NOT NULL,
  supporting_materials JSONB,
  analysis JSONB NOT NULL,
  audio_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_saved_hackathon_analyses_user_id
  ON public.saved_hackathon_analyses(user_id);
CREATE INDEX idx_saved_hackathon_analyses_category
  ON public.saved_hackathon_analyses(selected_category);
CREATE INDEX idx_saved_hackathon_analyses_created_at
  ON public.saved_hackathon_analyses(created_at DESC);

-- Recreate RLS policies
ALTER TABLE public.saved_hackathon_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_hackathon_analyses_select_policy"
  ON public.saved_hackathon_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_hackathon_analyses_insert_policy"
  ON public.saved_hackathon_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_hackathon_analyses_update_policy"
  ON public.saved_hackathon_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "saved_hackathon_analyses_delete_policy"
  ON public.saved_hackathon_analyses FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 2: Migrate Data Back

```sql
-- Migrate hackathon analyses back
INSERT INTO saved_hackathon_analyses (
  id,
  user_id,
  project_description,
  selected_category,
  kiro_usage,
  supporting_materials,
  analysis,
  audio_base64,
  created_at
)
SELECT
  id,
  user_id,
  idea as project_description,
  analysis->>'selectedCategory' as selected_category,
  analysis->>'kiroUsage' as kiro_usage,
  analysis->'supportingMaterials' as supporting_materials,
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

### Step 3: Clean Up Unified Table

```sql
-- Remove hackathon records from unified table
DELETE FROM saved_analyses WHERE analysis_type = 'hackathon';

-- Remove analysis_type column
ALTER TABLE saved_analyses DROP COLUMN analysis_type;

-- Remove type-specific indexes
DROP INDEX IF EXISTS idx_saved_analyses_type;
DROP INDEX IF EXISTS idx_saved_analyses_user_type;
```

### Step 4: Revert Code Changes

Restore the original repository and mapper implementations from version control.

## Historical Context

This consolidation was part of a larger effort to simplify the application architecture and improve maintainability. The decision was made after careful analysis of the benefits and risks, with full testing in a staging environment before production deployment.

The migration was successful with zero downtime and no data loss. All existing functionality was preserved, and the consolidation has resulted in improved performance and easier maintenance.

## References

- [Database Consolidation Documentation](../DATABASE_CONSOLIDATION.md)
- [Requirements Document](../../.kiro/specs/database-consolidation/requirements.md)
- [Design Document](../../.kiro/specs/database-consolidation/design.md)
- [Implementation Tasks](../../.kiro/specs/database-consolidation/tasks.md)

---

**Note**: This is a historical reference document. The schema definitions described here are no longer in use. Refer to the [Database Consolidation Documentation](../DATABASE_CONSOLIDATION.md) for the current unified table structure.
