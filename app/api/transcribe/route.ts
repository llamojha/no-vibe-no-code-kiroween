import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/server/ai/transcribeAudio';
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
    const { audio, mimeType, locale } = body as {
      audio?: string;
      mimeType?: string;
      locale?: SupportedLocale;
    };

    if (!audio || !mimeType || !locale) {
      return NextResponse.json(
        { error: 'Audio, mimeType, and locale are required.' },
        { status: 400 },
      );
    }

    const transcription = await transcribeAudio(audio, mimeType, locale);
    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Transcription API error', error);
    const message =
      error instanceof Error ? error.message : 'Failed to transcribe audio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
