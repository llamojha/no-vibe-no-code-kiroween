<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# No Vibe No Code

AI-powered product management platform that transforms raw startup ideas into execution-ready documentation and GitHub backlogs.

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1oC2K72G4jrgFUQiuL_s0gfVa-07buTm7

## Architecture

The application follows **hexagonal architecture** (Ports and Adapters pattern) with clear separation between:

- **Domain Layer** (`src/domain/`): Pure business logic with strongly-typed entities and value objects
- **Application Layer** (`src/application/`): Use cases and application services
- **Infrastructure Layer** (`src/infrastructure/`): External adapters (database, AI services, web)
- **Shared Layer** (`src/shared/`): Common utilities and types

### Documentation

**Architecture & Development:**
- **[Architecture Overview](docs/ARCHITECTURE.md)**: Comprehensive architecture documentation
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Step-by-step guide for adding new features
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Domain Layer](src/domain/README.md)**: Domain layer documentation
- **[Application Layer](src/application/README.md)**: Application layer documentation
- **[Infrastructure Layer](src/infrastructure/README.md)**: Infrastructure layer documentation
- **[Hexagonal Architecture Standards](.kiro/steering/hexagonal-architecture-standards.md)**: Architecture standards and guidelines

**Testing & Mocks:**
- **[Sistema de Mocks](docs/SISTEMA_MOCKS_DOCUMENTACION.md)**: 🧪 Documentación completa del sistema de mocks para desarrollo sin costos de API
- **[Guía de Ejecución de Tests](docs/GUIA_EJECUCION_TESTS.md)**: 📝 Paso a paso para ejecutar tests de integración y E2E
- **[Mock Mode Guide](tests/MOCK_MODE_GUIDE.md)**: Technical guide for mock mode
- **[Testing README](tests/README.md)**: General testing documentation

## Security

### Critical: Supabase Client Management

⚠️ **NEVER cache Supabase server clients in a static variable or singleton pattern.**

In Next.js server-side operations, each HTTP request has its own cookie store containing user-specific session tokens. Caching the Supabase client globally causes:

- **Session Leaks**: User B can access User A's data and permissions
- **Stale Tokens**: Refresh tokens don't update when cookies change
- **Auth Bypass**: Unauthenticated users can inherit authenticated sessions

**Correct Usage:**
```typescript
// ✅ Server-side: Always create fresh client
const supabase = SupabaseAdapter.getServerClient(); // New client per request

// ✅ Client-side: Singleton is safe
const supabase = SupabaseAdapter.getClientClient(); // Browser context is isolated
```

