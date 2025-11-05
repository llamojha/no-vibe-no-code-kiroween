import { NextResponse } from 'next/server';
import { analyzeStartupIdea } from '@/lib/server/ai/analyzeStartupIdea';
import type { SupportedLocale } from '@/features/locale/translations';
import { serverSupabase } from '@/lib/supabase/server';
import { requirePaidOrAdmin } from '@/lib/auth/access';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = serverSupabase();
    const access = await requirePaidOrAdmin(supabase);
    if (!access.allowed) return access.response;

    const body = await request.json();
    const { idea, locale } = body as {
      idea?: string;
      locale?: SupportedLocale;
    };

    if (!idea || !locale) {
      return NextResponse.json(
        { error: 'Idea and locale are required.' },
        { status: 400 },
      );
    }

    const analysis = await analyzeStartupIdea(idea, locale);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze API error', error);
    const message =
      error instanceof Error ? error.message : 'Failed to analyze idea.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
