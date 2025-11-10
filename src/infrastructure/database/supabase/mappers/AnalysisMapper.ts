import { Analysis } from "../../../../domain/entities";
import {
  AnalysisId,
  UserId,
  Score,
  Locale,
  Category,
} from "../../../../domain/value-objects";
import {
  AnalysisDAO,
  AnalysisDataDAO,
  IdeaAnalysisData,
  HackathonAnalysisData,
  isHackathonAnalysisData,
} from "../../types/dao";
import {
  SavedAnalysesRow,
  SavedAnalysesInsert,
  SavedAnalysesUpdate,
} from "../../types/database";

/**
 * Data Transfer Object for Analysis API operations
 */
export interface AnalysisDTO {
  id: string;
  idea: string;
  score: number;
  locale: string;
  category?: string;
  feedback?: string;
  suggestions: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

/**
 * Mapper class for converting between Analysis domain entities, DAOs, and DTOs
 * Handles complex object mapping and nested data structures
 */
export class AnalysisMapper {
  /**
   * Convert Analysis domain entity to DAO for database persistence
   * Automatically determines type based on domain entity properties
   */
  toDAO(analysis: Analysis): AnalysisDAO {
    const isHackathon = this.isHackathonAnalysis(analysis);
    const analysisData = isHackathon
      ? this.mapHackathonAnalysisData(analysis)
      : this.mapIdeaAnalysisData(analysis);

    return {
      id: analysis.id.value,
      user_id: analysis.userId.value,
      analysis_type: isHackathon ? "hackathon" : "idea",
      idea: analysis.idea, // Works for both types: startup idea OR project description
      analysis: analysisData as any, // Type assertion for Supabase Json type
      audio_base64: null, // Not implemented in current domain model
      created_at: analysis.createdAt.toISOString(),
    };
  }

  /**
   * Convert DAO from database to Analysis domain entity
   * Parses based on analysis_type discriminator
   */
  toDomain(dao: AnalysisDAO): Analysis {
    // Parse the analysis JSON data based on type
    const analysisData = dao.analysis as unknown as
      | IdeaAnalysisData
      | HackathonAnalysisData;

    // Convert empty strings to undefined for optional fields
    const feedback =
      analysisData.detailedSummary && analysisData.detailedSummary.trim() !== ""
        ? analysisData.detailedSummary
        : undefined;

    // Extract suggestions from criteria array
    const suggestions =
      analysisData.criteria?.map((c) => c.justification) || [];

    // Base properties common to both types
    const baseProps = {
      id: AnalysisId.reconstruct(dao.id),
      idea: dao.idea,
      userId: UserId.reconstruct(dao.user_id),
      score: Score.reconstruct(analysisData.score || 0),
      locale: Locale.fromString(analysisData.locale || "en"),
      feedback,
      suggestions,
      createdAt: new Date(dao.created_at || Date.now()),
      updatedAt: new Date(dao.created_at || Date.now()),
    };

    // Check analysis_type discriminator and parse accordingly
    if (
      dao.analysis_type === "hackathon" &&
      isHackathonAnalysisData(analysisData)
    ) {
      return Analysis.reconstruct({
        ...baseProps,
        category: Category.createHackathon(analysisData.selectedCategory),
      });
    } else {
      // Default to idea type
      return Analysis.reconstruct(baseProps);
    }
  }

  /**
   * Convert Analysis domain entity to DTO for API responses
   */
  toDTO(analysis: Analysis): AnalysisDTO {
    return {
      id: analysis.id.value,
      idea: analysis.idea,
      score: analysis.score.value,
      locale: analysis.locale.value,
      category: analysis.category?.value,
      feedback: analysis.feedback,
      suggestions: [...analysis.suggestions],
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
      userId: analysis.userId.value,
    };
  }

  /**
   * Convert Supabase row to DAO
   */
  fromSupabaseRow(row: SavedAnalysesRow): AnalysisDAO {
    // Use analysis_type from the database row (already includes the discriminator)
    const analysis_type = (
      row.analysis_type === "hackathon" ? "hackathon" : "idea"
    ) as "idea" | "hackathon";

    return {
      id: row.id,
      user_id: row.user_id,
      analysis_type,
      idea: row.idea,
      analysis: row.analysis,
      audio_base64: row.audio_base64,
      created_at: row.created_at,
    };
  }

  /**
   * Convert DAO to Supabase insert format
   */
  toSupabaseInsert(dao: AnalysisDAO): SavedAnalysesInsert {
    return {
      id: dao.id,
      user_id: dao.user_id,
      analysis_type: dao.analysis_type,
      idea: dao.idea,
      analysis: dao.analysis,
      audio_base64: dao.audio_base64,
      created_at: dao.created_at,
    };
  }

  /**
   * Convert DAO to Supabase update format
   */
  toSupabaseUpdate(dao: AnalysisDAO): SavedAnalysesUpdate {
    return {
      user_id: dao.user_id,
      analysis_type: dao.analysis_type,
      idea: dao.idea,
      analysis: dao.analysis,
      audio_base64: dao.audio_base64,
      // Note: created_at is typically not updated
    };
  }

  /**
   * Convert Analysis domain entity directly to Supabase insert format
   */
  toSupabaseInsertFromDomain(analysis: Analysis): SavedAnalysesInsert {
    const dao = this.toDAO(analysis);
    return this.toSupabaseInsert(dao);
  }

