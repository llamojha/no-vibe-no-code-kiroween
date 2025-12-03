# Open Source Mode Specification

## Overview

This document outlines the plan to make "No Vibe No Code" open source friendly by enabling a fully functional local-only mode that requires no database setup. Users can spin up their own instance with just a Gemini API key.

## Problem Statement

Currently, the application requires:

- Supabase account and configuration
- Database setup and migrations
- Authentication configuration

This creates friction for:

- Open source contributors wanting to test locally
- Hackathon demos requiring quick setup
- Self-hosted deployments without cloud dependencies

## Solution

Implement a `LOCAL_STORAGE_MODE` that:

1. Uses browser localStorage for all data persistence
2. Provides simple username/password authentication (default: kiro/kiro)
3. Bypasses credit system enforcement (stores but doesn't block)
4. Requires only `GEMINI_API_KEY` to function

## Goals

- **2-minute setup**: Clone, add API key, run
- **Zero database dependency**: All data in localStorage
- **Familiar auth**: Simple username/password instead of magic links
- **Feature parity**: All core features work in local mode
- **Future-proof**: Credit transactions stored for potential sync later

## Non-Goals

- Multi-user support in local mode
- Data sync between localStorage and Supabase
- Production-grade security for local auth
- Offline AI functionality (still requires Gemini API)

---

## Technical Design

### Architecture Alignment

This implementation follows the existing hexagonal architecture:

- **Domain Layer**: No changes required (pure business logic)
- **Application Layer**: Minor changes to credit enforcement
- **Infrastructure Layer**: New localStorage repository implementations
- **Feature Layer**: New LocalLoginForm component

### Feature Flag

```typescript
// lib/featureFlags.config.ts
LOCAL_STORAGE_MODE: defineBooleanFlag({
  key: "LOCAL_STORAGE_MODE",
  description: "Open source mode - localStorage + simple auth, no Supabase required",
  default: resolveBooleanEnvFlag(process.env.LOCAL_STORAGE_MODE) ?? false,
  exposeToClient: true,
}),
```

### Environment Variables

```env
# === OPEN SOURCE MODE (No Database Required) ===
LOCAL_STORAGE_MODE=true
LOCAL_AUTH_USERNAME=kiro        # Optional, defaults to "kiro"
LOCAL_AUTH_PASSWORD=kiro        # Optional, defaults to "kiro"

# Required for AI features
GEMINI_API_KEY=your_gemini_api_key_here

# === FULL MODE (Requires Supabase) ===
# LOCAL_STORAGE_MODE=false
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Implementation Phases

### Phase 1: Feature Flag & Configuration

**Duration**: ~30 minutes

**Tasks**:

1. Add `LOCAL_STORAGE_MODE` feature flag to `lib/featureFlags.config.ts`
2. Add `LOCAL_AUTH_USERNAME` and `LOCAL_AUTH_PASSWORD` env var support
3. Update `src/infrastructure/config/environment.ts` to skip Supabase validation when in local mode
4. Update `.env.example` with open source mode configuration

**Files to modify**:

- `lib/featureFlags.config.ts`
- `src/infrastructure/config/environment.ts`
- `.env.example`

### Phase 2: Simple Authentication System

**Duration**: ~1 hour

**Tasks**:

1. Create local auth service at `lib/auth/localAuth.ts`

   - Validate username/password against env vars
   - Generate deterministic user ID from username (e.g., `local-user-{hash}`)
   - Store auth state in localStorage
   - Return mock session compatible with AuthContext

2. Create `LocalLoginForm` component at `features/auth/components/LocalLoginForm.tsx`

   - Username and password input fields
   - Form validation and error handling
   - Styled to match existing UI theme
   - Success redirects to dashboard

3. Update `features/auth/components/LoginForm.tsx`

   - Detect `LOCAL_STORAGE_MODE` flag
   - Conditionally render `LocalLoginForm` or existing magic link form

4. Update `features/auth/context/AuthContext.tsx`
   - Check for `LOCAL_STORAGE_MODE` on initialization
   - Use local auth state instead of Supabase when enabled
   - Generate consistent mock session for downstream compatibility

**New files**:

- `lib/auth/localAuth.ts`
- `features/auth/components/LocalLoginForm.tsx`

**Files to modify**:

- `features/auth/components/LoginForm.tsx`
- `features/auth/context/AuthContext.tsx`

### Phase 3: localStorage Repository Implementations

**Duration**: ~2-3 hours

**Tasks**:

1. Create base localStorage adapter at `src/infrastructure/database/localStorage/LocalStorageAdapter.ts`

   - Generic CRUD operations with type safety
   - Namespace prefixing (`nvnc-local-`)
   - Error handling for quota and corruption
   - Leverage existing `lib/localStorage.ts` patterns

2. Implement localStorage repositories:

   **LocalStorageAnalysisRepository.ts**

   - Extend patterns from existing `MockAnalysisRepository`
   - Persist to localStorage instead of in-memory Map
   - Implement full `IAnalysisRepository` interface

   **LocalStorageUserRepository.ts**

   - Simple single-user storage
   - Store user profile from local auth
   - Implement `IUserRepository` interface

   **LocalStorageIdeaRepository.ts**

   - Ideas persistence with full CRUD
   - Implement `IIdeaRepository` interface

   **LocalStorageDocumentRepository.ts**

   - Documents persistence with idea relationships
   - Implement `IDocumentRepository` interface

   **LocalStorageCreditTransactionRepository.ts**

   - Store credit transactions (for audit trail)
   - Implement `ICreditTransactionRepository` interface

3. Update `src/infrastructure/factories/RepositoryFactory.ts`
   - Check `LOCAL_STORAGE_MODE` flag
   - Return localStorage implementations when enabled
   - Maintain existing Supabase implementations as default

**New files**:

- `src/infrastructure/database/localStorage/LocalStorageAdapter.ts`
- `src/infrastructure/database/localStorage/LocalStorageAnalysisRepository.ts`
- `src/infrastructure/database/localStorage/LocalStorageUserRepository.ts`
- `src/infrastructure/database/localStorage/LocalStorageIdeaRepository.ts`
- `src/infrastructure/database/localStorage/LocalStorageDocumentRepository.ts`
- `src/infrastructure/database/localStorage/LocalStorageCreditTransactionRepository.ts`
- `src/infrastructure/database/localStorage/index.ts`

**Files to modify**:

- `src/infrastructure/factories/RepositoryFactory.ts`

### Phase 4: Credit System Bypass

**Duration**: ~30 minutes

**Tasks**:

1. Update credit check use cases to bypass enforcement in local mode

   - `CheckCreditsUseCase`: Return unlimited credits
   - `DeductCreditUseCase`: Log transaction but always succeed
   - `GetCreditBalanceUseCase`: Return high balance (e.g., 9999)

2. Still record transactions to localStorage for:
   - Usage tracking and analytics
   - Future sync capability
   - Debugging and testing

**Files to modify**:

- `src/application/use-cases/CheckCreditsUseCase.ts`
- `src/application/use-cases/DeductCreditUseCase.ts`
- `src/application/use-cases/GetCreditBalanceUseCase.ts`

### Phase 5: Environment Validation Updates

**Duration**: ~30 minutes

**Tasks**:

1. Update environment validation to conditionally require Supabase vars
2. Add validation for local mode requirements (GEMINI_API_KEY only)
3. Provide clear error messages for missing configuration

**Files to modify**:

- `src/infrastructure/config/environment.ts`
- `src/infrastructure/bootstrap/validation.ts` (if exists)

### Phase 6: Documentation

**Duration**: ~30 minutes

**Tasks**:

1. Update `README.md` with quick start for open source mode
2. Create `docs/SELF_HOSTED.md` with detailed setup instructions
3. Document limitations of local mode
4. Add troubleshooting section

**New files**:

- `docs/SELF_HOSTED.md`

**Files to modify**:

- `README.md`
- `.env.example`

---

## Data Model

### localStorage Keys

```
nvnc-local-auth          # Auth state (user session)
nvnc-local-user          # User profile
nvnc-local-analyses      # Startup idea analyses
nvnc-local-hackathon     # Hackathon analyses
nvnc-local-ideas         # Ideas (Idea Panel)
nvnc-local-documents     # Documents (Idea Panel)
nvnc-local-credits       # Credit transactions
nvnc-local-frankenstein  # Doctor Frankenstein ideas
```

### Local User Structure

```typescript
interface LocalUser {
  id: string; // Deterministic from username
  username: string;
  email: string; // Generated: {username}@local.nvnc
  tier: "admin"; // Always admin in local mode
  createdAt: string;
  lastLoginAt: string;
}
```

### Local Auth State

```typescript
interface LocalAuthState {
  isAuthenticated: boolean;
  user: LocalUser | null;
  sessionCreatedAt: string;
}
```

---

## Security Considerations

### Local Mode Security

- **Not for production**: Local auth is for development/demo only
- **No password hashing**: Credentials compared directly (acceptable for local-only)
- **localStorage limitations**: Data accessible via browser dev tools
- **Single user**: No multi-tenancy or user isolation

### Recommendations for Self-Hosted Production

If users want to self-host in production, recommend:

1. Use full Supabase mode with proper auth
2. Or implement proper password hashing for local mode
3. Consider adding session expiration
4. Use HTTPS in production

---

## Testing Strategy

### Unit Tests

- Test localStorage repositories with mock localStorage
- Test local auth service credential validation
- Test feature flag detection logic

### Integration Tests

- Test full auth flow in local mode
- Test analysis creation and retrieval
- Test credit bypass behavior

### E2E Tests

- Add Playwright tests for local mode login
- Test dashboard functionality in local mode
- Verify data persistence across page reloads

---

## Migration Path

### From Local to Full Mode

Users who start with local mode and want to migrate to Supabase:

1. Export localStorage data (future feature)
2. Set up Supabase instance
3. Import data to Supabase (future feature)
4. Switch `LOCAL_STORAGE_MODE=false`

### Data Export Format

Consider adding export functionality:

```json
{
  "version": "1.0",
  "exportedAt": "2024-11-29T00:00:00Z",
  "user": { ... },
  "analyses": [ ... ],
  "ideas": [ ... ],
  "documents": [ ... ]
}
```

---

## Success Criteria

1. **Quick Setup**: New user can run the app in under 2 minutes
2. **Feature Parity**: All core features work in local mode
3. **No Errors**: No Supabase-related errors when `LOCAL_STORAGE_MODE=true`
4. **Data Persistence**: Data survives page refresh and browser restart
5. **Clear Documentation**: README provides clear setup instructions

---

## Effort Estimation

| Phase                              | Duration  | Priority |
| ---------------------------------- | --------- | -------- |
| Phase 1: Feature Flag & Config     | 30 min    | P0       |
| Phase 2: Simple Auth System        | 1 hour    | P0       |
| Phase 3: localStorage Repositories | 2-3 hours | P0       |
| Phase 4: Credit System Bypass      | 30 min    | P1       |
| Phase 5: Environment Validation    | 30 min    | P1       |
| Phase 6: Documentation             | 30 min    | P2       |

**Total Estimated Effort**: 5-6 hours

---

## Future Enhancements

1. **Data Export/Import**: Allow users to backup and restore localStorage data
2. **IndexedDB Option**: For larger datasets beyond localStorage limits
3. **Sync to Cloud**: Optional sync from local to Supabase account
4. **Multiple Local Users**: Support switching between local user profiles
5. **Session Expiration**: Add configurable session timeout

---

## Appendix: Quick Start Preview

```bash
# Clone the repository
git clone https://github.com/your-org/no-vibe-no-code
cd no-vibe-no-code

# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Gemini API key
# LOCAL_STORAGE_MODE=true (already set)
# GEMINI_API_KEY=your_key_here

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
# Login with: kiro / kiro
# 🎉 Ready to analyze ideas!
```

---

_Last updated: November 29, 2025_
