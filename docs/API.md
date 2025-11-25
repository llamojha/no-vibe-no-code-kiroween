# API Documentation

This document provides comprehensive documentation for the No Vibe No Code API endpoints.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication using Supabase Auth. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": ["Additional error details"]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity (business rule violations)
- `500` - Internal Server Error

## Analysis Endpoints

### Database Structure

**New Data Model (Current)**:

All new analyses are stored in two tables:

- `ideas` table: Stores the idea/project concept with metadata (status, notes, tags)
- `documents` table: Stores analyses linked to ideas via `idea_id` foreign key

**Legacy Data Model (Backward Compatible)**:

The `saved_analyses` table remains for backward compatibility:

- Contains all analyses created before the migration
- Still readable via fallback logic in load operations
- No longer used for new analyses

**Migration Approach**:

- **Write Operations**: All new saves go to `ideas` + `documents` tables
- **Read Operations**: Try `documents` table first, fallback to `saved_analyses` for legacy data
- **Update/Delete Operations**: Try `documents` table first, fallback to `saved_analyses` for legacy data

For details about the database structure, see:

- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [Database Consolidation Documentation](./DATABASE_CONSOLIDATION.md)
- [Complete Documents Migration Guide](./COMPLETE_DOCUMENTS_MIGRATION_GUIDE.md)

### POST /api/analyze

Analyzes a startup idea using AI and returns detailed feedback.

**Authentication**: Required

**Request Body**:

```json
{
  "idea": "A mobile app that connects dog owners with local dog walkers",
  "locale": "en"
}
```

**Request Schema**:

- `idea` (string, required): The startup idea to analyze (10-5000 characters)
- `locale` (string, required): Language locale ("en" or "es")

**Response** (201):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "idea": "A mobile app that connects dog owners with local dog walkers",
  "score": 78,
  "detailedSummary": "This is a solid marketplace idea with clear value proposition...",
  "criteria": [
    {
      "name": "Market Size",
      "score": 85,
      "justification": "Large and growing pet care market..."
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "locale": "en"
}
```

**Example cURL**:

```bash
curl -X POST https://your-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "idea": "A mobile app that connects dog owners with local dog walkers",
    "locale": "en"
  }'
```

### GET /api/analyze/[id]

Retrieves a specific analysis by ID.

**Authentication**: Required

**Parameters**:

- `id` (string): Analysis ID (UUID format)

**Response** (200):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "idea": "A mobile app that connects dog owners with local dog walkers",
  "score": 78,
  "detailedSummary": "This is a solid marketplace idea...",
  "criteria": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "locale": "en"
}
```

**Error Responses**:

- `404` - Analysis not found
- `403` - Analysis belongs to another user

### POST /api/analyze/save

Saves an analysis to the user's dashboard. Creates an idea and document in the new data model.

**Authentication**: Required

**Request Body**:

```json
{
  "idea": "A mobile app that connects dog owners with local dog walkers",
  "analysis": {
    "score": 78,
    "detailedSummary": "This is a solid marketplace idea...",
    "criteria": [...]
  },
  "ideaId": "optional-existing-idea-id"
}
```

**Request Schema**:

- `idea` (string, required): The startup idea text
- `analysis` (object, required): The analysis data
- `ideaId` (string, optional): Link to existing idea (if analyzing an existing idea)

**Response** (200):

