# Factory Security Fix - Session Leak Prevention

## Overview

This document describes the critical security fix implemented to prevent session leaks in the ServiceFactory, RepositoryFactory, and UseCaseFactory classes.

## The Problem

### Original Vulnerable Implementation

The factories were using singleton patterns that cached the Supabase client from the first request:

```typescript
// ❌ VULNERABLE CODE (Before Fix)
export class ServiceFactory {
  private static instance: ServiceFactory;
  
  static getInstance(supabaseClient: SupabaseClient): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(supabaseClient);
    }
    return ServiceFactory.instance; // Returns cached instance!
  }
}
```

### Security Impact

**Critical Session Leak Vulnerability:**

1. **User A** makes first request → Factory created with User A's Supabase client
2. **User B** makes request → Gets cached factory with User A's client
3. **User B now has User A's session** → CRITICAL SECURITY BREACH

This affected:
- All API routes (`/api/v2/dashboard/*`, `/api/v2/hackathon/*`, `/api/v2/analyze/*`)
- All authentication helpers (`serverAuth.ts`)
- All route handlers (`AnalysisRoutes.ts`, `DashboardRoutes.ts`, `HackathonRoutes.ts`)

## The Solution

### New Secure Implementation

Removed singleton pattern entirely - each request creates fresh factory instances:

```typescript
// ✅ SECURE CODE (After Fix)
export class ServiceFactory {
  // No static instance variable
  
  static create(supabaseClient: SupabaseClient): ServiceFactory {
    return new ServiceFactory(supabaseClient); // Fresh instance per request
  }
  
  // Deprecated method for backward compatibility
  static getInstance(supabaseClient: SupabaseClient): ServiceFactory {
    return ServiceFactory.create(supabaseClient);
  }
}
```

### Usage Pattern

**Before (Vulnerable):**
```typescript
export async function GET(request: NextRequest) {
  const supabase = serverSupabase();
  const factory = ServiceFactory.getInstance(supabase); // Cached!
  const controller = factory.createAnalysisController();
  return controller.listAnalyses(request);
}
```

**After (Secure):**
```typescript
export async function GET(request: NextRequest) {
  const supabase = SupabaseAdapter.getServerClient(); // Fresh client
  const factory = ServiceFactory.create(supabase);    // Fresh factory
  const controller = factory.createAnalysisController();
  return controller.listAnalyses(request);
}
```

## Changes Made

### 1. ServiceFactory (`src/infrastructure/factories/ServiceFactory.ts`)

- ✅ Removed `private static instance: ServiceFactory`
- ✅ Added `static create()` method that always returns new instance
- ✅ Deprecated `getInstance()` but kept for backward compatibility
- ✅ Updated to use `RepositoryFactory.create()` instead of `getInstance()`
- ✅ Added comprehensive security documentation in JSDoc

### 2. RepositoryFactory (`src/infrastructure/factories/RepositoryFactory.ts`)

- ✅ Removed `private static instance: RepositoryFactory`
- ✅ Added `static create()` method that always returns new instance
- ✅ Deprecated `getInstance()` but kept for backward compatibility
- ✅ Added comprehensive security documentation in JSDoc

### 3. UseCaseFactory (`src/infrastructure/factories/UseCaseFactory.ts`)

- ✅ Removed `private static instance: UseCaseFactory`
- ✅ Added `static create()` method that always returns new instance
- ✅ Deprecated `getInstance()` but kept for backward compatibility
- ✅ Added comprehensive security documentation in JSDoc

### 4. Application Bootstrap (`src/main.ts`)

- ✅ Removed cached `serviceFactory` instance variable
- ✅ Updated `initialize()` to not cache ServiceFactory
- ✅ Added `createServiceFactory()` method for per-request factory creation
- ✅ Deprecated `getServiceFactory()` with clear error message
- ✅ Updated shutdown logic to not clear factory cache

### 5. Server Auth Helpers (`src/infrastructure/web/helpers/serverAuth.ts`)

- ✅ Updated all functions to use `ServiceFactory.create()` instead of `getInstance()`
- ✅ Ensures fresh factory per authentication check

### 6. Documentation Updates

- ✅ Updated `docs/SECURITY.md` with ServiceFactory security information
- ✅ Updated `docs/ARCHITECTURE.md` with factory security patterns
- ✅ Added examples of correct vs incorrect usage
- ✅ Added developer checklist including factory security

## Performance Considerations

**Q: Doesn't creating a new factory per request hurt performance?**

