import { NextRequest } from 'next/server';
import { getControllers, createAPIRouteHandler } from '@/src/infrastructure/bootstrap/nextjs';

export const runtime = 'nodejs';

// Create handlers using the new hexagonal architecture
const handlers = createAPIRouteHandler({
  POST: async (request: NextRequest) => {
    const { analysisController } = await getControllers();
    return analysisController.createAnalysis(request);
  },

  GET: async (request: NextRequest) => {
    const { analysisController } = await getControllers();
    return analysisController.listAnalyses(request);
  }
});

export const POST = handlers.POST;
export const GET = handlers.GET;
