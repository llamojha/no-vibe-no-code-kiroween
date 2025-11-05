export type UserTier = 'free' | 'paid' | 'admin';

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
