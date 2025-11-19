# Idea Panel MVP Summary

## Overview

The Idea Panel transforms saved startup analyses into an interactive workspace for generating professional project documentation. Users can create PRDs, Technical Design Documents, Roadmaps, and Architecture Documents using AI assistance, then edit and export them for execution.

**Core Value**: Bridge the gap between initial idea analysis and actionable project kickoff with AI-assisted documentation and human oversight.

## Key Features

### 1. Panel Access & Navigation

- "Manage" button on dashboard analysis cards
- Dedicated full-screen panel at `/idea-panel/[analysisId]`
- Breadcrumb navigation back to dashboard
- Display original analysis with scores and feedback

### 2. Project Status Tracking

- Visual status indicator (idea → documented → ready → completed)
- Progress percentage based on generated documents (0-100%)
- Status badges for each document type
- Next recommended action guidance

### 3. AI Document Generation

Four document types with AI-powered content:

**PRD (Product Requirements Document)**

- Problem statement
- User personas
- Features list
- Success metrics
- Out-of-scope items

**Technical Design Document**

- Architecture overview
- Tech stack decisions
- Data models
- API specifications
- Security considerations
- Deployment strategy

**Roadmap**

- Milestones with timelines
- Feature prioritization
- Dependencies
- Resource allocation
- Risk mitigation

**Architecture Document**

- System architecture diagram
- Component breakdown
- Integration points
- Scalability considerations

### 4. Document Management

- Markdown editor for content refinement
- Version history with timestamps
- Restore previous versions
- Regenerate documents with AI
- Auto-save with version increment

### 5. Export Capabilities

- Markdown (.md) export
- PDF export with formatting preservation
- Metadata inclusion (title, version, date)

### 6. Credit System Integration

- Credit cost display per document type
- Balance check before generation
- Automatic deduction on generation
- Refund on generation failure
- Insufficient credits error handling

### 7. Accessibility & Responsiveness

- Full keyboard navigation
- ARIA labels for screen readers
- Mobile-responsive layout
- Collapsible sidebar on mobile
- Touch-friendly buttons (44x44px minimum)

### 8. Feature Flags

- `ENABLE_IDEA_PANEL`: Controls panel access
- `ENABLE_DOCUMENT_GENERATION`: Controls document generation

## Architecture

### Hexagonal Architecture Layers

**Domain Layer** (Pure business logic)

- `IdeaPanel` aggregate root
- `GeneratedDocument` entity
- Value objects: `DocumentType`, `ProjectStatus`, `DocumentVersion`
- Repository interfaces

**Application Layer** (Use case orchestration)

- Panel management use cases
- Document generation use cases
- Document editing use cases
- Export use cases

**Infrastructure Layer** (External integrations)

- Supabase repositories
- Google AI document generator adapter
- PDF export adapter
- Next.js API controllers

**Feature Layer** (UI components)

- Panel layout and navigation
- Document generation interface
- Document editor
- Version history viewer
- Export controls

## Database Schema

### Extensions to `saved_analyses` Table

```sql
ALTER TABLE saved_analyses ADD COLUMN
  documents_generated JSONB DEFAULT '{"prd": false, "design": false, "roadmap": false, "architecture": false}',
  project_status TEXT DEFAULT 'idea',
  panel_metadata JSONB DEFAULT '{}';
```

### New `generated_documents` Table

```sql
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES saved_analyses(id),
  document_type TEXT CHECK (document_type IN ('prd', 'design', 'roadmap', 'architecture')),
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (analysis_id, document_type, version)
);
```

## API Endpoints

### Panel Management

- `GET /api/v2/idea-panel/[analysisId]` - Open panel
- `GET /api/v2/idea-panel/[analysisId]/overview` - Get overview

### Document Operations

- `POST /api/v2/idea-panel/[analysisId]/documents` - Generate document
- `PUT /api/v2/idea-panel/[analysisId]/documents/[documentId]` - Update document
- `GET /api/v2/idea-panel/[analysisId]/documents/[documentId]/export` - Export document
- `GET /api/v2/idea-panel/[analysisId]/documents/[documentId]/versions` - Get version history
- `POST /api/v2/idea-panel/[analysisId]/documents/[documentId]/restore` - Restore version
- `POST /api/v2/idea-panel/[analysisId]/documents/[documentId]/regenerate` - Regenerate document

