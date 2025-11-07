import { CommandHandler } from '../../types/base/Command';
import { UpdateAnalysisCommand, UpdateAnalysisResult } from '../../types/commands/AnalysisCommands';
import { SaveAnalysisUseCase } from '../../use-cases/SaveAnalysisUseCase';
import { AnalysisId, Score, Category } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for UpdateAnalysisCommand
 * Delegates to SaveAnalysisUseCase for business logic execution
 */
export class UpdateAnalysisHandler implements CommandHandler<UpdateAnalysisCommand, UpdateAnalysisResult> {
  constructor(
    private readonly saveAnalysisUseCase: SaveAnalysisUseCase
  ) {}

  /**
   * Handle the update analysis command
   */
  async handle(command: UpdateAnalysisCommand): Promise<Result<UpdateAnalysisResult, Error>> {
    try {
      // Convert command updates to use case format
      const updates: Record<string, unknown> = {};

      if (command.updates.score !== undefined) {
        updates.score = command.updates.score;
      }

      if (command.updates.feedback !== undefined) {
        updates.feedback = command.updates.feedback;
      }

      if (command.updates.category !== undefined) {
        updates.category = command.updates.category;
      }

      // Convert command to use case input
      const input = {
        analysisId: command.analysisId,
        userId: command.analysisId, // This should be passed separately in a real implementation
        updates
      };

      // Execute the use case
      const result = await this.saveAnalysisUseCase.execute(input);

      if (!result.success) {
        return failure(result.error);
      }

      // Convert use case output to command result
      const commandResult: UpdateAnalysisResult = {
        analysis: result.data.analysis
      };

      return success(commandResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in UpdateAnalysisHandler'));
    }
  }

  /**
   * Validate command data before processing
   */
  validateCommand(data: unknown): Result<UpdateAnalysisCommand, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid command data'));
      }

      const commandData = data as Record<string, unknown>;

      // Validate required fields
      if (!commandData.analysisId || typeof commandData.analysisId !== 'string') {
        return failure(new ValidationError('Analysis ID is required and must be a string'));
      }

      if (!commandData.updates || typeof commandData.updates !== 'object') {
        return failure(new ValidationError('Updates object is required'));
      }

      // Create value objects
      const analysisId = AnalysisId.fromString(commandData.analysisId);
      
      const updatesData = commandData.updates as Record<string, unknown>;
      const updates: Record<string, unknown> = {};
      
      if (updatesData.score !== undefined) {
        updates.score = Score.create(updatesData.score as number);
      }

      if (updatesData.feedback !== undefined) {
        updates.feedback = updatesData.feedback;
      }

      if (updatesData.category !== undefined && typeof updatesData.category === 'string') {
        updates.category = Category.createGeneral(updatesData.category);
      }

      // Create command
      const command = new UpdateAnalysisCommand(
        analysisId,
        updates,
        typeof commandData.correlationId === 'string' ? commandData.correlationId : undefined
      );

      return success(command);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Command validation failed'));
    }
  }
}