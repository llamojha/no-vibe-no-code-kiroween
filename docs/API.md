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

Saves an analysis to the user's dashboard.

**Authentication**: Required

**Request Body**:
```json
{
  "analysisId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Analysis saved to dashboard"
}
```

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

Analyzes a hackathon project with specialized criteria.

**Authentication**: Required

**Request Body**:
```json
{
  "projectName": "EcoTracker",
  "description": "A mobile app that helps users track their carbon footprint",
  "category": "sustainability",
  "teamSize": 4,
  "techStack": ["React Native", "Node.js", "MongoDB"],
  "locale": "en"
}
```

**Request Schema**:
- `projectName` (string, required): Project name (1-100 characters)
- `description` (string, required): Project description (10-2000 characters)
- `category` (string, required): Project category
- `teamSize` (number, optional): Number of team members
- `techStack` (array, optional): Technologies used
- `locale` (string, required): Language locale ("en" or "es")

**Response** (201):
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "projectName": "EcoTracker",
  "description": "A mobile app that helps users track their carbon footprint",
  "category": "sustainability",
  "overallScore": 82,
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
    }
  ],
  "recommendations": [
    "Consider adding social features to increase engagement",
    "Implement gamification elements"
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Dashboard Endpoints (v2)

### GET /api/v2/dashboard/analyses

Retrieves user's saved analyses for the dashboard.

**Authentication**: Required

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 10)

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
import { NoVibeNoCodeClient } from '@novibecode/sdk';

const client = new NoVibeNoCodeClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com/api'
});

// Analyze an idea
const analysis = await client.analyze({
  idea: 'A mobile app for dog walking',
  locale: 'en'
});

// Get user analyses
const analyses = await client.getAnalyses({
  page: 1,
  limit: 10
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