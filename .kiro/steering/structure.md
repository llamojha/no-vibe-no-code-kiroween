# Project Structure

## Architecture Pattern

This project follows hexagonal architecture (Ports and Adapters pattern) with clear separation between domain, application, and infrastructure layers. The codebase is organized to enforce dependency rules: domain has no dependencies, application depends only on domain, and infrastructure depends on both.

## Quick Reference Index

### Domain Layer (`src/domain/`)

The domain layer contains pure business logic with no external dependencies.

#### Entities

Core business objects with identity and lifecycle:

- `entities/Analysis.ts` - Analysis aggregate root with business rules and invariants
- `entities/User.ts` - User aggregate root
- `entities/CreditTransaction.ts` - Credit transaction entity with immutability guarantees
- `entities/Idea.ts` - Idea aggregate root (Idea Panel feature)
- `entities/Document.ts` - Document entity for analyses (Idea Panel feature)
- `entities/shared/Entity.ts` - Base entity class with ID encapsulation

#### Value Objects

Immutable domain concepts with validation:

- `value-objects/AnalysisId.ts` - Strongly-typed analysis identifier
- `value-objects/UserId.ts` - Strongly-typed user identifier
- `value-objects/CreditTransactionId.ts` - Strongly-typed credit transaction identifier
- `value-objects/IdeaId.ts` - Strongly-typed idea identifier (Idea Panel)
- `value-objects/DocumentId.ts` - Strongly-typed document identifier (Idea Panel)
- `value-objects/Email.ts` - Email validation and representation
- `value-objects/Score.ts` - Score validation (0-100 range)
- `value-objects/Category.ts` - Analysis categories (general/hackathon types)
- `value-objects/AnalysisType.ts` - Analysis type discriminator (startup/hackathon)
- `value-objects/IdeaSource.ts` - Idea source (manual/frankenstein) (Idea Panel)
- `value-objects/DocumentType.ts` - Document type (startup_analysis/hackathon_analysis) (Idea Panel)
- `value-objects/ProjectStatus.ts` - Project status (idea/in_progress/completed/archived) (Idea Panel)
- `value-objects/TransactionType.ts` - Credit transaction types (deduct/add/refund/admin_adjustment)
- `value-objects/Criteria.ts` - Evaluation criteria value object
- `value-objects/Locale.ts` - Supported locale value object (en/es)

#### Repository Interfaces

Data access contracts (ports):

- `repositories/IAnalysisRepository.ts` - Analysis persistence interface
- `repositories/IUserRepository.ts` - User persistence interface
- `repositories/ICreditTransactionRepository.ts` - Credit transaction persistence interface
- `repositories/IHackathonAnalysisRepository.ts` - Hackathon analysis persistence
- `repositories/IDashboardRepository.ts` - Dashboard data aggregation interface
- `repositories/IIdeaRepository.ts` - Idea persistence interface (Idea Panel)
- `repositories/IDocumentRepository.ts` - Document persistence interface (Idea Panel)
- `repositories/base/` - Base repository interfaces and types

#### Domain Services

Business logic coordination:

- `services/AnalysisValidationService.ts` - Analysis validation rules and quality metrics
- `services/ScoreCalculationService.ts` - Score computation logic
- `services/HackathonAnalysisService.ts` - Hackathon-specific business rules
- `services/CreditPolicy.ts` - Credit system policies and business rules

### Application Layer (`src/application/`)

The application layer orchestrates business operations and coordinates domain logic.

#### Use Cases

Business operation orchestration:

