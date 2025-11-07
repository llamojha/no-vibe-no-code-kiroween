import { z } from 'zod';

/**
 * DTO for creating a new analysis
 */
export interface CreateAnalysisDTO {
  idea: string;
  locale: 'en' | 'es';
  category?: string;
}

/**
 * Zod validation schema for CreateAnalysisDTO
 */
export const CreateAnalysisSchema = z.object({
  idea: z.string()
    .min(10, 'Idea must be at least 10 characters')
    .max(5000, 'Idea cannot exceed 5000 characters')
    .trim(),
  locale: z.enum(['en', 'es'], {
    message: 'Locale must be either "en" or "es"'
  }),
  category: z.string().optional()
});

/**
 * DTO for updating an existing analysis
 */
export interface UpdateAnalysisDTO {
  idea?: string;
  locale?: 'en' | 'es';
  category?: string;
}

/**
 * Zod validation schema for UpdateAnalysisDTO
 */
export const UpdateAnalysisSchema = z.object({
  idea: z.string()
    .min(10, 'Idea must be at least 10 characters')
    .max(5000, 'Idea cannot exceed 5000 characters')
    .trim()
    .optional(),
  locale: z.enum(['en', 'es'], {
    message: 'Locale must be either "en" or "es"'
  }).optional(),
  category: z.string().optional()
});

/**
 * DTO for analysis response
 */
export interface AnalysisResponseDTO {
  id: string;
  idea: string;
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  createdAt: string;
  locale: string;
  category?: string;
  competitors?: Array<{
    name: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
    sourceLink?: string;
  }>;
  monetizationStrategies?: Array<{
    name: string;
    description: string;
  }>;
  improvementSuggestions?: Array<{
    title: string;
    description: string;
  }>;
  nextSteps?: Array<{
    title: string;
    description: string;
  }>;
  founderQuestions?: Array<{
    question: string;
    ask: string;
    why: string;
    source: string;
    analysis: string;
  }>;
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  marketTrends?: Array<{
    trend: string;
    impact: string;
  }>;
  viabilitySummary?: string;
  finalScoreExplanation?: string;
}

/**
 * DTO for dashboard statistics
 */
export interface DashboardStatsDTO {
  totalAnalyses: number;
  averageScore: number;
  highestScore: number;
  recentAnalyses: AnalysisResponseDTO[];
}

/**
 * DTO for paginated analysis list
 */
export interface PaginatedAnalysisDTO {
  analyses: AnalysisResponseDTO[];
  total: number;
  page: number;
  limit: number;
  searchTerm?: string;
}

/**
 * DTO for analysis search criteria
 */
export interface AnalysisSearchDTO {
  searchTerm?: string;
  category?: string;
  locale?: 'en' | 'es';
  minScore?: number;
  maxScore?: number;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

/**
 * Zod validation schema for AnalysisSearchDTO
 */
export const AnalysisSearchSchema = z.object({
  searchTerm: z.string().optional(),
  category: z.string().optional(),
  locale: z.enum(['en', 'es']).optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
});

/**
 * DTO for bulk analysis operations
 */
export interface BulkAnalysisOperationDTO {
  analysisIds: string[];
  operation: 'delete' | 'archive' | 'export';
}

/**
 * Zod validation schema for BulkAnalysisOperationDTO
 */
export const BulkAnalysisOperationSchema = z.object({
  analysisIds: z.array(z.string().min(1, 'Analysis ID cannot be empty')).min(1, 'At least one analysis ID is required'),
  operation: z.enum(['delete', 'archive', 'export'], {
    message: 'Operation must be one of: delete, archive, export'
  })
});

/**
 * DTO for analysis export
 */
export interface AnalysisExportDTO {
  format: 'json' | 'csv' | 'pdf';
  analysisIds?: string[];
  includeDetails?: boolean;
}

/**
 * Zod validation schema for AnalysisExportDTO
 */
export const AnalysisExportSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf'], {
    message: 'Format must be one of: json, csv, pdf'
  }),
  analysisIds: z.array(z.string().min(1)).optional(),
  includeDetails: z.boolean().optional()
});