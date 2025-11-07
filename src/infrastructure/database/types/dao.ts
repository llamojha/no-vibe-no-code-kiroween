/**
 * Data Access Object (DAO) interfaces for database operations
 * These represent the structure of data as stored in the database
 */

import type { Json } from './database';

/**
 * Base DAO interface with common fields
 */
export interface BaseDAO {
  id: string;
  created_at: string | null;
}

/**
 * Analysis DAO - represents saved_analyses table structure
 */
export interface AnalysisDAO extends BaseDAO {
  user_id: string;
  idea: string;
  analysis: Json;
  audio_base64: string | null;
}

/**
 * User DAO - represents profiles table structure
 */
export interface UserDAO extends BaseDAO {
  tier: "free" | "paid" | "admin";
}

/**
 * Hackathon Analysis DAO - represents saved_hackathon_analyses table structure
 */
export interface HackathonAnalysisDAO extends BaseDAO {
  user_id: string;
  project_description: string;
  selected_category: "resurrection" | "frankenstein" | "skeleton-crew" | "costume-contest";
  kiro_usage: string;
  analysis: Json;
  audio_base64: string | null;
  supporting_materials: Json | null;
}

/**
 * Analysis data structure as stored in the analysis JSON field
 */
export interface AnalysisDataDAO {
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  locale: string;
}

/**
 * Hackathon analysis data structure as stored in the analysis JSON field
 */
export interface HackathonAnalysisDataDAO {
  score: number;
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
 * Supporting materials structure for hackathon analyses
 */
export interface SupportingMaterialsDAO {
  githubRepo?: string;
  demoUrl?: string;
  videoUrl?: string;
  screenshots?: string[];
  additionalNotes?: string;
}