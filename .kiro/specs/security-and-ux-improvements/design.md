# Design Document

## Overview

This design addresses critical security vulnerabilities in authentication handling and implements user experience improvements across the No Vibe No Code platform. The solution focuses on replacing insecure `getSession()` calls with secure `getUser()` authentication, optimizing database queries for performance, removing deprecated form fields, and enhancing UI elements for better user experience.

## Architecture

### Security Layer Enhancement

The authentication security improvements will be implemented at multiple layers:

1. **Application Layer**: Update `AuthenticationService` to use `getUser()` instead of `getSession()`
2. **Infrastructure Layer**: Modify all client-side API functions and server actions
3. **Middleware Layer**: Update authentication middleware to validate user authenticity
4. **Repository Layer**: Ensure all database handlers verify user authorization

### Query Optimization Strategy

Dashboard queries will be optimized using a selective field approach:

- Implement a dedicated DTO for dashboard card data
- Modify repository methods to accept field selection parameters
- Update API routes to request only necessary fields

### UI Enhancement Approach

UI improvements will follow the existing design system:

- Maintain consistency with current Tailwind CSS patterns
- Enhance interactive elements with animations and gradients
- Ensure accessibility standards are met

## Components and Interfaces

### 1. Authentication Service Updates

**File**: `src/application/services/AuthenticationService.ts`

**Changes**:

```typescript
// Replace getSession() method with getUser() approach
async getSession(): Promise<SessionInfo> {
  try {
    // Use getUser() instead of getSession() for security
    const {
      data: { user },
      error: userError,
    } = await this.supabaseClient.auth.getUser();

    if (userError || !user) {
      return {
        isAuthenticated: false,
        user: null,
        userId: null,
        session: null,
      };
    }

    // Get session only after user is validated
    const {
      data: { session },
      error: sessionError,
    } = await this.supabaseClient.auth.getSession();

    return {
      isAuthenticated: true,
      user: user,
      userId: user.id,
      session: session,
    };
  } catch (error) {
    // Error handling
  }
}
```

### 2. Client-Side API Functions

**Files to Update**:

- `features/kiroween-analyzer/api/*.ts`
- `features/dashboard/api/loadUnifiedAnalyses.ts`
- `lib/auth/access.ts`

**Pattern**:

```typescript
// Before (Insecure)
const {
  data: { session },
} = await supabase.auth.getSession();

// After (Secure)
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
if (error || !user) {
  throw new Error("Unauthorized");
}
```

### 3. Server Actions

**Files to Update**:

- `app/actions/analysis.ts`
- `app/actions/hackathon.ts`
- `app/actions/dashboard.ts`

**Pattern**:

```typescript
// Before (Insecure)
const {
  data: { session },
} = await supabase.auth.getSession();
const accessToken = session?.access_token || "";

// After (Secure)
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
if (error || !user) {
  return { success: false, error: "Unauthorized" };
}
const {
  data: { session },
} = await supabase.auth.getSession();
const accessToken = session?.access_token || "";
```

### 4. Repository Authorization

**Files to Update**:

- `src/infrastructure/database/supabase/repositories/SupabaseAnalysisRepository.ts`
- `src/infrastructure/database/supabase/repositories/SupabaseUserRepository.ts`

**Approach**:

- Add user ID validation to all query methods
- Implement authorization checks before data access
- Rely on Supabase Row Level Security (RLS) as primary defense
- Add application-level checks as secondary defense

**Example**:

```typescript
async findByUserId(
  userId: UserId,
  requestingUserId: UserId, // Add this parameter
  params: PaginationParams
): Promise<Result<PaginatedResult<Analysis>, Error>> {
  // Verify requesting user matches the query user
  if (userId.value !== requestingUserId.value) {
    return failure(new AuthorizationError('Cannot access other user data'));
  }

  // Proceed with query (RLS will also enforce this)
  return this.findWhereWithPagination({ user_id: userId.value }, params);
}
```

### 5. Dashboard Query Optimization

**File**: `src/infrastructure/database/supabase/repositories/SupabaseAnalysisRepository.ts`

**New Method**:

```typescript
async findByUserIdForDashboard(
  userId: UserId,
  options: {
    page: number;
    limit: number;
    sortBy?: 'newest' | 'oldest' | 'score' | 'title';
    category?: 'idea' | 'kiroween' | 'all';
  }
): Promise<Result<{ analyses: DashboardAnalysisDTO[]; total: number }, Error>> {
  try {
    const offset = (options.page - 1) * options.limit;

    // Select only fields needed for dashboard cards
    let query = this.client
      .from(this.tableName)
      .select('id, idea, created_at, analysis->score, analysis->category, analysis->detailedSummary',
              { count: 'exact' })
      .eq('user_id', userId.value);

    // Apply filters and sorting...

    return success({ analyses: mappedData, total: count || 0 });
  } catch (error) {
    return failure(new DatabaseQueryError('Failed to fetch dashboard analyses', error));
  }
}
```

