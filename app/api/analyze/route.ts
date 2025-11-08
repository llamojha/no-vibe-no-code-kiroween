import { NextRequest } from 'next/server';
import { getControllers, createAPIRouteHandler } from '@/src/infrastructure/bootstrap/nextjs';
import { logger, LogCategory } from '@/lib/logger';

export const runtime = 'nodejs';

// Create handlers using the new hexagonal architecture
const handlers = createAPIRouteHandler({
  POST: async (request: NextRequest) => {
    const startTime = Date.now();
    logger.info(LogCategory.API, 'POST /api/analyze - Creating new analysis', {
      method: 'POST',
      path: '/api/analyze'
    });

    try {
      const { analysisController } = await getControllers();
      const response = await analysisController.createAnalysis(request);
      
      const duration = Date.now() - startTime;
      logger.info(LogCategory.API, 'POST /api/analyze - Completed', {
        statusCode: response.status,
        duration
      });

      return response;
    } catch (error) {
      logger.error(LogCategory.API, 'POST /api/analyze - Failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  GET: async (request: NextRequest) => {
    const startTime = Date.now();
    logger.info(LogCategory.API, 'GET /api/analyze - Listing analyses', {
      method: 'GET',
      path: '/api/analyze'
    });

    try {
      const { analysisController } = await getControllers();
      const response = await analysisController.listAnalyses(request);
      
      const duration = Date.now() - startTime;
      logger.info(LogCategory.API, 'GET /api/analyze - Completed', {
        statusCode: response.status,
        duration
      });

      return response;
    } catch (error) {
      logger.error(LogCategory.API, 'GET /api/analyze - Failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }
});

export const POST = handlers.POST;
export const GET = handlers.GET;
