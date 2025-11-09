/**
 * Zod schemas for validating mock response data
 */

import { z } from 'zod';

/**
 * Schema for founder questions in analyzer responses
 */
const FounderQuestionSchema = z.object({
  question: z.string().min(1),
  ask: z.string().min(1),
  why: z.string().min(1),
  source: z.string().min(1),
  analysis: z.string().min(1),
});

/**
 * Schema for SWOT analysis
 */
const SwotAnalysisSchema = z.object({
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  opportunities: z.array(z.string().min(1)),
  threats: z.array(z.string().min(1)),
});

/**
 * Schema for market trends
 */
const MarketTrendSchema = z.object({
  trend: z.string().min(1),
  impact: z.string().min(1),
});

/**
 * Schema for scoring rubric items
 */
const ScoringRubricItemSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(100),
  justification: z.string().min(1),
});

/**
 * Schema for competitors
 */
const CompetitorSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
});

/**
 * Schema for monetization strategies
 */
const MonetizationStrategySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

/**
 * Schema for improvement suggestions
 */
const ImprovementSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

/**
 * Schema for next steps
 */
const NextStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

/**
 * Schema for Analyzer mock response data
 */
export const AnalyzerMockResponseDataSchema = z.object({
  detailedSummary: z.string().min(1),
  founderQuestions: z.array(FounderQuestionSchema),
  swotAnalysis: SwotAnalysisSchema,
  currentMarketTrends: z.array(MarketTrendSchema),
  scoringRubric: z.array(ScoringRubricItemSchema),
  competitors: z.array(CompetitorSchema),
  monetizationStrategies: z.array(MonetizationStrategySchema),
  improvementSuggestions: z.array(ImprovementSuggestionSchema),
  nextSteps: z.array(NextStepSchema),
  finalScore: z.number().min(0).max(100),
  finalScoreExplanation: z.string().min(1),
  viabilitySummary: z.string().min(1),
});

/**
 * Schema for error responses
 */
const ErrorResponseDataSchema = z.object({
  error: z.string().min(1),
  message: z.string().min(1),
});

/**
 * Complete Analyzer mock response schema
 */
export const AnalyzerMockResponseSchema = z.object({
  data: z.union([AnalyzerMockResponseDataSchema, ErrorResponseDataSchema]),
  statusCode: z.number().min(100).max(599),
  delay: z.number().min(0).optional(),
});

/**
 * Schema for category evaluation in hackathon responses
 */
const CategoryEvaluationSchema = z.object({
  category: z.string().min(1),
  fitScore: z.number().min(0).max(10),
  explanation: z.string().min(1),
  improvementSuggestions: z.array(z.string().min(1)),
});

/**
 * Schema for category analysis
 */
const CategoryAnalysisSchema = z.object({
  evaluations: z.array(CategoryEvaluationSchema),
  bestMatch: z.string().min(1),
  bestMatchReason: z.string().min(1),
});

/**
 * Schema for sub-scores in criteria analysis
 */
const SubScoreSchema = z.object({
  score: z.number().min(0).max(5),
  explanation: z.string().min(1),
});

/**
 * Schema for criteria score
 */
const CriteriaScoreSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(5),
  justification: z.string().min(1),
  subScores: z.record(z.string(), SubScoreSchema),
});

/**
 * Schema for criteria analysis
 */
const CriteriaAnalysisSchema = z.object({
  scores: z.array(CriteriaScoreSchema),
  finalScore: z.number().min(0).max(5),
  finalScoreExplanation: z.string().min(1),
});

/**
 * Schema for hackathon-specific advice
 */
const HackathonSpecificAdviceSchema = z.object({
  categoryOptimization: z.array(z.string().min(1)),
  kiroIntegrationTips: z.array(z.string().min(1)),
  competitionStrategy: z.array(z.string().min(1)),
});

/**
 * Schema for Hackathon mock response data
 */
export const HackathonMockResponseDataSchema = z.object({
  detailedSummary: z.string().min(1),
  categoryAnalysis: CategoryAnalysisSchema,
  criteriaAnalysis: CriteriaAnalysisSchema,
  hackathonSpecificAdvice: HackathonSpecificAdviceSchema,
  scoringRubric: z.array(ScoringRubricItemSchema),
  competitors: z.array(CompetitorSchema),
  improvementSuggestions: z.array(ImprovementSuggestionSchema),
  nextSteps: z.array(NextStepSchema),
  finalScore: z.number().min(0).max(100),
  finalScoreExplanation: z.string().min(1),
  viabilitySummary: z.string().min(1),
});

/**
 * Complete Hackathon mock response schema
 */
export const HackathonMockResponseSchema = z.object({
  data: z.union([HackathonMockResponseDataSchema, ErrorResponseDataSchema]),
  statusCode: z.number().min(100).max(599),
  delay: z.number().min(0).optional(),
});

/**
 * Schema for Frankenstein metrics
 */
const FrankensteinMetricsSchema = z.object({
  originality_score: z.number().min(0).max(100),
  feasibility_score: z.number().min(0).max(100),
  impact_score: z.number().min(0).max(100),
  scalability_score: z.number().min(0).max(100),
  wow_factor: z.number().min(0).max(100),
});

/**
 * Schema for Frankenstein mock response data
 */
export const FrankensteinMockResponseDataSchema = z.object({
  idea_title: z.string().min(1),
  idea_description: z.string().min(1),
  core_concept: z.string().min(1),
  problem_statement: z.string().min(1),
  proposed_solution: z.string().min(1),
  unique_value_proposition: z.string().min(1),
  target_audience: z.string().min(1),
  business_model: z.string().min(1),
  growth_strategy: z.string().min(1),
  tech_stack_suggestion: z.string().min(1),
  risks_and_challenges: z.string().min(1),
  metrics: FrankensteinMetricsSchema,
  summary: z.string().min(1),
  language: z.enum(['en', 'es']),
});

/**
 * Complete Frankenstein mock response schema
 */
export const FrankensteinMockResponseSchema = z.object({
  data: z.union([FrankensteinMockResponseDataSchema, ErrorResponseDataSchema]),
  statusCode: z.number().min(100).max(599),
  delay: z.number().min(0).optional(),
});

/**
 * Schema for mock scenarios file structure
 */
export const MockScenariosSchema = z.object({
  scenarios: z.record(
    z.string(),
    z.array(z.union([
      AnalyzerMockResponseSchema,
      HackathonMockResponseSchema,
      FrankensteinMockResponseSchema,
    ]))
  ),
});

/**
 * Type exports for TypeScript
 */
export type AnalyzerMockResponseData = z.infer<typeof AnalyzerMockResponseDataSchema>;
export type HackathonMockResponseData = z.infer<typeof HackathonMockResponseDataSchema>;
export type FrankensteinMockResponseData = z.infer<typeof FrankensteinMockResponseDataSchema>;
export type AnalyzerMockResponse = z.infer<typeof AnalyzerMockResponseSchema>;
export type HackathonMockResponse = z.infer<typeof HackathonMockResponseSchema>;
export type FrankensteinMockResponse = z.infer<typeof FrankensteinMockResponseSchema>;
