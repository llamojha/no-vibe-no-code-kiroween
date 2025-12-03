export type UserTier = "free" | "paid" | "admin";

export interface ScoreCriterion {
  name: string;
  score: number;
  justification: string;
}

export interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  sourceLink?: string;
}

export interface MonetizationStrategy {
  name: string;
  description: string;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MarketTrend {
  trend: string;
  impact: string;
}

export interface NextStep {
  title: string;
  description: string;
}

export interface FounderQuestion {
  question: string;
  ask: string;
  why: string;
  source: string;
  analysis: string;
}

export interface ImprovementSuggestion {
  title: string;
  description?: string; // Legacy field for idea analyzer
  snippet?: string; // Text snippet to add to project description (for hackathon analyzer)
}

export interface Analysis {
  detailedSummary: string;
  founderQuestions: FounderQuestion[];
  swotAnalysis: SWOTAnalysis;
  currentMarketTrends: MarketTrend[];
  scoringRubric: ScoreCriterion[];
  competitors: Competitor[];
  monetizationStrategies: MonetizationStrategy[];
  improvementSuggestions: ImprovementSuggestion[];
  nextSteps: NextStep[];
  finalScore: number;
  finalScoreExplanation: string;
  viabilitySummary: string;
}

export interface SavedAnalysis {
  id: string;
  idea: string;
  analysis: Analysis;
  createdAt: string;
  audioBase64?: string | null;
}

export interface SavedAnalysisRecord extends SavedAnalysis {
  userId: string;
  analysisType: "idea" | "hackathon";
}

// Kiroween Hackathon Analyzer Types

export type KiroweenCategory =
  | "resurrection"
  | "frankenstein"
  | "skeleton-crew"
  | "costume-contest";

export interface ProjectSubmission {
  description: string;
  supportingMaterials?: {
    screenshots?: string[];
    demoLink?: string;
    additionalNotes?: string;
  };
}

export interface CategoryEvaluation {
  category: KiroweenCategory;
  fitScore: number; // 1-10 scale
  explanation: string;
  improvementSuggestions: string[];
}

export interface CategoryAnalysis {
  evaluations: CategoryEvaluation[];
  bestMatch: KiroweenCategory;
  bestMatchReason: string;
}

export interface CriteriaScore {
  name: "Potential Value" | "Implementation" | "Quality and Design";
  score: number; // 1-5 scale
  justification: string;
  subScores?: {
    [key: string]: {
      score: number;
      explanation: string;
    };
  };
}

export interface CriteriaAnalysis {
  scores: CriteriaScore[];
  finalScore: number; // Average of all scores, rounded to 1 decimal
  finalScoreExplanation: string;
}

export interface HackathonAnalysis
  extends Omit<
    Analysis,
    | "founderQuestions"
    | "swotAnalysis"
    | "currentMarketTrends"
    | "monetizationStrategies"
  > {
  delay?: number;
  categoryAnalysis: CategoryAnalysis;
  criteriaAnalysis: CriteriaAnalysis;
  hackathonSpecificAdvice: {
    categoryOptimization: string[];
    kiroIntegrationTips: string[];
    competitionStrategy: string[];
  };
}

export interface SavedHackathonAnalysis {
  id: string;
  userId: string;
  projectDescription: string;
  analysis: HackathonAnalysis;
  createdAt: string;
  audioBase64?: string | null;
  supportingMaterials?: ProjectSubmission["supportingMaterials"];
}

// Unified analysis types for dashboard
export type AnalysisCategory = "idea" | "kiroween" | "frankenstein";

export interface UnifiedAnalysisRecord {
  id: string;
  userId: string;
  category: AnalysisCategory;
  title: string;
  createdAt: string;
  finalScore: number;
  summary: string;
  audioBase64?: string | null;
  // Original analysis data
  originalData:
    | SavedAnalysisRecord
    | SavedHackathonAnalysis
    | SavedFrankensteinIdea;
}

export interface DashboardFilterState {
  filter: "all" | "idea" | "kiroween" | "frankenstein";
  searchQuery: string;
  sortOption: "newest" | "oldest" | "az";
}

export interface AnalysisCounts {
  total: number;
  idea: number;
  kiroween: number;
  frankenstein: number;
}

// Doctor Frankenstein Types

export interface TechItem {
  name: string;
  description: string;
  category: string;
}

export interface FrankensteinIdeaResult {
  idea_title: string;
  idea_description: string; // Main content - detailed description of the idea
  // Legacy fields - kept for backward compatibility but no longer generated
  core_concept: string;
  problem_statement: string;
  proposed_solution: string;
  unique_value_proposition: string;
  target_audience: string;
  business_model: string;
  growth_strategy: string;
  tech_stack_suggestion: string;
  risks_and_challenges: string;
  metrics?: {
    originality_score: number;
    feasibility_score: number;
    impact_score: number;
    scalability_score: number;
    wow_factor: number;
  };
  summary: string; // Main content - summary of viability and potential
  language: string;
}

export interface FrankensteinAnalysis {
  ideaName: string;
  description: string;
  keyFeatures: string[];
  targetMarket: string;
  uniqueValueProposition: string;
  language: "en" | "es";
  fullAnalysis?: FrankensteinIdeaResult;
  allSelectedTechnologies?: TechItem[]; // Store all selected technologies
  // Validation tracking
  validatedWithKiroween?: {
    analysisId: string;
    score: number;
    validatedAt: string;
  };
  validatedWithAnalyzer?: {
    analysisId: string;
    score: number;
    validatedAt: string;
  };
}

export interface SavedFrankensteinIdea {
  id: string;
  userId: string;
  mode: "companies" | "aws";
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
  createdAt: string;
}
