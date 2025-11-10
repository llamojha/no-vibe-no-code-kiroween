import { NextRequest, NextResponse } from "next/server";
import { generateFrankensteinIdea, type FrankensteinElement } from "@/features/doctor-frankenstein/api/generateFrankensteinIdea";
import { MockModeHelper, MockConfigurationError } from "@/lib/testing/api/mock-mode-helper";
import { MockFrankensteinService } from "@/lib/testing/mocks/MockFrankensteinService";
import { TestDataManager } from "@/lib/testing/TestDataManager";
import { logger, LogCategory } from "@/lib/logger";
import type { TestScenario } from "@/lib/testing/types";
import { TestEnvironmentConfig } from "@/lib/testing/config/test-environment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Use MockModeHelper to get mock mode status and validate environment
    const mockModeStatus = MockModeHelper.getMockModeStatus();
    const config = MockModeHelper.getConfiguration();
    
    logger.info(LogCategory.API, 'POST /api/doctor-frankenstein/generate - Generating idea', {
      method: 'POST',
      path: '/api/doctor-frankenstein/generate',
      mockMode: mockModeStatus.mockMode,
      scenario: mockModeStatus.scenario
    });

    const body = await request.json();
    const { elements, mode, language } = body;

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return NextResponse.json(
        { error: "Elements array is required" },
        { status: 400 }
      );
    }

    if (!mode || !['companies', 'aws'].includes(mode)) {
      return NextResponse.json(
        { error: "Mode must be 'companies' or 'aws'" },
        { status: 400 }
      );
    }

    const lang = language === 'es' ? 'es' : 'en';

    let result;
    
    // Route to mock service when enabled
    if (mockModeStatus.mockMode) {
      const testDataManager = new TestDataManager();
      const defaultScenario: TestScenario = TestEnvironmentConfig.isValidScenario(config.scenario)
        ? config.scenario
        : "success";
      const mockServiceConfig = {
        defaultScenario,
        enableVariability: false,
        simulateLatency: config.simulateLatency,
        minLatency: 100,
        maxLatency: 500,
        logRequests: false,
      };
      const mockService = new MockFrankensteinService(testDataManager, mockServiceConfig);
      
      logger.info(LogCategory.API, 'Using MockFrankensteinService', {
        scenario: mockServiceConfig.defaultScenario,
        simulateLatency: mockServiceConfig.simulateLatency
      });
      
      result = await mockService.generateFrankensteinIdea(
        elements as FrankensteinElement[],
        mode as 'companies' | 'aws',
        lang
      );
    } else {
      // Use production service
      result = await generateFrankensteinIdea(
        elements as FrankensteinElement[],
        mode as 'companies' | 'aws',
        lang
      );
    }

    // Add mock mode status to response metadata
    const enhancedResult = {
      ...result,
      _meta: mockModeStatus
    };

    const duration = Date.now() - startTime;
    logger.info(LogCategory.API, 'POST /api/doctor-frankenstein/generate - Completed', {
      duration,
      mockMode: mockModeStatus.mockMode
    });

    return NextResponse.json(enhancedResult);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle mock configuration errors specifically
    if (error instanceof MockConfigurationError) {
      logger.error(LogCategory.API, 'POST /api/doctor-frankenstein/generate - Mock configuration error', {
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
    
    logger.error(LogCategory.API, 'POST /api/doctor-frankenstein/generate - Failed', {
      error: error instanceof Error ? error.message : String(error),
      duration
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate idea" },
      { status: 500 }
    );
  }
}
