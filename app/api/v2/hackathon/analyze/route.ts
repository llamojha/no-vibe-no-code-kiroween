import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { serverSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Analyze hackathon project
 * POST /api/v2/hackathon/analyze
 */
export async function POST(request: NextRequest) {
  try {
    // Get Supabase client and create service factory
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    
    // Create hackathon controller
    const hackathonController = serviceFactory.createHackathonController();
    
    // Delegate to controller
    return await hackathonController.analyzeHackathonProject(request);
  } catch (error) {
    console.error('V2 Hackathon Analyze API error', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to analyze hackathon project.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}