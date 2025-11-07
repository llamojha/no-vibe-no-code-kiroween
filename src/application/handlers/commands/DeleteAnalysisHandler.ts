import { CommandHandler } from '../../types/base/Command';
import { DeleteAnalysisCommand, DeleteAnalysisResult } from '../../types/commands/AnalysisCommands';
import { DeleteAnalysisUseCase } from '../../use-cases/DeleteAnalysisUseCase';
import { AnalysisId, UserId } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for DeleteAnalysisCommand
 * Delegates to DeleteAnalysisUseCase for business logic execution
 */
export class DeleteAnalysisHandler implements CommandHandler<DeleteAnalysisCommand, DeleteAnalysisResult> {
  constructor(
    private readonly deleteAnalysisUseCase: DeleteAnalysisUseCase
  ) {}

  /**
   * Handle the delete analysis command
   */
  async handle(command: DeleteAnalysisCommand): Promise<Result<DeleteAnalysisResult, Error>> {
    try {
      // Convert command to use case input
      const input = {
        analysisId: command.analysisId,
        userId: command.userId,
        confirmDeletion: true, // Commands assume confirmation
        reason: 'Deleted via command handler'
      };

      // Execute the use case
      const result = await this.deleteAnalysisUseCase.execute(input);

      if (!result.success) {
        return failure(result.error);
      }

      // Convert use case output to command result
      const commandResult: DeleteAnalysisResult = {
        success: result.data.success
      };

      return success(commandResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in DeleteAnalysisHandler'));
    }
  }

  /**
   * Validate command data before processing
   */
  validateCommand(data: unknown): Result<DeleteAnalysisCommand, Error> {
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

      // Create value objects
      const analysisId = AnalysisId.fromString(commandData.analysisId);
      const userId = UserId.fromString(commandData.userId);

      // Create command
      const command = new DeleteAnalysisCommand(
        analysisId,
        userId,
        commandData.correlationId
      );

      return success(command);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Command validation failed'));
    }
  }
}