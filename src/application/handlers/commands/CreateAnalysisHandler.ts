import { CommandHandler } from '../../types/base/Command';
import { CreateAnalysisCommand, CreateAnalysisResult } from '../../types/commands/AnalysisCommands';
import { AnalyzeIdeaUseCase } from '../../use-cases/AnalyzeIdeaUseCase';
import { UserId, Locale, Category } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for CreateAnalysisCommand
 * Delegates to AnalyzeIdeaUseCase for business logic execution
 */
export class CreateAnalysisHandler implements CommandHandler<CreateAnalysisCommand, CreateAnalysisResult> {
  constructor(
    private readonly analyzeIdeaUseCase: AnalyzeIdeaUseCase
  ) {}

  /**
   * Handle the create analysis command
   */
  async handle(command: CreateAnalysisCommand): Promise<Result<CreateAnalysisResult, Error>> {
    try {
      // Convert command to use case input
      const input = {
        idea: command.idea,
        userId: command.userId,
        locale: command.locale,
        category: command.category
      };

      // Execute the use case
      const result = await this.analyzeIdeaUseCase.execute(input);

      if (!result.success) {
        return failure(result.error);
      }

      // Convert use case output to command result
      const commandResult: CreateAnalysisResult = {
        analysis: result.data.analysis
      };

      return success(commandResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in CreateAnalysisHandler'));
    }
  }

  /**
   * Validate command data before processing
   */
  validateCommand(data: unknown): Result<CreateAnalysisCommand, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid command data'));
      }

      const commandData = data as any;

      // Validate required fields
      if (!commandData.idea || typeof commandData.idea !== 'string') {
        return failure(new ValidationError('Idea is required and must be a string'));
      }

      if (!commandData.userId || typeof commandData.userId !== 'string') {
        return failure(new ValidationError('User ID is required and must be a string'));
      }

      if (!commandData.locale || typeof commandData.locale !== 'string') {
        return failure(new ValidationError('Locale is required and must be a string'));
      }

      // Create value objects
      const userId = UserId.fromString(commandData.userId);
      const locale = Locale.create(commandData.locale);
      const category = commandData.category ? Category.createGeneral(commandData.category) : undefined;

      // Create command
      const command = new CreateAnalysisCommand(
        commandData.idea,
        userId,
        locale,
        category,
        commandData.correlationId
      );

      return success(command);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Command validation failed'));
    }
  }
}