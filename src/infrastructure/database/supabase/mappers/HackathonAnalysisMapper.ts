import { Analysis } from '../../../../domain/entities';
import { AnalysisId, UserId, Score, Locale, Category } from '../../../../domain/value-objects';
import { HackathonAnalysisDAO, HackathonAnalysisDataDAO, SupportingMaterialsDAO } from '../../types/dao';
import { SavedHackathonAnalysesRow, SavedHackathonAnalysesInsert, SavedHackathonAnalysesUpdate } from '../../types/database';

/**
 * Data Transfer Object for Hackathon Analysis API operations
 */
export interface HackathonAnalysisDTO {
  id: string;
  projectDescription: string;
  selectedCategory: string;
  kiroUsage: string;
  score: number;
  locale: string;
  feedback?: string;
  supportingMaterials?: {
    githubRepo?: string;
    demoUrl?: string;
    videoUrl?: string;
    screenshots?: string[];
    additionalNotes?: string;
  };
  createdAt: string;
  userId: string;
}

/**
 * Mapper class for converting between Hackathon Analysis domain entities, DAOs, and DTOs
 * Handles hackathon-specific data mapping and nested structures
 */
export class HackathonAnalysisMapper {
  /**
   * Convert Analysis domain entity to Hackathon DAO for database persistence
   */
  toDAO(analysis: Analysis, projectDescription: string, kiroUsage: string, selectedCategory: string): HackathonAnalysisDAO {
    const analysisData: HackathonAnalysisDataDAO = {
      score: analysis.score.value,
      detailedSummary: analysis.feedback || '',
      criteria: [], // Simplified - would contain detailed criteria in real implementation
      category: analysis.category?.value || selectedCategory,
      locale: analysis.locale.value,
      kiroUsageScore: analysis.score.value, // Simplified - would have separate scoring
      supportingMaterialsScore: 0, // Simplified - would calculate based on materials
    };

    return {
      id: analysis.id.value,
      user_id: analysis.userId.value,
      project_description: projectDescription,
      selected_category: selectedCategory as any, // Type assertion for the specific enum
      kiro_usage: kiroUsage,
      analysis: analysisData,
      audio_base64: null, // Not implemented in current domain model
      supporting_materials: null, // Would be populated with actual materials
      created_at: analysis.createdAt.toISOString(),
    };
  }

  /**
   * Convert Hackathon DAO from database to Analysis domain entity
   */
  toDomain(dao: HackathonAnalysisDAO): Analysis {
    // Parse the analysis JSON data
    const analysisData = dao.analysis as HackathonAnalysisDataDAO;
    
    return Analysis.reconstruct({
      id: AnalysisId.reconstruct(dao.id),
      idea: dao.project_description, // Use project description as idea
      userId: UserId.reconstruct(dao.user_id),
      score: Score.reconstruct(analysisData.score || 0),
      locale: Locale.fromString(analysisData.locale || 'en'),
      category: analysisData.category ? Category.fromString(analysisData.category) : undefined,
      feedback: analysisData.detailedSummary,
      suggestions: [], // Simplified - would parse suggestions from data
      createdAt: new Date(dao.created_at || Date.now()),
      updatedAt: new Date(dao.created_at || Date.now()), // Simplified - using created_at as updated_at
    });
  }

  /**
   * Convert Hackathon Analysis to DTO for API responses
   */
  toDTO(analysis: Analysis, dao: HackathonAnalysisDAO): HackathonAnalysisDTO {
    const supportingMaterials = dao.supporting_materials as SupportingMaterialsDAO | null;
    
    return {
      id: analysis.id.value,
      projectDescription: dao.project_description,
      selectedCategory: dao.selected_category,
      kiroUsage: dao.kiro_usage,
      score: analysis.score.value,
      locale: analysis.locale.value,
      feedback: analysis.feedback,
      supportingMaterials: supportingMaterials ? {
        githubRepo: supportingMaterials.githubRepo,
        demoUrl: supportingMaterials.demoUrl,
        videoUrl: supportingMaterials.videoUrl,
        screenshots: supportingMaterials.screenshots,
        additionalNotes: supportingMaterials.additionalNotes,
      } : undefined,
      createdAt: analysis.createdAt.toISOString(),
      userId: analysis.userId.value,
    };
  }

  /**
   * Convert Supabase hackathon row to DAO
   */
  fromSupabaseRow(row: SavedHackathonAnalysesRow): HackathonAnalysisDAO {
    return {
      id: row.id,
      user_id: row.user_id,
      project_description: row.project_description,
      selected_category: row.selected_category,
      kiro_usage: row.kiro_usage,
      analysis: row.analysis,
      audio_base64: row.audio_base64,
      supporting_materials: row.supporting_materials,
      created_at: row.created_at,
    };
  }

  /**
   * Convert DAO to Supabase insert format
   */
  toSupabaseInsert(dao: HackathonAnalysisDAO): SavedHackathonAnalysesInsert {
    return {
      id: dao.id,
      user_id: dao.user_id,
      project_description: dao.project_description,
      selected_category: dao.selected_category,
      kiro_usage: dao.kiro_usage,
      analysis: dao.analysis,
      audio_base64: dao.audio_base64,
      supporting_materials: dao.supporting_materials,
      created_at: dao.created_at,
    };
  }

