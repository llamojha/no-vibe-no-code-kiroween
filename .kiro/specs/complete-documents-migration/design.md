# Design Document: Complete Migration to Documents Table

## Overview

This design completes the migration from the legacy `saved_analyses` table to the new `ideas` and `documents` table architecture. All new analyses will be saved to the new tables, while maintaining read compatibility with legacy data.

## Architecture

### Data Flow

#### Current (Legacy) Flow

```
User creates analysis → Save to saved_analyses → Load from saved_analyses
```

#### New Flow

```
User creates analysis → Create idea in ideas table → Create document in documents table
User views analysis → Try documents table → Fallback to saved_analyses (legacy)
User lists analyses → Load from ideas table with document counts
```

### Table Relationships

```
ideas (1) → (many) documents
  ├─ startup_analysis documents
  └─ hackathon_analysis documents

saved_analyses (LEGACY - read-only for backward compatibility)
```

## Components to Update

### 1. Kiroween Analyzer API

#### saveHackathonAnalysis.ts

**Current Behavior:**

- Saves directly to `saved_analyses` table

**New Behavior:**

- Check if `ideaId` is provided (from Idea Panel or pre-existing idea)
- If `ideaId` exists:
  - Load existing idea
  - Create document linked to idea
- If no `ideaId`:
  - Create new idea with source='manual'
  - Create document linked to new idea
- Return both idea ID and document ID

**Function Signature:**

```typescript
interface SaveHackathonAnalysisParams {
  projectDescription: string;
  analysis: HackathonAnalysis;
  supportingMaterials?: Record<string, string>;
  audioBase64?: string;
  ideaId?: string; // Optional: link to existing idea
}

interface SaveHackathonAnalysisResult {
  ideaId: string;
  documentId: string;
  createdAt: string;
}

async function saveHackathonAnalysis(
  params: SaveHackathonAnalysisParams
): Promise<{ data: SaveHackathonAnalysisResult | null; error: string | null }>;
```

#### loadHackathonAnalysis.ts

**Current Behavior:**

- Loads from `saved_analyses` table only

**New Behavior:**

- Already updated with fallback logic (keep as is)

#### loadUserHackathonAnalyses.ts

**Current Behavior:**

- Loads all user's analyses from `saved_analyses`

**New Behavior:**

- Load all ideas for user from `ideas` table
- Include document counts
- Return in unified format

#### updateHackathonAnalysisAudio.ts

**Current Behavior:**

- Updates `saved_analyses` table

**New Behavior:**

- Try updating `documents` table first
- Fallback to `saved_analyses` for legacy data
- Store audio in document content JSONB field

#### deleteHackathonAnalysis.ts

**Current Behavior:**

- Deletes from `saved_analyses` table

**New Behavior:**

- Try deleting from `documents` table first
- Fallback to `saved_analyses` for legacy data
- Do NOT delete parent idea (idea can exist without documents)

### 2. Classic Analyzer API

#### saveAnalysis.ts (in features/analyzer/api/)

**Current Behavior:**

- Saves to `saved_analyses` via `/api/analyze/save`

**New Behavior:**

- Check if `ideaId` is provided
- If `ideaId` exists:
  - Load existing idea
  - Create document linked to idea
- If no `ideaId`:
  - Create new idea with source='manual'
  - Create document linked to new idea
- Return both idea ID and document ID

**Function Signature:**

```typescript
interface SaveAnalysisParams {
  idea: string;
  analysis: Analysis;
  audioBase64?: string;
  ideaId?: string; // Optional: link to existing idea
}

interface SaveAnalysisResult {
  ideaId: string;
  documentId: string;
  createdAt: string;
}

async function saveAnalysis(
  params: SaveAnalysisParams
): Promise<{ data: SaveAnalysisResult | null; error: string | null }>;
```

#### loadAnalysis.ts

**Current Behavior:**

- Loads from `saved_analyses` via `/api/analyze/[id]`

**New Behavior:**

- Already updated with fallback logic (keep as is)

