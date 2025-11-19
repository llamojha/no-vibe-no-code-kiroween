# Technology Stack

## Framework & Runtime

- **Next.js 14.2+** with App Router
- **React 18.2** with TypeScript
- **Node.js** runtime with ES modules

## Styling & UI

- **Tailwind CSS 3.4+** for styling with custom theme
- **Rajdhani** font family (Google Fonts)
- Custom animations and Halloween-themed colors
- Responsive design with mobile-first approach

## Backend & Database

- **Supabase 2.47+** for authentication and database
- **Google Gemini AI 1.28+** (@google/genai) for AI analysis
- **Three.js 0.181+** for 3D animations and effects

## Key Libraries

### Production Dependencies

- `@supabase/auth-helpers-nextjs` (0.10+) for authentication
- `@supabase/supabase-js` (2.47+) for database operations
- `posthog-js` (1.200+) and `posthog-node` (5.11+) for analytics
- `jspdf` (3.0+) for PDF generation
- `zod` (4.1+) for schema validation
- Custom feature flag system

### Development Dependencies

- `@faker-js/faker` (10.1+) for test data generation
- `@playwright/test` (1.56+) for end-to-end testing
- `@testing-library/react` (16.3+) for component testing
- `@vitest/coverage-v8` (2.1+) for test coverage

## Testing Framework

### Vitest (2.1+)

- **Unit Testing**: Fast, modern test runner with native ESM support
- **Property-Based Testing**: Uses `@faker-js/faker` for random test data generation
- **Coverage**: V8 provider with text, JSON, and HTML reporters
- **Configuration**: Globals enabled, jsdom environment for React components

### Playwright (1.56+)

- **End-to-End Testing**: Browser automation for integration tests
- **Coverage**: Optional E2E coverage collection
- **Browsers**: Chromium, Firefox, and WebKit support

### Property Testing Approach

- **Test Data Generators**: Random valid data generation using faker.js
- **Property Helpers**: Utilities for common property test assertions
- **Coverage Tracking**: Automated tracking of tested properties
- **CI/CD Integration**: Property tests run on every pull request

## Development Tools

- **TypeScript 5.8+** with strict mode enabled
- **ESLint 8.57+** with Next.js configuration
- **PostCSS 8.4+** with Autoprefixer
- Path aliases configured (`@/*` maps to root, `@/domain`, `@/application`, `@/infrastructure`, `@/shared`)

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test             # Run unit tests once
npm run test:watch   # Run unit tests in watch mode
npm run test:coverage # Run tests with coverage report

# Property Testing
npm run test:properties          # Run property tests once
npm run test:properties:watch    # Run property tests in watch mode
npm run test:properties:coverage # Run property tests with coverage

# End-to-End Testing
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode
npm run test:e2e:debug   # Debug E2E tests

# Setup
npm install          # Install dependencies
npm run playwright:install # Install Playwright browsers
```

## Environment Configuration

- Use `.env.local` for local environment variables
- `GEMINI_API_KEY` required for AI functionality
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` for analytics
- Feature flags: `FF_<FLAG_NAME>` (server) or `NEXT_PUBLIC_FF_<FLAG_NAME>` (client)

## Build Configuration

- Server actions enabled with 2MB body size limit
- Experimental features configured in `next.config.js`
- TypeScript with ES2022 target and bundler module resolution
- Architecture validation runs before build (`prebuild` script)

## Architecture

This project follows **Hexagonal Architecture** (Ports and Adapters pattern):

- **Domain Layer** (`src/domain/`): Pure business logic with no external dependencies
- **Application Layer** (`src/application/`): Use cases and application services
- **Infrastructure Layer** (`src/infrastructure/`): External adapters and implementations
- **Features** (`features/`): UI components and client-side logic

See `hexagonal-architecture-standards.md` for detailed architectural guidelines.

<!-- Last updated: November 19, 2025 -->