  /**
   * Convert Analysis domain entity directly to Supabase update format
   */
  toSupabaseUpdateFromDomain(analysis: Analysis): SavedAnalysesUpdate {
    const dao = this.toDAO(analysis);
    return this.toSupabaseUpdate(dao);
  }

  /**
   * Convert Supabase row directly to domain entity
   */
  fromSupabaseRowToDomain(row: SavedAnalysesRow): Analysis {
    const dao = this.fromSupabaseRow(row);
    return this.toDomain(dao);
  }

  /**
   * Batch convert multiple Supabase rows to domain entities
   */
  fromSupabaseRowsToDomain(rows: SavedAnalysesRow[]): Analysis[] {
    return rows.map((row) => this.fromSupabaseRowToDomain(row));
  }

  /**
   * Batch convert multiple domain entities to DTOs
   */
  toDTOs(analyses: Analysis[]): AnalysisDTO[] {
    return analyses.map((analysis) => this.toDTO(analysis));
  }

  /**
   * Validate DAO structure before conversion
   */
  private validateDAO(dao: AnalysisDAO): void {
    if (!dao.id || typeof dao.id !== "string") {
      throw new Error("Invalid DAO: id is required and must be a string");
    }

    if (!dao.user_id || typeof dao.user_id !== "string") {
      throw new Error("Invalid DAO: user_id is required and must be a string");
    }

    if (!dao.idea || typeof dao.idea !== "string") {
      throw new Error("Invalid DAO: idea is required and must be a string");
    }

    if (!dao.analysis || typeof dao.analysis !== "object") {
      throw new Error(
        "Invalid DAO: analysis is required and must be an object"
      );
    }
  }

  /**
   * Safely parse analysis JSON data with fallbacks
   */
  private parseAnalysisData(analysis: unknown): AnalysisDataDAO {
    if (!analysis || typeof analysis !== "object") {
      return {
        score: 0,
        detailedSummary: "",
        criteria: [],
        locale: "en",
      };
    }

    const analysisObj = analysis as Record<string, unknown>;

    const score =
      typeof analysisObj.score === "number" ? analysisObj.score : 0;
    const finalScore =
      typeof analysisObj.finalScore === "number"
        ? analysisObj.finalScore
        : score > 5
        ? this.toFivePointScoreValue(score)
        : score;

    return {
      score,
      finalScore,
      detailedSummary:
        typeof analysisObj.detailedSummary === "string"
          ? analysisObj.detailedSummary
          : "",
      criteria: Array.isArray(analysisObj.criteria) ? analysisObj.criteria : [],
      locale:
        typeof analysisObj.locale === "string" ? analysisObj.locale : "en",
    };
  }

  /**
   * Handle complex nested object mapping for analysis data
   */
  private mapAnalysisData(analysis: Analysis): AnalysisDataDAO {
    return {
      score: analysis.score.value,
      finalScore: this.toFivePointScoreValue(analysis.score.value),
      detailedSummary: analysis.feedback || "",
      criteria: analysis.suggestions.map((suggestion, index) => ({
        name: `Suggestion ${index + 1}`,
        score: analysis.score.value, // Simplified - would have individual criteria scores
        justification: suggestion,
      })),
      locale: analysis.locale.value,
    };
  }

  /**
   * Determine if analysis is hackathon type based on domain properties
   * Detects presence of hackathon-specific category
   */
  private isHackathonAnalysis(analysis: Analysis): boolean {
    return !!(analysis.category && analysis.category.isHackathon);
  }

  /**
   * Map idea analysis to JSONB structure
   * Creates IdeaAnalysisData with score, detailedSummary, criteria, and locale
   */
  private mapIdeaAnalysisData(analysis: Analysis): IdeaAnalysisData {
    return {
      score: analysis.score.value,
      finalScore: this.toFivePointScoreValue(analysis.score.value),
      detailedSummary: analysis.feedback || "",
      criteria: analysis.suggestions.map((suggestion, index) => ({
        name: `Criterion ${index + 1}`,
        score: analysis.score.value,
        justification: suggestion,
      })),
      locale: analysis.locale.value,
    };
  }

  /**
   * Map hackathon analysis to JSONB structure
   * Includes all idea fields plus selectedCategory
   */
  private mapHackathonAnalysisData(analysis: Analysis): HackathonAnalysisData {
    return {
      score: analysis.score.value,
      finalScore: this.toFivePointScoreValue(analysis.score.value),
      detailedSummary: analysis.feedback || "",
      criteria: analysis.suggestions.map((suggestion, index) => ({
        name: `Criterion ${index + 1}`,
        score: analysis.score.value,
        justification: suggestion,
      })),
      locale: analysis.locale.value,
      selectedCategory: (analysis.category?.value as any) || "costume-contest",
    };
  }

  /**
   * Convert the domain's 0-100 score into a normalized 0-5 value.
   */
  private toFivePointScoreValue(rawScore: number): number {
    if (!Number.isFinite(rawScore)) {
      return 0;
    }
    const normalized = rawScore > 5 ? rawScore / 20 : rawScore;
    const clamped = Math.max(0, Math.min(normalized, 5));
    return Number(clamped.toFixed(1));
  }
}
