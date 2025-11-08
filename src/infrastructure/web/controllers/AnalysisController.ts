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
