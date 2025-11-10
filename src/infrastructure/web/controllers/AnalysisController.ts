import { NextRequest, NextResponse } from 'next/server';
import { 
  CreateAnalysisHandler,
  UpdateAnalysisHandler,
  DeleteAnalysisHandler 
} from '@/src/application/handlers/commands';
import { 
  GetAnalysisHandler,
  ListAnalysesHandler,
  SearchAnalysesHandler 
} from '@/src/application/handlers/queries';
import { CreateAnalysisCommand, UpdateAnalysisCommand, DeleteAnalysisCommand } from '@/src/application/types/commands';
import { GetAnalysisByIdQuery, GetAnalysesByUserQuery, SearchAnalysesQuery } from '@/src/application/types/queries';
import { CreateAnalysisDTO, UpdateAnalysisDTO, AnalysisResponseDTO } from '../dto/AnalysisDTO';
import { CreateAnalysisSchema, UpdateAnalysisSchema } from '../dto/AnalysisDTO';
import { AnalysisId, UserId, Locale, Category } from '@/src/domain/value-objects';
import { handleApiError } from '../middleware/ErrorMiddleware';
import { validateRequest } from '../middleware/ValidationMiddleware';
import { authenticateRequest } from '../middleware/AuthMiddleware';
import { resolveMockModeFlag } from '@/lib/testing/config/mock-mode-flags';

/**
 * Controller for analysis-related API endpoints
 * Handles HTTP requests and delegates to application layer handlers
 */
export class AnalysisController {
  constructor(
    private readonly createAnalysisHandler: CreateAnalysisHandler,
    private readonly updateAnalysisHandler: UpdateAnalysisHandler,
    private readonly deleteAnalysisHandler: DeleteAnalysisHandler,
    private readonly getAnalysisHandler: GetAnalysisHandler,
    private readonly listAnalysesHandler: ListAnalysesHandler,
    private readonly searchAnalysesHandler: SearchAnalysesHandler
  ) {}

  /**
   * Create a new analysis
   * POST /api/analyze
   */
  async createAnalysis(request: NextRequest): Promise<NextResponse> {
    try {
      // Check if we're in mock mode
      const isMockMode =
        resolveMockModeFlag(process.env.FF_USE_MOCK_API) ||
        resolveMockModeFlag(process.env.NEXT_PUBLIC_FF_USE_MOCK_API);

      if (isMockMode) {
        // In mock mode, return mock data directly
        return await this.mockCreateAnalysis(request);
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Validate and parse request body
      const validationResult = await validateRequest(request, CreateAnalysisSchema);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.errors },
          { status: 400 }
        );
      }

      const dto = validationResult.data as CreateAnalysisDTO;
      // Build command and delegate to application handler to persist
      const command = new CreateAnalysisCommand(
        dto.idea,
        UserId.fromString(authResult.userId),
        Locale.fromString(dto.locale),
        dto.category ? Category.createGeneral(dto.category) : undefined
      );

