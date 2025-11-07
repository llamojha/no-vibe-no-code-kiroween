import { NextResponse, NextRequest } from 'next/server';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { Locale } from '@/src/domain/value-objects';
import type { SupportedLocale } from '@/features/locale/translations';
import { authenticateRequestPaidOrAdmin } from '@/src/infrastructure/web/middleware/AuthMiddleware';
import { serverSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Use the new authentication middleware
    const authResult = await authenticateRequestPaidOrAdmin();
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

    // Use the new hexagonal architecture
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const ttsAdapter = serviceFactory.createTextToSpeechAdapter();
    const domainLocale = Locale.fromString(locale);

    const result = await ttsAdapter.convertTextToSpeech(text, domainLocale);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      audio: result.data.audioBase64,
      mimeType: result.data.mimeType,
      duration: result.data.duration
    });
  } catch (error) {
    console.error('TTS API error', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate audio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
