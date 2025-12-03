import { NextRequest } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { handleApiError } from '@/src/infrastructure/web/middleware/ErrorMiddleware';
import { authenticateRequest } from '@/src/infrastructure/web/middleware/AuthMiddleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get user dashboard
 * GET /api/v2/dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request using the new architecture
    const authResult = await authenticateRequest(request, { 
      allowFree: true, 
      updateLastLogin: true 
    });
    
    if (!authResult.success) {
      return Response.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const controller = serviceFactory.createDashboardController();
    
    return await controller.getDashboard(request);
  } catch (error) {
    return handleApiError(error, '/api/v2/dashboard');
  }
}
