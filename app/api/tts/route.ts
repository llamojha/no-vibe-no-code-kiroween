import { NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/server/ai/textToSpeech';
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
    const { text, locale } = body as {
      text?: string;
      locale?: SupportedLocale;
    };

    if (!text || !locale) {
      return NextResponse.json(
        { error: 'Text and locale are required.' },
        { status: 400 },
      );
    }

    const audio = await generateSpeech(text, locale);
    return NextResponse.json({ audio });
  } catch (error) {
    console.error('TTS API error', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate audio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
