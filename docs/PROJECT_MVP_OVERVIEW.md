# No Vibe No Code - Complete MVP Overview

## Executive Summary

**No Vibe No Code** is an AI-powered product management platform that transforms raw startup ideas into execution-ready documentation and GitHub backlogs. The platform combines AI-assisted analysis with human oversight to help users go from "I have an idea" to "I have a governed plan with tickets" in under 24 hours.

**Current Status**: MVP with active features + Idea Panel feature in development

**Tech Stack**: Next.js 14, React 18, TypeScript, Supabase, Google Gemini AI, Hexagonal Architecture

---

## 🎯 Product Vision

### Mission

Help users transform ideas into actionable documentation with AI assistance while maintaining human control and quality oversight.

### Target Users

| Persona                  | Needs                                 | Value Delivered                              |
| ------------------------ | ------------------------------------- | -------------------------------------------- |
| 🧑‍💻 Indie Builders        | Fast MVP validation                   | Idea → PRD → backlog in a day                |
| 🧑‍💼 Product Managers      | Convert specs into actionable tickets | Reduce coordination overhead                 |
| 🧠 AI Studios / Agencies | Parallel project pipelines            | Scale idea throughput with human checkpoints |
| 🏢 Enterprise R&D        | Internal innovation acceleration      | Controlled sandbox for AI documentation      |

### Success Metrics

| Metric                         | Target                             |
| ------------------------------ | ---------------------------------- |
| Time from idea → PRD + tickets | ≤ 24h with human approvals         |
| Human acceptance of AI drafts  | ≥ 90% after edits                  |
| Accessibility compliance       | WCAG 2.1 AA (90+ Lighthouse score) |
| Test coverage                  | 70%+ code coverage                 |

---

## 🏗️ Architecture

### Hexagonal Architecture Pattern

The application follows strict hexagonal architecture (Ports and Adapters) with clear layer separation:

```
src/
├── domain/              # Pure business logic (no dependencies)
│   ├── entities/        # Domain entities with encapsulated IDs
│   ├── value-objects/   # Immutable value objects
│   ├── repositories/    # Repository interfaces (ports)
│   └── services/        # Domain services
├── application/         # Use cases and orchestration
│   ├── use-cases/       # Business use cases
│   ├── handlers/        # Command and query handlers
│   └── services/        # Application services
├── infrastructure/      # External adapters
│   ├── database/        # Supabase repositories
│   ├── external/        # AI services, analytics
│   ├── web/             # Next.js controllers
│   └── factories/       # Service factories
└── shared/              # Shared utilities
```

### Key Architectural Principles

- **Domain-Driven Design**: Strongly-typed entities and value objects
- **Dependency Inversion**: Domain layer has zero external dependencies
- **SOLID Principles**: Single responsibility, interface segregation
- **Testability**: Pure functions, dependency injection, comprehensive mocking

---

## 🚀 Current Features (Live MVP)

### 1. Startup Idea Analyzer

**Purpose**: AI-powered evaluation of startup ideas with comprehensive scoring and feedback

**Features**:

- Multi-dimensional scoring (viability, innovation, market potential, execution complexity)
- Detailed feedback with strengths, weaknesses, and recommendations
- Multi-language support (English, Spanish)
- Credit-based usage system
- Analysis history and dashboard

**User Flow**:

1. User enters startup idea description
2. AI analyzes idea using Google Gemini
3. System generates scores (0-100) across multiple dimensions
4. User receives detailed feedback and recommendations
5. Analysis saved to dashboard for future reference

**Tech Implementation**:

- Domain: `Analysis` entity, `Score` value objects
- Application: `AnalyzeIdeaUseCase`, `SaveAnalysisUseCase`
- Infrastructure: `GoogleAIAnalysisService`, `SupabaseAnalysisRepository`
- UI: React components with loading states, error handling

### 2. Kiroween Hackathon Analyzer

**Purpose**: Specialized evaluation tool for hackathon projects with Kiro-specific criteria

**Features**:

- Hackathon-specific scoring (creativity, technical execution, Kiro integration)
- Category recommendations (AI/ML, DevTools, Productivity, etc.)
- Kiro usage analysis and integration assessment
- Leaderboard functionality
- Halloween-themed UI

**User Flow**:

1. User describes hackathon project
2. AI evaluates project against hackathon criteria
3. System provides category recommendations
4. Kiro usage analysis generated
5. Project added to leaderboard

**Tech Implementation**:

- Domain: `HackathonAnalysis` entity, `Category` value objects
- Application: `AnalyzeHackathonProjectUseCase`
- Infrastructure: `GoogleAIAdapter` with hackathon prompts
- UI: Themed components with animations

