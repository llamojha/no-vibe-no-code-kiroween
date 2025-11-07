import { Analysis } from '../../../../domain/entities';
import { AnalysisId, UserId, Score, Locale, Category } from '../../../../domain/value-objects';
import { AnalysisDAO, AnalysisDataDAO } from '../../types/dao';
import { SavedAnalysesRow, SavedAnalysesInsert, SavedAnalysesUpdate } from '../../types/database';

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
   */
  toDAO(analysis: Analysis): AnalysisDAO {
    const analysisData: AnalysisDataDAO = {
      score: analysis.score.value,
      detailedSummary: analysis.feedback || '',
      criteria: [], // Simplified - would contain detailed criteria in real implementation
      locale: analysis.locale.value,
    };

    return {
      id: analysis.id.value,
      user_id: analysis.userId.value,
      idea: analysis.idea,
      analysis: analysisData as any, // Type assertion for Supabase Json type
      audio_base64: null, // Not implemented in current domain model
      created_at: analysis.createdAt.toISOString(),
    };
  }

  /**
   * Convert DAO from database to Analysis domain entity
   */
  toDomain(dao: AnalysisDAO): Analysis {
    // Parse the analysis JSON data
    const analysisData = dao.analysis as unknown as AnalysisDataDAO;
    
    return Analysis.reconstruct({
      id: AnalysisId.reconstruct(dao.id),
      idea: dao.idea,
      userId: UserId.reconstruct(dao.user_id),
      score: Score.reconstruct(analysisData.score || 0),
      locale: Locale.fromString(analysisData.locale || 'en'),
      category: analysisData.locale ? undefined : undefined, // Simplified - would parse category from data
      feedback: analysisData.detailedSummary,
      suggestions: [], // Simplified - would parse suggestions from data
      createdAt: new Date(dao.created_at || Date.now()),
      updatedAt: new Date(dao.created_at || Date.now()), // Simplified - using created_at as updated_at
    });
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
    return {
      id: row.id,
      user_id: row.user_id,
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
    return rows.map(row => this.fromSupabaseRowToDomain(row));
  }

  /**
   * Batch convert multiple domain entities to DTOs
   */
  toDTOs(analyses: Analysis[]): AnalysisDTO[] {
    return analyses.map(analysis => this.toDTO(analysis));
  }

  /**
   * Validate DAO structure before conversion
   */
  private validateDAO(dao: AnalysisDAO): void {
    if (!dao.id || typeof dao.id !== 'string') {
      throw new Error('Invalid DAO: id is required and must be a string');
    }

    if (!dao.user_id || typeof dao.user_id !== 'string') {
      throw new Error('Invalid DAO: user_id is required and must be a string');
    }

    if (!dao.idea || typeof dao.idea !== 'string') {
      throw new Error('Invalid DAO: idea is required and must be a string');
    }

    if (!dao.analysis || typeof dao.analysis !== 'object') {
      throw new Error('Invalid DAO: analysis is required and must be an object');
    }
  }

  /**
   * Safely parse analysis JSON data with fallbacks
   */
  private parseAnalysisData(analysis: any): AnalysisDataDAO {
    if (!analysis || typeof analysis !== 'object') {
      return {
        score: 0,
        detailedSummary: '',
        criteria: [],
        locale: 'en',
      };
    }

    return {
      score: typeof analysis.score === 'number' ? analysis.score : 0,
      detailedSummary: typeof analysis.detailedSummary === 'string' ? analysis.detailedSummary : '',
      criteria: Array.isArray(analysis.criteria) ? analysis.criteria : [],
      locale: typeof analysis.locale === 'string' ? analysis.locale : 'en',
    };
  }

  /**
   * Handle complex nested object mapping for analysis data
   */
  private mapAnalysisData(analysis: Analysis): AnalysisDataDAO {
    return {
      score: analysis.score.value,
      detailedSummary: analysis.feedback || '',
      criteria: analysis.suggestions.map((suggestion, index) => ({
        name: `Suggestion ${index + 1}`,
        score: analysis.score.value, // Simplified - would have individual criteria scores
        justification: suggestion,
      })),
      locale: analysis.locale.value,
    };
  }
}