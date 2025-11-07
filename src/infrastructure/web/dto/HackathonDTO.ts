import { z } from 'zod';

/**
 * Hackathon category types
 */
export type KiroweenCategory = 'resurrection' | 'frankenstein' | 'skeleton-crew' | 'costume-contest';

/**
 * DTO for project submission
 */
export interface ProjectSubmissionDTO {
  description: string;
  selectedCategory: KiroweenCategory;
  kiroUsage: string;
  supportingMaterials?: {
    screenshots?: string[];
    demoLink?: string;
    additionalNotes?: string;
  };
}

/**
 * Zod validation schema for ProjectSubmissionDTO
 */
export const ProjectSubmissionSchema = z.object({
  description: z.string()
    .min(50, 'Project description must be at least 50 characters')
    .max(10000, 'Project description cannot exceed 10000 characters')
    .trim(),
  selectedCategory: z.enum(['resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest'], {
    message: 'Invalid category selected'
  }),
  kiroUsage: z.string()
    .min(20, 'Kiro usage description must be at least 20 characters')
    .max(2000, 'Kiro usage description cannot exceed 2000 characters')
    .trim(),
  supportingMaterials: z.object({
    screenshots: z.array(z.string().url('Invalid screenshot URL')).max(10, 'Maximum 10 screenshots allowed').optional(),
    demoLink: z.string().url('Invalid demo link URL').optional(),
    additionalNotes: z.string().max(1000, 'Additional notes cannot exceed 1000 characters').optional()
  }).optional()
});

/**
 * DTO for creating a hackathon project analysis
 */
export interface CreateHackathonProjectDTO {
  submission: ProjectSubmissionDTO;
  locale: 'en' | 'es';
}

/**
 * Zod validation schema for CreateHackathonProjectDTO
 */
export const CreateHackathonProjectSchema = z.object({
  submission: ProjectSubmissionSchema,
  locale: z.enum(['en', 'es'], {
    message: 'Locale must be either "en" or "es"'
  })
});

/**
 * DTO for category evaluation
 */
export interface CategoryEvaluationDTO {
  category: KiroweenCategory;
  fitScore: number;
  explanation: string;
  improvementSuggestions: string[];
}

/**
 * DTO for category analysis
 */
export interface CategoryAnalysisDTO {
  evaluations: CategoryEvaluationDTO[];
  bestMatch: KiroweenCategory;
  bestMatchReason: string;
}

/**
 * DTO for criteria score
 */
export interface CriteriaScoreDTO {
  name: 'Potential Value' | 'Implementation' | 'Quality and Design';
  score: number;
  justification: string;
  subScores?: {
    [key: string]: {
      score: number;
      explanation: string;
    };
  };
}

/**
 * DTO for criteria analysis
 */
export interface CriteriaAnalysisDTO {
  scores: CriteriaScoreDTO[];
  finalScore: number;
  finalScoreExplanation: string;
}

/**
 * DTO for hackathon analysis response
 */
export interface HackathonAnalysisResponseDTO {
  id: string;
  submission: ProjectSubmissionDTO;
  analysis: {
    detailedSummary: string;
    categoryAnalysis: CategoryAnalysisDTO;
    criteriaAnalysis: CriteriaAnalysisDTO;
    competitors: Array<{
      name: string;
      description: string;
      strengths: string[];
      weaknesses: string[];
      sourceLink?: string;
    }>;
    improvementSuggestions: Array<{
      title: string;
      description: string;
    }>;
    nextSteps: Array<{
      title: string;
      description: string;
    }>;
    hackathonSpecificAdvice: {
      categoryOptimization: string[];
      kiroIntegrationTips: string[];
      competitionStrategy: string[];
    };
    viabilitySummary: string;
  };
  score: number;
  createdAt: string;
  locale: string;
}

/**
 * DTO for hackathon leaderboard entry
 */
export interface HackathonLeaderboardEntryDTO {
  id: string;
  submission: {
    description: string;
    selectedCategory: KiroweenCategory;
    kiroUsage: string;
  };
  score: number;
  rank: number;
  createdAt: string;
}

/**
 * DTO for hackathon leaderboard response
 */
export interface HackathonLeaderboardResponseDTO {
  entries: HackathonLeaderboardEntryDTO[];
  category?: KiroweenCategory;
  total: number;
}

/**
 * DTO for hackathon search criteria
 */
export interface HackathonSearchDTO {
  searchTerm?: string;
  category?: KiroweenCategory;
  minScore?: number;
  maxScore?: number;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

/**
 * Zod validation schema for HackathonSearchDTO
 */
export const HackathonSearchSchema = z.object({
  searchTerm: z.string().optional(),
  category: z.enum(['resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest']).optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
});

/**
 * DTO for paginated hackathon analysis list
 */
export interface PaginatedHackathonAnalysisDTO {
  analyses: HackathonAnalysisResponseDTO[];
  total: number;
  page: number;
  limit: number;
  searchTerm?: string;
  category?: KiroweenCategory;
}

/**
 * DTO for hackathon statistics
 */
export interface HackathonStatsDTO {
  totalSubmissions: number;
  averageScore: number;
  categoryDistribution: Record<KiroweenCategory, number>;
  topScores: Array<{
    id: string;
    score: number;
    category: KiroweenCategory;
    description: string;
  }>;
}

/**
 * DTO for updating hackathon analysis
 */
export interface UpdateHackathonProjectDTO {
  submission?: ProjectSubmissionDTO;
  locale?: 'en' | 'es';
}

/**
 * Zod validation schema for UpdateHackathonProjectDTO
 */
export const UpdateHackathonProjectSchema = z.object({
  submission: ProjectSubmissionSchema.optional(),
  locale: z.enum(['en', 'es']).optional()
});