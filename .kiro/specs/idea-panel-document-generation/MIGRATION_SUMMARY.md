# Database Migration Summary

## Migration: Document Generation Types and Versioning

**Date:** November 24, 2025
**Status:** ✅ Successfully Completed

## Overview

This migration adds support for new document types (PRD, Technical Design, Architecture, Roadmap) and implements document versioning in the `documents` table.

## Changes Applied

### 1. Extended Document Types ✅

**Migration:** `add_document_types_step1`

Updated the CHECK constraint on `document_type` column to include new types:

- `startup_analysis` (existing)
- `hackathon_analysis` (existing)
- `prd` (NEW)
- `technical_design` (NEW)
- `architecture` (NEW)
- `roadmap` (NEW)

### 2. Added Version Column ✅

**Migration:** `add_version_column_step2`

Added `version` column to `documents` table:

- Type: `INTEGER NOT NULL`
- Default: `1`
- All existing documents automatically set to version 1

### 3. Updated Unique Constraint ✅

**Migration:** `update_unique_constraint_step3`

Replaced the old unique constraint with a new one that includes version:

- **Old:** `documents_idea_id_document_type_key` (one document per idea+type)
- **New:** `documents_idea_type_version_idx` (unique per idea+type+version)

This allows multiple versions of the same document type for an idea.

### 4. Added Performance Index ✅

**Migration:** `add_version_index_step4`

Created index for efficient latest version queries:

- Index: `documents_latest_version_idx`
- Columns: `(idea_id, document_type, version DESC)`
- Purpose: Optimizes queries like `ORDER BY version DESC LIMIT 1`

## Verification Results

### Table Structure

```
Column Name    | Data Type                  | Default         | Nullable
---------------|----------------------------|-----------------|----------
id             | uuid                       | gen_random_uuid()| NO
idea_id        | uuid                       | null            | NO
user_id        | uuid                       | null            | NO
document_type  | text                       | null            | NO
title          | text                       | null            | YES
content        | jsonb                      | null            | NO
created_at     | timestamp with time zone   | now()           | NO
updated_at     | timestamp with time zone   | now()           | NO
version        | integer                    | 1               | NO
```

### Constraints

- ✅ CHECK constraint includes all 6 document types
- ✅ Unique index on (idea_id, document_type, version)

### Indexes

- ✅ `documents_pkey` - Primary key on id
- ✅ `documents_idea_type_version_idx` - Unique index for versioning
- ✅ `documents_latest_version_idx` - Performance index for latest version queries
- ✅ `idx_documents_idea` - Existing index on idea_id
- ✅ `idx_documents_type` - Existing index on (idea_id, document_type)
- ✅ `idx_documents_user` - Existing index on user_id

### Data Integrity

- ✅ All existing documents preserved
- ✅ All existing documents have version = 1
- ✅ No data loss during migration

## Versioning Semantics

### How Versioning Works

1. **Each version is a separate row** with its own unique `id` (UUID)
2. **Version identification:** The tuple `(idea_id, document_type, version)` uniquely identifies a specific version
3. **Latest version query:**
   ```sql
   SELECT * FROM documents
   WHERE idea_id = ? AND document_type = ?
   ORDER BY version DESC
   LIMIT 1
   ```
4. **All versions preserved:** Immutable history (no updates, only inserts)
5. **Version creation:** When editing, insert a new row with `version = old_version + 1` and a new UUID

### Example Scenario

```
Initial document:
- id: uuid-1, idea_id: idea-123, document_type: 'prd', version: 1, content: "v1 content"

After edit:
- id: uuid-1, idea_id: idea-123, document_type: 'prd', version: 1, content: "v1 content" (preserved)
- id: uuid-2, idea_id: idea-123, document_type: 'prd', version: 2, content: "v2 content" (new row)

After another edit:
- id: uuid-1, idea_id: idea-123, document_type: 'prd', version: 1, content: "v1 content" (preserved)
- id: uuid-2, idea_id: idea-123, document_type: 'prd', version: 2, content: "v2 content" (preserved)
- id: uuid-3, idea_id: idea-123, document_type: 'prd', version: 3, content: "v3 content" (new row)
```

## Backward Compatibility

✅ **Fully backward compatible:**

- Existing code continues to work
- All existing documents have version = 1
- Old queries still work (they'll get version 1 documents)
- RLS policies unchanged and still effective

## Next Steps

The database schema is now ready for:

1. ✅ Storing new document types (PRD, Technical Design, Architecture, Roadmap)
2. ✅ Version management (edit history, regeneration)
3. ⏳ Domain layer implementation (DocumentType value object extension)
4. ⏳ Repository layer implementation (version query methods)
5. ⏳ Application layer implementation (use cases for generation, editing, versioning)

## Rollback Plan

If needed, the migration can be rolled back:

```sql
-- Remove version column
ALTER TABLE documents DROP COLUMN IF EXISTS version;

-- Restore old unique constraint
CREATE UNIQUE INDEX documents_idea_id_document_type_key
ON documents(idea_id, document_type);

-- Remove new indexes
DROP INDEX IF EXISTS documents_idea_type_version_idx;
DROP INDEX IF EXISTS documents_latest_version_idx;

-- Restore old CHECK constraint
ALTER TABLE documents DROP CONSTRAINT documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN ('startup_analysis', 'hackathon_analysis'));
```

## Migration Files

The migration was applied in 4 steps:

1. `add_document_types_step1` - Extended document types
2. `add_version_column_step2` - Added version column
3. `update_unique_constraint_step3` - Updated unique constraint
4. `add_version_index_step4` - Added performance index

All migrations are tracked in Supabase migrations table.