- `use-cases/AnalyzeIdeaUseCase.ts` - Analyze startup idea with AI
- `use-cases/SaveAnalysisUseCase.ts` - Persist analysis to database
- `use-cases/GetAnalysisUseCase.ts` - Retrieve single analysis
- `use-cases/DeleteAnalysisUseCase.ts` - Remove analysis
- `use-cases/AnalyzeHackathonProjectUseCase.ts` - Analyze hackathon project
- `use-cases/SaveHackathonAnalysisUseCase.ts` - Persist hackathon analysis
- `use-cases/GetUserAnalysesUseCase.ts` - Retrieve user's analyses
- `use-cases/GetDashboardStatsUseCase.ts` - Calculate dashboard statistics
- `use-cases/GetHackathonLeaderboardUseCase.ts` - Generate hackathon leaderboard
- `use-cases/CheckCreditsUseCase.ts` - Check user credit balance
- `use-cases/DeductCreditUseCase.ts` - Deduct credits for operations
- `use-cases/AddCreditsUseCase.ts` - Add credits to user account
- `use-cases/GetCreditBalanceUseCase.ts` - Retrieve current credit balance
- `use-cases/GetIdeaWithDocumentsUseCase.ts` - Retrieve idea with all documents (Idea Panel)
- `use-cases/UpdateIdeaStatusUseCase.ts` - Update idea status (Idea Panel)
- `use-cases/SaveIdeaMetadataUseCase.ts` - Save idea notes and tags (Idea Panel)
- `use-cases/GetUserIdeasUseCase.ts` - Retrieve all ideas for user (Idea Panel)
- `use-cases/GetDocumentsByIdeaUseCase.ts` - Retrieve documents for idea (Idea Panel)
- `use-cases/user/CreateUserUseCase.ts` - User creation
- `use-cases/user/GetUserByIdUseCase.ts` - User retrieval
- `use-cases/user/UpdateUserLastLoginUseCase.ts` - Login tracking

#### Handlers

Command and query processing:

- `handlers/commands/` - Write operations (create, update, delete)
- `handlers/queries/` - Read operations (get, list, search)

#### Application Services

Cross-cutting application concerns:

- `services/GoogleAIAnalysisService.ts` - AI analysis orchestration
- `services/AudioProcessingService.ts` - Audio transcription and processing
- `services/AuthenticationService.ts` - Authentication logic
- `services/SessionService.ts` - Session management
- `services/NotificationService.ts` - Notification handling
- `services/IAIAnalysisService.ts` - AI service interface (port)
- `services/IAudioProcessingService.ts` - Audio service interface (port)
- `services/INotificationService.ts` - Notification service interface (port)

#### Types

Application-level types:

- `types/commands.ts` - Command type definitions
- `types/queries.ts` - Query type definitions
- `types/base/` - Base command/query types
- `types/commands/` - Specific command type definitions
- `types/queries/` - Specific query type definitions

#### Utilities

Application-level utilities:

- `utils/getUserTier.ts` - User tier determination logic
- `utils/localDevCredits.ts` - Local development credit utilities

### Infrastructure Layer (`src/infrastructure/`)

The infrastructure layer provides concrete implementations of interfaces and external integrations.

#### Database Adapters

- `database/supabase/SupabaseClient.ts` - Database connection management
- `database/supabase/repositories/SupabaseAnalysisRepository.ts` - Analysis repository implementation
- `database/supabase/repositories/SupabaseUserRepository.ts` - User repository implementation
- `database/supabase/repositories/SupabaseCreditTransactionRepository.ts` - Credit transaction repository
- `database/supabase/repositories/SupabaseIdeaRepository.ts` - Idea repository implementation (Idea Panel)
- `database/supabase/repositories/SupabaseDocumentRepository.ts` - Document repository implementation (Idea Panel)
- `database/supabase/mappers/IdeaMapper.ts` - Idea entity/DAO/DTO mapper (Idea Panel)
- `database/supabase/mappers/DocumentMapper.ts` - Document entity/DAO/DTO mapper (Idea Panel)
- `database/types/` - Database-specific types (DAOs)
- `database/errors/` - Database error handling

#### External Service Adapters

- `external/ai/GoogleAIAdapter.ts` - Google Gemini AI integration
- `external/ai/TextToSpeechAdapter.ts` - Text-to-speech service
- `external/ai/TranscriptionAdapter.ts` - Audio transcription service
- `external/analytics/PostHogAdapter.ts` - Analytics integration

#### Web Layer (Next.js Integration)