```json
{
  "ideaId": "123e4567-e89b-12d3-a456-426614174000",
  "documentId": "456e7890-e89b-12d3-a456-426614174001",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Response Fields**:

- `ideaId`: ID of the idea (new or existing)
- `documentId`: ID of the created document (analysis)
- `createdAt`: Timestamp of creation

**Behavior**:

- If `ideaId` is provided: Links document to existing idea
- If `ideaId` is not provided: Creates new idea with source='manual', then creates document
- Backward compatible: Falls back to `saved_analyses` table for legacy data

### GET /api/analyze/search

Searches user's analyses with optional filters.

**Authentication**: Required

**Query Parameters**:

- `q` (string, optional): Search query
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 10, max: 50)
- `sortBy` (string, optional): Sort field ("createdAt" or "score")
- `sortOrder` (string, optional): Sort order ("asc" or "desc")

**Response** (200):

```json
{
  "analyses": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "idea": "A mobile app that connects dog owners...",
      "score": 78,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## Hackathon Analysis Endpoints

### POST /api/analyze-hackathon

Analyzes a hackathon project with specialized criteria. Creates an idea and document in the new data model.

**Authentication**: Required

**Request Body**:

```json
{
  "projectDescription": "A mobile app that helps users track their carbon footprint",
  "analysis": {
    "score": 82,
    "detailedSummary": "Innovative approach...",
    "criteria": [...],
    "selectedCategory": "frankenstein"
  },
  "supportingMaterials": {
    "githubUrl": "https://github.com/...",
    "demoUrl": "https://demo.example.com"
  },
  "ideaId": "optional-existing-idea-id"
}
```

**Request Schema**:

- `projectDescription` (string, required): Project description (10-2000 characters)
- `analysis` (object, required): The hackathon analysis data
- `supportingMaterials` (object, optional): Additional project materials
- `ideaId` (string, optional): Link to existing idea (if analyzing an existing idea)

**Response** (201):

```json
{
  "ideaId": "123e4567-e89b-12d3-a456-426614174000",
  "documentId": "456e7890-e89b-12d3-a456-426614174001",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Response Fields**:

- `ideaId`: ID of the idea (new or existing)
- `documentId`: ID of the created document (hackathon analysis)
- `createdAt`: Timestamp of creation

**Behavior**:

- If `ideaId` is provided: Links document to existing idea
- If `ideaId` is not provided: Creates new idea with source='manual', then creates document
- Document type is set to 'hackathon_analysis'
- Backward compatible: Falls back to `saved_analyses` table for legacy data

## Dashboard Endpoints (v2)

### GET /api/v2/dashboard/analyses

Retrieves user's saved analyses for the dashboard. Supports filtering by analysis type.

**Authentication**: Required

**Query Parameters**:

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 10)
- `type` (string, optional): Filter by analysis type ('idea' or 'hackathon')

**Response** (200):

```json
{
  "analyses": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "idea": "A mobile app that connects dog owners...",
      "score": 78,
      "createdAt": "2024-01-15T10:30:00Z",
      "isSaved": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

### DELETE /api/v2/dashboard/analyses/[id]

Deletes an analysis from the user's dashboard.

**Authentication**: Required

**Parameters**:

- `id` (string): Analysis ID (UUID format)

**Response** (200):

```json
{
  "success": true,
  "message": "Analysis deleted successfully"
}
```

**Error Responses**:

- `404` - Analysis not found
- `403` - Analysis belongs to another user

## Idea Panel Endpoints (v2)

The Idea Panel feature introduces a new data model that separates ideas from documents (analyses). This architecture enables:

- Ideas to exist independently of analyses
- Multiple analyses per idea (e.g., both startup and hackathon analyses)
- Better organization with status tracking, notes, and tags
- Foundation for future document types (PRDs, Design Docs, Roadmaps)

**Data Model**:

- `ideas` table: Stores all ideas with management metadata
- `documents` table: Stores analyses linked to ideas via `idea_id` foreign key
- One idea can have multiple documents (analyses)

**Migration Status**:

- All new analyses save to `ideas` + `documents` tables
- Legacy analyses in `saved_analyses` remain readable via fallback logic
- Backward compatible: No breaking changes to existing functionality

For complete documentation, see [Idea Panel API Documentation](./IDEA_PANEL_API.md).

### GET /api/v2/ideas

Retrieves all ideas for the authenticated user with document counts.

**Authentication**: Required

**Query Parameters**:

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 10)
- `status` (string, optional): Filter by project status
- `source` (string, optional): Filter by idea source

**Response** (200):

```json
{
  "ideas": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "ideaText": "A mobile app that connects dog owners...",
      "source": "manual",
      "projectStatus": "in_progress",
      "notes": "Met with potential users",
      "tags": ["mobile-app", "marketplace"],
      "documentCount": 2,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### GET /api/v2/ideas/[ideaId]

Retrieves a specific idea with all associated documents.

**Authentication**: Required

**Response** (200):

```json
{
  "idea": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "ideaText": "A mobile app that connects dog owners...",
    "source": "manual",
    "projectStatus": "in_progress",
    "notes": "Met with potential users",
    "tags": ["mobile-app", "marketplace"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:20:00Z"
  },
  "documents": [
    {
      "id": "doc-uuid-1",
      "documentType": "startup_analysis",
      "content": {
        /* analysis data */
      },
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### PUT /api/v2/ideas/[ideaId]/status

Updates the project status of an idea.

**Authentication**: Required

**Request Body**:

```json
{
  "status": "in_progress"
}
```

**Response** (200):

```json
{
  "success": true,
  "idea": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "projectStatus": "in_progress",
    "updatedAt": "2024-01-16T14:20:00Z"
  }
}
```

### PUT /api/v2/ideas/[ideaId]/metadata

Updates notes and/or tags for an idea.

**Authentication**: Required

**Request Body**:

```json
{
  "notes": "Met with potential users, positive feedback",
  "tags": ["mobile-app", "marketplace", "pets"]
}
```

**Response** (200):

```json
{
  "success": true,
  "idea": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "notes": "Met with potential users, positive feedback",
    "tags": ["mobile-app", "marketplace", "pets"],
    "updatedAt": "2024-01-16T14:25:00Z"
  }
}
```

### GET /api/v2/ideas/[ideaId]/documents

Retrieves all documents for a specific idea.

**Authentication**: Required

**Response** (200):

```json
{
  "documents": [
    {
      "id": "doc-uuid-1",
      "ideaId": "123e4567-e89b-12d3-a456-426614174000",
      "documentType": "startup_analysis",
      "content": {
        /* analysis data */
      },
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

For complete Idea Panel API documentation, including data models, migration details, and SDK examples, see [Idea Panel API Documentation](./IDEA_PANEL_API.md).

## Document Generation Endpoints (v2)

The Document Generation feature enables users to transform analyzed ideas into professional, AI-generated project documentation. Users can generate PRDs, Technical Design Documents, Architecture Documents, and Roadmaps with AI assistance.

**Feature Flag**: `ENABLE_DOCUMENT_GENERATION` (default: true)

**Credit Costs**:

- PRD: 50 credits
- Technical Design: 75 credits
- Architecture: 75 credits
- Roadmap: 50 credits

For complete documentation, see [Document Generation Feature Guide](./DOCUMENT_GENERATION_GUIDE.md).

### POST /api/v2/documents/generate

Generates a new document using AI for a specific idea.

**Authentication**: Required

**Feature Flag**: Requires `ENABLE_DOCUMENT_GENERATION=true`

**Request Body**:

```json
{
  "ideaId": "123e4567-e89b-12d3-a456-426614174000",
  "documentType": "prd"
}
```

**Request Schema**:

- `ideaId` (string, required): UUID of the idea
- `documentType` (string, required): Type of document to generate ("prd", "technical_design", "architecture", "roadmap")

**Response** (201):

```json
{
  "id": "doc-uuid-123",
  "ideaId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid-456",
  "documentType": "prd",
  "title": "Product Requirements Document",
  "content": {
    "markdown": "# Product Requirements Document\n\n## Problem Statement\n..."
  },
  "version": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:

- `400` - Invalid document type or missing required fields
- `403` - Feature flag disabled or insufficient credits
- `404` - Idea not found
- `422` - Business rule violation (e.g., insufficient credits)
- `500` - AI service error (credits are refunded automatically)

**Example cURL**:

```bash
curl -X POST https://your-domain.com/api/v2/documents/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "ideaId": "123e4567-e89b-12d3-a456-426614174000",
    "documentType": "prd"
  }'
```

### PUT /api/v2/documents/[documentId]

Updates an existing document's content, creating a new version.

**Authentication**: Required

**Parameters**:

- `documentId` (string): Document ID (UUID format)

**Request Body**:

```json
{
  "content": {
    "markdown": "# Updated Product Requirements Document\n\n## Problem Statement\n..."
  }
}
```

**Response** (200):

```json
{
  "id": "doc-uuid-new-version",
  "ideaId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid-456",
  "documentType": "prd",
  "title": "Product Requirements Document",
  "content": {
    "markdown": "# Updated Product Requirements Document\n..."
  },
  "version": 2,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

**Versioning Behavior**:

- Creates a NEW document entity with a NEW UUID
- Increments version number (e.g., v1 → v2)
- Preserves previous version as separate database row
- Returns the new document with new ID and incremented version

**Error Responses**:

- `404` - Document not found
- `403` - Document belongs to another user

### POST /api/v2/documents/[documentId]/regenerate

Regenerates a document using AI, creating a new version while preserving the previous version.

**Authentication**: Required

**Feature Flag**: Requires `ENABLE_DOCUMENT_GENERATION=true`

**Parameters**:

- `documentId` (string): Document ID (UUID format)

**Response** (201):

```json
{
  "id": "doc-uuid-regenerated",
  "ideaId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid-456",
  "documentType": "prd",
  "title": "Product Requirements Document",
  "content": {
    "markdown": "# Product Requirements Document (Regenerated)\n..."
  },
  "version": 3,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:15:00Z"
}
```

**Credit Behavior**:

- Deducts credits based on document type
- Refunds credits automatically if AI generation fails
- Checks credit balance before deduction

**Error Responses**:

- `403` - Insufficient credits or feature flag disabled
- `404` - Document not found
- `500` - AI service error (credits refunded)

### GET /api/v2/documents/[documentId]/versions

Retrieves all versions of a document.

**Authentication**: Required

**Parameters**:

- `documentId` (string): Document ID (UUID format)

**Response** (200):

```json
{
  "versions": [
    {
      "id": "doc-uuid-v3",
      "version": 3,
      "content": {
        "markdown": "# Product Requirements Document (v3)\n..."
      },
      "createdAt": "2024-01-15T12:15:00Z",
      "updatedAt": "2024-01-15T12:15:00Z"
    },
    {
      "id": "doc-uuid-v2",
      "version": 2,
      "content": {
        "markdown": "# Product Requirements Document (v2)\n..."
      },
      "createdAt": "2024-01-15T11:45:00Z",
      "updatedAt": "2024-01-15T11:45:00Z"
    },
    {
      "id": "doc-uuid-v1",
      "version": 1,
      "content": {
        "markdown": "# Product Requirements Document (v1)\n..."
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Ordering**: Versions are returned in descending order (newest first)

### POST /api/v2/documents/[documentId]/versions/[version]/restore

Restores a previous version by creating a new version with that content.

**Authentication**: Required

**Parameters**:

- `documentId` (string): Document ID (UUID format)
- `version` (number): Version number to restore

**Response** (201):

```json
{
  "id": "doc-uuid-restored",
  "ideaId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid-456",
  "documentType": "prd",
  "title": "Product Requirements Document",
  "content": {
    "markdown": "# Product Requirements Document (Restored from v1)\n..."
  },
  "version": 4,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T13:00:00Z"
}
```

**Behavior**:

- Loads content from specified version
- Creates new version with that content
- Does not delete any versions (immutable history)

### GET /api/v2/documents/[documentId]/export

Exports a document in the specified format.

**Authentication**: Required

**Parameters**:

- `documentId` (string): Document ID (UUID format)

**Query Parameters**:

- `format` (string, required): Export format ("markdown" or "pdf")

**Response** (200):

For Markdown export:

```
Content-Type: text/markdown
Content-Disposition: attachment; filename="prd-{ideaId}.md"

# Product Requirements Document
...
```

For PDF export:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="prd-{ideaId}.pdf"

[PDF binary content]
```

**Export Metadata**:

Both formats include:

- Document title
- Version number
- Creation date
- Last updated date

**Error Responses**:

- `400` - Invalid format parameter
- `404` - Document not found
- `500` - Export generation error

**Example cURL**:

```bash
# Export as Markdown
curl -X GET "https://your-domain.com/api/v2/documents/doc-uuid-123/export?format=markdown" \
  -H "Authorization: Bearer <jwt_token>" \
  -o document.md

# Export as PDF
curl -X GET "https://your-domain.com/api/v2/documents/doc-uuid-123/export?format=pdf" \
  -H "Authorization: Bearer <jwt_token>" \
  -o document.pdf
```

## Audio Features

### POST /api/tts

Converts text to speech.

**Authentication**: Required

**Request Body**:

```json
{
  "text": "This is a solid marketplace idea with clear value proposition",
  "locale": "en"
}
```

**Response** (200):

```json
{
  "audioUrl": "https://storage.example.com/audio/123456.mp3",
  "duration": 5.2
}
```

### POST /api/transcribe

Transcribes audio to text.

**Authentication**: Required

**Request**: Multipart form data

- `audio` (file): Audio file (MP3, WAV, M4A)
- `locale` (string): Language locale

**Response** (200):

```json
{
  "text": "This is the transcribed text from the audio file",
  "confidence": 0.95,
  "duration": 12.3
}
```

## Health Check

### GET /api/health

Health check endpoint for monitoring.

**Authentication**: Not required

**Response** (200):

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "ai": "healthy"
  }
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Analysis endpoints**: 10 requests per minute per user
- **Audio endpoints**: 5 requests per minute per user
- **Other endpoints**: 60 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642248600
```

## Webhooks

### Analysis Completion Webhook

Triggered when an analysis is completed (for async processing).

**URL**: Configured in environment variables
**Method**: POST
**Headers**:

- `X-Webhook-Signature`: HMAC signature for verification

**Payload**:

```json
{
  "event": "analysis.completed",
  "data": {
    "analysisId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "user_123",
    "score": 78,
    "completedAt": "2024-01-15T10:30:00Z"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { NoVibeNoCodeClient } from "@novibecode/sdk";

const client = new NoVibeNoCodeClient({
  apiKey: "your-api-key",
  baseUrl: "https://your-domain.com/api",
});

// Analyze an idea
const analysis = await client.analyze({
  idea: "A mobile app for dog walking",
  locale: "en",
});

// Get user analyses
const analyses = await client.getAnalyses({
  page: 1,
  limit: 10,
});
```

### Python

```python
from novibecode import Client

client = Client(
    api_key='your-api-key',
    base_url='https://your-domain.com/api'
)

# Analyze an idea
analysis = client.analyze(
    idea='A mobile app for dog walking',
    locale='en'
)

# Get user analyses
analyses = client.get_analyses(page=1, limit=10)
```

## Changelog

### v2.0.0 (2024-01-15)

- Added hexagonal architecture endpoints
- Improved error handling and validation
- Added hackathon analysis endpoints
- Enhanced dashboard functionality

### v1.0.0 (2023-12-01)

- Initial API release
- Basic analysis functionality
- User authentication
- Dashboard features

## Support

For API support and questions:

- Email: api-support@novibecode.com
- Documentation: https://docs.novibecode.com
- Status Page: https://status.novibecode.com