See [Architecture Documentation](docs/ARCHITECTURE.md#critical-security-supabase-client-management) for detailed explanation and examples.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Feature Flags

- Define flags centrally and control them via environment variables.
- Server-only flags: use `FF_<FLAG_NAME>`.
- Client-exposed flags: use `NEXT_PUBLIC_FF_<FLAG_NAME>`.

### Enhanced Feature Flags

The application includes several enhanced feature flags for controlling UI elements and development workflows:

#### Button Visibility Flags (Client-Exposed)

- **`ENABLE_CLASSIC_ANALYZER`**: Controls visibility of the classic startup idea analyzer button on the home page

  - Environment variable: `NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER`
  - Default: `true`

- **`ENABLE_KIROWEEN_ANALYZER`**: Controls visibility of the Kiroween hackathon analyzer button on the home page
  - Environment variable: `NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER`
  - Default: `true`

#### Local Development Mode

- **`LOCAL_DEV_MODE`**: Exposes whether local development mode is active to code via the flag system.
  - It now derives from `NODE_ENV === 'development'` and does not require a separate env var.
  - Keep `NODE_ENV=development` locally; set to `production` in deployments.

### Usage

1. Define flags in `lib/featureFlags.config.ts`:

```typescript
registerFlags({
  ENABLE_CLASSIC_ANALYZER: defineBooleanFlag({
    key: "ENABLE_CLASSIC_ANALYZER",
    description: "Show the classic startup idea analyzer button on home page",
    default: true,
    exposeToClient: true,
  }),
});
```

2. Read flags from code:

```typescript
import { isEnabled, getValue } from "@/lib/featureFlags";

if (isEnabled("ENABLE_CLASSIC_ANALYZER")) {
  // Show classic analyzer button
} else {
  // Hide classic analyzer button
}

// Non-boolean values (if defined):
const maxItems = getValue<number>("MAX_ITEMS");
```

3. Set env vars locally in `.env.local`:

- `NODE_ENV=development`
- `NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER=true` (exposed to client)
- `NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER=true` (exposed to client)

### Local Development Mode

When `NODE_ENV=development` (i.e., `LOCAL_DEV_MODE` resolves to enabled):

- Authentication is bypassed with a mock user
- Analysis data is stored in browser local storage instead of Supabase
- Pre-populated mock analysis cards are available for testing
- Ideal for rapid development and testing without database dependencies

### Notes

- Client-exposed flags are read from `NEXT_PUBLIC_FF_<FLAG>` and become part of the client bundle at build time.
- Defaults apply when env vars are absent.
- Flag validation runs automatically in development mode to ensure proper configuration.

## Testing

### Mock Mode

The application includes a comprehensive mock system for development and testing without consuming API credits or requiring internet connectivity.

#### Enabling Mock Mode

Add to your `.env.local`:

```bash
# Enable mock mode
FF_USE_MOCK_API=true

# Configure mock behavior
FF_MOCK_SCENARIO=success
FF_MOCK_VARIABILITY=false
FF_SIMULATE_LATENCY=true
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000
FF_LOG_MOCK_REQUESTS=true
```

When mock mode is active, you'll see a "🧪 Mock Mode Active" indicator in the bottom-right corner of the application.

#### Available Mock Scenarios

- **`success`** (default): Returns realistic successful responses
- **`api_error`**: Simulates API failures with 500 status codes
- **`timeout`**: Simulates request timeouts
- **`rate_limit`**: Simulates rate limit errors with 429 status codes
- **`invalid_input`**: Simulates validation errors with 400 status codes

#### Mock Features

- **Predefined Responses**: Realistic mock data for all AI features (Analyzer, Hackathon Analyzer, Doctor Frankenstein)
- **Response Variants**: Multiple response variations for testing different scenarios
- **Latency Simulation**: Configurable network delay simulation
- **Error Scenarios**: Test error handling without triggering real errors
- **Request Logging**: Track all mock requests for debugging

#### Documentation

- **[Developer Guide](lib/testing/DEVELOPER_GUIDE.md)**: Complete guide to using the mock system
- **[Mock System Overview](lib/testing/README.md)**: Architecture and implementation details
- **[Example Files](tests/e2e/examples/)**: Example tests, page objects, and helpers

### E2E Testing

The application uses Playwright for end-to-end testing with comprehensive test coverage.

#### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e -- --ui

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- analyzer.spec.ts

# Run specific test by name
npm run test:e2e -- --grep "should analyze idea successfully"

# Run in different browsers
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

#### Debugging Tests

```bash
# Run with debug mode
npm run test:e2e -- --debug

# Run with trace viewer
npm run test:e2e -- --trace on

# Generate and open HTML report
npm run test:e2e -- --reporter=html
npx playwright show-report
```

#### Test Configuration

Configure test behavior via environment variables:

```bash
E2E_BASE_URL=http://localhost:3000    # Base URL for tests
E2E_HEADLESS=true                     # Run in headless mode
E2E_TIMEOUT=30000                     # Test timeout in ms
E2E_SCREENSHOT_ON_FAILURE=true        # Capture screenshots on failure
E2E_VIDEO_ON_FAILURE=false            # Record video on failure
```

#### Test Coverage

The E2E test suite covers:

- **Analyzer Feature**: Idea analysis, loading states, error handling, multi-language support
- **Hackathon Analyzer**: Project evaluation, category recommendations, Kiro usage analysis
- **Doctor Frankenstein**: Idea generation (companies and AWS modes), slot machine animation
- **Dashboard**: Analysis history, project listings, empty states

#### Test Artifacts

Test artifacts (screenshots, videos, reports) are automatically captured on failure and stored in:

- `tests/e2e/test-results/` - Test execution results
- `tests/e2e/screenshots/` - Failure screenshots
- `tests/e2e/videos/` - Failure videos (if enabled)
- `tests/e2e/reports/` - HTML test reports

### CI/CD Integration

E2E tests run automatically in GitHub Actions on:

- Pull requests to `main` or `develop` branches
- Pushes to `main` branch

#### Workflow Features

- **Automated Testing**: All E2E tests run in CI environment
- **Artifact Upload**: Screenshots, videos, and reports uploaded on failure
- **PR Comments**: Test results automatically posted as PR comments
- **Merge Blocking**: Failed tests block PR merges
- **Coverage Reporting**: Test coverage metrics included in reports

#### Viewing CI Results

1. Navigate to the **Actions** tab in GitHub
2. Select the **E2E Tests** workflow
3. View test results and download artifacts
4. Check PR comments for test summaries

### Mock Response Validation

Validate all mock responses against schemas:

```bash
# Validate all mock responses
npm run validate:mocks

# This checks:
# - JSON syntax validity
# - Schema compliance (Zod validation)
# - Required fields presence
# - Data type correctness
```

### Adding New Mock Responses

1. Add your mock response to the appropriate JSON file in `lib/testing/data/`:
   - `analyzer-mocks.json` - For analyzer responses
   - `hackathon-mocks.json` - For hackathon analyzer responses
   - `frankenstein-mocks.json` - For Doctor Frankenstein responses

2. Validate the mock response:
   ```bash
   npm run validate:mocks
   ```

3. Test the mock response:
   ```bash
   # Set the scenario in .env.local
   FF_MOCK_SCENARIO=your_scenario
   
   # Restart dev server
   npm run dev
   ```

See the [Developer Guide](lib/testing/DEVELOPER_GUIDE.md) for detailed instructions on adding mock responses.

### Environment Variables Reference

#### Mock Mode Configuration

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `FF_USE_MOCK_API` | Enable/disable mock mode | `false` | `true`, `false` |
| `FF_MOCK_SCENARIO` | Default mock scenario | `success` | `success`, `api_error`, `timeout`, `rate_limit`, `invalid_input` |
| `FF_MOCK_VARIABILITY` | Enable random response variants | `false` | `true`, `false` |
| `FF_SIMULATE_LATENCY` | Simulate network latency | `false` | `true`, `false` |
| `FF_MIN_LATENCY` | Minimum latency in ms | `500` | Any number |
| `FF_MAX_LATENCY` | Maximum latency in ms | `2000` | Any number |
| `FF_LOG_MOCK_REQUESTS` | Log all mock requests | `false` | `true`, `false` |

#### E2E Testing Configuration

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `E2E_BASE_URL` | Base URL for E2E tests | `http://localhost:3000` | Any URL |
| `E2E_HEADLESS` | Run tests in headless mode | `true` | `true`, `false` |
| `E2E_TIMEOUT` | Test timeout in ms | `30000` | Any number |
| `E2E_SCREENSHOT_ON_FAILURE` | Capture screenshots on failure | `true` | `true`, `false` |
| `E2E_VIDEO_ON_FAILURE` | Record video on failure | `false` | `true`, `false` |

### Troubleshooting

For common issues and solutions, see the [Developer Guide](lib/testing/DEVELOPER_GUIDE.md#troubleshooting-guide).

Common issues:

- **Mock mode not activating**: Check `FF_USE_MOCK_API` is set to `'true'` and restart dev server
- **E2E tests failing**: Ensure dev server is running and increase timeout if needed
- **Slow test execution**: Disable latency simulation with `FF_SIMULATE_LATENCY=false`
- **Schema validation errors**: Run `npm run validate:mocks` and fix reported issues
