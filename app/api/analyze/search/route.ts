import { NextRequest } from 'next/server';
import { getControllers, createAPIRouteHandler } from '@/src/infrastructure/bootstrap/nextjs';

export const runtime = 'nodejs';

// Create handlers using the new hexagonal architecture
const handlers = createAPIRouteHandler({
  GET: async (request: NextRequest) => {
    const { analysisController } = await getControllers();
    return analysisController.searchAnalyses(request);
  }
});

export const GET = handlers.GET;