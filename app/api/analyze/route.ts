import { NextRequest, NextResponse } from 'next/server';
import { NextJSBootstrap, createAPIRouteHandler } from '@/src/infrastructure/bootstrap/nextjs';
import { logger, LogCategory } from '@/lib/logger';
import { MockModeHelper, MockConfigurationError } from '@/lib/testing/api/mock-mode-helper';

export const runtime = 'nodejs';

// Create handlers using the new hexagonal architecture
const handlers = createAPIRouteHandler({
  POST: async (request: NextRequest) => {
    const startTime = Date.now();
    
    try {
      // Use MockModeHelper to create ServiceFactory with proper mock mode handling
      await NextJSBootstrap.initialize();
      const serviceFactory = MockModeHelper.createServiceFactory();
      const mockModeStatus = MockModeHelper.getMockModeStatus();
      
      logger.info(LogCategory.API, 'POST /api/analyze - Creating new analysis', {
        method: 'POST',
        path: '/api/analyze',
        mockMode: mockModeStatus.mockMode,
        scenario: mockModeStatus.scenario
      });

      const analysisController = serviceFactory.createAnalysisController();
      const response = await analysisController.createAnalysis(request);
      
      // Parse response to add mock mode status to metadata
      const responseData = await response.json();
      const enhancedResponse = {
        ...responseData,
        _meta: {
          ...responseData._meta,
          ...mockModeStatus
        }
      };
      
      const duration = Date.now() - startTime;
      logger.info(LogCategory.API, 'POST /api/analyze - Completed', {
        statusCode: response.status,
        duration,
        mockMode: mockModeStatus.mockMode
      });

      return NextResponse.json(enhancedResponse, { status: response.status });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle mock configuration errors specifically
      if (error instanceof MockConfigurationError) {
        logger.error(LogCategory.API, 'POST /api/analyze - Mock configuration error', {
          error: error.message,
          code: error.code,
          details: error.details,
          duration
        });
        
        return NextResponse.json(
          { 
            error: error.message,
            code: error.code,
            details: error.details
          },
          { status: 500 }
        );
      }
      
      logger.error(LogCategory.API, 'POST /api/analyze - Failed', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw error;
    }
  },

  GET: async (request: NextRequest) => {
    const startTime = Date.now();
    
    try {
      // Use MockModeHelper for GET requests as well
      await NextJSBootstrap.initialize();
      const serviceFactory = MockModeHelper.createServiceFactory();
      const mockModeStatus = MockModeHelper.getMockModeStatus();
      
      logger.info(LogCategory.API, 'GET /api/analyze - Listing analyses', {
        method: 'GET',
        path: '/api/analyze',
        mockMode: mockModeStatus.mockMode
      });

      const analysisController = serviceFactory.createAnalysisController();
      const response = await analysisController.listAnalyses(request);
      
      const duration = Date.now() - startTime;
      logger.info(LogCategory.API, 'GET /api/analyze - Completed', {
        statusCode: response.status,
        duration,
        mockMode: mockModeStatus.mockMode
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle mock configuration errors
      if (error instanceof MockConfigurationError) {
        logger.error(LogCategory.API, 'GET /api/analyze - Mock configuration error', {
          error: error.message,
          code: error.code,
          details: error.details,
          duration
        });
        
        return NextResponse.json(
          { 
            error: error.message,
            code: error.code,
            details: error.details
          },
          { status: 500 }
        );
      }
      
      logger.error(LogCategory.API, 'GET /api/analyze - Failed', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw error;
    }
  }
});

export const POST = handlers.POST;
export const GET = handlers.GET;