- `web/controllers/AnalysisController.ts` - Analysis HTTP request handling
- `web/controllers/DashboardController.ts` - Dashboard HTTP handling
- `web/controllers/HackathonController.ts` - Hackathon HTTP handling
- `web/controllers/IdeaPanelController.ts` - Idea Panel HTTP request handling (Idea Panel)
- `web/middleware/AuthMiddleware.ts` - Authentication middleware
- `web/middleware/ErrorMiddleware.ts` - Error handling middleware
- `web/middleware/ValidationMiddleware.ts` - Request validation
- `web/dto/AnalysisDTO.ts` - Analysis data transfer objects
- `web/dto/UserDTO.ts` - User DTOs
- `web/dto/HackathonDTO.ts` - Hackathon DTOs
- `web/dto/IdeaDTO.ts` - Idea data transfer objects (Idea Panel)
- `web/dto/DocumentDTO.ts` - Document data transfer objects (Idea Panel)
- `web/routes/` - Route definitions and mappings
- `web/context/` - React context providers
- `web/helpers/` - Web-specific utilities

#### Factories

Dependency injection and service instantiation:

- `factories/RepositoryFactory.ts` - Repository instantiation with proper dependencies
- `factories/ServiceFactory.ts` - Service instantiation and configuration
- `factories/UseCaseFactory.ts` - Use case instantiation with injected dependencies

#### Configuration

Environment and feature configuration:

- `config/environment.ts` - Environment variable management
- `config/database.ts` - Database configuration
- `config/ai.ts` - AI service configuration
- `config/features.ts` - Feature flag configuration
- `config/credits.ts` - Credit system configuration

#### Integration Adapters

- `integration/SupabaseAdapter.ts` - Supabase integration utilities
- `integration/FeatureFlagAdapter.ts` - Feature flag adapter
- `integration/LocaleAdapter.ts` - Localization adapter

#### Bootstrap

Application initialization:

- `bootstrap/nextjs.ts` - Next.js-specific bootstrap
- `bootstrap/validation.ts` - Validation setup
- `bootstrap/index.ts` - Main bootstrap orchestration

#### Cache

Caching infrastructure:

- `cache/ICache.ts` - Cache interface (port)
- `cache/InMemoryCache.ts` - In-memory cache implementation

### Feature Modules (`features/`)

Feature-specific UI components and client-side logic.

#### Analyzer

Startup idea analysis feature:

- `analyzer/components/AnalyzerView.tsx` - Main analyzer UI
- `analyzer/components/AnalysisDisplay.tsx` - Results display component
- `analyzer/components/IdeaInputForm.tsx` - Input form component
- `analyzer/api/analyzeIdea.ts` - Client-side API call wrapper
- `analyzer/utils/exportReport.ts` - Report generation utilities

#### Kiroween Analyzer

Hackathon project evaluation:

- `kiroween-analyzer/components/KiroweenAnalyzerView.tsx` - Main hackathon UI
- `kiroween-analyzer/components/HackathonAnalysisDisplay.tsx` - Results display
- `kiroween-analyzer/api/analyzeHackathonProject.ts` - Hackathon analysis API
- `kiroween-analyzer/utils/hackathonScoring.ts` - Scoring utilities

#### Auth

Authentication and user management:

- `auth/components/LoginForm.tsx` - Login UI component
- `auth/components/SignupForm.tsx` - Signup UI component
- `auth/context/AuthContext.tsx` - Authentication state management

#### Dashboard

User dashboard:

- `dashboard/components/UserDashboard.tsx` - Dashboard UI
- `dashboard/components/IdeaCard.tsx` - Idea card component (displays ideas instead of analyses)
- `dashboard/components/AnalysisList.tsx` - Analysis list component
- `dashboard/api/loadUnifiedAnalysesV2.ts` - Dashboard data loading

#### Idea Panel

Dedicated workspace for managing ideas with status tracking, notes, tags, and multiple analyses:

- `idea-panel/components/IdeaPanelView.tsx` - Main container component
- `idea-panel/components/IdeaPanelLayout.tsx` - Full-screen layout with breadcrumb navigation
- `idea-panel/components/IdeaDetailsSection.tsx` - Displays idea text, source, and creation date
- `idea-panel/components/DocumentsListSection.tsx` - Lists all analyses with expandable details
- `idea-panel/components/ProjectStatusControl.tsx` - Status dropdown with last updated timestamp
- `idea-panel/components/NotesSection.tsx` - Textarea for adding and editing notes
- `idea-panel/components/TagsSection.tsx` - Tag management with add/remove functionality
- `idea-panel/components/AnalyzeButton.tsx` - Dropdown button for creating new analyses
- `idea-panel/api/getIdeaWithDocuments.ts` - Fetch idea with all documents
- `idea-panel/api/getUserIdeas.ts` - Fetch all ideas for user
- `idea-panel/api/updateStatus.ts` - Update idea status
- `idea-panel/api/saveMetadata.ts` - Save notes and tags
- `idea-panel/api/getDocumentsByIdea.ts` - Fetch documents for idea
- `idea-panel/analytics/tracking.ts` - Analytics tracking for panel events

#### Document Generator

AI-powered document generation for PRDs, Technical Designs, Architecture Documents, and Roadmaps:

- `document-generator/components/` - Document generation UI components
- `document-generator/analytics/` - Analytics tracking for document generation events

#### Locale

Internationalization:

- `locale/components/LanguageSwitcher.tsx` - Language selection UI
- `locale/context/LocaleContext.tsx` - Locale state management
- `locale/translations.ts` - Translation utilities

#### Analytics

Analytics integration:

- `analytics/posthogClient.ts` - PostHog analytics client

#### Home

Landing page:

- `home/components/` - Home page components
- `home/hooks/` - Home page hooks

### Shared Libraries (`lib/`)

Cross-cutting utilities and shared code.

#### Feature Flags

- `featureFlags.ts` - Feature flag system implementation
- `featureFlags.config.ts` - Feature flag configuration
- `featureFlags.types.ts` - Feature flag types
- `featureFlags.validation.ts` - Feature flag validation

#### Logging

- `logger/Logger.ts` - Structured logging implementation
- `logger/types.ts` - Logger types
- `logger/index.ts` - Logger exports

#### AI Prompts

- `prompts/startupIdea.ts` - AI prompts for startup analysis
- `prompts/hackathonProject.ts` - AI prompts for hackathon evaluation
- `prompts/constants.ts` - Prompt constants

#### Supabase Client

- `supabase/client.ts` - Supabase client setup (client-side)
- `supabase/server.ts` - Supabase server client
- `supabase/types.ts` - Supabase type definitions
- `supabase/mappers.ts` - Legacy mappers (being migrated)

#### Utilities

- `auth/access.ts` - Access control utilities
- `types.ts` - Global type definitions
- `date.ts` - Date utilities
- `localStorage.ts` - Local storage utilities
- `mockData.ts` - Mock data for development

### API Routes (`app/api/`)

Next.js API routes (HTTP endpoints).

#### Analysis Endpoints

- `api/analyze/route.ts` - POST /api/analyze (legacy)
- `api/analyze/[id]/route.ts` - GET /api/analyze/:id
- `api/analyze/save/route.ts` - POST /api/analyze/save
- `api/analyze/search/route.ts` - GET /api/analyze/search
- `api/v2/analyze/route.ts` - POST /api/v2/analyze (new architecture)

#### Hackathon Endpoints

- `api/analyze-hackathon/route.ts` - POST /api/analyze-hackathon (legacy)
- `api/v2/hackathon/analyze/route.ts` - POST /api/v2/hackathon/analyze (new architecture)

#### Dashboard Endpoints

- `api/v2/dashboard/route.ts` - GET /api/v2/dashboard

#### Idea Panel Endpoints

- `api/v2/ideas/route.ts` - GET /api/v2/ideas (list all ideas for user)
- `api/v2/ideas/[ideaId]/route.ts` - GET /api/v2/ideas/[ideaId] (get idea with documents)
- `api/v2/ideas/[ideaId]/status/route.ts` - PUT /api/v2/ideas/[ideaId]/status (update status)
- `api/v2/ideas/[ideaId]/metadata/route.ts` - PUT /api/v2/ideas/[ideaId]/metadata (save notes/tags)
- `api/v2/ideas/[ideaId]/documents/route.ts` - GET /api/v2/ideas/[ideaId]/documents (list documents)

