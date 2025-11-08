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

- **[Architecture Overview](docs/ARCHITECTURE.md)**: Comprehensive architecture documentation
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Step-by-step guide for adding new features
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Domain Layer](src/domain/README.md)**: Domain layer documentation
- **[Application Layer](src/application/README.md)**: Application layer documentation
- **[Infrastructure Layer](src/infrastructure/README.md)**: Infrastructure layer documentation
- **[Hexagonal Architecture Standards](.kiro/steering/hexagonal-architecture-standards.md)**: Architecture standards and guidelines

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

#### Development Mode Flag (Server-Only)

- **`LOCAL_DEV_MODE`**: Enables local development mode with mock authentication and local storage
  - Environment variable: `FF_LOCAL_DEV_MODE`
  - Default: `false`
  - **Security Note**: This flag is server-only and should never be enabled in production

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

- `FF_LOCAL_DEV_MODE=false` (server-only)
- `NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER=true` (exposed to client)
- `NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER=true` (exposed to client)

### Local Development Mode

When `LOCAL_DEV_MODE` is enabled:

- Authentication is bypassed with a mock user
- Analysis data is stored in browser local storage instead of Supabase
- Pre-populated mock analysis cards are available for testing
- Ideal for rapid development and testing without database dependencies

### Notes

- Client-exposed flags are read from `NEXT_PUBLIC_FF_<FLAG>` and become part of the client bundle at build time.
- Defaults apply when env vars are absent.
- Flag validation runs automatically in development mode to ensure proper configuration.
