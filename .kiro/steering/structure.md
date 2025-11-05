# Project Structure

## Architecture Pattern

Feature-based architecture with clear separation of concerns. Each feature is self-contained with its own components, API functions, and utilities.

## Directory Structure

### `/app` - Next.js App Router

- **Pages**: Route-based page components (`page.tsx`)
- **API Routes**: Server endpoints (`route.ts`)
- **Layouts**: Shared layout components (`layout.tsx`)
- **Global Styles**: Application-wide CSS (`globals.css`)

### `/features` - Feature Modules

Each feature follows this structure:

```
features/[feature-name]/
├── components/          # React components
├── api/                # Client-side API functions
├── utils/              # Feature-specific utilities
├── context/            # React contexts
└── __tests__/          # Feature tests
```

**Key Features:**

- `analyzer` - Core startup idea analysis
- `kiroween-analyzer` - Hackathon project evaluation
- `auth` - Authentication and user management
- `dashboard` - User dashboard functionality
- `locale` - Internationalization support

### `/lib` - Shared Libraries

- `auth/` - Authentication utilities and access control
- `server/ai/` - AI integration (Gemini, TTS, transcription)
- `supabase/` - Database client, types, and mappers
- `types.ts` - Global TypeScript definitions
- `featureFlags.ts` - Feature flag system

### `/locales` - Internationalization

- `en.json` - English translations
- `es.json` - Spanish translations

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
