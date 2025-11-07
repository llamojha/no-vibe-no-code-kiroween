import { NextRequest } from 'next/server';
import { getControllers, createAPIRouteHandler } from '@/src/infrastructure/bootstrap/nextjs';

export const runtime = 'nodejs';

// Create handlers using the new hexagonal architecture
const handlers = createAPIRouteHandler({
  GET: async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { analysisController } = await getControllers();
    return analysisController.getAnalysis(request, { params });
  },

  PUT: async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { analysisController } = await getControllers();
    return analysisController.updateAnalysis(request, { params });
  },

  DELETE: async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { analysisController } = await getControllers();
    return analysisController.deleteAnalysis(request, { params });
  }
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;