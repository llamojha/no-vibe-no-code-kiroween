import { Analysis } from "../../domain/entities";
import { AnalysisId, UserId } from "../../domain/value-objects";
import { IAnalysisRepository } from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from "../../shared/types/errors";

/**
 * Input for getting an analysis
 */
export interface GetAnalysisInput {
  analysisId: AnalysisId;
  userId?: UserId; // Optional for access control
  includePrivateData?: boolean;
}

/**
 * Output from getting an analysis
 */
export interface GetAnalysisOutput {
  analysis: Analysis;
  metadata: {
    isOwner: boolean;
    canEdit: boolean;
    canDelete: boolean;
    ageInDays: number;
    isRecent: boolean;
    qualityLevel: "high" | "medium" | "low";
  };
  relatedAnalyses?: Analysis[];
}

/**
 * Use case for retrieving a single analysis
 * Handles access control and metadata enrichment
 */
export class GetAnalysisUseCase {
  constructor(private readonly analysisRepository: IAnalysisRepository) {}

  /**
   * Execute the get analysis process
   */
  async execute(
    input: GetAnalysisInput
  ): Promise<Result<GetAnalysisOutput, Error>> {
    try {
      // Step 1: Retrieve the analysis
      const analysisResult = await this.analysisRepository.findById(
        input.analysisId,
        input.userId
      );

      if (!analysisResult.success) {
        return failure(analysisResult.error);
      }

      if (!analysisResult.data) {
        return failure(
          new EntityNotFoundError("Analysis", input.analysisId.value)
        );
      }

      const analysis = analysisResult.data;

      // Step 2: Check access permissions
      const isOwner = input.userId
        ? analysis.belongsToUser(input.userId)
        : false;

      // If private data is requested but user is not owner, restrict access
      if (input.includePrivateData && !isOwner) {
        return failure(
          new BusinessRuleViolationError(
            "Access denied: Cannot view private analysis data"
          )
        );
      }

      // Step 3: Calculate metadata
      const metadata = {
        isOwner,
        canEdit: isOwner && this.canEditAnalysis(analysis),
        canDelete: isOwner && this.canDeleteAnalysis(analysis),
        ageInDays: analysis.getAgeInDays(),
        isRecent: analysis.isRecent(),
        qualityLevel: this.getQualityLevel(analysis),
      };

      // Step 4: Get related analyses if user is owner
      let relatedAnalyses: Analysis[] | undefined;
      if (isOwner) {
        const similarResult = await this.analysisRepository.findSimilar(
          analysis,
          3
        );
        if (similarResult.success) {
          relatedAnalyses = similarResult.data;
        }
      }

      // Step 5: Return result
      const output: GetAnalysisOutput = {
        analysis,
        metadata,
        relatedAnalyses,
      };

      return success(output);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during retrieval")
      );
    }
  }

  /**
   * Check if analysis can be edited
   */
  private canEditAnalysis(analysis: Analysis): boolean {
    // Can't edit very old completed analyses
    if (analysis.isCompleted() && analysis.getAgeInDays() > 30) {
      return false;
    }
    return true;
  }

  /**
   * Check if analysis can be deleted
   */
  private canDeleteAnalysis(analysis: Analysis): boolean {
    // Can't delete high-quality completed analyses
    if (analysis.isHighQuality() && analysis.isCompleted()) {
      return false;
    }

    // Can't delete recent high-value analyses
    if (analysis.isRecent() && analysis.score.value > 70) {
      return false;
    }

    return true;
  }

  /**
   * Determine quality level based on score and completeness
   */
  private getQualityLevel(analysis: Analysis): "high" | "medium" | "low" {
    if (analysis.isHighQuality()) {
      return "high";
    } else if (analysis.score.value >= 50) {
      return "medium";
    } else {
      return "low";
    }
  }
}
