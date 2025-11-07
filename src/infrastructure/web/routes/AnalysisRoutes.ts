import { NextRequest, NextResponse } from 'next/server';
import { AnalysisController } from '../controllers/AnalysisController';
import { ServiceFactory } from '../../factories/ServiceFactory';
import { handleApiError } from '../middleware/ErrorMiddleware';

/**
 * Analysis route handlers for Next.js API routes
 * These functions can be directly used in Next.js route.ts files
 */

/**
 * Create analysis route handler
 * POST /api/analyze
 */
export async function createAnalysisRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createAnalysisController();
    return await controller.createAnalysis(request);
  } catch (error) {
    return handleApiError(error, '/api/analyze');
  }
}

/**
 * Get analysis by ID route handler
 * GET /api/analyze/[id]
 */
export async function getAnalysisRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createAnalysisController();
    return await controller.getAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/analyze/${params.id}`);
  }
}

/**
 * List analyses route handler
 * GET /api/analyze
 */
export async function listAnalysesRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createAnalysisController();
    return await controller.listAnalyses(request);
  } catch (error) {
    return handleApiError(error, '/api/analyze');
  }
}

/**
 * Update analysis route handler
 * PUT /api/analyze/[id]
 */
export async function updateAnalysisRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createAnalysisController();
    return await controller.updateAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/analyze/${params.id}`);
  }
}

/**
 * Delete analysis route handler
 * DELETE /api/analyze/[id]
 */
export async function deleteAnalysisRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createAnalysisController();
    return await controller.deleteAnalysis(request, { params });
  } catch (error) {
    return handleApiError(error, `/api/analyze/${params.id}`);
  }
}

/**
 * Search analyses route handler
 * GET /api/analyze/search
 */
export async function searchAnalysesRoute(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const controller = serviceFactory.createAnalysisController();
    return await controller.searchAnalyses(request);
  } catch (error) {
    return handleApiError(error, '/api/analyze/search');
  }
}