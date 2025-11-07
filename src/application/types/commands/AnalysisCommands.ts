import { z } from 'zod';
import { BaseCommand, createCommandSchema } from '../base/Command';
import { AnalysisId, UserId, Category, Locale, Score } from '../../../domain/value-objects';
import { Analysis } from '../../../domain/entities';

/**
 * Command to create a new analysis
 */
export class CreateAnalysisCommand extends BaseCommand {
  constructor(
    public readonly idea: string,
    public readonly userId: UserId,
    public readonly locale: Locale,
    public readonly category?: Category,
    correlationId?: string
  ) {
    super('CREATE_ANALYSIS', correlationId);
  }
}

/**
 * Validation schema for CreateAnalysisCommand
 */
export const CreateAnalysisCommandSchema = createCommandSchema(
  z.object({
    idea: z.string().min(10, 'Idea must be at least 10 characters').max(5000, 'Idea cannot exceed 5000 characters'),
    userId: z.string().uuid('Invalid user ID format'),
    locale: z.enum(['en', 'es']),
    category: z.string().optional()
  })
);

/**
 * Command to update an existing analysis
 */
export class UpdateAnalysisCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly updates: {
      score?: Score;
      feedback?: string;
      category?: Category;
    },
    correlationId?: string
  ) {
    super('UPDATE_ANALYSIS', correlationId);
  }
}

/**
 * Validation schema for UpdateAnalysisCommand
 */
export const UpdateAnalysisCommandSchema = createCommandSchema(
  z.object({
    analysisId: z.string().uuid('Invalid analysis ID format'),
    updates: z.object({
      score: z.number().min(0).max(100).optional(),
      feedback: z.string().max(10000, 'Feedback cannot exceed 10000 characters').optional(),
      category: z.string().optional()
    })
  })
);

/**
 * Command to delete an analysis
 */
export class DeleteAnalysisCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('DELETE_ANALYSIS', correlationId);
  }
}

/**
 * Validation schema for DeleteAnalysisCommand
 */
export const DeleteAnalysisCommandSchema = createCommandSchema(
  z.object({
    analysisId: z.string().uuid('Invalid analysis ID format'),
    userId: z.string().uuid('Invalid user ID format')
  })
);

/**
 * Command to add a suggestion to an analysis
 */
export class AddSuggestionCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly suggestion: string,
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('ADD_SUGGESTION', correlationId);
  }
}

/**
 * Validation schema for AddSuggestionCommand
 */
export const AddSuggestionCommandSchema = createCommandSchema(
  z.object({
    analysisId: z.string().uuid('Invalid analysis ID format'),
    suggestion: z.string().min(1, 'Suggestion cannot be empty').max(500, 'Suggestion cannot exceed 500 characters'),
    userId: z.string().uuid('Invalid user ID format')
  })
);

/**
 * Command to remove a suggestion from an analysis
 */
export class RemoveSuggestionCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly suggestion: string,
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('REMOVE_SUGGESTION', correlationId);
  }
}

/**
 * Validation schema for RemoveSuggestionCommand
 */
export const RemoveSuggestionCommandSchema = createCommandSchema(
  z.object({
    analysisId: z.string().uuid('Invalid analysis ID format'),
    suggestion: z.string().min(1, 'Suggestion cannot be empty'),
    userId: z.string().uuid('Invalid user ID format')
  })
);

/**
 * Command result types for analysis operations
 */
export interface CreateAnalysisResult {
  analysis: Analysis;
}

export interface UpdateAnalysisResult {
  analysis: Analysis;
}

export interface DeleteAnalysisResult {
  success: boolean;
}

export interface AddSuggestionResult {
  analysis: Analysis;
}

export interface RemoveSuggestionResult {
  analysis: Analysis;
}