  /**
   * Convert DAO to Supabase update format
   */
  toSupabaseUpdate(dao: HackathonAnalysisDAO): SavedHackathonAnalysesUpdate {
    return {
      user_id: dao.user_id,
      project_description: dao.project_description,
      selected_category: dao.selected_category,
      kiro_usage: dao.kiro_usage,
      analysis: dao.analysis,
      audio_base64: dao.audio_base64,
      supporting_materials: dao.supporting_materials,
      // Note: created_at is typically not updated
    };
  }

  /**
   * Convert Supabase row directly to domain entity
   */
  fromSupabaseRowToDomain(row: SavedHackathonAnalysesRow): Analysis {
    const dao = this.fromSupabaseRow(row);
    return this.toDomain(dao);
  }

  /**
   * Batch convert multiple Supabase rows to domain entities
   */
  fromSupabaseRowsToDomain(rows: SavedHackathonAnalysesRow[]): Analysis[] {
    return rows.map(row => this.fromSupabaseRowToDomain(row));
  }

  /**
   * Create supporting materials DAO from input data
   */
  createSupportingMaterialsDAO(materials: {
    githubRepo?: string;
    demoUrl?: string;
    videoUrl?: string;
    screenshots?: string[];
    additionalNotes?: string;
  }): SupportingMaterialsDAO {
    return {
      githubRepo: materials.githubRepo,
      demoUrl: materials.demoUrl,
      videoUrl: materials.videoUrl,
      screenshots: materials.screenshots || [],
      additionalNotes: materials.additionalNotes,
    };
  }

  /**
   * Map hackathon category to domain Category value object
   */
  mapCategoryToDomain(category: string): Category {
    switch (category) {
      case 'resurrection':
        return Category.fromString('resurrection');
      case 'frankenstein':
        return Category.fromString('frankenstein');
      case 'skeleton-crew':
        return Category.fromString('skeleton-crew');
      case 'costume-contest':
        return Category.fromString('costume-contest');
      default:
        return Category.fromString('general');
    }
  }

  /**
   * Map domain Category to hackathon category string
   */
  mapCategoryFromDomain(category: Category): string {
    return category.value;
  }

  /**
   * Calculate hackathon-specific scores
   */
  calculateHackathonScores(
    baseScore: number,
    kiroUsage: string,
    supportingMaterials?: SupportingMaterialsDAO
  ): {
    overallScore: number;
    kiroUsageScore: number;
    supportingMaterialsScore: number;
  } {
    // Simplified scoring logic
    const kiroUsageScore = this.scoreKiroUsage(kiroUsage);
    const supportingMaterialsScore = this.scoreSupportingMaterials(supportingMaterials);
    
    // Weighted average: 60% base score, 25% kiro usage, 15% supporting materials
    const overallScore = Math.round(
      (baseScore * 0.6) + 
      (kiroUsageScore * 0.25) + 
      (supportingMaterialsScore * 0.15)
    );

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      kiroUsageScore,
      supportingMaterialsScore,
    };
  }

  /**
   * Score Kiro usage description
   */
  private scoreKiroUsage(kiroUsage: string): number {
    if (!kiroUsage || kiroUsage.trim().length === 0) {
      return 0;
    }

    const length = kiroUsage.trim().length;
    
    // Basic scoring based on description length and content
    if (length < 50) return 20;
    if (length < 100) return 40;
    if (length < 200) return 60;
    if (length < 500) return 80;
    return 100;
  }

  /**
   * Score supporting materials
   */
  private scoreSupportingMaterials(materials?: SupportingMaterialsDAO): number {
    if (!materials) return 0;

    let score = 0;
    
    // Award points for each type of supporting material
    if (materials.githubRepo) score += 30;
    if (materials.demoUrl) score += 25;
    if (materials.videoUrl) score += 20;
    if (materials.screenshots && materials.screenshots.length > 0) score += 15;
    if (materials.additionalNotes) score += 10;

    return Math.min(100, score);
  }

  /**
   * Validate hackathon DAO structure
   */
  private validateHackathonDAO(dao: HackathonAnalysisDAO): void {
    if (!dao.id || typeof dao.id !== 'string') {
      throw new Error('Invalid Hackathon DAO: id is required and must be a string');
    }

    if (!dao.user_id || typeof dao.user_id !== 'string') {
      throw new Error('Invalid Hackathon DAO: user_id is required and must be a string');
    }

    if (!dao.project_description || typeof dao.project_description !== 'string') {
      throw new Error('Invalid Hackathon DAO: project_description is required and must be a string');
    }

    if (!dao.selected_category) {
      throw new Error('Invalid Hackathon DAO: selected_category is required');
    }

    if (!dao.kiro_usage || typeof dao.kiro_usage !== 'string') {
      throw new Error('Invalid Hackathon DAO: kiro_usage is required and must be a string');
    }
  }

  /**
   * Extract hackathon metadata for leaderboard and statistics
   */
  extractHackathonMetadata(dao: HackathonAnalysisDAO): {
    id: string;
    userId: string;
    category: string;
    score: number;
    hasGithub: boolean;
    hasDemo: boolean;
    hasVideo: boolean;
    createdAt: string;
  } {
    const analysisData = dao.analysis as HackathonAnalysisDataDAO;
    const supportingMaterials = dao.supporting_materials as SupportingMaterialsDAO | null;

    return {
      id: dao.id,
      userId: dao.user_id,
      category: dao.selected_category,
      score: analysisData.score || 0,
      hasGithub: !!(supportingMaterials?.githubRepo),
      hasDemo: !!(supportingMaterials?.demoUrl),
      hasVideo: !!(supportingMaterials?.videoUrl),
      createdAt: dao.created_at || new Date().toISOString(),
    };
  }
}