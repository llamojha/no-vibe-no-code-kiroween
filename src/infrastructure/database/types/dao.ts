/**
 * Data Access Object (DAO) interfaces for database operations
 * These represent the structure of data as stored in the database
 */

import type { Json } from "./database";

/**
 * Base DAO interface with common fields
 */
export interface BaseDAO {
  id: string;
  created_at: string | null;
}

/**
 * Analysis type discriminator
 */
export type AnalysisType = "idea" | "hackathon";

/**
 * Analysis DAO - represents unified saved_analyses table structure
 * Supports both idea and hackathon analysis types via analysis_type discriminator
 */
export interface AnalysisDAO extends BaseDAO {
  user_id: string;
  analysis_type: AnalysisType;
  idea: string; // For 'idea': startup idea text; For 'hackathon': project description
  analysis: Json; // Contains type-specific structured data (IdeaAnalysisData or HackathonAnalysisData)
  audio_base64: string | null;
}

/**
 * User DAO - represents profiles table structure
 */
export interface UserDAO extends BaseDAO {
  tier: "free" | "paid" | "admin";
  credits: number;
}

/**
 * Transaction type for credit operations
 */
export type TransactionType = "deduct" | "add" | "refund" | "admin_adjustment";

/**
 * Credit Transaction DAO - represents credit_transactions table structure
 */
export interface CreditTransactionDAO extends BaseDAO {
  user_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  metadata: Json | null;
  timestamp: string;
}

/**
 * Hackathon Analysis DAO - represents saved_hackathon_analyses table structure
 */
export interface HackathonAnalysisDAO extends BaseDAO {
  user_id: string;
  project_description: string;
  selected_category:
    | "resurrection"
    | "frankenstein"
    | "skeleton-crew"
    | "costume-contest";
  kiro_usage: string;
  analysis: Json;
  audio_base64: string | null;
  supporting_materials: Json | null;
}

/**
 * Idea-specific analysis data structure (stored in analysis JSONB field)
 * This represents the analysis JSONB structure for 'idea' type analyses
 */
export interface IdeaAnalysisData {
  score: number;
  finalScore?: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string;
}

/**
 * Supporting materials structure for hackathon analyses
 */
// Note: SupportingMaterials removed from unified analysis JSON shape

/**
 * Hackathon-specific analysis data structure (stored in analysis JSONB field)
 * Extends IdeaAnalysisData with hackathon-specific fields
 */
export interface HackathonAnalysisData extends IdeaAnalysisData {
  selectedCategory:
    | "resurrection"
    | "frankenstein"
    | "skeleton-crew"
    | "costume-contest";
}

/**
 * @deprecated Use IdeaAnalysisData instead
 * Analysis data structure as stored in the analysis JSON field
 */
export interface AnalysisDataDAO {
  score: number;
  finalScore?: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string;
}

/**
 * @deprecated Use HackathonAnalysisData instead
 * Hackathon analysis data structure as stored in the analysis JSON field
 */
export interface HackathonAnalysisDataDAO {
  score: number;
  finalScore?: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  category: string;
  locale: string;
  kiroUsageScore: number;
  supportingMaterialsScore: number;
}

/**
 * @deprecated Use SupportingMaterials instead
 * Supporting materials structure for hackathon analyses
 */
export interface SupportingMaterialsDAO {
  githubRepo?: string;
  demoUrl?: string;
  videoUrl?: string;
  screenshots?: string[];
  additionalNotes?: string;
}

/**
 * Type guard to check if analysis data is IdeaAnalysisData
 * @param data - The analysis data to check
 * @returns true if the data is IdeaAnalysisData (not hackathon type)
 */
export function isIdeaAnalysisData(data: unknown): data is IdeaAnalysisData {
  return (
    typeof data === "object" && data !== null && !("selectedCategory" in data)
  );
}

/**
 * Type guard to check if analysis data is HackathonAnalysisData
 * @param data - The analysis data to check
 * @returns true if the data is HackathonAnalysisData
 */
export function isHackathonAnalysisData(
  data: unknown
): data is HackathonAnalysisData {
  return (
    typeof data === "object" && data !== null && "selectedCategory" in data
  );
}