### 3. Doctor Frankenstein (Idea Generator)

**Purpose**: AI-powered idea generation tool with two modes

**Features**:

- **Companies Mode**: Generate startup ideas inspired by successful companies
- **AWS Mode**: Generate ideas leveraging AWS services
- Slot machine animation for engaging UX
- Detailed idea descriptions with market analysis
- Save generated ideas for analysis

**User Flow**:

1. User selects generation mode (Companies/AWS)
2. Clicks generate button (slot machine animation)
3. AI generates creative startup idea
4. User can save idea or generate another
5. Saved ideas can be analyzed with main analyzer

**Tech Implementation**:

- Application: `GenerateIdeaUseCase`
- Infrastructure: `GoogleAIAdapter` with creative prompts
- UI: Three.js animations, responsive design

### 4. User Dashboard

**Purpose**: Centralized view of all user analyses and projects

**Features**:

- Unified analysis history (startup ideas + hackathon projects)
- Filtering and sorting capabilities
- Quick stats (total analyses, average scores)
- Analysis detail views
- Delete functionality
- Empty state guidance

**User Flow**:

1. User logs in and views dashboard
2. Sees all saved analyses with scores
3. Can filter by type or date
4. Click to view full analysis details
5. Delete unwanted analyses

**Tech Implementation**:

- Application: `GetUserAnalysesUseCase`, `GetDashboardStatsUseCase`
- Infrastructure: `SupabaseDashboardRepository`
- UI: React Server Components, optimistic updates

### 5. Authentication & User Management

**Purpose**: Secure user authentication and session management

**Features**:

- Email/password authentication via Supabase
- Social login (Google, GitHub)
- Session management with secure cookies
- User profile management
- Last login tracking

**Tech Implementation**:

- Infrastructure: `SupabaseAdapter` for auth
- Middleware: Authentication checks on protected routes
- Security: Per-request Supabase client (no caching)

### 6. Credit System

**Purpose**: Usage tracking and monetization foundation

**Features**:

- Credit balance tracking per user
- Credit deduction on AI operations
- Insufficient credit handling
- Credit refunds on failures
- Usage analytics

**Tech Implementation**:

- Domain: `CreditBalance` value object
- Application: `CheckCreditsUseCase`, `DeductCreditUseCase`
- Infrastructure: `SupabaseCreditRepository`

### 7. Internationalization (i18n)

**Purpose**: Multi-language support for global users

**Features**:

- English and Spanish translations
- Language switcher component
- Locale persistence
- RTL support ready

**Tech Implementation**:

- Feature: `LocaleContext` with React Context
- Translations: JSON-based translation files
- UI: Language switcher in navigation

### 8. Analytics & Monitoring

**Purpose**: User behavior tracking and error monitoring

**Features**:

- PostHog integration for analytics
- Event tracking (page views, feature usage)
- Error tracking and reporting
- User journey analysis

**Tech Implementation**:

- Infrastructure: `PostHogAdapter`
- Events: Analysis creation, document generation, exports

---

## 🔮 Planned Feature: Idea Panel

### Overview

The **Idea Panel** extends the platform by providing a comprehensive workspace for managing analyzed startup ideas. After completing an initial analysis, users can open the Idea Panel to generate professional project documentation, track progress through workflow states, and prepare ideas for execution.

### Workflow Progression

**New Idea → Generate Documents → Review & Edit → Ready → Export & Execute**

### Key Capabilities

#### 1. Panel Access & Management

**Features**:

- "Manage" button on dashboard analysis cards
- Dedicated full-screen panel at `/idea-panel/[analysisId]`
- Breadcrumb navigation
- Analysis summary display with original scores

**User Flow**:

1. User clicks "Manage" on analysis card
2. Panel opens showing analysis overview
3. Current project status displayed
4. Available actions shown based on status

#### 2. AI Document Generation

**Four Document Types**:

**PRD (Product Requirements Document)**

- Problem statement and user personas
- Feature specifications
- Success metrics
- Out-of-scope items
- Cost: Credits per generation

**Technical Design Document**

- Architecture overview
- Tech stack decisions
- Data models and API specs
- Security considerations
- Deployment strategy

**Roadmap**

- Milestones with timelines
- Feature prioritization
- Dependencies and resources
- Risk mitigation strategies

**Architecture Document**

- System architecture diagrams
- Component breakdown
- Integration points
- Scalability considerations

**Generation Process**:

1. User selects document type
2. System checks credit balance
3. AI generates comprehensive document
4. Document saved with version 1
5. Credits deducted
6. Project status updated

