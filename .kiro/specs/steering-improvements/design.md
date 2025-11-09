# Design Document

## Overview

This design outlines the approach for updating steering files to accurately reflect current project practices and implementing an automated maintenance system. The solution focuses on four main areas: testing documentation accuracy, critical thinking guidance, comprehensive structure indexing, and automated maintenance through agent hooks.

## Architecture

### Component Overview

```
.kiro/
├── steering/
│   ├── testing-best-practices.md    # Updated with Vitest-only content
│   ├── philosophy.md                # Enhanced with critical thinking section
│   ├── git-best-practices.md        # Disabled (inclusion: never)
│   └── structure.md                 # Expanded with comprehensive file index
└── hooks/
    └── update-structure-index.json  # New hook for automatic updates
```

### Design Principles

1. **Accuracy First**: Steering files must reflect actual project state, not generic best practices
2. **Actionable Guidance**: Every instruction must be directly applicable to this specific project
3. **Automated Maintenance**: Reduce manual overhead through intelligent automation
4. **Architectural Alignment**: All guidance must reinforce hexagonal architecture principles

## Components and Interfaces

### 1. Testing Best Practices Update

**Purpose**: Replace generic multi-framework testing guidance with Vitest-specific instructions

**Structure**:

```markdown
---
title: Testing Best Practices
inclusion: always
---

# Testing Best Practices

## Test Framework: Vitest

## Test Execution Commands

- npm test (runs once with --run flag)
- npm run test:watch (watch mode)
- npm run test:coverage (with coverage reports)

## Test File Patterns

- Location: src/**/\*.test.ts and lib/**/\*.test.ts
- Structure: describe/it/expect pattern
- Mocking: Vitest's vi.mock()

## Test Organization by Layer

- Domain Layer: Pure unit tests, no mocks
- Application Layer: Mock repositories and external services
- Infrastructure Layer: Integration tests with real dependencies

## Performance Optimization

- Parallel execution (Vitest default)
- Focused tests with .only() during development
- Coverage thresholds in vitest.config.ts
```

**Key Changes**:

- Remove all Jest, Pytest, Mocha references
- Add actual npm scripts from package.json
- Include hexagonal architecture testing patterns
- Reference vitest.config.ts configuration

### 2. Philosophy Enhancement

**Purpose**: Add critical thinking guidance to ensure agents challenge suboptimal requests

**New Section**:

```markdown
## Critical Thinking and Reality Check

- **Challenge Suboptimal Requests**: When user requests violate best practices, architectural principles, or introduce unnecessary complexity, agents MUST provide constructive pushback with clear reasoning
- **Best Practices Over Preferences**: Hexagonal architecture standards, SOLID principles, and established patterns take precedence over user preferences unless explicitly justified
- **Propose Alternatives**: When challenging a request, always provide 2-3 alternative approaches that align with project standards
- **Respectful Firmness**: Maintain a collaborative tone while being firm about architectural integrity and code quality
- **Justify Deviations**: If accepting a non-standard approach, require explicit justification and document the decision
- **Prevent Technical Debt**: Proactively identify and prevent decisions that will create maintenance burden or architectural drift
```

**Integration**: This section will be added after "Scope Control & Minimalism" and before "Code Organization & Readability"

### 3. Structure Documentation Expansion

**Purpose**: Create a comprehensive, searchable index of all project files organized by architectural layer

**Enhanced Structure**:

