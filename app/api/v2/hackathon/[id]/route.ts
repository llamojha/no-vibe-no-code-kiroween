import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { serverSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Update hackathon analysis
 * PUT /api/v2/hackathon/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get Supabase client and create service factory
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    
    // Create hackathon controller
    const hackathonController = serviceFactory.createHackathonController();
    
    // Delegate to controller
    return await hackathonController.updateHackathonAnalysis(request, { params });
  } catch (error) {
    console.error('V2 Hackathon Update API error', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update hackathon analysis.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Get hackathon analysis by ID
 * GET /api/v2/hackathon/[id]
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get Supabase client and create service factory
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    
    // Create hackathon controller
    const hackathonController = serviceFactory.createHackathonController();
    
    // For now, redirect to search with ID filter
    // TODO: Implement dedicated getById method in controller
    const url = new URL(request.url);
    url.pathname = '/api/v2/hackathon/search';
    url.searchParams.set('id', params.id);
    
    const searchRequest = new NextRequest(url, {
      method: 'GET',
      headers: request.headers
    });
    
    return await hackathonController.searchHackathonAnalyses(searchRequest);
  } catch (error) {
    console.error('V2 Hackathon Get API error', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to get hackathon analysis.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Delete hackathon analysis
 * DELETE /api/v2/hackathon/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get Supabase client and create service factory
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    
    // Create dashboard controller (which handles delete operations)
    const dashboardController = serviceFactory.createDashboardController();
    
    // Create a mock request for delete operation
    const deleteRequest = new NextRequest(request.url, {
      method: 'DELETE',
      headers: request.headers
    });
    
    return await dashboardController.deleteUserAnalysis(deleteRequest, { params });
  } catch (error) {
    console.error('V2 Hackathon Delete API error', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to delete hackathon analysis.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}