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

    // Use the new hexagonal architecture
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const transcriptionAdapter = serviceFactory.createTranscriptionAdapter();
    const domainLocale = Locale.fromString(locale);

    const result = await transcriptionAdapter.transcribeIdeaAudio(audio, mimeType, domainLocale);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      transcription: result.data.text,
      confidence: result.data.confidence,
      wordCount: result.data.wordCount,
      duration: result.data.duration
    });
  } catch (error) {
    console.error('Transcription API error', error);
    const message =
      error instanceof Error ? error.message : 'Failed to transcribe audio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
