import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Get session to ensure auth state is properly maintained
  // This is important for the Supabase auth helpers to work correctly
  await supabase.auth.getSession();
  
  // The actual authentication and authorization logic is handled
  // by the AuthMiddleware in the hexagonal architecture
  // This middleware only ensures the Supabase session is maintained
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|icons|screenshots|favicon.ico|manifest\\.webmanifest).*)',
  ],
};
