import { CommandHandler } from '../../types/base/Command';
import { UpdateHackathonAnalysisCommand, UpdateHackathonAnalysisResult } from '../../types/commands/HackathonCommands';
import { SaveHackathonAnalysisUseCase } from '../../use-cases/SaveHackathonAnalysisUseCase';
import { AnalysisId, UserId } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for UpdateHackathonAnalysisCommand
 * Delegates to SaveHackathonAnalysisUseCase for business logic execution
 */
export class UpdateHackathonAnalysisHandler implements CommandHandler<UpdateHackathonAnalysisCommand, UpdateHackathonAnalysisResult> {
  constructor(
    private readonly saveHackathonAnalysisUseCase: SaveHackathonAnalysisUseCase
  ) {}

  /**
   * Handle the update hackathon analysis command
   */
  async handle(command: UpdateHackathonAnalysisCommand): Promise<Result<UpdateHackathonAnalysisResult, Error>> {
    try {
      // Convert command to use case input
      const input = {
        analysisId: command.analysisId,
        userId: command.userId,
        updates: {
          projectData: command.updates
        }
      };

      // Execute the use case
      const result = await this.saveHackathonAnalysisUseCase.execute(input);

      if (!result.success) {
        return failure(result.error);
      }

      // Convert use case output to command result
      const commandResult: UpdateHackathonAnalysisResult = {
        analysis: result.data.analysis
      };

      return success(commandResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in UpdateHackathonAnalysisHandler'));
    }
  }

  /**
   * Validate command data before processing
   */
  validateCommand(data: unknown): Result<UpdateHackathonAnalysisCommand, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid command data'));
      }

      const commandData = data as any;

      // Validate required fields
      if (!commandData.analysisId || typeof commandData.analysisId !== 'string') {
        return failure(new ValidationError('Analysis ID is required and must be a string'));
      }

      if (!commandData.userId || typeof commandData.userId !== 'string') {
        return failure(new ValidationError('User ID is required and must be a string'));
      }

      if (!commandData.updates || typeof commandData.updates !== 'object') {
        return failure(new ValidationError('Updates object is required'));
      }

      // Create value objects
      const analysisId = AnalysisId.fromString(commandData.analysisId);
      const userId = UserId.fromString(commandData.userId);

      // Create command
      const command = new UpdateHackathonAnalysisCommand(
        analysisId,
        commandData.updates,
        userId,
        commandData.correlationId
      );

      return success(command);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Command validation failed'));
    }
  }
}