```markdown
# Project Structure

## Quick Reference Index

### Domain Layer (`src/domain/`)

- **Entities**: Core business objects with identity

  - `entities/Analysis.ts` - Analysis aggregate root
  - `entities/User.ts` - User aggregate root
  - `entities/shared/Entity.ts` - Base entity class

- **Value Objects**: Immutable domain concepts

  - `value-objects/AnalysisId.ts` - Strongly-typed analysis identifier
  - `value-objects/UserId.ts` - Strongly-typed user identifier
  - `value-objects/Email.ts` - Email validation and representation
  - `value-objects/Score.ts` - Score validation (0-100)
  - `value-objects/Category.ts` - Analysis categories (general/hackathon)
  - `value-objects/Criteria.ts` - Evaluation criteria
  - `value-objects/Locale.ts` - Supported locales

- **Repository Interfaces**: Data access contracts

  - `repositories/IAnalysisRepository.ts` - Analysis persistence interface
  - `repositories/IUserRepository.ts` - User persistence interface
  - `repositories/IHackathonAnalysisRepository.ts` - Hackathon analysis interface
  - `repositories/IDashboardRepository.ts` - Dashboard data interface

- **Domain Services**: Business logic coordination
  - `services/AnalysisValidationService.ts` - Analysis validation rules
  - `services/ScoreCalculationService.ts` - Score computation logic
  - `services/HackathonAnalysisService.ts` - Hackathon-specific logic

### Application Layer (`src/application/`)

- **Use Cases**: Business operation orchestration

  - `use-cases/AnalyzeIdeaUseCase.ts` - Analyze startup idea
  - `use-cases/SaveAnalysisUseCase.ts` - Persist analysis
  - `use-cases/GetAnalysisUseCase.ts` - Retrieve analysis
  - `use-cases/DeleteAnalysisUseCase.ts` - Remove analysis
  - `use-cases/AnalyzeHackathonProjectUseCase.ts` - Hackathon analysis
  - `use-cases/GetUserAnalysesUseCase.ts` - User's analyses
  - `use-cases/GetDashboardStatsUseCase.ts` - Dashboard statistics
  - `use-cases/user/CreateUserUseCase.ts` - User creation
  - `use-cases/user/GetUserByIdUseCase.ts` - User retrieval
  - `use-cases/user/UpdateUserLastLoginUseCase.ts` - Login tracking

- **Handlers**: Command and query processing

  - `handlers/commands/CreateAnalysisHandler.ts` - Create analysis command
  - `handlers/commands/UpdateAnalysisHandler.ts` - Update analysis command
  - `handlers/commands/DeleteAnalysisHandler.ts` - Delete analysis command
  - `handlers/commands/CreateHackathonAnalysisHandler.ts` - Hackathon creation
  - `handlers/queries/GetAnalysisHandler.ts` - Get analysis query
  - `handlers/queries/ListAnalysesHandler.ts` - List analyses query
  - `handlers/queries/SearchAnalysesHandler.ts` - Search analyses query
  - `handlers/queries/GetHackathonLeaderboardHandler.ts` - Leaderboard query

- **Application Services**: Cross-cutting concerns
  - `services/GoogleAIAnalysisService.ts` - AI analysis orchestration
  - `services/AudioProcessingService.ts` - Audio handling
  - `services/AuthenticationService.ts` - Authentication logic
  - `services/SessionService.ts` - Session management
  - `services/NotificationService.ts` - Notifications

### Infrastructure Layer (`src/infrastructure/`)

- **Database Adapters**:

  - `database/supabase/SupabaseClient.ts` - Database connection
  - `database/supabase/repositories/SupabaseAnalysisRepository.ts` - Analysis repo implementation
  - `database/supabase/repositories/SupabaseUserRepository.ts` - User repo implementation
  - `database/supabase/mappers/AnalysisMapper.ts` - Entity ↔ DAO conversion
  - `database/supabase/mappers/UserMapper.ts` - User mapping
  - `database/supabase/mappers/HackathonAnalysisMapper.ts` - Hackathon mapping

- **External Service Adapters**:

  - `external/ai/GoogleAIAdapter.ts` - Google Gemini integration
  - `external/ai/TextToSpeechAdapter.ts` - TTS integration
  - `external/ai/TranscriptionAdapter.ts` - Audio transcription
  - `external/analytics/PostHogAdapter.ts` - Analytics integration

- **Web Layer (Next.js)**:

  - `web/controllers/AnalysisController.ts` - Analysis HTTP handling
  - `web/controllers/DashboardController.ts` - Dashboard HTTP handling
  - `web/controllers/HackathonController.ts` - Hackathon HTTP handling
  - `web/middleware/AuthMiddleware.ts` - Authentication middleware
  - `web/middleware/ErrorMiddleware.ts` - Error handling
  - `web/middleware/ValidationMiddleware.ts` - Request validation
  - `web/dto/AnalysisDTO.ts` - Analysis data transfer objects
  - `web/dto/UserDTO.ts` - User DTOs
  - `web/dto/HackathonDTO.ts` - Hackathon DTOs

- **Factories**: Dependency injection

  - `factories/RepositoryFactory.ts` - Repository instantiation
  - `factories/ServiceFactory.ts` - Service instantiation
  - `factories/UseCaseFactory.ts` - Use case instantiation

- **Configuration**:
  - `config/environment.ts` - Environment variables
  - `config/database.ts` - Database configuration
  - `config/ai.ts` - AI service configuration
  - `config/features.ts` - Feature flags

### Feature Modules (`features/`)

- **Analyzer**: Startup idea analysis

  - `analyzer/components/AnalyzerView.tsx` - Main analyzer UI
  - `analyzer/components/AnalysisDisplay.tsx` - Results display
  - `analyzer/components/IdeaInputForm.tsx` - Input form
  - `analyzer/api/analyzeIdea.ts` - Client-side API call
  - `analyzer/utils/exportReport.ts` - Report generation

- **Kiroween Analyzer**: Hackathon evaluation

  - `kiroween-analyzer/components/KiroweenAnalyzerView.tsx` - Main UI
  - `kiroween-analyzer/components/HackathonAnalysisDisplay.tsx` - Results
  - `kiroween-analyzer/api/analyzeHackathonProject.ts` - Analysis API
  - `kiroween-analyzer/utils/hackathonScoring.ts` - Scoring logic

- **Auth**: Authentication

  - `auth/components/LoginForm.tsx` - Login UI
  - `auth/context/AuthContext.tsx` - Auth state management

- **Dashboard**: User dashboard
  - `dashboard/components/UserDashboard.tsx` - Dashboard UI
  - `dashboard/api/loadUnifiedAnalysesV2.ts` - Data loading

### Shared Libraries (`lib/`)

- `featureFlags.ts` - Feature flag system
- `logger/Logger.ts` - Structured logging
- `prompts/startupIdea.ts` - AI prompts for startup analysis
- `prompts/hackathonProject.ts` - AI prompts for hackathon analysis
- `supabase/client.ts` - Supabase client setup
- `types.ts` - Global type definitions

### API Routes (`app/api/`)

- `api/analyze/route.ts` - POST /api/analyze
- `api/analyze/[id]/route.ts` - GET /api/analyze/:id
- `api/v2/analyze/route.ts` - POST /api/v2/analyze (new architecture)
- `api/v2/dashboard/route.ts` - GET /api/v2/dashboard
- `api/v2/hackathon/analyze/route.ts` - POST /api/v2/hackathon/analyze

## Finding Files by Purpose

### "Where do I add business validation?"

→ `src/domain/services/` or entity methods in `src/domain/entities/`

### "Where do I add a new API endpoint?"

→ `app/api/` for route, `src/infrastructure/web/controllers/` for logic

### "Where do I add database queries?"

→ Implement in `src/infrastructure/database/supabase/repositories/`

### "Where do I add AI integration?"

→ `src/infrastructure/external/ai/` for adapters, `src/application/services/` for orchestration

### "Where do I add UI components?"

→ `features/[feature-name]/components/` for feature-specific, `app/` for pages

### "Where are the tests?"

→ Co-located with source: `__tests__/` folders or `.test.ts` files

## Architecture Patterns

[Keep existing content about naming conventions, import patterns, etc.]
```

