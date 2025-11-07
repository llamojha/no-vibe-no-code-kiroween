import { z } from 'zod';
import { BaseCommand, createCommandSchema } from '../base/Command';
import { AnalysisId, UserId, Category } from '../../../domain/value-objects';
import { Analysis } from '../../../domain/entities';
import { HackathonProjectMetadata } from '../../../domain/services';

/**
 * Command to create a hackathon analysis
 */
export class CreateHackathonAnalysisCommand extends BaseCommand {
  constructor(
    public readonly projectData: HackathonProjectMetadata,
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('CREATE_HACKATHON_ANALYSIS', correlationId);
  }
}

/**
 * Validation schema for CreateHackathonAnalysisCommand
 */
export const CreateHackathonAnalysisCommandSchema = createCommandSchema(
  z.object({
    projectData: z.object({
      projectName: z.string().min(1, 'Project name is required').max(100, 'Project name cannot exceed 100 characters'),
      description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description cannot exceed 2000 characters'),
      kiroUsage: z.string().min(30, 'Kiro usage description must be at least 30 characters').max(1000, 'Kiro usage cannot exceed 1000 characters'),
      githubUrl: z.string().url('Invalid GitHub URL').optional(),
      demoUrl: z.string().url('Invalid demo URL').optional(),
      videoUrl: z.string().url('Invalid video URL').optional(),
      screenshots: z.array(z.string().url('Invalid screenshot URL')).optional(),
      teamSize: z.number().min(1, 'Team size must be at least 1').max(10, 'Team size cannot exceed 10')
    }),
    userId: z.string().uuid('Invalid user ID format')
  })
);

/**
 * Command to update hackathon analysis metadata
 */
export class UpdateHackathonAnalysisCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly updates: Partial<HackathonProjectMetadata>,
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('UPDATE_HACKATHON_ANALYSIS', correlationId);
  }
}

/**
 * Command to assign category to hackathon analysis
 */
export class AssignHackathonCategoryCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly category: Category,
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('ASSIGN_HACKATHON_CATEGORY', correlationId);
  }
}

/**
 * Validation schema for AssignHackathonCategoryCommand
 */
export const AssignHackathonCategoryCommandSchema = createCommandSchema(
  z.object({
    analysisId: z.string().uuid('Invalid analysis ID format'),
    category: z.enum(['resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest']),
    userId: z.string().uuid('Invalid user ID format')
  })
);

/**
 * Command to submit hackathon project for evaluation
 */
export class SubmitHackathonProjectCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly userId: UserId,
    public readonly finalSubmission: boolean = true,
    correlationId?: string
  ) {
    super('SUBMIT_HACKATHON_PROJECT', correlationId);
  }
}

/**
 * Command to withdraw hackathon submission
 */
export class WithdrawHackathonSubmissionCommand extends BaseCommand {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly userId: UserId,
    public readonly reason?: string,
    correlationId?: string
  ) {
    super('WITHDRAW_HACKATHON_SUBMISSION', correlationId);
  }
}

/**
 * Command to bulk update hackathon categories
 */
export class BulkUpdateHackathonCategoriesCommand extends BaseCommand {
  constructor(
    public readonly updates: Array<{
      analysisId: AnalysisId;
      category: Category;
    }>,
    public readonly adminUserId: UserId,
    correlationId?: string
  ) {
    super('BULK_UPDATE_HACKATHON_CATEGORIES', correlationId);
  }
}

/**
 * Command result types for hackathon operations
 */
export interface CreateHackathonAnalysisResult {
  analysis: Analysis;
  recommendedCategory: Category;
  categoryFitScore: number;
}

export interface UpdateHackathonAnalysisResult {
  analysis: Analysis;
}

export interface AssignHackathonCategoryResult {
  analysis: Analysis;
}

export interface SubmitHackathonProjectResult {
  analysis: Analysis;
  submissionId: string;
}

export interface WithdrawHackathonSubmissionResult {
  analysis: Analysis;
}

export interface BulkUpdateHackathonCategoriesResult {
  updatedCount: number;
  errors: Array<{
    analysisId: string;
    error: string;
  }>;
}