**DTO Definition**:

```typescript
// src/infrastructure/web/dto/AnalysisDTO.ts
export interface DashboardAnalysisDTO {
  id: string;
  title: string;
  createdAt: string;
  score: number;
  category: string;
  summary: string;
}
```

### 6. Prompt and Form Updates

**File**: `lib/prompts/hackathonProject.ts`

**Changes**:

- Remove `kiroUsage` parameter from function signature
- Remove `categoryDescriptions` constant
- Update prompt template to exclude these fields

**File**: `features/kiroween-analyzer/components/ProjectSubmissionForm.tsx`

**Changes**:

- Remove `kiroUsage` input field
- Remove `categoryDescriptions` input field
- Update form validation to exclude these fields
- Update `ProjectSubmission` type if needed

### 7. Header Positioning

**Files to Update**:

- `features/home/components/HomeHero.tsx`
- Any other components using `top-1/2` positioning

**Change**:

```typescript
// Before
className = "absolute top-1/2 ...";

// After
className = "absolute top-[90%] ...";
```

### 8. Enhanced Login Button

**File**: `features/home/components/HomeHero.tsx`

**Design**:

```typescript
<button
  onClick={() => router.push("/login")}
  className="group relative px-8 py-4 text-lg font-bold uppercase tracking-wider overflow-hidden
             bg-gradient-to-r from-accent via-secondary to-accent bg-size-200 bg-pos-0
             hover:bg-pos-100 transition-all duration-500 ease-out
             border-2 border-accent/50 hover:border-accent
             shadow-lg hover:shadow-accent/50 hover:shadow-2xl
             transform hover:scale-105 active:scale-95
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-accent"
>
  <span className="relative z-10 flex items-center justify-center gap-2">
    <svg
      className="w-5 h-5 transform group-hover:rotate-12 transition-transform"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clipRule="evenodd"
      />
    </svg>
    {t("loginButton")}
  </span>
  <div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                  transform -skew-x-12 -translate-x-full group-hover:translate-x-full
                  transition-transform duration-1000"
  />
</button>
```

**Tailwind Config Addition**:

```javascript
// tailwind.config.ts
theme: {
  extend: {
    backgroundSize: {
      'size-200': '200% 200%',
    },
    backgroundPosition: {
      'pos-0': '0% 0%',
      'pos-100': '100% 100%',
    },
  },
}
```

### 9. User Identity Display

**Files to Update**:

- `app/dashboard/page.tsx`
- `app/analyzer/page.tsx`

**Component**: Create new `UserIdentityBadge` component

**File**: `features/auth/components/UserIdentityBadge.tsx`

```typescript
interface UserIdentityBadgeProps {
  userEmail?: string;
  userName?: string;
  className?: string;
}

export const UserIdentityBadge: React.FC<UserIdentityBadgeProps> = ({
  userEmail,
  userName,
  className = "",
}) => {
  const displayName = userName || userEmail || "User";

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-accent/30
                     rounded-lg text-sm ${className}`}
    >
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-slate-400">Logged in as</span>
      <span className="text-accent font-semibold">{displayName}</span>
    </div>
  );
};
```

**Integration**:

```typescript
// In dashboard/page.tsx and analyzer/page.tsx
import { UserIdentityBadge } from "@/features/auth/components/UserIdentityBadge";

// Get user info
const user = await getCurrentUser();

// Pass to component
<UserIdentityBadge
  userEmail={user?.email}
  userName={user?.displayName}
  className="absolute top-4 right-4 z-20"
