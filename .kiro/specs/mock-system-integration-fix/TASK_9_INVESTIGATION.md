# Task 9 Investigation: API Integration Issues

## Problem Summary

E2E tests are failing with "Failed to save analysis" (400 Bad Request) errors, even though:
- Mock mode is verified and active
- Environment variables are properly configured
- Authentication service has been updated to handle test mode

## Root Cause Analysis

### 1. Authentication Fix Applied ✅
**Issue**: AuthenticationService only checked for `NODE_ENV === "development"` for local dev mode.
**Fix**: Updated to also check for `NODE_ENV === "test"` and `FF_LOCAL_DEV_MODE === "true"`.

```typescript
// Before
const isLocalDevMode = (process.env.NODE_ENV || "development") === "development";

// After
const isLocalDevMode = (process.env.NODE_ENV || "development") === "development" || 
                       process.env.NODE_ENV === "test" ||
                       process.env.FF_LOCAL_DEV_MODE === "true";
```

### 2. Remaining Issue: Repository Save Failure ❌

The tests are still failing with 400 errors. The flow is:
1. ✅ Client sends POST to `/api/analyze` with `{ idea, locale }`
2. ✅ API route creates ServiceFactory with MockModeHelper
3. ✅ Authentication succeeds (local dev mode)
4. ✅ Validation passes (schema is correct)
5. ✅ CreateAnalysisHandler is called
6. ✅ AnalyzeIdeaUseCase executes
7. ❌ **Repository.save() fails** - This is where the 400 error occurs

### 3. Why Repository Save is Failing

The `AnalyzeIdeaUseCase` tries to save the analysis to the repository:

```typescript
// Step 7: Persist the analysis
const saveResult = await this.analysisRepository.save(analysis);

if (!saveResult.success) {
  return failure(saveResult.error);
}
```

**Problem**: The repository is trying to save to Supabase, but:
- In test mode, we have dummy Supabase credentials
- The Supabase client will fail to connect
- The save operation returns an error

### 4. Missing Mock Repository

The issue is that **ServiceFactory creates real repositories, not mock repositories** in test mode.

Looking at `ServiceFactory.initializeUseCaseFactory()`:
```typescript
private initializeUseCaseFactory(): void {
  const analysisRepository = this.repositoryFactory.createAnalysisRepository();
  // This creates a REAL Supabase repository, not a mock!
  ...
}
```

The `RepositoryFactory` creates real Supabase repositories:
```typescript
createAnalysisRepository(): IAnalysisRepository {
  return new SupabaseAnalysisRepository(this.supabaseClient);
  // This will try to connect to Supabase!
}
```

## Solution Required

We need to create **mock repositories** when in mock mode, similar to how we create mock AI services.

### Option 1: Mock Repository Implementation (Recommended)

Create `MockAnalysisRepository` that:
- Implements `IAnalysisRepository` interface
- Stores data in memory (Map or array)
- Returns success results without database calls
- Can be configured with test data

### Option 2: Repository Factory Mock Mode

Update `RepositoryFactory` to check for mock mode and return mock repositories:
```typescript
createAnalysisRepository(): IAnalysisRepository {
  if (this.isMockMode()) {
    return new MockAnalysisRepository();
  }
  return new SupabaseAnalysisRepository(this.supabaseClient);
}
```

### Option 3: In-Memory Supabase Client

Create a mock Supabase client that doesn't make network calls but stores data in memory.

## Recommended Approach

**Option 1** is the cleanest and most aligned with the existing mock architecture:

1. Create `lib/testing/mocks/MockAnalysisRepository.ts`
2. Implement `IAnalysisRepository` interface
3. Use in-memory storage (Map<string, Analysis>)
4. Update `RepositoryFactory` to use mock repository in mock mode
5. Ensure mock repository is used in test environment

## Implementation Steps

1. **Create MockAnalysisRepository**
   - Implement all IAnalysisRepository methods
   - Use Map for in-memory storage
   - Generate UUIDs for new analyses
   - Return success results

2. **Update RepositoryFactory**
   - Add mock mode detection
   - Return MockAnalysisRepository when in mock mode
   - Keep existing Supabase repository for production

3. **Test Integration**
   - Verify mock repository is used in tests
   - Confirm no database calls are made
   - Validate E2E tests pass

## Current Status

- ✅ Mock mode verification working
- ✅ Authentication fixed for test mode
- ✅ Mock AI services working
- ❌ Mock repositories not implemented
- ❌ E2E tests failing due to repository save errors

## Next Actions

1. Implement MockAnalysisRepository
2. Update RepositoryFactory to use mock repositories in mock mode
3. Re-run E2E tests to verify fix
4. Complete task 9.1, 9.2, and 9.3

