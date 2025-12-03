import { NextRequest } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { handleApiError } from '@/src/infrastructure/web/middleware/ErrorMiddleware';

export const runtime = 'nodejs';

/**
 * Get user analysis by ID
 * GET /api/v2/dashboard/analyses/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const controller = serviceFactory.createDashboardController();
    
    return await controller.getUserAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/v2/dashboard/analyses/${params.id}`);
  }
}

/**
 * Delete user analysis
 * DELETE /api/v2/dashboard/analyses/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const controller = serviceFactory.createDashboardController();
    
    return await controller.deleteUserAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/v2/dashboard/analyses/${params.id}`);
  }
}