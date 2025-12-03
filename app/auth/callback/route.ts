import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');

  // Resolve and validate the next URL to avoid open redirects.
  // Only allow redirects that stay on this origin; otherwise, use a safe default.
  const resolveSafeRedirect = (raw: string | null, base: URL): string => {
    const fallback = '/dashboard';
    if (!raw) return fallback;
    try {
      const target = new URL(raw, base);
      if (target.origin !== base.origin) return fallback; // different host/protocol
      const path = `${target.pathname}${target.search}${target.hash}`;
      // Ensure it is a site-relative path
      return path.startsWith('/') ? path : fallback;
    } catch {
      return fallback;
    }
  };

  const redirectTo = resolveSafeRedirect(nextParam, url);

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
