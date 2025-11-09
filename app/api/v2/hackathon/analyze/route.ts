import { NextRequest, NextResponse } from 'next/server';
import { NextJSBootstrap } from '@/src/infrastructure/bootstrap/nextjs';
import { MockModeHelper, MockConfigurationError } from '@/lib/testing/api/mock-mode-helper';
import { logger, LogCategory } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * Analyze hackathon project
 * POST /api/v2/hackathon/analyze
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Use MockModeHelper to create ServiceFactory with proper mock mode handling
    await NextJSBootstrap.initialize();
    const serviceFactory = MockModeHelper.createServiceFactory();
    const mockModeStatus = MockModeHelper.getMockModeStatus();
    
    logger.info(LogCategory.API, 'POST /api/v2/hackathon/analyze - Analyzing hackathon project', {
      method: 'POST',
      path: '/api/v2/hackathon/analyze',
      mockMode: mockModeStatus.mockMode,
      scenario: mockModeStatus.scenario
    });
    
    // Create hackathon controller
    const hackathonController = serviceFactory.createHackathonController();
    
    // Delegate to controller
    const response = await hackathonController.analyzeHackathonProject(request);
    
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
    logger.info(LogCategory.API, 'POST /api/v2/hackathon/analyze - Completed', {
      statusCode: response.status,
      duration,
      mockMode: mockModeStatus.mockMode
    });
    
    return NextResponse.json(enhancedResponse, { status: response.status });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle mock configuration errors specifically
    if (error instanceof MockConfigurationError) {
      logger.error(LogCategory.API, 'POST /api/v2/hackathon/analyze - Mock configuration error', {
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
    
    logger.error(LogCategory.API, 'POST /api/v2/hackathon/analyze - Failed', {
      error: error instanceof Error ? error.message : String(error),
      duration
    });
    
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to analyze hackathon project.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}