<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://novibenocode.com/icons/icon-512x512.png" />
</div>

# No Vibe No Code

AI-powered product management platform that transforms raw startup ideas into execution-ready documentation and GitHub backlogs.

## Core Features

- **Idea Analysis**: AI-powered startup idea evaluation with detailed scoring and feedback
- **Hackathon Analyzer**: Specialized evaluation for hackathon projects (Kiroween theme)
- **Doctor Frankenstein**: AI-powered mashup idea generator combining tech company or AWS service technologies
- **Idea Panel**: Dedicated workspace for managing ideas with status tracking, notes, tags, and multiple analyses
- **Document Generation**: AI-generated PRDs, Technical Designs, Architecture Documents, and Roadmaps
- **Multi-language Support**: Full English and Spanish localization
- **Credit System**: Usage-based credit system with tier-based limits

## Quick Start

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Set environment variables in .env.local
# Required: GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run development server
npm run dev
```

## Architecture

The application follows **hexagonal architecture** (Ports and Adapters pattern):

- **Domain Layer** (`src/domain/`): Pure business logic with strongly-typed entities and value objects
- **Application Layer** (`src/application/`): Use cases and application services
- **Infrastructure Layer** (`src/infrastructure/`): External adapters (database, AI services, web)
- **Features** (`features/`): UI components and client-side logic

## Documentation

### Architecture & Development

- **[Architecture Overview](docs/ARCHITECTURE.md)**: Comprehensive architecture documentation
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Step-by-step guide for adding new features
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Database Schema](docs/DATABASE_SCHEMA.md)**: Current database schema and query patterns
- **[Hexagonal Architecture Standards](.kiro/steering/hexagonal-architecture-standards.md)**: Architecture standards and guidelines

### Feature Documentation

- **[Document Generation Guide](docs/DOCUMENT_GENERATION_GUIDE.md)**: Complete guide for AI-generated documentation
- **[Idea Panel User Guide](docs/IDEA_PANEL_USER_GUIDE.md)**: User guide for the Idea Panel feature
- **[Mock System Documentation](docs/SISTEMA_MOCKS_DOCUMENTACION.md)**: Mock system for development without API costs

## Document Generation

Generate professional project documentation from your analyzed ideas:

| Document Type    | Credit Cost | Purpose                                  |
| ---------------- | ----------- | ---------------------------------------- |
| PRD              | 50          | Product requirements and user stories    |
| Technical Design | 75          | Architecture and implementation planning |
| Architecture     | 75          | System architecture and infrastructure   |
| Roadmap          | 50          | Milestones and feature prioritization    |

**Recommended Workflow**: Analysis → PRD → Technical Design → Architecture → Roadmap

## Testing

```bash
# Unit tests
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Property tests
npm run test:properties     # Run property tests
npm run test:properties:coverage  # With coverage

# E2E tests
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Headed browser mode
```

### Mock Mode

Enable mock mode for development without consuming API credits:

```bash
# .env.local
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=true
```

## Feature Flags

Control features via environment variables:

| Flag                                      | Description                   | Default |
| ----------------------------------------- | ----------------------------- | ------- |
| `NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER`  | Classic analyzer visibility   | `true`  |
| `NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER` | Hackathon analyzer visibility | `true`  |
| `FF_USE_MOCK_API`                         | Enable mock mode              | `false` |
| `ENABLE_DOCUMENT_GENERATION`              | Document generation feature   | `true`  |

## CI/CD Pipeline

Automated quality checks on every pull request:

- **ESLint**: Code quality and linting
- **Unit Tests**: Vitest with coverage reporting
- **E2E Tests**: Playwright browser automation
- **Lighthouse**: Accessibility audits (90% minimum score)
- **Property Tests**: Property-based testing validation

## Security

⚠️ **Critical**: Never cache Supabase server clients in static variables. Each HTTP request requires a fresh client to prevent session leaks.

```typescript
// ✅ Correct: Fresh client per request
const supabase = SupabaseAdapter.getServerClient();

// ❌ Wrong: Cached client causes session leaks
const cachedClient = createClient(); // Don't do this
```

## Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host

# Optional - Mock Mode
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
```

## Project Structure

```
src/
├── domain/           # Business logic (entities, value objects, services)
├── application/      # Use cases and handlers
├── infrastructure/   # Database, AI, web adapters
└── shared/           # Common utilities

features/
├── analyzer/         # Startup idea analysis
├── kiroween-analyzer/# Hackathon analysis
├── doctor-frankenstein/ # Idea mashup generator
├── idea-panel/       # Idea management workspace
├── document-generator/ # AI document generation
├── dashboard/        # User dashboard
└── auth/             # Authentication

app/
├── api/v2/           # API endpoints
├── generate/         # Document generation pages
├── idea/             # Idea Panel pages
└── ...               # Other pages
```

## Contributing

1. Follow hexagonal architecture standards
2. Write tests for new functionality
3. Run `npm run lint` and `npm test` before committing
4. Use conventional commit messages

## License

Private - All rights reserved

---

_Last updated: December 1, 2025_
