import { NextResponse, NextRequest } from 'next/server';
import { generateSpeech } from '@/lib/server/ai/textToSpeech';
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
