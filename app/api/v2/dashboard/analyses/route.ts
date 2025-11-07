import { NextRequest } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { handleApiError } from '@/src/infrastructure/web/middleware/ErrorMiddleware';

export const runtime = 'nodejs';

/**
 * Get user analyses
 * GET /api/v2/dashboard/analyses
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const controller = serviceFactory.createDashboardController();
    
    return await controller.getUserAnalyses(request);
  } catch (error) {
    return handleApiError(error, '/api/v2/dashboard/analyses');
  }
}