#### Document Generation Endpoints

- `api/v2/documents/generate/route.ts` - POST /api/v2/documents/generate (generate document)
- `api/v2/documents/[documentId]/route.ts` - GET/PUT /api/v2/documents/[documentId] (get/update document)

#### Credit Endpoints

- `api/v2/credits/balance/route.ts` - GET /api/v2/credits/balance (get user credit balance)

#### Utility Endpoints

- `api/health/route.ts` - GET /api/health (health check)
- `api/transcribe/route.ts` - POST /api/transcribe (audio transcription)
- `api/tts/route.ts` - POST /api/tts (text-to-speech)

#### Development Endpoints

- `api/dev/test-new-logger/route.ts` - Logger testing endpoint

### Page Routes (`app/`)

Next.js page routes (UI pages).

#### Main Pages

- `app/page.tsx` - Home page
- `app/analyzer/page.tsx` - Startup idea analyzer
- `app/kiroween-analyzer/page.tsx` - Hackathon project analyzer
- `app/doctor-frankenstein/page.tsx` - Doctor Frankenstein idea generator
- `app/dashboard/page.tsx` - User dashboard
- `app/login/page.tsx` - Login page

#### Idea Panel Pages

- `app/idea/[ideaId]/page.tsx` - Idea Panel page (dedicated workspace for managing ideas)

#### Document Generation Pages

- `app/generate/prd/[ideaId]/page.tsx` - PRD generation page
- `app/generate/technical-design/[ideaId]/page.tsx` - Technical Design generation page
- `app/generate/architecture/[ideaId]/page.tsx` - Architecture Document generation page
- `app/generate/roadmap/[ideaId]/page.tsx` - Roadmap generation page

### Shared Types (`src/shared/`)

Shared utilities and types used across layers.

- `shared/types/common.ts` - Common type definitions
- `shared/types/errors.ts` - Error types and classes
- `shared/utils/validation.ts` - Validation utilities

### Property Testing (`tests/properties/`)

Property-based testing framework for validating correctness properties across all architectural layers.

#### Test Organization

Property tests are organized by architectural concern:

- `properties/domain/` - Domain layer property tests

  - `entity-identity.properties.test.ts` - Entity ID immutability, uniqueness, and format validation
  - `value-objects.properties.test.ts` - Value object immutability and validation
  - `analysis.properties.test.ts` - Analysis entity business rules and invariants
  - `credits.properties.test.ts` - Credit system invariants and transaction rules

- `properties/data-integrity/` - Data persistence and mapping property tests

  - `mappers.properties.test.ts` - Entity ↔ DAO round-trip fidelity and null preservation
  - `migration.properties.test.ts` - Database migration integrity and data preservation

- `properties/business-rules/` - Business logic property tests

  - `scoring.properties.test.ts` - Score calculation determinism and aggregation
  - `rate-limiting.properties.test.ts` - Credit cost consistency and deduction rules
  - `categories.properties.test.ts` - Category evaluation and matching logic

- `properties/security/` - Security and authorization property tests

  - `auth.properties.test.ts` - Authentication, authorization, and RLS policy enforcement

- `properties/system/` - System-wide property tests
  - `idempotency.properties.test.ts` - Repository and query idempotency
  - `caching.properties.test.ts` - Cache expiration, invalidation, and consistency
  - `error-handling.properties.test.ts` - Error propagation and graceful degradation
  - `ci-cd.properties.test.ts` - Build determinism and test isolation

#### Test Utilities

Shared utilities for property-based testing:

- `properties/utils/generators.ts` - Test data generators using faker.js

  - Entity generators (Analysis, User, CreditTransaction)
  - Value object generators (AnalysisId, UserId, Score, Email)
  - Bulk generation utilities

- `properties/utils/property-helpers.ts` - Property test assertion helpers

  - `forAll()` - Assert property holds for all generated values
  - `forCases()` - Assert property holds for specific test cases
  - `deepEqual()` - Deep value comparison
  - `entityEquals()` - Entity equality by ID
  - `measureTime()` - Performance measurement utilities

