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
import { UpdateAnalysisCommand, DeleteAnalysisCommand } from '@/src/application/types/commands';
import { GetAnalysisByIdQuery, GetAnalysesByUserQuery, SearchAnalysesQuery } from '@/src/application/types/queries';
import { CreateAnalysisDTO, UpdateAnalysisDTO, AnalysisResponseDTO } from '../dto/AnalysisDTO';
import { CreateAnalysisSchema, UpdateAnalysisSchema } from '../dto/AnalysisDTO';
import { AnalysisId, UserId, Locale } from '@/src/domain/value-objects';
import { handleApiError } from '../middleware/ErrorMiddleware';
import { validateRequest } from '../middleware/ValidationMiddleware';
import { authenticateRequest } from '../middleware/AuthMiddleware';
import { GoogleAIAdapter } from '../../external/ai/GoogleAIAdapter';

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

      // Use the new hexagonal architecture AI service
      const googleAI = GoogleAIAdapter.create();
      const analysis = await googleAI.analyzeIdea(dto.idea, Locale.fromString(dto.locale));

      // Return the analysis in the expected format for backward compatibility
      return NextResponse.json(analysis, { status: 200 });
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

      if (result.isSuccess && result.data) {
        const responseDTO: AnalysisResponseDTO = {
          id: result.data.id,
          idea: result.data.idea,
          score: result.data.score,
          detailedSummary: result.data.detailedSummary,
          criteria: result.data.criteria,
          createdAt: result.data.createdAt,
          locale: result.data.locale
        };
        return NextResponse.json(responseDTO);
      } else if (result.isSuccess && !result.data) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
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

      if (result.isSuccess) {
        const responseDTOs: AnalysisResponseDTO[] = result.data.analyses.map(analysis => ({
          id: analysis.id,
          idea: analysis.idea,
          score: analysis.score,
          detailedSummary: analysis.detailedSummary,
          criteria: analysis.criteria,
          createdAt: analysis.createdAt,
          locale: analysis.locale
        }));

        return NextResponse.json({
          analyses: responseDTOs,
          total: result.data.total,
          page,
          limit
        });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
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

      // Convert DTO to command
      const command = new UpdateAnalysisCommand(
        params.id,
        authResult.userId,
        dto.idea,
        dto.locale
      );

      // Execute command
      const result = await this.updateAnalysisHandler.handle(command);

      if (result.isSuccess) {
        const responseDTO: AnalysisResponseDTO = {
          id: result.data.id,
          idea: result.data.idea,
          score: result.data.score,
          detailedSummary: result.data.detailedSummary,
          criteria: result.data.criteria,
          createdAt: result.data.createdAt,
          locale: result.data.locale
        };
        return NextResponse.json(responseDTO);
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
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
      const command = new DeleteAnalysisCommand(params.id, authResult.userId);

      // Execute command
      const result = await this.deleteAnalysisHandler.handle(command);

      if (result.isSuccess) {
        return NextResponse.json({ message: 'Analysis deleted successfully' });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
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

      if (result.isSuccess) {
        const responseDTOs: AnalysisResponseDTO[] = result.data.analyses.map(analysis => ({
          id: analysis.id,
          idea: analysis.idea,
          score: analysis.score,
          detailedSummary: analysis.detailedSummary,
          criteria: analysis.criteria,
          createdAt: analysis.createdAt,
          locale: analysis.locale
        }));

        return NextResponse.json({
          analyses: responseDTOs,
          total: result.data.total,
          page,
          limit,
          searchTerm
        });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } catch (error) {
      return handleApiError(error);
    }
  }
}