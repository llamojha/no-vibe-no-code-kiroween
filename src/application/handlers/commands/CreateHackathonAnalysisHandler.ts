import { CommandHandler } from '../../types/base/Command';
import { CreateHackathonAnalysisCommand, CreateHackathonAnalysisResult } from '../../types/commands/HackathonCommands';
import { AnalyzeHackathonProjectUseCase } from '../../use-cases/AnalyzeHackathonProjectUseCase';
import { UserId, Locale } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';
import { HackathonProjectMetadata } from '../../../domain/services/HackathonAnalysisService';

/**
 * Handler for CreateHackathonAnalysisCommand
 * Delegates to AnalyzeHackathonProjectUseCase for business logic execution
 */
export class CreateHackathonAnalysisHandler implements CommandHandler<CreateHackathonAnalysisCommand, CreateHackathonAnalysisResult> {
  constructor(
    private readonly analyzeHackathonProjectUseCase: AnalyzeHackathonProjectUseCase
  ) {}

  /**
   * Handle the create hackathon analysis command
   */
  async handle(command: CreateHackathonAnalysisCommand): Promise<Result<CreateHackathonAnalysisResult, Error>> {
    try {
      // Convert command to use case input
      const input = {
        projectData: command.projectData,
        userId: command.userId,
        locale: Locale.english(), // Default locale for hackathon
        autoAssignCategory: true
      };

      // Execute the use case
      const result = await this.analyzeHackathonProjectUseCase.execute(input);

      if (!result.success) {
        return failure(result.error);
      }

      // Convert use case output to command result
      const commandResult: CreateHackathonAnalysisResult = {
        analysis: result.data.analysis,
        recommendedCategory: result.data.evaluation.recommendedCategory,
        categoryFitScore: result.data.evaluation.categoryFitScore.value
      };

      return success(commandResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in CreateHackathonAnalysisHandler'));
    }
  }

  /**
   * Validate command data before processing
   */
  validateCommand(data: unknown): Result<CreateHackathonAnalysisCommand, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid command data'));
      }

      const commandData = data as Record<string, unknown>;

      // Validate required fields
      if (!commandData.projectData || typeof commandData.projectData !== 'object') {
        return failure(new ValidationError('Project data is required'));
      }

      if (!commandData.userId || typeof commandData.userId !== 'string') {
        return failure(new ValidationError('User ID is required and must be a string'));
      }

      // Validate project data
      const projectData = commandData.projectData as Record<string, unknown>;

      if (!projectData.projectName || typeof projectData.projectName !== 'string') {
        return failure(new ValidationError('Project name is required'));
      }

      if (!projectData.description || typeof projectData.description !== 'string') {
        return failure(new ValidationError('Project description is required'));
      }

      if (!projectData.kiroUsage || typeof projectData.kiroUsage !== 'string') {
        return failure(new ValidationError('Kiro usage description is required'));
      }

      if (!projectData.teamSize || typeof projectData.teamSize !== 'number' || projectData.teamSize < 1) {
        return failure(new ValidationError('Team size must be a positive number'));
      }

      // Create value objects
      const userId = UserId.fromString(commandData.userId);

      // Construct metadata object
      const metadata: HackathonProjectMetadata = {
        projectName: projectData.projectName as string,
        description: projectData.description as string,
        kiroUsage: projectData.kiroUsage as string,
        teamSize: projectData.teamSize as number,
        githubUrl: typeof projectData.githubUrl === 'string' ? projectData.githubUrl : undefined,
        demoUrl: typeof projectData.demoUrl === 'string' ? projectData.demoUrl : undefined,
        videoUrl: typeof projectData.videoUrl === 'string' ? projectData.videoUrl : undefined,
        screenshots: Array.isArray(projectData.screenshots) ? projectData.screenshots as string[] : undefined,
        timeSpent: typeof projectData.timeSpent === 'number' ? projectData.timeSpent : undefined
      };

      // Create command
      const command = new CreateHackathonAnalysisCommand(
        metadata,
        userId,
        typeof commandData.correlationId === 'string' ? commandData.correlationId : undefined
      );

      return success(command);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Command validation failed'));
    }
  }
}