- `properties/utils/coverage-tracker.ts` - Property coverage tracking
  - Track which properties have test implementations
  - Generate coverage reports by category
  - Identify untested properties

#### Test File Patterns

- **Naming**: Use `.properties.test.ts` suffix for property test files
- **Structure**: Organize by architectural layer and concern
- **Documentation**: Each test references the property ID from general-properties.md
- **Iterations**: Run 100+ iterations per property test for thorough validation

## Finding Files by Purpose

### "Where do I add business validation?"

→ `src/domain/services/` for domain services or add methods to entities in `src/domain/entities/`

### "Where do I add a new API endpoint?"

→ `app/api/` for the Next.js route, `src/infrastructure/web/controllers/` for the controller logic

### "Where do I add database queries?"

→ Implement repository interface in `src/infrastructure/database/supabase/repositories/`

### "Where do I add AI integration?"

→ `src/infrastructure/external/ai/` for adapters, `src/application/services/` for orchestration

### "Where do I add UI components?"

→ `features/[feature-name]/components/` for feature-specific, `app/` for pages and layouts

### "Where are the tests?"

→ Co-located with source in `__tests__/` folders or `.test.ts` files

### "Where do I add property tests?"

→ `tests/properties/` organized by concern:

- `tests/properties/domain/` for domain layer properties (entities, value objects)
- `tests/properties/data-integrity/` for mapper and migration properties
- `tests/properties/business-rules/` for business logic properties
- `tests/properties/security/` for authentication and authorization properties
- `tests/properties/system/` for system-wide properties (caching, idempotency, CI/CD)
- Use `tests/properties/utils/generators.ts` for test data generation
- Use `tests/properties/utils/property-helpers.ts` for assertion utilities

### "Where do I add a new use case?"

→ `src/application/use-cases/` with proper dependency injection

### "Where do I add a new entity or value object?"

→ `src/domain/entities/` for entities, `src/domain/value-objects/` for value objects

### "Where do I configure environment variables?"

→ `src/infrastructure/config/environment.ts` for reading, `.env.local` for values

### "Where do I add feature flags?"

→ `lib/featureFlags.config.ts` for configuration, use via `lib/featureFlags.ts`

### "Where do I add credit system logic?"

→ `src/domain/services/CreditPolicy.ts` for business rules, `src/application/use-cases/` for credit operations

### "Where do I add document generation logic?"

→ `features/document-generator/` for UI components, `app/generate/` for pages, `app/api/v2/documents/` for API endpoints

## Hexagonal Architecture Layers

### Dependency Rules

- **Domain Layer**: No dependencies on other layers (pure business logic)
- **Application Layer**: Depends only on Domain layer
- **Infrastructure Layer**: Depends on both Domain and Application layers
- **Features/UI**: Depends on Application and Infrastructure layers

### Layer Responsibilities

- **Domain**: Business entities, value objects, business rules, repository interfaces
- **Application**: Use cases, application services, command/query handlers
- **Infrastructure**: Database implementations, external APIs, web controllers, configuration
- **Features**: UI components, client-side API calls, feature-specific utilities

## Naming Conventions

- **Files**: kebab-case for directories, PascalCase for React components
- **Components**: PascalCase with descriptive names
- **API Routes**: RESTful naming in `route.ts` files
- **Types**: PascalCase interfaces, camelCase for properties
- **Constants**: UPPER_SNAKE_CASE

## Import Patterns

- Use `@/` path alias for imports from project root
- Group imports: external libraries, then internal modules
- Prefer named exports over default exports for utilities

## Component Organization

- Keep components small and focused on single responsibility
- Use composition over inheritance
- Implement proper TypeScript interfaces for props
- Include error boundaries and loading states

## API Structure

- Server-side API routes in `/app/api/`
- Client-side API functions in `/features/[feature]/api/`
- Consistent error handling and response formats
- Authentication middleware for protected routes

<!-- Last updated: December 1, 2025 -->
