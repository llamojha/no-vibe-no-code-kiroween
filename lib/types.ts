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
  description: string;
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
}

// Kiroween Hackathon Analyzer Types

export type KiroweenCategory =
  | "resurrection"
  | "frankenstein"
  | "skeleton-crew"
  | "costume-contest";

export interface ProjectSubmission {
  description: string;
  selectedCategory: KiroweenCategory;
  kiroUsage: string;
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
  selectedCategory: KiroweenCategory;
  kiroUsage: string;
  analysis: HackathonAnalysis;
  createdAt: string;
  audioBase64?: string | null;
  supportingMaterials?: ProjectSubmission["supportingMaterials"];
}