**Key Additions**:

- Complete file index organized by hexagonal layers
- Purpose and responsibility for each major file
- "Finding Files by Purpose" quick reference
- Cross-references between related files
- Clear mapping of architectural concepts to file locations

### 4. Agent Hook for Automatic Updates

**Purpose**: Automatically update structure.md when files are added or modified

**Hook Configuration** (`.kiro/hooks/update-structure-index.json`):

```json
{
  "name": "Update Structure Index",
  "description": "Automatically updates structure.md file index after spec tasks or file changes",
  "trigger": {
    "type": "manual",
    "label": "Update Structure Index"
  },
  "prompt": "Review the current project structure in src/, features/, lib/, and app/ directories. Update the file index in .kiro/steering/structure.md to reflect any new files, moved files, or deleted files. Preserve all existing documentation sections. Add a timestamp comment at the end: <!-- Last updated: [current date] -->. Focus only on updating the Quick Reference Index section with accurate file paths and purposes.",
  "context": [
    ".kiro/steering/structure.md",
    "src/",
    "features/",
    "lib/",
    "app/"
  ]
}
```

**Trigger Strategy**:

- Manual trigger via button in Agent Hooks panel
- Can be invoked after completing spec tasks
- Can be run periodically during development

**Update Logic**:

1. Scan src/, features/, lib/, app/ directories
2. Identify new, moved, or deleted files
3. Update file index while preserving documentation
4. Add timestamp for tracking
5. Maintain organizational structure by layer

## Data Models

### Steering File Frontmatter

```yaml
---
title: [Descriptive Title]
inclusion: always | never | fileMatch
fileMatchPattern: [glob pattern] # only if inclusion: fileMatch
---
```

### File Index Entry

```markdown
- `path/to/file.ts` - Brief description of purpose and responsibility
```

## Error Handling

### Missing Files

- Hook should gracefully handle deleted files
- Remove entries for non-existent files
- Log warnings for unexpected deletions

### Parse Errors

- If structure.md is malformed, create backup before updating
- Preserve as much existing content as possible
- Alert user if manual intervention needed

### Hook Failures

- Log detailed error messages
- Preserve existing structure.md
- Provide manual update instructions

## Testing Strategy

### Manual Verification

1. **Testing Documentation**: Verify all Vitest commands work as documented
2. **Philosophy Section**: Review critical thinking guidance for clarity and completeness
3. **Structure Index**: Spot-check file paths for accuracy
4. **Hook Execution**: Test manual trigger and verify output

### Validation Checks

- All file paths in structure.md must exist
- All npm test commands must match package.json
- Vitest config references must be accurate
- No references to removed frameworks (Jest, Pytest, Mocha)

### Acceptance Testing

- Run through common development scenarios
- Verify agents receive correct guidance
- Confirm hook updates structure.md correctly
- Validate that critical thinking guidance is applied

## Implementation Notes

### Priority Order

1. Update testing-best-practices.md (highest impact, simplest change)
2. Enhance philosophy.md (critical for agent behavior)
3. Expand structure.md (time-consuming but high value)
4. Create agent hook (enables automation)

### Maintenance Considerations

- Structure index should be updated after major refactoring
- Testing practices should be reviewed when test framework changes
- Philosophy should evolve with team learnings
- Hook should be refined based on usage patterns

### Future Enhancements

- Automatic hook trigger on file creation/deletion
- Integration with architecture validation script
- Automated detection of outdated documentation
- Link validation for file references