### 3. Doctor Frankenstein API

#### saveFrankensteinIdea.ts

**Current Behavior:**

- Saves to `saved_analyses` with analysis_type='frankenstein'

**New Behavior:**

- Create idea in `ideas` table with source='frankenstein'
- Do NOT create document (no analysis yet)
- Return idea ID

**Function Signature:**

```typescript
interface SaveFrankensteinIdeaParams {
  idea: string;
  frankensteinMode: "aws" | "tech";
  slot1: string;
  slot2: string;
  slot3: string;
}

interface SaveFrankensteinIdeaResult {
  ideaId: string;
  createdAt: string;
}

async function saveFrankensteinIdea(
  params: SaveFrankensteinIdeaParams
): Promise<{ data: SaveFrankensteinIdeaResult | null; error: string | null }>;
```

#### loadFrankensteinIdea.ts

**Current Behavior:**

- Loads from `saved_analyses`

**New Behavior:**

- Load from `ideas` table
- Return idea without documents

#### updateFrankensteinIdea.ts

**Current Behavior:**

- Updates `saved_analyses` table

**New Behavior:**

- Update `ideas` table
- Update idea_text field

### 4. Dashboard API

#### loadUnifiedAnalyses.ts

**Current Status:**

- Legacy file, dashboard already uses `getUserIdeas()` from idea-panel API

**Action:**

- Mark as deprecated
- Add comment pointing to new API
- Keep for backward compatibility if needed elsewhere

### 5. Backend Controllers

#### AnalysisController

**Methods to Update:**

**saveAnalysis()** - POST /api/analyze/save

- Accept optional `ideaId` parameter
- Create idea if not provided
- Create document linked to idea
- Return both IDs

**updateAnalysis()** - PUT /api/analyze/[id]

- Try updating documents table first
- Fallback to saved_analyses for legacy

**deleteAnalysis()** - DELETE /api/analyze/[id]

- Try deleting from documents table first
- Fallback to saved_analyses for legacy

#### HackathonController (if exists)

Same pattern as AnalysisController

### 6. Repository Layer

#### SupabaseAnalysisRepository

**Current Behavior:**

- Uses `saved_analyses` table

**New Behavior:**

- Keep for legacy read operations only
- Mark save methods as deprecated
- Add comments directing to DocumentRepository

#### SupabaseIdeaRepository

**Current Status:**

- Already implemented and working

**Action:**

- No changes needed

#### SupabaseDocumentRepository

**Current Status:**

- Already implemented and working

**Action:**

- No changes needed

## Data Mapping

### Startup Analysis Mapping

**From saved_analyses to ideas + documents:**

```typescript
// saved_analyses row
{
  id: "uuid",
  user_id: "uuid",
  idea: "My startup idea",
  analysis: { /* Analysis object */ },
  audio_base64: "base64...",
  created_at: "timestamp",
  analysis_type: "idea"
}

// Maps to:

// ideas table
{
  id: "new-uuid",
  user_id: "uuid",
  idea_text: "My startup idea",
  source: "manual",
  project_status: "idea",
  notes: "",
  tags: [],
  created_at: "timestamp",
  updated_at: "timestamp"
}

// documents table
{
  id: "uuid", // Keep original ID for backward compat
  idea_id: "new-uuid",
  user_id: "uuid",
  document_type: "startup_analysis",
  title: null,
  content: {
    analysis: { /* Analysis object */ },
    audioBase64: "base64..." // Move audio into content
  },
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Hackathon Analysis Mapping

**From saved_analyses to ideas + documents:**

```typescript
// saved_analyses row
{
  id: "uuid",
  user_id: "uuid",
  idea: "My hackathon project",
  analysis: { /* HackathonAnalysis object */ },
  audio_base64: "base64...",
  created_at: "timestamp",
  analysis_type: "hackathon"
}

// Maps to:

// ideas table
{
  id: "new-uuid",
  user_id: "uuid",
  idea_text: "My hackathon project",
  source: "manual",
  project_status: "idea",
  notes: "",
  tags: [],
  created_at: "timestamp",
  updated_at: "timestamp"
}

// documents table
{
  id: "uuid", // Keep original ID
  idea_id: "new-uuid",
  user_id: "uuid",
  document_type: "hackathon_analysis",
  title: null,
  content: {
    analysis: { /* HackathonAnalysis object */ },
    projectDescription: "My hackathon project",
    supportingMaterials: {},
    audioBase64: "base64..."
  },
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Frankenstein Idea Mapping

**From saved_analyses to ideas:**

```typescript
// saved_analyses row
{
  id: "uuid",
  user_id: "uuid",
  idea: "Generated mashup idea",
  analysis: null,
  audio_base64: null,
  created_at: "timestamp",
  analysis_type: "frankenstein"
}

// Maps to:

// ideas table ONLY (no document)
{
  id: "uuid", // Keep original ID
  user_id: "uuid",
  idea_text: "Generated mashup idea",
  source: "frankenstein",
  project_status: "idea",
  notes: "",
  tags: [],
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

## Error Handling

### Save Errors

```typescript
// Idea creation fails
{
  data: null,
  error: "Failed to create idea. Please try again."
}

// Document creation fails (after idea created)
{
  data: null,
  error: "Idea created but failed to save analysis. Please try analyzing again."
}

// Foreign key violation
{
  data: null,
  error: "Invalid idea ID. Please refresh and try again."
}
```

### Load Errors

```typescript
// Not found in either table
{
  data: null,
  error: "Analysis not found"
}

// Database error
{
  data: null,
  error: "Failed to load analysis. Please try again."
}
```

## Performance Considerations

### Indexes

Ensure these indexes exist:

- `ideas(user_id)` - For listing user's ideas
- `ideas(updated_at DESC)` - For sorting
- `documents(idea_id)` - For loading documents by idea
- `documents(user_id)` - For user queries
- `documents(id, user_id)` - For authorization checks

### Query Optimization

**Loading ideas with document counts:**

```sql
SELECT
  i.*,
  COUNT(d.id) as document_count
FROM ideas i
LEFT JOIN documents d ON d.idea_id = i.id
WHERE i.user_id = $1
GROUP BY i.id
ORDER BY i.updated_at DESC;
```

## Testing Strategy

### Unit Tests

- Test idea creation with valid data
- Test document creation with valid idea_id
- Test document creation with invalid idea_id (should fail)
- Test fallback logic for legacy data
- Test error handling for all operations

### Integration Tests

- Test complete save flow (idea + document)
- Test load flow with fallback
- Test update flow with fallback
- Test delete flow with fallback
- Test Doctor Frankenstein flow

### E2E Tests

- Create startup analysis → verify in database
- Create hackathon analysis → verify in database
- Generate Frankenstein idea → verify in database
- Analyze Frankenstein idea → verify document linked
- View analysis from dashboard → verify loads correctly
- View legacy analysis → verify loads correctly

## Migration Checklist

- [ ] Update saveHackathonAnalysis.ts
- [ ] Update loadUserHackathonAnalyses.ts
- [ ] Update updateHackathonAnalysisAudio.ts
- [ ] Update deleteHackathonAnalysis.ts
- [ ] Update saveAnalysis.ts (classic analyzer)
- [ ] Update saveFrankensteinIdea.ts
- [ ] Update loadFrankensteinIdea.ts
- [ ] Update updateFrankensteinIdea.ts
- [ ] Update AnalysisController.saveAnalysis()
- [ ] Update AnalysisController.updateAnalysis()
- [ ] Update AnalysisController.deleteAnalysis()
- [ ] Mark loadUnifiedAnalyses.ts as deprecated
- [ ] Add deprecation comments to SupabaseAnalysisRepository
- [ ] Update all analyzer views to pass ideaId when available
- [ ] Test all flows end-to-end
- [ ] Verify legacy data still loads correctly
- [ ] Update documentation
