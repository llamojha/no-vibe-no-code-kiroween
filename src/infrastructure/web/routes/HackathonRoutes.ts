import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { ServiceFactory } from '../../factories/ServiceFactory';
import { handleApiError } from '../middleware/ErrorMiddleware';

/**
 * Hackathon route handlers for Next.js API routes
 * These functions can be directly used in Next.js route.ts files
 */

/**
 * Analyze hackathon project route handler
 * POST /api/hackathon/analyze
 */
export async function analyzeHackathonProjectRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance(serverSupabase());
    const controller = serviceFactory.createHackathonController();
    return await controller.analyzeHackathonProject(request);
  } catch (error) {
    return handleApiError(error, '/api/hackathon/analyze');
  }
}

/**
 * Get hackathon leaderboard route handler
 * GET /api/hackathon/leaderboard
 */
export async function getHackathonLeaderboardRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance(serverSupabase());
    const controller = serviceFactory.createHackathonController();
    return await controller.getLeaderboard(request);
  } catch (error) {
    return handleApiError(error, '/api/hackathon/leaderboard');
  }
}

/**
 * Search hackathon analyses route handler
 * GET /api/hackathon/search
 */
export async function searchHackathonAnalysesRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance(serverSupabase());
    const controller = serviceFactory.createHackathonController();
    return await controller.searchHackathonAnalyses(request);
  } catch (error) {
    return handleApiError(error, '/api/hackathon/search');
  }
}

/**
 * Update hackathon analysis route handler
 * PUT /api/hackathon/[id]
 */
export async function updateHackathonAnalysisRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance(serverSupabase());
    const controller = serviceFactory.createHackathonController();
    return await controller.updateHackathonAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/hackathon/${params.id}`);
  }
}