## User Workflows

### Primary Workflow

1. User views dashboard with saved analyses
2. Clicks "Manage" button on analysis card
3. Opens Idea Panel showing analysis summary and status
4. Generates PRD (AI creates content, credits deducted)
5. Reviews and edits PRD content in markdown editor
6. Saves changes (version incremented)
7. Generates remaining documents (Design, Roadmap, Architecture)
8. Exports documents as Markdown or PDF
9. Project status updates to "ready"

### Document Editing Workflow

1. Open generated document in editor
2. Modify content
3. Save changes (creates new version)
4. View version history if needed
5. Restore previous version if desired

### Regeneration Workflow

1. View generated document
2. Click "Regenerate" button
3. Confirm action (credit warning displayed)
4. AI generates new content
5. New version created, previous preserved

## Implementation Plan (24 Tasks)

### Phase 1: Foundation (Tasks 1-4)

- Database schema and migrations
- Domain entities and value objects
- Repository interfaces
- Domain errors

### Phase 2: Infrastructure (Tasks 5-7)

- Supabase repository implementations
- AI document generation adapter
- PDF export adapter

### Phase 3: Application Logic (Tasks 8-10)

- Panel management use cases
- Document generation use cases
- Document editing use cases

### Phase 4: Web Layer (Tasks 11-13)

- API controllers
- Next.js API routes
- Client-side API wrappers

### Phase 5: UI Components (Tasks 14-17)

- Panel layout and structure
- Document generation interface
- Document editor and controls
- Dashboard integration

### Phase 6: Configuration & Testing (Tasks 18-21)

- Feature flags setup
- Service factories
- Integration tests
- E2E tests

### Phase 7: Finalization (Tasks 22-24)

- Analytics tracking
- Documentation updates
- Final verification

## Testing Strategy

### Property-Based Testing (100 iterations each)

- Document version increment correctness
- Project status transition validity
- Document persistence verification
- Metadata update accuracy
- Credit deduction correctness
- Export formatting preservation
- Version history preservation

### Integration Testing

- Complete document generation flow
- Credit system integration
- Feature flag protection
- Error handling and rollback

### E2E Testing (Playwright)

- Full user workflows
- Mobile responsiveness
- Keyboard navigation
- Accessibility compliance

## Success Metrics

### Completion Criteria

- All 54 correctness properties validated
- All 15 user stories implemented
- 100% test coverage for domain layer
- E2E tests passing for all workflows
- Mobile responsive on all viewports
- WCAG 2.1 AA accessibility compliance

### Performance Targets

- Panel load time < 2 seconds
- Document generation < 30 seconds
- Export generation < 5 seconds
- Real-time UI updates < 100ms

## Rollout Strategy

### Phase 1: Internal Testing

- Deploy with feature flags disabled
- Run database migrations
- Enable for internal team only

### Phase 2: Beta Testing

- Enable `ENABLE_IDEA_PANEL` for 10% of users
- Monitor usage and error rates
- Collect user feedback

### Phase 3: Full Rollout

- Gradual rollout: 25% → 50% → 100%
- Monitor credit usage patterns
- Track document generation success rates

### Rollback Plan

- Feature flags allow instant disable
- Database migrations are additive (no data loss)
- Credit refunds ensure no user impact

## Technical Considerations

### Security

- Authentication on all endpoints
- User ownership validation
- Input sanitization
- Rate limiting on generation endpoints

### Performance

- Database indexes on `analysis_id` and `document_type`
- Connection pooling for Supabase
- Request queuing for AI service
- Client-side caching with SWR pattern

### Error Handling

- Domain errors for business rule violations
- Infrastructure error conversion
- User-friendly error messages
- Automatic credit refunds on failure

## Dependencies

### External Services

- Google Gemini AI (document generation)
- Supabase (database and auth)
- PDF generation library

### Internal Systems

- Credit system (balance check, deduction, refund)
- Authentication system
- Analytics tracking (PostHog)
- Feature flag system

## Future Enhancements (Post-MVP)

- Collaborative editing
- Document templates
- Custom document types
- GitHub integration for issue creation
- Real-time collaboration
- Document comparison/diff view
- AI-powered suggestions during editing
- Bulk export functionality

---

**Estimated Development Time**: 4-6 weeks
**Team Size**: 2-3 developers
**Priority**: High (Core product feature)
