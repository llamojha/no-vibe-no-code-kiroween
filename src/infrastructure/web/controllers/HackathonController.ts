import { NextRequest, NextResponse } from "next/server";
import {
  CreateHackathonAnalysisHandler,
  UpdateHackathonAnalysisHandler,
} from "@/src/application/handlers/commands";
import {
  GetHackathonLeaderboardHandler,
  SearchHackathonAnalysesHandler,
} from "@/src/application/handlers/queries";
import { HackathonLeaderboardResponseDTO } from "../dto/HackathonDTO";
import { handleApiError } from "../middleware/ErrorMiddleware";
import { authenticateRequest } from "../middleware/AuthMiddleware";
import { withCreditCheck } from "../middleware/CreditCheckMiddleware";
import { CheckCreditsUseCase } from "@/src/application/use-cases/CheckCreditsUseCase";
import { DeductCreditUseCase } from "@/src/application/use-cases/DeductCreditUseCase";
import { DeductCreditCommand } from "@/src/application/types/commands/CreditCommands";
import { UserId, AnalysisId, AnalysisType, Locale } from "@/src/domain/value-objects";
import { GoogleAIAdapter } from "../../external/ai/GoogleAIAdapter";
import { resolveMockModeFlag } from "@/lib/testing/config/mock-mode-flags";
import { TestDataManager } from "@/lib/testing/TestDataManager";
import { TestEnvironmentConfig } from "@/lib/testing/config/test-environment";
import type { TestScenario } from "@/lib/testing/types";
import type { HackathonAnalysis } from "@/lib/types";
import {
  trackServerAnalysisRequest,
  trackServerError,
} from "@/features/analytics/server-tracking";

/**
 * Controller for hackathon analysis-related API endpoints
 * Handles HTTP requests and delegates to application layer handlers
 */
export class HackathonController {
  private readonly hackathonMockData: TestDataManager;

  constructor(
    private readonly createHackathonAnalysisHandler: CreateHackathonAnalysisHandler,
    private readonly updateHackathonAnalysisHandler: UpdateHackathonAnalysisHandler,
    private readonly getHackathonLeaderboardHandler: GetHackathonLeaderboardHandler,
    private readonly searchHackathonAnalysesHandler: SearchHackathonAnalysesHandler,
    private readonly checkCreditsUseCase: CheckCreditsUseCase,
    private readonly deductCreditUseCase: DeductCreditUseCase
  ) {
    this.hackathonMockData = new TestDataManager();
  }

  /**
   * Analyze hackathon project
   * POST /api/hackathon/analyze
   */
  async analyzeHackathonProject(request: NextRequest): Promise<NextResponse> {
    let trackedUserId: string | null = null;
    let trackedUserTier: Parameters<typeof trackServerAnalysisRequest>[2];

    try {
      // Check if we're in mock mode
      const isMockMode =
        resolveMockModeFlag(process.env.FF_USE_MOCK_API) ||
        resolveMockModeFlag(process.env.NEXT_PUBLIC_FF_USE_MOCK_API);

      // Authenticate request for both mock and production flows
      const authResult = await authenticateRequest(request, {
        requirePaid: true,
        allowFree: false,
      });

      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      trackedUserId = authResult.userId || null;
      trackedUserTier = authResult.userTier;

      if (trackedUserId) {
        void trackServerAnalysisRequest(
          trackedUserId,
          "kiroween",
          trackedUserTier
        );
      }

      const userId = UserId.fromString(authResult.userId);

      // Enforce credit policy before running analysis
      await withCreditCheck(userId, this.checkCreditsUseCase);

      if (isMockMode) {
        // In mock mode, return mock data directly
        return await this.mockAnalyzeHackathonProject(request, userId);
      }

      // Production mode: use the legacy implementation
      return await this.legacyAnalyzeHackathonProject(request, userId);
    } catch (error) {
      if (trackedUserId) {
        void trackServerError(
          trackedUserId,
          "hackathon_analysis_error",
          error instanceof Error ? error.message : String(error),
          trackedUserTier
        );
      }

      return handleApiError(error);
    }
  }

