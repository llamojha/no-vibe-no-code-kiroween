# SSR Performance Findings

## 1. Middleware forces Supabase round trips on every request
- The global `middleware` calls `supabase.auth.getUser()` and `supabase.auth.getSession()` for *all* paths matched by the very broad matcher, even for public routes or already-authenticated responses (`middleware.ts:21`). That means every SSR page load pays two extra network calls before your page code runs.
- These calls are duplicated later by route-level helpers, so the middleware work rarely contributes useful data.
- **Recommendation:** Limit the matcher to only the paths that truly need pre-auth (e.g., `/dashboard(.*)`), or drop the Supabase calls here and rely on the route-level helpers you already have. If you still need middleware, cache the result in a request header instead of re-hitting Supabase in the page.

## 2. Server components re-authenticate the same user multiple times
- Pages such as the dashboard/analyzer/doctor views call `isAuthenticated`, `getCurrentUserId`, `getCurrentUser`, and `getSessionContext` sequentially (`app/dashboard/page.tsx:41`, `app/analyzer/page.tsx:31`, `app/doctor-frankenstein/page.tsx:31`). Each helper creates a fresh Supabase client, spins up a new `ServiceFactory`, and eventually calls `AuthenticationService.getSession()` again (`src/infrastructure/web/helpers/serverAuth.ts:16`).
- `AuthenticationService.getSession()` performs both `supabase.auth.getUser()` and `supabase.auth.getSession()` every time (`src/application/services/AuthenticationService.ts:212`), so a single page render ends up hitting Supabase 6–8 times *before* it fetches any real data.
- **Recommendation:** Hydrate the `AuthenticationService` once per request (e.g., via `cache(() => ...)` or by passing the instance down), expose a single `getSessionContext()` that returns user, tier, and id together, and reuse that object throughout the page. Also consider `Promise.all` for independent data fetches so the Supabase calls can run in parallel.

## 3. `SessionService.getSessionContext` amplifies the problem
- `getSessionContext` invokes `getCurrentUser`, `getCurrentUserId`, `isAuthenticated`, and then triggers another `authenticateRequest` just to read the tier (`src/application/services/SessionService.ts:29`).
- Because each of those helper methods calls `getSession()` internally, a single `getSessionContext()` call results in at least four additional Supabase `auth` round trips plus an extra profiles query for the tier check (`src/application/services/AuthenticationService.ts:320`).
- **Recommendation:** Refactor `AuthenticationService.getSession()` to return `{sessionInfo, tier, user}` in one shot, memoize it per request, and let `SessionService` reuse that data instead of re-deriving it piecemeal. Even caching `getSession()` in-memory for the lifetime of the request cuts the number of Supabase calls by ~80%.

## 4. Server actions invoke HTTP controllers instead of business logic
- `getDashboardDataAction` and `getUserAnalysesAction` authenticate the user, then construct mock `NextRequest` objects, call controller methods, await the `NextResponse`, and parse JSON (`app/actions/dashboard.ts:23`). The controllers *again* call `authenticateRequest`, so each dashboard load authenticates three separate times (`src/infrastructure/web/controllers/DashboardController.ts:41`).
- This pattern doubles the serialization cost (JSON ↔️ JS ↔️ JSON) and adds extra Supabase lookups just to reach the same use cases that are already available in-process.
- **Recommendation:** Call the `GetDashboardStatsUseCase`/`GetUserAnalysesUseCase` directly from the server action (or, even better, from the server component itself) and pass the already-validated session context into them. You’ll save a full Supabase auth cycle plus the JSON encode/decode path per request.

## 5. Client immediately re-fetches data that was just SSR’d
- `UserDashboard` triggers `refreshAnalyses()` inside `useEffect`, which fire-and-forgets another Supabase read as soon as the hydrated bundle mounts (`features/dashboard/components/UserDashboard.tsx:64`). Because the SSR payload already contained `initialAnalyses`, users pay for the same query twice and you lose the perceived benefit of SSR when the list flickers after hydration.
- **Recommendation:** Only re-fetch if the user interacts (e.g., manual refresh button) or when SWR detects staleness. If you need automatic refresh, defer it with a timer so it doesn’t contend with the initial paint.

## 6. Verbose logging on hot paths
- Several SSR pages log full session contexts on every request (`app/analyzer/page.tsx:37`, `app/kiroween-analyzer/page.tsx:37`). Under load, console I/O on the server can become a noticeable chunk of the response time, especially when combined with the excessive Supabase calls above.
- **Recommendation:** Gate these logs behind a debug flag or remove them entirely once issues are resolved.

## Suggested Next Steps
1. Profile one slow page (e.g., `/dashboard`) with `serverTiming` headers or simple `performance.now()` checkpoints to quantify the latency each auth hop adds.
2. Refactor the authentication/session helpers to return a cached context object, then remove the redundant `isAuthenticated`/`getCurrentUserId` calls from the pages.
3. Replace the controller-based server actions with direct use-case calls and delete the global Supabase calls from `middleware.ts` to avoid doing work twice.
