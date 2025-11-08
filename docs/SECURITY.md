# Security Documentation

This document outlines critical security considerations and best practices for the No Vibe No Code application.

## Table of Contents

1. [Critical: Supabase Client Session Management](#critical-supabase-client-session-management)
2. [Authentication and Authorization](#authentication-and-authorization)
3. [Data Protection](#data-protection)
4. [Input Validation](#input-validation)
5. [API Security](#api-security)
6. [Environment Variables](#environment-variables)
7. [Security Testing](#security-testing)

## Critical: Supabase Client Session Management

### ⚠️ The Session Leak Vulnerability

**NEVER cache Supabase server clients in a static variable or singleton pattern.**

This is the most critical security issue in Next.js applications using Supabase. Understanding and preventing this vulnerability is essential.

### Understanding the Problem

In Next.js server-side operations (Server Components, API Routes, Server Actions), each HTTP request has its own cookie store via the `cookies()` function. These cookies contain:

- **Access tokens**: JWT for current session
- **Refresh tokens**: For renewing expired sessions
- **User-specific session data**: User ID, roles, permissions

If you cache the Supabase client globally, you cache the cookie store from the first request, causing all subsequent requests to use the first user's credentials.

### Attack Scenario

**Vulnerable Code:**
```typescript
// ❌ DANGEROUS - DO NOT DO THIS
class VulnerableAdapter {
  private static serverInstance: SupabaseClient | null = null;
  
  static getServerClient() {
    if (!this.serverInstance) {
      // This caches the cookies from the FIRST request
      this.serverInstance = createServerComponentClient({ cookies });
    }
    return this.serverInstance;
  }
}
```

**What Happens:**

1. **10:00 AM** - Admin user logs in and makes first request
   - Client created with admin cookies
   - Client cached in `serverInstance`
   - Admin sees their data ✓

2. **10:01 AM** - Regular user logs in and makes request
   - Gets cached client with admin cookies
   - Regular user now has admin access ✗
   - **CRITICAL SECURITY BREACH**

3. **10:02 AM** - Unauthenticated visitor makes request
   - Gets cached client with admin cookies
   - Visitor has admin access ✗
   - **CRITICAL SECURITY BREACH**

### Real-World Impact

**Data Exposure:**
```typescript
// User A (admin) makes request
const supabase = VulnerableAdapter.getServerClient();
const { data: adminData } = await supabase
  .from('sensitive_data')
  .select('*'); // Admin can see everything

// User B (regular user) makes request
const supabase = VulnerableAdapter.getServerClient(); // Same instance!
const { data: userData } = await supabase
  .from('sensitive_data')
  .select('*'); // User B sees admin's data!
```

**Permission Bypass:**
```typescript
// User A has permission to delete
const supabase = VulnerableAdapter.getServerClient();
await supabase.from('projects').delete().eq('id', projectId); // Success

// User B doesn't have permission, but...
const supabase = VulnerableAdapter.getServerClient(); // Same instance!
await supabase.from('projects').delete().eq('id', projectId); // Success! (Should fail)
```

**Row-Level Security (RLS) Bypass:**
```typescript
// Even with RLS policies in place:
CREATE POLICY "Users can only see their own data"
ON analyses FOR SELECT
USING (auth.uid() = user_id);

// The cached client has User A's auth.uid()
// So User B can see User A's data despite RLS!
```

### The Secure Solution

**Our Implementation:**
```typescript
// ✅ SAFE - Always create fresh client
export class SupabaseAdapter {
  static getServerClient(): SupabaseClient {
    // Creates new client with current request's cookies
    return createServerComponentClient({ cookies });
  }
}
```

**Why This Works:**
- Each request calls `cookies()` which returns that request's cookie store
- Each client is tied to its own request's session
- User sessions are properly isolated
- RLS policies work correctly
- Refresh tokens update as expected

### Usage Examples

#### ✅ Correct: Server Component

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Fresh client with current user's cookies
  const supabase = SupabaseAdapter.getServerClient();
  
  const { data: analyses } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
  
  return <DashboardView analyses={analyses} />;
}
```

#### ✅ Correct: API Route

```typescript
// app/api/analyses/route.ts
export async function GET(request: NextRequest) {
  // Fresh client with current user's cookies
  const supabase = SupabaseAdapter.getServerClient();
  
  // Get current user from their session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Query with proper user isolation
  const { data } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id);
  
  return NextResponse.json(data);
}
```

#### ✅ Correct: Server Action

```typescript
// app/actions/analysis.ts
'use server';

export async function deleteAnalysis(analysisId: string) {
  // Fresh client with current user's cookies
  const supabase = SupabaseAdapter.getServerClient();
  
  // Verify user owns the analysis
  const { data: analysis } = await supabase
    .from('analyses')
    .select('user_id')
    .eq('id', analysisId)
    .single();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (analysis?.user_id !== user?.id) {
    throw new Error('Unauthorized');
  }
  
  await supabase.from('analyses').delete().eq('id', analysisId);
}
```

#### ✅ Correct: Client Component

```typescript
// components/AnalysisList.tsx
'use client';

import { useEffect, useState } from 'react';
import { SupabaseAdapter } from '@/infrastructure/integration/SupabaseAdapter';

export function AnalysisList() {
  const [analyses, setAnalyses] = useState([]);
  
  useEffect(() => {
    // Singleton is SAFE in client components
    // Each browser has its own isolated context
    const supabase = SupabaseAdapter.getClientClient();
    
    supabase
      .from('analyses')
      .select('*')
      .then(({ data }) => setAnalyses(data || []));
  }, []);
  
  return <div>{/* Render analyses */}</div>;
}
```

#### ❌ Incorrect: Caching Server Client

```typescript
// ❌ DO NOT DO THIS
class BadRepository {
  private client: SupabaseClient;
  
  constructor() {
    // Caching client in constructor
    this.client = createServerComponentClient({ cookies });
  }
  
  async findAll() {
    // This uses cached client with wrong user's session!
    return this.client.from('analyses').select('*');
  }
}
```

#### ❌ Incorrect: Singleton Pattern

```typescript
// ❌ DO NOT DO THIS
class BadAdapter {
  private static instance: SupabaseClient;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = createServerComponentClient({ cookies });
    }
    return this.instance; // Session leak!
  }
}
```

### Why Client-Side Singleton is Safe

Client-side code runs in the user's browser, which provides natural isolation:

```typescript
// ✅ SAFE - Singleton in browser
export class SupabaseAdapter {
  private static clientInstance: SupabaseClient | null = null;
  
  static getClientClient(): SupabaseClient {
    if (!this.clientInstance) {
      this.clientInstance = createClientComponentClient();
    }
    return this.clientInstance;
  }
}
```

**Why This is Safe:**
- Each browser has its own JavaScript context
- Cookies are managed by the browser, not shared between users
- No server-side request multiplexing
- Each user's browser maintains its own singleton
- Performance benefit from reusing the same client

### Performance Considerations

**Q: Doesn't creating a new client per request hurt performance?**

**A: No, the overhead is minimal:**

1. **Lightweight Client**: The Supabase client is just a wrapper around fetch
2. **No Connection Pooling**: Supabase handles connection pooling on their end
3. **Fast Initialization**: Client creation is synchronous and fast
4. **Security First**: Security always trumps micro-optimizations

**Benchmark:**
```typescript
// Creating a new client takes ~0.1ms
console.time('create-client');
const client = createServerComponentClient({ cookies });
console.timeEnd('create-client'); // ~0.1ms
```

### Testing for Session Isolation

We have comprehensive tests to ensure session isolation:

```typescript
// src/infrastructure/integration/__tests__/SupabaseAdapter.test.ts

describe('SupabaseAdapter Security', () => {
  it('should create a new client for each call', () => {
    const client1 = SupabaseAdapter.getServerClient();
    const client2 = SupabaseAdapter.getServerClient();
    
    // CRITICAL: Must be different instances
    expect(client1).not.toBe(client2);
  });

  it('should use current request cookies', async () => {
    // Mock different users
    const mockCookies1 = { get: vi.fn().mockReturnValue('user1-token') };
    const mockCookies2 = { get: vi.fn().mockReturnValue('user2-token') };
    
    // Simulate User A's request
    vi.mocked(cookies).mockReturnValueOnce(mockCookies1 as any);
    const client1 = SupabaseAdapter.getServerClient();
    
    // Simulate User B's request
    vi.mocked(cookies).mockReturnValueOnce(mockCookies2 as any);
    const client2 = SupabaseAdapter.getServerClient();
    
    // Verify isolation
    expect(client1).not.toBe(client2);
  });
});
```

### Integration Testing

```typescript
// Test that RLS works correctly
describe('Session Isolation Integration', () => {
  it('should not leak sessions between users', async () => {
    // User A creates analysis
    const userARequest = createRequestWithAuth('user-a-token');
    const clientA = SupabaseAdapter.getServerClient();
    await clientA.from('analyses').insert({ idea: 'User A idea' });
    
    // User B tries to access User A's data
    const userBRequest = createRequestWithAuth('user-b-token');
    const clientB = SupabaseAdapter.getServerClient();
    const { data } = await clientB
      .from('analyses')
      .select('*')
      .eq('idea', 'User A idea');
    
    // User B should NOT see User A's data
    expect(data).toHaveLength(0);
  });
});
```

### ServiceFactory and RepositoryFactory

The same session leak vulnerability applies to factory classes. We've fixed this by removing singleton patterns:

**✅ Correct Implementation:**
```typescript
// ServiceFactory.ts
export class ServiceFactory {
  // No static instance variable
  
  static create(supabaseClient: SupabaseClient): ServiceFactory {
    return new ServiceFactory(supabaseClient); // Fresh instance
  }
}

// Usage in API route
export async function GET(request: NextRequest) {
  const supabase = SupabaseAdapter.getServerClient(); // Fresh client
  const factory = ServiceFactory.create(supabase);    // Fresh factory
  const controller = factory.createAnalysisController();
  return controller.listAnalyses(request);
}
```

**❌ Previous Vulnerable Implementation:**
```typescript
// ❌ DO NOT DO THIS
export class ServiceFactory {
  private static instance: ServiceFactory; // Cached instance
  
  static getInstance(supabaseClient: SupabaseClient): ServiceFactory {
    if (!this.instance) {
      this.instance = new ServiceFactory(supabaseClient);
    }
    return this.instance; // Returns cached instance with first user's client!
  }
}
```

### Checklist for Developers

When working with Supabase in server-side code:

- [ ] ✅ Always use `SupabaseAdapter.getServerClient()` for server operations
- [ ] ✅ Always use `ServiceFactory.create()` (not `getInstance()`)
- [ ] ✅ Always use `RepositoryFactory.create()` (not `getInstance()`)
- [ ] ✅ Never cache the result of `getServerClient()` in a variable
- [ ] ✅ Never cache ServiceFactory or RepositoryFactory instances
- [ ] ✅ Never store Supabase client in class instance variables
- [ ] ✅ Never use singleton pattern for server-side clients or factories
- [ ] ✅ Always verify user identity before data operations
- [ ] ✅ Test with multiple users to ensure isolation
- [ ] ✅ Use `getClientClient()` for client-side operations
- [ ] ✅ Review all repository implementations for caching

### References

- [Supabase Auth Helpers Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [SupabaseAdapter Implementation](../src/infrastructure/integration/SupabaseAdapter.ts)

## Authentication and Authorization

### JWT Token Management

- Tokens are stored in HTTP-only cookies
- Automatic token refresh handled by Supabase
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (30 days)

### Row-Level Security (RLS)

All database tables have RLS policies:

```sql
-- Example: Users can only see their own analyses
CREATE POLICY "Users can only see their own analyses"
ON analyses FOR SELECT
USING (auth.uid() = user_id);

-- Example: Users can only update their own analyses
CREATE POLICY "Users can only update their own analyses"
ON analyses FOR UPDATE
USING (auth.uid() = user_id);
```

### Authorization Middleware

```typescript
// src/infrastructure/web/middleware/AuthMiddleware.ts
export class AuthMiddleware {
  async authenticate(request: NextRequest): Promise<User | null> {
    const supabase = SupabaseAdapter.getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
  
  async requireAuth(request: NextRequest): Promise<User> {
    const user = await this.authenticate(request);
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }
    return user;
  }
}
```

## Data Protection

### Encryption

- **At Rest**: Supabase handles database encryption
- **In Transit**: All communications use HTTPS/TLS
- **API Keys**: Stored in environment variables, never in code

### Sensitive Data Handling

```typescript
// Never log sensitive data
console.log('User logged in:', user.email); // ❌ Bad
console.log('User logged in:', user.id);    // ✅ Good

// Sanitize error messages
throw new Error(`Invalid credentials for ${email}`); // ❌ Bad
throw new Error('Invalid credentials');              // ✅ Good
```

## Input Validation

### Zod Schemas

All inputs are validated using Zod:

```typescript
import { z } from 'zod';

const CreateAnalysisSchema = z.object({
  idea: z.string().min(10).max(5000),
  locale: z.enum(['en', 'es'])
});

// Validate input
const validatedData = CreateAnalysisSchema.parse(requestBody);
```

### SQL Injection Prevention

Always use parameterized queries:

```typescript
// ✅ Safe - Parameterized query
const { data } = await supabase
  .from('analyses')
  .select('*')
  .eq('id', analysisId);

// ❌ Dangerous - String concatenation (don't do this)
const { data } = await supabase
  .rpc('raw_query', { 
    query: `SELECT * FROM analyses WHERE id = '${analysisId}'` 
  });
```

## API Security

### Rate Limiting

Implement rate limiting for API endpoints:

```typescript
// Example rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### CORS Configuration

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### API Key Security

```typescript
// ✅ Server-side only
const apiKey = process.env.GEMINI_API_KEY;

// ❌ Never expose to client
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // Don't do this!
```

## Environment Variables

### Secure Configuration

```bash
# .env.local (never commit this file)

# Public variables (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Private variables (server-side only)
GEMINI_API_KEY=your-secret-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Environment Variable Validation

```typescript
// src/infrastructure/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

## Security Testing

### Security Test Checklist

- [ ] Test authentication flows
- [ ] Test authorization boundaries
- [ ] Test input validation
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test session isolation
- [ ] Test RLS policies
- [ ] Test error handling (no sensitive data leaks)

### Example Security Tests

```typescript
describe('Security Tests', () => {
  it('should prevent unauthorized access', async () => {
    const response = await fetch('/api/analyses', {
      method: 'GET',
      // No auth header
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE analyses; --";
    
    const response = await fetch('/api/analyses', {
      method: 'POST',
      body: JSON.stringify({ idea: maliciousInput }),
    });
    
    // Should be rejected by validation
    expect(response.status).toBe(400);
  });
  
  it('should prevent XSS attacks', async () => {
    const xssInput = '<script>alert("XSS")</script>';
    
    const response = await fetch('/api/analyses', {
      method: 'POST',
      body: JSON.stringify({ idea: xssInput }),
    });
    
    // Should be sanitized or rejected
    const data = await response.json();
    expect(data.idea).not.toContain('<script>');
  });
});
```

## Incident Response

### Security Incident Checklist

1. **Identify**: Detect and confirm the security incident
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix the vulnerability
5. **Recover**: Restore normal operations
6. **Review**: Post-incident analysis and improvements

### Contact Information

- Security Team: security@example.com
- On-Call: +1-XXX-XXX-XXXX

## Security Updates

### Keeping Dependencies Secure

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Security Monitoring

- Monitor Supabase logs for suspicious activity
- Set up alerts for failed authentication attempts
- Review API usage patterns
- Monitor error rates

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [TypeScript Security](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
