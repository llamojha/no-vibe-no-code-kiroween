import { NextResponse, NextRequest } from 'next/server';
import { transcribeAudio } from '@/lib/server/ai/transcribeAudio';
import type { SupportedLocale } from '@/features/locale/translations';
import { authenticateRequestPaidOrAdmin } from '@/src/infrastructure/web/middleware/AuthMiddleware';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Use the new authentication middleware
    const authResult = await authenticateRequestPaidOrAdmin(request as NextRequest);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

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