#### 3. Document Editing & Versioning

**Features**:

- Markdown editor with syntax highlighting
- Auto-save functionality
- Version history tracking
- Restore previous versions
- Version comparison (future)

**User Flow**:

1. User opens generated document
2. Edits content in markdown editor
3. Saves changes (version incremented)
4. Can view version history
5. Can restore any previous version

#### 4. Document Export

**Export Formats**:

- **Markdown (.md)**: Preserves formatting, includes metadata
- **PDF**: Professional formatting, includes title/version/date

**Features**:

- One-click export
- Metadata inclusion
- Formatting preservation
- Batch export (future)

#### 5. Project Status Tracking

**Status States**:

- **Idea**: Initial state, no documents generated
- **Documented**: At least one document generated
- **Ready**: All documents generated and reviewed
- **Completed**: Project exported and ready for execution

**Visual Indicators**:

- Progress percentage (0-100%)
- Status badges per document type
- Next recommended action
- Completion checklist

#### 6. Regeneration & Refinement

**Features**:

- Regenerate any document with AI
- Confirmation dialog with credit warning
- Previous version preserved in history
- New version created with regenerated content

**Use Cases**:

- Unsatisfied with initial generation
- Requirements changed
- Need different perspective
- Incorporate new feedback

### Technical Implementation

#### Database Schema

**Extensions to `saved_analyses` table**:

```sql
ALTER TABLE saved_analyses ADD COLUMN
  documents_generated JSONB DEFAULT '{"prd": false, "design": false, "roadmap": false, "architecture": false}',
  project_status TEXT DEFAULT 'idea',
  panel_metadata JSONB DEFAULT '{}';
```

**New `generated_documents` table**:

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

#### Domain Layer

**Entities**:

- `IdeaPanel`: Aggregate root managing panel state
- `GeneratedDocument`: Individual documents with versioning

**Value Objects**:

- `DocumentType`: PRD, DESIGN, ROADMAP, ARCHITECTURE
- `ProjectStatus`: IDEA, DOCUMENTED, READY, COMPLETED
- `DocumentVersion`: Version number with increment logic

**Repository Interfaces**:

- `IIdeaPanelRepository`: Panel persistence
- `IGeneratedDocumentRepository`: Document persistence with versioning

#### Application Layer

**Use Cases**:

- `OpenIdeaPanelUseCase`: Initialize or load panel
- `GetPanelOverviewUseCase`: Load panel with statistics
- `GenerateDocumentUseCase`: AI document generation with credit handling
- `UpdateDocumentUseCase`: Edit and version documents
- `ExportDocumentUseCase`: Export to Markdown/PDF
- `GetDocumentVersionHistoryUseCase`: Load version history
- `RestoreDocumentVersionUseCase`: Restore previous version
- `RegenerateDocumentUseCase`: AI regeneration with versioning

#### Infrastructure Layer

**Repositories**:

- `SupabaseIdeaPanelRepository`: Panel data persistence
- `SupabaseGeneratedDocumentRepository`: Document persistence with version queries

**Adapters**:

- `GoogleAIDocumentGeneratorAdapter`: AI document generation
- `PDFExportAdapter`: PDF conversion and export

**Controllers**:

- `IdeaPanelController`: Panel HTTP endpoints
- `DocumentController`: Document operation endpoints

#### API Endpoints

```
GET    /api/v2/idea-panel/[analysisId]
GET    /api/v2/idea-panel/[analysisId]/overview
POST   /api/v2/idea-panel/[analysisId]/documents
PUT    /api/v2/idea-panel/[analysisId]/documents/[documentId]
GET    /api/v2/idea-panel/[analysisId]/documents/[documentId]/export
GET    /api/v2/idea-panel/[analysisId]/documents/[documentId]/versions
POST   /api/v2/idea-panel/[analysisId]/documents/[documentId]/restore
POST   /api/v2/idea-panel/[analysisId]/documents/[documentId]/regenerate
```

#### UI Components

**Layout**:

- `IdeaPanelLayout`: Full-screen layout with sidebar
- `PanelOverview`: Status and statistics display
- `DocumentStatusBadge`: Generation status indicators

**Document Generation**:

- `DocumentGenerationInterface`: Document type selector
- `InsufficientCreditsModal`: Credit error handling

**Document Editing**:

- `DocumentEditor`: Markdown editor with save
- `DocumentExportControl`: Export buttons
- `DocumentVersionHistory`: Version list and restore
- `RegenerateDocumentButton`: Regeneration with confirmation

### Feature Flags

