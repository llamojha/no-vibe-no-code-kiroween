import { NextRequest, NextResponse } from 'next/server';
import { DeleteAnalysisHandler } from '@/src/application/handlers/commands';
import { 
  ListAnalysesHandler,
  SearchAnalysesHandler,
  GetAnalysisHandler 
} from '@/src/application/handlers/queries';
import { DeleteAnalysisCommand } from '@/src/application/types/commands/AnalysisCommands';
import { GetAnalysisByIdQuery } from '@/src/application/types/queries/AnalysisQueries';
import { AnalysisId, UserId } from '@/src/domain/value-objects';
import { AnalysisResponseDTO, DashboardStatsDTO } from '../dto/AnalysisDTO';
import { UserDTO } from '../dto/UserDTO';
import { handleApiError } from '../middleware/ErrorMiddleware';
import { authenticateRequest } from '../middleware/AuthMiddleware';
import { GetUserAnalysesUseCase, GetDashboardStatsUseCase } from '@/src/application/use-cases';

/**
 * Controller for user dashboard-related API endpoints
 * Handles HTTP requests and delegates to application layer handlers
 */
export class DashboardController {
  constructor(
    private readonly listAnalysesHandler: ListAnalysesHandler,
    private readonly searchAnalysesHandler: SearchAnalysesHandler,
    private readonly getAnalysisHandler: GetAnalysisHandler,
    private readonly deleteAnalysisHandler: DeleteAnalysisHandler,
    private readonly getUserAnalysesUseCase: GetUserAnalysesUseCase,
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase
  ) {}

  /**
   * Get user dashboard data
   * GET /api/dashboard
   */
  async getDashboard(request: NextRequest): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      const userId = UserId.fromString(authResult.userId);

      // Get dashboard stats using the new use case
      const statsResult = await this.getDashboardStatsUseCase.execute({
        userId,
        recentLimit: 5
      });

      if (!statsResult.success) {
        return NextResponse.json({ error: statsResult.error.message }, { status: 400 });
      }

      const { stats } = statsResult.data;

      // Convert recent analyses to DTOs
      const recentAnalysesDTOs: AnalysisResponseDTO[] = stats.recentAnalyses.map(analysis => ({
        id: analysis.id.value,
        idea: analysis.idea,
        score: analysis.score.value,
        detailedSummary: analysis.feedback || 'No detailed summary available',
        criteria: analysis.suggestions.map((suggestion, index) => ({
          name: `Suggestion ${index + 1}`,
          score: 0, // Default score since suggestions don't have scores
          justification: suggestion
        })),
        createdAt: analysis.createdAt.toISOString(),
        locale: analysis.locale.value
      }));

      const statsDTO: DashboardStatsDTO = {
        totalAnalyses: stats.totalAnalyses,
        averageScore: stats.averageScore,
        highestScore: stats.highestScore,
        recentAnalyses: recentAnalysesDTOs
      };

      const userDTO: UserDTO = {
        id: authResult.userId,
        email: authResult.userEmail || '',
        createdAt: new Date().toISOString() // This would come from user service in real implementation
      };

      return NextResponse.json({
        user: userDTO,
        stats: statsDTO
      });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Get user's analyses with pagination
   * GET /api/dashboard/analyses
   */
  async getUserAnalyses(request: NextRequest): Promise<NextResponse> {
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
      const searchTerm = url.searchParams.get('search');
      const sortBy = url.searchParams.get('sortBy') as 'newest' | 'oldest' | 'score' | 'title' || 'newest';
      const category = url.searchParams.get('category') as 'idea' | 'kiroween' | 'all' || 'all';

      const userId = UserId.fromString(authResult.userId);

      // Use the new GetUserAnalysesUseCase
      const result = await this.getUserAnalysesUseCase.execute({
        userId,
        page,
        limit,
        searchTerm: searchTerm || undefined,
        sortBy,
        category
      });

      if (result.success) {
        const responseDTOs: AnalysisResponseDTO[] = result.data.analyses.map(analysis => ({
          id: analysis.id.value,
          idea: analysis.idea,
          score: analysis.score.value,
          detailedSummary: analysis.feedback || 'No detailed summary available',
          criteria: analysis.suggestions.map((suggestion, index) => ({
            name: `Suggestion ${index + 1}`,
            score: 0, // Default score since suggestions don't have scores
            justification: suggestion
          })),
          createdAt: analysis.createdAt.toISOString(),
          locale: analysis.locale.value
        }));

        return NextResponse.json({
          analyses: responseDTOs,
          total: result.data.total,
          page: result.data.page,
          limit: result.data.limit,
          hasMore: result.data.hasMore,
          searchTerm: result.data.searchTerm,
          sortBy: result.data.sortBy,
          category: result.data.category
        });
      } else {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Delete user's analysis
   * DELETE /api/dashboard/analyses/[id]
   */
  async deleteUserAnalysis(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
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
   * Get specific analysis for user
   * GET /api/dashboard/analyses/[id]
   */
  async getUserAnalysis(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
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

      if (result.success && result.data.analysis) {
        const analysis = result.data.analysis;
        const responseDTO: AnalysisResponseDTO = {
          id: analysis.id.value,
          idea: analysis.idea,
          score: analysis.score.value,
          detailedSummary: analysis.feedback || 'No detailed summary available',
          criteria: analysis.suggestions.map((suggestion, index) => ({
            name: `Suggestion ${index + 1}`,
            score: 0, // Default score since suggestions don't have scores
            justification: suggestion
          })),
          createdAt: analysis.createdAt.toISOString(),
          locale: analysis.locale.value
        };
        return NextResponse.json(responseDTO);
      } else if (result.success && !result.data.analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      } else {
        const errorMessage = result.success ? 'Unknown error' : result.error.message;
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    } catch (error) {
      return handleApiError(error);
    }
  }
}