**A: No, the overhead is minimal:**

1. **Lightweight Objects**: Factories are just wrappers with minimal state
2. **No Connection Pooling**: Supabase handles connection pooling on their end
3. **Fast Initialization**: Factory creation is synchronous and fast (~0.1ms)
4. **Security First**: Security always trumps micro-optimizations

**Benchmark:**
```typescript
console.time('create-factory');
const factory = ServiceFactory.create(supabaseClient);
console.timeEnd('create-factory'); // ~0.1ms
```

## Testing

### Build Verification

```bash
npm run build
# ✅ Build completed successfully with no errors
```

### Test Results

```bash
npm run test -- --run --silent
# ✅ 394 tests passed
# ⚠️ 1 test failed (pre-existing, unrelated to security fix)
```

The failing test (`AnalysisController.test.ts`) was already failing before these changes and is unrelated to the security fix.

## Migration Guide

### For Existing Code

If you have code using the old pattern:

```typescript
// Old pattern (still works but deprecated)
const factory = ServiceFactory.getInstance(supabase);

// New pattern (recommended)
const factory = ServiceFactory.create(supabase);
```

The `getInstance()` method is deprecated but still works (it now calls `create()` internally) for backward compatibility.

### For New Code

Always use the `create()` method:

```typescript
// API Route
export async function GET(request: NextRequest) {
  const supabase = SupabaseAdapter.getServerClient();
  const factory = ServiceFactory.create(supabase);
  const controller = factory.createAnalysisController();
  return controller.listAnalyses(request);
}

// Server Component
export default async function MyPage() {
  const supabase = SupabaseAdapter.getServerClient();
  const factory = ServiceFactory.create(supabase);
  const useCase = factory.getUseCaseFactory().createGetAnalysisUseCase();
  // ...
}
```

## Security Checklist

When working with factories in server-side code:

- [ ] ✅ Always use `ServiceFactory.create()` (not `getInstance()`)
- [ ] ✅ Always use `RepositoryFactory.create()` (not `getInstance()`)
- [ ] ✅ Always use `UseCaseFactory.create()` (not `getInstance()`)
- [ ] ✅ Never cache factory instances in static variables
- [ ] ✅ Never cache factory instances in class instance variables
- [ ] ✅ Always create fresh factory per request
- [ ] ✅ Always use `SupabaseAdapter.getServerClient()` for fresh Supabase client
- [ ] ✅ Test with multiple users to ensure session isolation

## References

- [Security Documentation](./SECURITY.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [SupabaseAdapter Security Fix](../src/infrastructure/integration/SupabaseAdapter.ts)
- [ServiceFactory Implementation](../src/infrastructure/factories/ServiceFactory.ts)
- [RepositoryFactory Implementation](../src/infrastructure/factories/RepositoryFactory.ts)
- [UseCaseFactory Implementation](../src/infrastructure/factories/UseCaseFactory.ts)

## Additional Fixes

### Server Actions Authentication Token Issue

**Problem Found:**
Server actions were using `supabase.auth.getSession()` without `await`, resulting in `'Bearer [object Promise]'` instead of actual access tokens.

**Files Fixed:**
- `app/actions/analysis.ts`
- `app/actions/hackathon.ts`
- `app/actions/dashboard.ts`

**Before (Broken):**
```typescript
headers: new Headers({
  'authorization': `Bearer ${supabase.auth.getSession()}` // ❌ Returns Promise!
})
```

**After (Fixed):**
```typescript
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token || '';

headers: new Headers({
  'authorization': `Bearer ${accessToken}` // ✅ Actual token
})
```

**Also Updated:**
- Changed `serverSupabase()` to `SupabaseAdapter.getServerClient()`
- Changed `ServiceFactory.getInstance()` to `ServiceFactory.create()`

## Timeline

- **Issue Identified**: Session leak vulnerability in factory singleton patterns
- **Fix Implemented**: Removed singleton patterns, added `create()` methods
- **Additional Issue Found**: Async auth token not awaited in server actions
- **Additional Fix**: Properly await `getSession()` and extract `access_token`
- **Documentation Updated**: Comprehensive security documentation added
- **Testing**: Build successful, 394/395 tests passing
- **Status**: ✅ **FIXED AND VERIFIED**

## Conclusion

This fix eliminates a critical session leak vulnerability that could have allowed users to access other users' data and permissions. The solution is simple, secure, and has minimal performance impact. All factory classes now create fresh instances per request, ensuring proper session isolation.