      const result = await this.createAnalysisHandler.handle(command);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to create analysis' },
          { status: 400 }
        );
      }

      const analysis = result.data.analysis;
      const responseDTO: AnalysisResponseDTO = {
        id: analysis.id.value,
        idea: analysis.idea,
        score: analysis.score.value,
        detailedSummary: analysis.feedback || '',
        criteria: [],
        createdAt: analysis.createdAt.toISOString(),
        locale: analysis.locale.value,
        category: analysis.category?.value
      };

      // Keep status 200 to match existing expectations/tests
      return NextResponse.json(responseDTO, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Mock implementation for testing without API calls
   */
  private async mockCreateAnalysis(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const { idea, locale } = body as { idea?: string; locale?: string };

    if (!idea || !locale) {
      return NextResponse.json(
        { error: "Idea and locale are required." },
        { status: 400 }
      );
    }

    // Return mock analysis data matching the Analysis interface
    const mockAnalysis = {
      id: "12345678-1234-4234-8234-123456789012",
      idea: idea,
      detailedSummary: "This is a comprehensive analysis of your startup idea. The concept shows strong market potential and addresses a real pain point in the industry.",
      viabilitySummary: "This is a promising startup idea with strong market potential and clear value proposition.",
      finalScore: 4.1,
      finalScoreExplanation: "The idea demonstrates strong viability with good market fit, feasible implementation, and clear monetization potential.",
      founderQuestions: [
        {
          question: "What is your unique value proposition?",
          why: "Understanding your differentiation is crucial for market positioning",
          suggestedApproach: "Conduct competitor analysis and identify your key advantages"
        },
        {
          question: "Who is your target customer?",
          why: "Precise customer targeting enables effective marketing and product development",
          suggestedApproach: "Create detailed customer personas based on market research"
        }
      ],
      swotAnalysis: {
        strengths: [
          "Clear problem-solution fit",
          "Strong value proposition",
          "Scalable business model",
          "Growing market demand"
        ],
        weaknesses: [
          "Competitive market space",
          "Requires significant initial investment",
          "Technical complexity"
        ],
        opportunities: [
          "Expand to adjacent markets",
          "Leverage emerging technologies",
          "Strategic partnerships potential"
        ],
        threats: [
          "New competitors entering market",
          "Changing regulations",
          "Economic downturn impact"
        ]
      },
      currentMarketTrends: [
        {
          trend: "Digital transformation acceleration",
          relevance: "High relevance to your solution",
          impact: "Positive - increases market demand"
        },
        {
          trend: "Remote work adoption",
          relevance: "Medium relevance",
          impact: "Positive - expands addressable market"
        }
      ],
      scoringRubric: [
        {
          name: "Market Demand",
          score: 4.5,
          maxScore: 5,
          justification: "Strong market demand with clear pain points and growing interest"
        },
        {
          name: "Market Size",
          score: 4.2,
          maxScore: 5,
          justification: "Large addressable market with significant growth potential"
        },
        {
          name: "Uniqueness",
          score: 3.8,
          maxScore: 5,
          justification: "Novel approach with some unique features and differentiation"
        },
        {
          name: "Scalability",
          score: 4.3,
          maxScore: 5,
          justification: "Highly scalable business model with low marginal costs"
        },
        {
          name: "Potential Profitability",
          score: 4.0,
          maxScore: 5,
          justification: "Clear monetization path with multiple revenue streams"
        }
      ],
      competitors: [
        {
          name: "Competitor A",
          strengths: ["Established brand", "Large user base"],
          weaknesses: ["Legacy technology", "Poor user experience"],
          differentiators: "Your solution offers better UX and modern tech stack"
        },
        {
          name: "Competitor B",
          strengths: ["Strong funding", "Fast growth"],
          weaknesses: ["Limited features", "High pricing"],
          differentiators: "Your solution provides more features at competitive pricing"
        }
      ],
      monetizationStrategies: [
        {
          strategy: "Subscription Model",
          viability: "High",
          pros: ["Predictable revenue", "Customer retention"],
          cons: ["Requires ongoing value delivery"],
          estimatedRevenue: "$50-100K MRR within 12 months"
        },
        {
          strategy: "Freemium",
          viability: "Medium",
          pros: ["Low barrier to entry", "Viral growth potential"],
          cons: ["Conversion challenges"],
          estimatedRevenue: "$30-60K MRR within 12 months"
        }
      ],
      improvementSuggestions: [
        {
          area: "Product Development",
          suggestion: "Focus on MVP with core features first",
          priority: "High",
          impact: "Faster time to market and early user feedback",
          effort: "Medium"
        },
        {
          area: "Market Strategy",
          suggestion: "Validate with target customers before full launch",
          priority: "High",
          impact: "Reduced risk and better product-market fit",
          effort: "Low"
        },
        {
          area: "Team Building",
          suggestion: "Bring on technical co-founder or CTO",
          priority: "Medium",
          impact: "Stronger technical execution",
          effort: "High"
        }
      ],
      nextSteps: [
        {
          step: "Validate assumptions with target customers",
          timeline: "Week 1-2",
          resources: "Customer interviews, surveys"
        },
        {
          step: "Build MVP with core features",
          timeline: "Month 1-3",
          resources: "Development team, design resources"
        },
        {
          step: "Launch beta and gather feedback",
          timeline: "Month 3-4",
          resources: "Beta users, analytics tools"
        }
      ],
      createdAt: new Date().toISOString(),
      locale: locale
    };

    return NextResponse.json(mockAnalysis, { status: 200 });
  }

  /**
   * Get analysis by ID
   * GET /api/analyze/[id]
   */
  async getAnalysis(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Create query
      const query = new GetAnalysisByIdQuery(
        AnalysisId.fromString(params.id), 
        authResult.userId ? UserId.fromString(authResult.userId) : undefined
      );

      // Execute query
      const result = await this.getAnalysisHandler.handle(query);

      if (!result.success) {
        return NextResponse.json({ error: result.error?.message || 'Failed to retrieve analysis' }, { status: 400 });
      }

      if (!result.data || !result.data.analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }

      const analysis = result.data.analysis;
      const responseDTO: AnalysisResponseDTO = {
        id: analysis.id.value,
        idea: analysis.idea,
        score: analysis.score.value,
        detailedSummary: analysis.feedback || '',
        criteria: [], // TODO: Map from analysis data when available
        createdAt: analysis.createdAt.toISOString(),
        locale: analysis.locale.value,
        category: analysis.category?.value
      };
      return NextResponse.json(responseDTO);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * List user's analyses
   * GET /api/analyze
   */
  async listAnalyses(request: NextRequest): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      // Create query
      const query = new GetAnalysesByUserQuery(
        UserId.fromString(authResult.userId), 
        { page, limit }
      );

      // Execute query
      const result = await this.listAnalysesHandler.handle(query);

      if (result.success) {
        const responseDTOs: AnalysisResponseDTO[] = result.data.analyses.items.map(analysis => ({
          id: analysis.id.value,
          idea: analysis.idea,
          score: analysis.score.value,
          detailedSummary: analysis.feedback || '',
          criteria: [],
          createdAt: analysis.createdAt.toISOString(),
          locale: analysis.locale.value,
          category: analysis.category?.value
        }));

        return NextResponse.json({
          analyses: responseDTOs,
          total: result.data.analyses.total,
          page,
          limit
        });
      } else {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Update analysis
   * PUT /api/analyze/[id]
   */
  async updateAnalysis(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Validate and parse request body
      const validationResult = await validateRequest(request, UpdateAnalysisSchema);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.errors },
          { status: 400 }
        );
      }

      const dto = validationResult.data as UpdateAnalysisDTO;

      /**
       * NOTE [Audio Updates Disabled]
       * The refactored PUT /api/analyze/[id] currently only maps `idea` -> updates.feedback
       * and `category`, and ignores an `audioBase64` payload that the client sends via
       * features/analyzer/api/updateAnalysisAudio and clearAnalysisAudio.
       * As a result, audio updates return 200 but are not persisted (previously stored in
       * Supabase column `audio_base64`). This breaks save/delete audio flows and loads will
       * always show `audioBase64: null`.
       *
       * To re‑enable audio persistence here:
       * 1) Accept optional `audioBase64: string | null` in the request body (extend
       *    UpdateAnalysisDTO/UpdateAnalysisSchema or read the raw JSON for this field).
       * 2) Forward it to the application layer (extend UpdateAnalysisCommand and
       *    SaveAnalysisUseCase updates to include `audioBase64`, or add a dedicated
       *    UpdateAnalysisAudioCommand/UseCase).
       * 3) Wire repository/mappers to persist `audio_base64` (SavedAnalysesUpdate.audio_base64)
       *    and include it in GET responses so subsequent loads reflect the change.
       * 4) Alternatively, expose a focused endpoint: PUT /api/analyze/[id]/audio that only
       *    updates audio and leaves other fields untouched.
       */
      
      // Convert DTO to command
      const updates: { feedback?: string; category?: Category } = {};
      if (dto.idea) {
        updates.feedback = dto.idea; // Map idea to feedback for now
      }
      if (dto.category) {
        updates.category = Category.createGeneral(dto.category);
      }

      const command = new UpdateAnalysisCommand(
        AnalysisId.fromString(params.id),
        UserId.fromString(authResult.userId),
        updates
      );

      // Execute command
      const result = await this.updateAnalysisHandler.handle(command);

      if (result.success) {
        const analysis = result.data.analysis;
        const responseDTO: AnalysisResponseDTO = {
          id: analysis.id.value,
          idea: analysis.idea,
          score: analysis.score.value,
          detailedSummary: analysis.feedback || '',
          criteria: [],
          createdAt: analysis.createdAt.toISOString(),
          locale: analysis.locale.value,
          category: analysis.category?.value
        };
        return NextResponse.json(responseDTO);
      } else {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Delete analysis
   * DELETE /api/analyze/[id]
   */
  async deleteAnalysis(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Convert to command
      const command = new DeleteAnalysisCommand(
        AnalysisId.fromString(params.id),
        UserId.fromString(authResult.userId)
      );

      // Execute command
      const result = await this.deleteAnalysisHandler.handle(command);

      if (result.success) {
        return NextResponse.json({ message: 'Analysis deleted successfully' });
      } else {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Search analyses
   * GET /api/analyze/search
   */
  async searchAnalyses(request: NextRequest): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const searchTerm = url.searchParams.get('q') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      // Create query
      const query = new SearchAnalysesQuery(
        { page, limit },
        { 
          userId: UserId.fromString(authResult.userId),
          ideaContains: searchTerm 
        },
        searchTerm
      );

      // Execute query
      const result = await this.searchAnalysesHandler.handle(query);

      if (result.success) {
        const responseDTOs: AnalysisResponseDTO[] = result.data.analyses.items.map(analysis => ({
          id: analysis.id.value,
          idea: analysis.idea,
          score: analysis.score.value,
          detailedSummary: analysis.feedback || '',
          criteria: [],
          createdAt: analysis.createdAt.toISOString(),
          locale: analysis.locale.value,
          category: analysis.category?.value
        }));

        return NextResponse.json({
          analyses: responseDTOs,
          total: result.data.analyses.total,
          page,
          limit,
          searchTerm
        });
      } else {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Handle OPTIONS preflight requests for CORS
   * OPTIONS /api/analyze
   */
  async handleOptions(_request: NextRequest): Promise<NextResponse> {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
}