  /**
   * Mock implementation for testing without API calls
   */
  private async mockAnalyzeHackathonProject(
    request: NextRequest,
    userId: UserId
  ): Promise<NextResponse> {
    const body = await request.json();
    const { submission, locale } = body as {
      submission?: {
        description: string;
        supportingMaterials?: {
          screenshots?: string[];
          demoLink?: string;
          additionalNotes?: string;
        };
      };
      locale?: "en" | "es";
    };

    if (!submission || !locale) {
      return NextResponse.json(
        { error: "Project submission and locale are required." },
        { status: 400 }
      );
    }

    const scenario = resolveMockScenario();
    let mockResponse =
      this.hackathonMockData.getMockResponse<HackathonAnalysis>(
        "hackathon",
        scenario
      );

    mockResponse = this.hackathonMockData.customizeMockResponse(
      mockResponse,
      "hackathon",
      {
        locale,
        input: {
          projectDescription: submission.description,
          supportingMaterials: submission.supportingMaterials,
        },
      }
    );

    if (mockResponse.delay && mockResponse.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockResponse.delay));
    }

    const response = NextResponse.json(mockResponse.data, {
      status: mockResponse.statusCode,
      headers: mockResponse.headers,
    });

    await this.recordCreditUsage(userId, AnalysisType.HACKATHON_PROJECT);

    return response;
  }

  /**
   * Legacy implementation for backward compatibility
   * This maintains the existing functionality while we transition to full hexagonal architecture
   */
  private async legacyAnalyzeHackathonProject(
    request: NextRequest,
    userId: UserId
  ): Promise<NextResponse> {
    // Use the new GoogleAI adapter instead of legacy function
    const googleAI = GoogleAIAdapter.create();

    const body = await request.json();
    const { submission, locale } = body as {
      submission?: {
        description: string;
        supportingMaterials?: {
          screenshots?: string[];
          demoLink?: string;
          additionalNotes?: string;
        };
      };
      locale?: "en" | "es";
    };

    if (!submission || !locale) {
      return NextResponse.json(
        { error: "Project submission and locale are required." },
        { status: 400 }
      );
    }

    // Validate required submission fields (only description is required now)
    const validationErrors: string[] = [];

    if (
      typeof submission.description !== "string" ||
      submission.description.trim().length === 0
    ) {
      validationErrors.push("Project description is required.");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: validationErrors.join(" "),
        },
        { status: 400 }
      );
    }

    // Use default category since it's no longer part of submission
    const analysis = await googleAI.analyzeHackathonProject(
      submission.description,
      "costume-contest",
      Locale.fromString(locale)
    );
    if (analysis?.success) {
      await this.recordCreditUsage(userId, AnalysisType.HACKATHON_PROJECT);
    }
    return NextResponse.json(analysis);
  }

  /**
   * Get hackathon leaderboard
   * GET /api/hackathon/leaderboard
   */
  async getLeaderboard(request: NextRequest): Promise<NextResponse> {
    try {
      // For now, return a placeholder response
      // TODO: Implement with hexagonal architecture handlers
      const url = new URL(request.url);
      const category = url.searchParams.get("category") || undefined;

      const responseDTO: HackathonLeaderboardResponseDTO = {
        entries: [],
        category: category as
          | "resurrection"
          | "frankenstein"
          | "skeleton-crew"
          | "costume-contest"
          | undefined,
        total: 0,
      };

      return NextResponse.json(responseDTO);
    } catch (error) {
      return handleApiError(error);
    }
  }

  private async recordCreditUsage(
    userId: UserId,
    analysisType: AnalysisType
  ): Promise<void> {
    const deductCommand: DeductCreditCommand = {
      userId,
      analysisType,
      analysisId: AnalysisId.generate().value,
    };

    const deductResult = await this.deductCreditUseCase.execute(deductCommand);

    if (!deductResult.success) {
      console.error("Failed to deduct credit for hackathon analysis", {
        userId: userId.value,
        error: deductResult.error?.message,
      });
    }
  }

  /**
   * Search hackathon analyses
   * GET /api/hackathon/search
   */
  async searchHackathonAnalyses(request: NextRequest): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const searchTerm = url.searchParams.get("q") || "";
      const category = url.searchParams.get("category") || undefined;
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");

      // For now, return empty results
      // TODO: Implement with hexagonal architecture handlers
      return NextResponse.json({
        analyses: [],
        total: 0,
        page,
        limit,
        searchTerm,
        category,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Update hackathon analysis
   * PUT /api/hackathon/[id]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateHackathonAnalysis(
    request: NextRequest,
    _params: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // For now, return not implemented
      // TODO: Implement with hexagonal architecture handlers
      return NextResponse.json(
        {
          error: "Update functionality not yet implemented in new architecture",
        },
        { status: 501 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Handle OPTIONS preflight requests for CORS
   * OPTIONS /api/hackathon/*
   */
  async handleOptions(_request: NextRequest): Promise<NextResponse> {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
}

function resolveMockScenario(): TestScenario {
  const config = TestEnvironmentConfig.getCurrentConfig();
  const scenario = config.scenario;

  if (TestEnvironmentConfig.isValidScenario(scenario)) {
    return scenario as TestScenario;
  }

  return "success";
}