/>;
```

## Data Models

### DashboardAnalysisDTO

```typescript
export interface DashboardAnalysisDTO {
  id: string;
  title: string;
  createdAt: string;
  score: number;
  category: "idea" | "kiroween";
  summary: string;
}
```

### Updated ProjectSubmission Type

```typescript
// lib/types.ts
export interface ProjectSubmission {
  description: string;
  // Removed: kiroUsage
  // Removed: category
}
```

### SessionInfo Enhancement

```typescript
// src/application/services/AuthenticationService.ts
export interface SessionInfo {
  isAuthenticated: boolean;
  user: any | null;
  userId: string | null;
  session: any | null;
  isVerified: boolean; // New field to indicate user was verified via getUser()
}
```

## Error Handling

### Authentication Errors

```typescript
export class AuthenticationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
```

### Error Responses

All API routes and server actions should return consistent error responses:

```typescript
{
  success: false,
  error: 'Unauthorized: User authentication failed',
  code: 'AUTH_FAILED'
}
```

## Testing Strategy

### Unit Tests

1. **AuthenticationService Tests**

   - Test `getSession()` now calls `getUser()` first
   - Test proper error handling when user is not authenticated
   - Test session info includes verification status

2. **Repository Tests**

   - Test authorization checks in query methods
   - Test proper error responses for unauthorized access
   - Test RLS policies are enforced

3. **Component Tests**
   - Test `UserIdentityBadge` renders correctly
   - Test login button interactions
   - Test form validation without deprecated fields

### Integration Tests

1. **Authentication Flow**

   - Test complete authentication flow uses `getUser()`
   - Test unauthorized access is properly rejected
   - Test session refresh maintains security

2. **Dashboard Loading**

   - Test optimized queries return only necessary fields
   - Test performance improvement is measurable
   - Test data integrity is maintained

3. **Form Submission**
   - Test hackathon project submission without deprecated fields
   - Test prompt generation excludes removed parameters
   - Test backward compatibility with existing data

### Security Tests

1. **Authorization Tests**

   - Test users cannot access other users' data
   - Test RLS policies are enforced at database level
   - Test application-level checks catch unauthorized attempts

2. **Token Validation Tests**
   - Test `getUser()` properly validates tokens
   - Test expired tokens are rejected
   - Test tampered tokens are detected

## Performance Considerations

### Query Optimization

- **Before**: Dashboard queries fetch full analysis objects (~10-50KB each)
- **After**: Dashboard queries fetch only card fields (~1-2KB each)
- **Expected Improvement**: 80-90% reduction in data transfer for dashboard

### Caching Strategy

- Implement client-side caching for dashboard data
- Cache user identity information to reduce auth calls
- Use SWR or React Query for optimistic updates

### Database Indexes

Ensure indexes exist for:

- `saved_analyses(user_id, created_at)`
- `saved_analyses(user_id, analysis->score)`
- `saved_analyses(user_id, analysis->category)`

## Migration Plan

### Phase 1: Authentication Security (Critical)

1. Update `AuthenticationService.getSession()` method
2. Update all server actions to use `getUser()`
3. Update client-side API functions
4. Update middleware
5. Test authentication flows thoroughly

### Phase 2: Repository Authorization

1. Add authorization checks to repository methods
2. Update use cases to pass requesting user ID
3. Test authorization enforcement
4. Verify RLS policies are active

### Phase 3: Query Optimization

1. Create `DashboardAnalysisDTO`
2. Add optimized repository method
3. Update dashboard API route
4. Update dashboard component
5. Measure performance improvement

### Phase 4: UI Enhancements

1. Remove deprecated form fields
2. Update prompt generation
3. Adjust header positioning
4. Enhance login button
5. Add user identity display

### Phase 5: Testing and Validation

1. Run full test suite
2. Perform security audit
3. Test performance improvements
4. Validate UI changes
5. Deploy to staging

## Rollback Strategy

Each phase can be rolled back independently:

1. **Authentication Changes**: Revert to `getSession()` if issues arise
2. **Repository Changes**: Remove authorization checks if they cause problems
3. **Query Optimization**: Fall back to full object queries
4. **UI Changes**: Revert individual UI components

## Monitoring and Observability

### Metrics to Track

1. **Authentication**

   - Failed authentication attempts
   - Token validation failures
   - Session refresh rate

2. **Performance**

   - Dashboard load time
   - Query execution time
   - Data transfer size

3. **Security**
   - Unauthorized access attempts
   - RLS policy violations
   - Authentication errors

### Logging

Use existing logger with appropriate categories:

- `LogCategory.AUTH` for authentication events
- `LogCategory.DATABASE` for query performance
- `LogCategory.API` for API request/response
- `LogCategory.BUSINESS` for authorization decisions

## Accessibility Considerations

### Login Button

- Maintain proper contrast ratios (WCAG AA minimum)
- Ensure keyboard navigation works
- Add proper ARIA labels
- Test with screen readers

### User Identity Badge

- Use semantic HTML
- Provide clear visual indicators
- Ensure text is readable
- Support high contrast mode

## Browser Compatibility

All UI enhancements should work in:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Documentation Updates

Update the following documentation:

- `docs/SECURITY.md` - Add authentication best practices
- `docs/API.md` - Document new DTO structures
- `docs/ARCHITECTURE.md` - Explain security layer changes
- `docs/DEVELOPER_GUIDE.md` - Add migration guide

## Dependencies

No new dependencies required. All changes use existing libraries:

- Supabase Auth (existing)
- Tailwind CSS (existing)
- React (existing)
- TypeScript (existing)
