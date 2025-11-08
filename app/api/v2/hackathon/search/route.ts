import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { serverSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Search hackathon analyses
 * GET /api/v2/hackathon/search
 */
export async function GET(request: NextRequest) {
  try {
    // Get Supabase client and create service factory
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    
    // Create hackathon controller
    const hackathonController = serviceFactory.createHackathonController();
    
    // Delegate to controller
    return await hackathonController.searchHackathonAnalyses(request);
  } catch (error) {
    console.error('V2 Hackathon Search API error', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to search hackathon analyses.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
