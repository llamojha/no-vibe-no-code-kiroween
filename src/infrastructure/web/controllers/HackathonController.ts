import { NextRequest, NextResponse } from 'next/server';
import { 
  CreateHackathonAnalysisHandler,
  UpdateHackathonAnalysisHandler 
} from '@/src/application/handlers/commands';
import { 
  GetHackathonLeaderboardHandler,
  SearchHackathonAnalysesHandler 
} from '@/src/application/handlers/queries';
import { HackathonLeaderboardResponseDTO } from '../dto/HackathonDTO';
import { handleApiError } from '../middleware/ErrorMiddleware';
import { authenticateRequest } from '../middleware/AuthMiddleware';
import { GoogleAIAdapter } from '../../external/ai/GoogleAIAdapter';
import { Locale } from '@/src/domain/value-objects';

/**
 * Controller for hackathon analysis-related API endpoints
 * Handles HTTP requests and delegates to application layer handlers
 */
export class HackathonController {
  constructor(
    private readonly createHackathonAnalysisHandler: CreateHackathonAnalysisHandler,
    private readonly updateHackathonAnalysisHandler: UpdateHackathonAnalysisHandler,
    private readonly getHackathonLeaderboardHandler: GetHackathonLeaderboardHandler,
    private readonly searchHackathonAnalysesHandler: SearchHackathonAnalysesHandler
  ) {}

  /**
   * Analyze hackathon project
   * POST /api/hackathon/analyze
   */
  async analyzeHackathonProject(request: NextRequest): Promise<NextResponse> {
    try {
      // For now, delegate to the legacy implementation to maintain compatibility
      // TODO: Fully implement with hexagonal architecture handlers
      return await this.legacyAnalyzeHackathonProject(request);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Legacy implementation for backward compatibility
   * This maintains the existing functionality while we transition to full hexagonal architecture
   */
  private async legacyAnalyzeHackathonProject(request: NextRequest): Promise<NextResponse> {
    // Use the new GoogleAI adapter instead of legacy function
    const googleAI = GoogleAIAdapter.create();

    // Use the new authentication middleware
    const authResult = await authenticateRequest(request, { 
      requirePaid: true, 
      allowFree: false 
    });
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { submission, locale } = body as {
      submission?: {
        description: string;
        selectedCategory: 'resurrection' | 'frankenstein' | 'skeleton-crew' | 'costume-contest';
        kiroUsage: string;
        supportingMaterials?: {
          screenshots?: string[];
          demoLink?: string;
          additionalNotes?: string;
        };
      };
      locale?: 'en' | 'es';
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

    const analysis = await googleAI.analyzeHackathonProject(submission.description, Locale.fromString(locale));
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
      const category = url.searchParams.get('category') || undefined;

      const responseDTO: HackathonLeaderboardResponseDTO = {
        entries: [],
        category: category as 'resurrection' | 'frankenstein' | 'skeleton-crew' | 'costume-contest' | undefined,
        total: 0
      };

      return NextResponse.json(responseDTO);
    } catch (error) {
      return handleApiError(error);
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
      const searchTerm = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category') || undefined;
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      // For now, return empty results
      // TODO: Implement with hexagonal architecture handlers
      return NextResponse.json({
        analyses: [],
        total: 0,
        page,
        limit,
        searchTerm,
        category
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
  async updateHackathonAnalysis(request: NextRequest, _params: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // For now, return not implemented
      // TODO: Implement with hexagonal architecture handlers
      return NextResponse.json(
        { error: 'Update functionality not yet implemented in new architecture' },
        { status: 501 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
}