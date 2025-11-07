import { NextRequest, NextResponse } from 'next/server';
import { DashboardController } from '../controllers/DashboardController';
import { ServiceFactory } from '../../factories/ServiceFactory';
import { handleApiError } from '../middleware/ErrorMiddleware';

/**
 * Dashboard route handlers for Next.js API routes
 * These functions can be directly used in Next.js route.ts files
 */

/**
 * Get user dashboard route handler
 * GET /api/dashboard
 */
export async function getDashboardRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createDashboardController();
    return await controller.getDashboard(request);
  } catch (error) {
    return handleApiError(error, '/api/dashboard');
  }
}

/**
 * Get user analyses route handler
 * GET /api/dashboard/analyses
 */
export async function getUserAnalysesRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createDashboardController();
    return await controller.getUserAnalyses(request);
  } catch (error) {
    return handleApiError(error, '/api/dashboard/analyses');
  }
}

/**
 * Delete user analysis route handler
 * DELETE /api/dashboard/analyses/[id]
 */
export async function deleteUserAnalysisRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createDashboardController();
    return await controller.deleteUserAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/dashboard/analyses/${params.id}`);
  }
}

/**
 * Get user analysis route handler
 * GET /api/dashboard/analyses/[id]
 */
export async function getUserAnalysisRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createDashboardController();
    return await controller.getUserAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/dashboard/analyses/${params.id}`);
  }
}