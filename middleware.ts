import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow PostHog ingest endpoints to bypass trailing slash redirects and auth
  // so both `/ingest` and `/ingest/` work reliably for analytics.
  if (pathname.startsWith("/ingest")) {
    return NextResponse.next();
  }

  // Recreate Next.js's default trailing-slash redirect behavior for all
  // non-PostHog routes: `/path/` → `/path` (excluding the root path).
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  try {
    // Use getUser() to validate user authenticity with the auth server
    // This is more secure than getSession() as it verifies the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      // Log authentication error but don't block the request
      // Protected routes will handle authentication at the route level
      console.warn("Middleware authentication warning:", userError.message);
    }

    if (!user) {
      // No authenticated user - this is fine for public routes
      // Protected routes will handle authentication at the route level
      return response;
    }

    // User is authenticated and verified
    // Get session to ensure auth state is properly maintained
    // This is important for the Supabase auth helpers to work correctly
    await supabase.auth.getSession();

    // The actual authentication and authorization logic is handled
    // by the AuthMiddleware in the hexagonal architecture
    // This middleware only ensures the Supabase session is maintained
    // and validates user authenticity

    return response;
  } catch (error) {
    // Handle unexpected errors gracefully
    console.error(
      "Middleware error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Don't block the request on middleware errors
    // Protected routes will handle authentication at the route level
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons|screenshots|favicon.ico|manifest\\.webmanifest).*)",
  ],
};