```typescript
ENABLE_IDEA_PANEL: boolean; // Controls panel access
ENABLE_DOCUMENT_GENERATION: boolean; // Controls document generation
```

### Implementation Plan

**24 Tasks organized in 7 phases**:

1. **Foundation** (Tasks 1-4): Database, domain entities, repositories, errors
2. **Infrastructure** (Tasks 5-7): Supabase repos, AI adapter, PDF export
3. **Application Logic** (Tasks 8-10): Use cases for panel, generation, editing
4. **Web Layer** (Tasks 11-13): Controllers, API routes, client wrappers
5. **UI Components** (Tasks 14-17): Layout, generation UI, editor, dashboard integration
6. **Configuration & Testing** (Tasks 18-21): Feature flags, factories, tests
7. **Finalization** (Tasks 22-24): Analytics, documentation, verification

**Estimated Timeline**: 4-6 weeks with 2-3 developers

### Testing Strategy

**Property-Based Testing** (100 iterations each):

- Document version increment correctness
- Project status transition validity
- Document persistence verification
- Credit deduction accuracy
- Export formatting preservation

**Integration Testing**:

- Complete document generation flow
- Credit system integration
- Feature flag protection
- Error handling and rollback

**E2E Testing** (Playwright):

- Full user workflows
- Mobile responsiveness
- Keyboard navigation
- Accessibility compliance

### Success Criteria

- All 54 correctness properties validated
- All 15 user stories implemented
- 100% test coverage for domain layer
- E2E tests passing for all workflows
- Mobile responsive on all viewports
- WCAG 2.1 AA accessibility compliance

---

## 🧪 Testing & Quality Assurance

### Testing Infrastructure

**Unit Testing** (Vitest):

- 70%+ code coverage requirement
- Domain layer: Pure unit tests, no mocks
- Application layer: Mocked dependencies
- Infrastructure layer: Integration tests

**E2E Testing** (Playwright):

- Complete user workflow coverage
- Multi-browser testing (Chromium, Firefox, WebKit)
- Screenshot/video capture on failure
- Accessibility audits

**Mock System**:

- Comprehensive mock API for development
- Zero API costs during testing
- Configurable scenarios (success, error, timeout)
- Latency simulation
- Request logging

### Mock Mode Configuration

```bash
FF_USE_MOCK_API=true              # Enable mock mode
FF_MOCK_SCENARIO=success          # Default scenario
FF_MOCK_VARIABILITY=false         # Random variants
FF_SIMULATE_LATENCY=true          # Network delay
FF_MIN_LATENCY=500                # Min delay (ms)
FF_MAX_LATENCY=2000               # Max delay (ms)
FF_LOG_MOCK_REQUESTS=true         # Request logging
```

### CI/CD Pipeline

**Automated Quality Gates**:

- ESLint code quality checks
- Vitest unit tests with coverage
- Playwright E2E tests
- Lighthouse accessibility audits (90+ score required)

**Workflow Features**:

- Parallel execution (~8-12 minutes total)
- Smart caching for dependencies
- Conditional execution based on changed files
- Unified PR reporting with actionable recommendations
- Automatic artifact upload on failure

**Merge Requirements**:

- All lint checks pass
- All unit tests pass
- All E2E tests pass
- Accessibility score ≥ 90
- Code coverage ≥ 70%

---

## 🔒 Security & Best Practices

### Critical Security Considerations

**Supabase Client Management**:

- Never cache server-side Supabase clients
- Create fresh client per request to prevent session leaks
- Client-side singleton is safe (browser isolation)

**Authentication**:

- Secure session management with HTTP-only cookies
- Per-request authentication checks
- User ownership validation on all operations
- Rate limiting on sensitive endpoints

**Input Validation**:

- Zod schemas for all API inputs
- Sanitization of user-generated content
- SQL injection prevention via parameterized queries
- XSS protection in markdown rendering

**Data Protection**:

- User data isolation in database
- Soft delete for audit trails
- Encrypted sensitive fields
- GDPR compliance ready

---

## 📚 Key Documentation

### Architecture & Development

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)

### Testing

- [Mock System Guide](lib/testing/DEVELOPER_GUIDE.md)
- [E2E Testing Guide](tests/README.md)

### Feature Specs

- [Idea Panel Requirements](.kiro/specs/idea-panel/requirements.md)
- [Idea Panel Design](.kiro/specs/idea-panel/design.md)
- [Idea Panel Tasks](.kiro/specs/idea-panel/tasks.md)

---

**Last Updated**: November 18, 2025
**Version**: MVP + Idea Panel (In Development)
**Status**: Active Development
