import { NextRequest, NextResponse } from "next/server";
import {
  generateFrankensteinIdea,
  type FrankensteinElement,
} from "@/features/doctor-frankenstein/api/generateFrankensteinIdea";
import {
  MockModeHelper,
  MockConfigurationError,
} from "@/lib/testing/api/mock-mode-helper";
import { MockFrankensteinService } from "@/lib/testing/mocks/MockFrankensteinService";
import { TestDataManager } from "@/lib/testing/TestDataManager";
import { logger, LogCategory } from "@/lib/logger";
import type { TestScenario } from "@/lib/testing/types";
import { TestEnvironmentConfig } from "@/lib/testing/config/test-environment";
import { NextJSBootstrap } from "@/src/infrastructure/bootstrap/nextjs";
import { authenticateRequest } from "@/src/infrastructure/web/middleware/AuthMiddleware";
import { withCreditCheck } from "@/src/infrastructure/web/middleware/CreditCheckMiddleware";
import { UserId, AnalysisId, AnalysisType } from "@/src/domain/value-objects";
import { handleApiError } from "@/src/infrastructure/web/middleware/ErrorMiddleware";
import {
  trackServerAnalysisRequest,
  trackServerError,
} from "@/features/analytics/server-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let trackedUserId: string | null = null;
  let trackedUserTier: Parameters<typeof trackServerAnalysisRequest>[2];

  try {
    await NextJSBootstrap.initialize();

    // Use MockModeHelper to get mock mode status and validate environment
    const mockModeStatus = MockModeHelper.getMockModeStatus();
    const config = MockModeHelper.getConfiguration();
    const mockModeActive = MockModeHelper.isMockModeActive();

    const serviceFactory = mockModeActive
      ? MockModeHelper.createServiceFactory()
      : await NextJSBootstrap.getServiceFactory();
    const useCaseFactory = serviceFactory.getUseCaseFactory();
    const repositoryFactory = serviceFactory.getRepositoryFactory();
    const checkCreditsUseCase = useCaseFactory.createCheckCreditsUseCase();
    const deductCreditUseCase = useCaseFactory.createDeductCreditUseCase();
    const userRepository = repositoryFactory.createUserRepository();

    logger.info(
      LogCategory.API,
      "POST /api/doctor-frankenstein/generate - Generating idea",
      {
        method: "POST",
        path: "/api/doctor-frankenstein/generate",
        mockMode: mockModeStatus.mockMode,
        scenario: mockModeStatus.scenario,
      }
    );

    const body = await request.json();
    const { elements, mode, language } = body;

    // Authenticate request - all logged-in users can access
    const authResult = await authenticateRequest(request, {
      allowFree: true,
    });

    if (!authResult.success) {
      logger.warn(
        LogCategory.API,
        "POST /api/doctor-frankenstein/generate - Authentication failed",
        {
          error: authResult.error,
          hasUserId: !!authResult.userId,
          userTier: authResult.userTier,
        }
      );
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    trackedUserId = authResult.userId || null;
    trackedUserTier = authResult.userTier;

    logger.info(
      LogCategory.API,
      "POST /api/doctor-frankenstein/generate - User authenticated",
      {
        userId: trackedUserId,
        userTier: trackedUserTier,
      }
    );

    if (trackedUserId) {
      await trackServerAnalysisRequest(
        trackedUserId,
        "frankenstein",
        trackedUserTier
      );
    }

    const userId = UserId.fromString(authResult.userId);

    logger.info(
      LogCategory.API,
      "POST /api/doctor-frankenstein/generate - Checking credits",
      {
        userId: userId.value,
      }
    );

    await withCreditCheck(userId, checkCreditsUseCase, userRepository);

    logger.info(
      LogCategory.API,
      "POST /api/doctor-frankenstein/generate - Credit check passed",
      {
        userId: userId.value,
      }
    );

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return NextResponse.json(
        { error: "Elements array is required" },
        { status: 400 }
      );
    }

    if (!mode || !["companies", "aws"].includes(mode)) {
      return NextResponse.json(
        { error: "Mode must be 'companies' or 'aws'" },
        { status: 400 }
      );
    }

    const lang = language === "es" ? "es" : "en";

    let result;

    // Route to mock service when enabled
    if (mockModeActive) {
      const testDataManager = new TestDataManager();
      const defaultScenario: TestScenario =
        TestEnvironmentConfig.isValidScenario(config.scenario)
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
      const mockService = new MockFrankensteinService(
        testDataManager,
        mockServiceConfig
      );

      logger.info(LogCategory.API, "Using MockFrankensteinService", {
        scenario: mockServiceConfig.defaultScenario,
        simulateLatency: mockServiceConfig.simulateLatency,
      });

      result = await mockService.generateFrankensteinIdea(
        elements as FrankensteinElement[],
        mode as "companies" | "aws",
        lang
      );
    } else {
      // Use production service
      result = await generateFrankensteinIdea(
        elements as FrankensteinElement[],
        mode as "companies" | "aws",
        lang
      );
    }

    // Note: Frankenstein ideas are saved by the client with full metadata
    // The client auto-save includes mode, tech1, tech2, and full analysis in notes field
    // We don't save here to avoid duplicates and to preserve all generation metadata

    const deductResult = await deductCreditUseCase.execute({
      userId,
      analysisType: AnalysisType.FRANKENSTEIN_EXPERIMENT,
      analysisId: AnalysisId.generate().value,
    });

    if (!deductResult.success) {
      logger.error(
        LogCategory.API,
        "Failed to deduct credits after Frankenstein analysis",
        {
          userId: userId.value,
          error: deductResult.error?.message,
        }
      );
    }

    // Add mock mode status to response metadata
    const enhancedResult = {
      ...result,
      _meta: mockModeStatus,
    };

    const duration = Date.now() - startTime;
    logger.info(
      LogCategory.API,
      "POST /api/doctor-frankenstein/generate - Completed",
      {
        duration,
        mockMode: mockModeStatus.mockMode,
      }
    );

    return NextResponse.json(enhancedResult);
  } catch (error) {
    const duration = Date.now() - startTime;

    if (trackedUserId) {
      await trackServerError(
        trackedUserId,
        "frankenstein_generate_error",
        error instanceof Error ? error.message : String(error),
        trackedUserTier
      );
    }

    // Handle mock configuration errors specifically
    if (error instanceof MockConfigurationError) {
      logger.error(
        LogCategory.API,
        "POST /api/doctor-frankenstein/generate - Mock configuration error",
        {
          error: error.message,
          code: error.code,
          details: error.details,
          duration,
        }
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 500 }
      );
    }

    logger.error(
      LogCategory.API,
      "POST /api/doctor-frankenstein/generate - Failed",
      {
        error: error instanceof Error ? error.message : String(error),
        duration,
      }
    );

    return handleApiError(error, "/api/doctor-frankenstein/generate");
  }
}
