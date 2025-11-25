import { Document } from "../../domain/entities";
import {
  IdeaId,
  UserId,
  DocumentType,
  DocumentId,
} from "../../domain/value-objects";
import {
  IDocumentRepository,
  IIdeaRepository,
} from "../../domain/repositories";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ICreditTransactionRepository } from "../../domain/repositories/ICreditTransactionRepository";
import { IAIDocumentGeneratorService } from "../services/IAIDocumentGeneratorService";
import { CreditPolicy } from "../../domain/services/CreditPolicy";
import { Result, success, failure } from "../../shared/types/common";
import {
  IdeaNotFoundError,
  UnauthorizedAccessError,
  InsufficientCreditsError,
  EntityNotFoundError,
  DocumentNotFoundError,
} from "../../shared/types/errors";
import { CreditTransaction } from "../../domain/entities/CreditTransaction";
import { TransactionType } from "../../domain/value-objects/TransactionType";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Input for regenerating a document
 */
export interface RegenerateDocumentInput {
  documentId?: DocumentId;
  ideaId: IdeaId;
  userId: UserId;
  documentType: DocumentType;
}

/**
 * Output from regenerating a document
 */
export interface RegenerateDocumentOutput {
  document: Document;
}

/**
 * Use case for regenerating a document using AI
 *
 * Flow:
 * 1. Load idea and existing documents
 * 2. Check credit balance
 * 3. Deduct credits
 * 4. Generate new content with AI
 * 5. Create new version preserving old version
 * 6. Save new version
 * 7. Return document
 * 8. On error: refund credits and throw
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export class RegenerateDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ideaRepository: IIdeaRepository,
    private readonly userRepository: IUserRepository,
    private readonly transactionRepository: ICreditTransactionRepository,
    private readonly aiService: IAIDocumentGeneratorService,
    private readonly creditPolicy: CreditPolicy
  ) {}

  /**
   * Execute the document regeneration process
   */
  async execute(
    input: RegenerateDocumentInput
  ): Promise<Result<RegenerateDocumentOutput, Error>> {
    logger.info(LogCategory.BUSINESS, "Starting document regeneration", {
      ideaId: input.ideaId.value,
      userId: input.userId.value,
      documentType: input.documentType.value,
    });

    let creditsDeducted = false;
    let deductedAmount = 0;

    try {
      // Step 1: Load idea and verify ownership
      const ideaResult = await this.ideaRepository.findById(
        input.ideaId,
        input.userId
      );

      if (!ideaResult.success) {
        return failure(ideaResult.error);
      }

      if (!ideaResult.data) {
        return failure(new IdeaNotFoundError(input.ideaId.value));
      }

      const idea = ideaResult.data;

      // Verify user owns the idea
      if (!idea.belongsToUser(input.userId)) {
        return failure(
          new UnauthorizedAccessError(input.userId.value, input.ideaId.value)
        );
      }

      // Step 2: Load current document to get version
      const currentDocResult = await this.documentRepository.findLatestVersion(
        input.ideaId,
        input.documentType
      );

      if (!currentDocResult.success) {
        return failure(currentDocResult.error);
      }

      if (!currentDocResult.data) {
        return failure(
          new DocumentNotFoundError(
            `${input.documentType.value} for idea ${input.ideaId.value}`
          )
        );
      }

      const currentDocument = currentDocResult.data;

      if (
        input.documentId &&
        !currentDocument.id.equals(input.documentId)
      ) {
        return failure(
          new DocumentNotFoundError(input.documentId.value)
        );
      }

      // Verify user owns the document
      if (!currentDocument.belongsToUser(input.userId)) {
        return failure(
          new UnauthorizedAccessError(
            input.userId.value,
            currentDocument.id.value
          )
        );
      }

      // Step 3: Load all existing documents for context
      const documentsResult = await this.documentRepository.findByIdeaId(
        input.ideaId
      );

      if (!documentsResult.success) {
        return failure(documentsResult.error);
      }

      const existingDocuments = documentsResult.data;

      // Step 4: Check credit balance
      const userResult = await this.userRepository.findById(input.userId);

      if (!userResult.success) {
        return failure(userResult.error);
      }

      if (!userResult.data) {
        return failure(new EntityNotFoundError("User", input.userId.value));
      }

      const user = userResult.data;
      const creditCost = input.documentType.getCreditCost();

      // Check if user has sufficient credits
      if (user.credits < creditCost) {
        logger.warn(
          LogCategory.BUSINESS,
          "Insufficient credits for document regeneration",
          {
            userId: input.userId.value,
            required: creditCost,
            available: user.credits,
          }
        );
        return failure(new InsufficientCreditsError(input.userId.value));
      }

      // Step 5: Deduct credits
      for (let i = 0; i < creditCost; i++) {
        user.deductCredit();
      }

      const updateResult = await this.userRepository.updateCredits(
        user.id,
        user.credits
      );

      if (!updateResult.success) {
        return failure(updateResult.error);
      }

      creditsDeducted = true;
      deductedAmount = creditCost;

      // Record transaction
      const transaction = CreditTransaction.create({
        userId: input.userId,
        amount: -creditCost,
        type: TransactionType.DEDUCT,
        description: `Document regeneration: ${input.documentType.getDisplayName()}`,
        metadata: {
          documentType: input.documentType.value,
          ideaId: input.ideaId.value,
          previousVersion: currentDocument.version.value,
        },
      });

      await this.transactionRepository.recordTransaction(transaction);

      logger.info(
        LogCategory.BUSINESS,
        "Credits deducted for document regeneration",
        {
          userId: input.userId.value,
          amount: creditCost,
          remainingCredits: user.credits,
        }
      );

      // Step 6: Build context for AI generation
      const context = this.buildGenerationContext(
        idea.ideaText,
        existingDocuments
      );

      // Step 7: Generate new content with AI
      logger.info(LogCategory.AI, "Regenerating document with AI", {
        documentType: input.documentType.value,
        currentVersion: currentDocument.version.value,
      });

      const generationResult = await this.aiService.generateDocument(
        input.documentType,
        context
      );

      if (!generationResult.success) {
        logger.error(LogCategory.AI, "Document regeneration failed", {
          error: generationResult.error.message,
          documentType: input.documentType.value,
        });
        throw generationResult.error;
      }

      const generatedContent = generationResult.data;

      // Step 8: Create new version (preserving old version)
      const newDocument = currentDocument.updateContent(generatedContent);

      logger.info(LogCategory.BUSINESS, "Created new document version", {
        oldVersion: currentDocument.version.value,
        newVersion: newDocument.version.value,
        oldDocumentId: currentDocument.id.value,
        newDocumentId: newDocument.id.value,
      });

      // Step 9: Save new version
      const saveResult = await this.documentRepository.save(newDocument);

      if (!saveResult.success) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to save regenerated document",
          {
            error: saveResult.error.message,
          }
        );
        throw saveResult.error;
      }

      logger.info(LogCategory.BUSINESS, "Document regenerated successfully", {
        documentId: newDocument.id.value,
        documentType: input.documentType.value,
        version: newDocument.version.value,
      });

      return success({
        document: saveResult.data,
      });
    } catch (error) {
      // Step 10: On error, refund credits if they were deducted
      if (creditsDeducted) {
        logger.warn(
          LogCategory.BUSINESS,
          "Refunding credits due to regeneration failure",
          {
            userId: input.userId.value,
            amount: deductedAmount,
          }
        );

        await this.refundCredits(input.userId, deductedAmount, error);
      }

      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during document regeneration")
      );
    }
  }

  /**
   * Build generation context from idea and existing documents
   */
  private buildGenerationContext(
    ideaText: string,
    existingDocuments: Document[]
  ): {
    ideaText: string;
    analysisScores?: Record<string, number>;
    analysisFeedback?: string;
    existingPRD?: string;
    existingTechnicalDesign?: string;
    existingArchitecture?: string;
  } {
    const context: {
      ideaText: string;
      analysisScores?: Record<string, number>;
      analysisFeedback?: string;
      existingPRD?: string;
      existingTechnicalDesign?: string;
      existingArchitecture?: string;
    } = {
      ideaText,
    };

    // Extract analysis data if available
    const analysis = existingDocuments.find((doc) =>
      doc.documentType.isAnalysis()
    );
    if (analysis) {
      const content = analysis.content;

      // Try to extract scores
      if (typeof content === "object" && content !== null) {
        if ("score" in content && typeof content.score === "number") {
          context.analysisScores = { overall: content.score };
        } else if (
          "finalScore" in content &&
          typeof content.finalScore === "number"
        ) {
          context.analysisScores = { overall: content.finalScore };
        }

        // Try to extract feedback
        if ("feedback" in content && typeof content.feedback === "string") {
          context.analysisFeedback = content.feedback;
        } else if (
          "detailedSummary" in content &&
          typeof content.detailedSummary === "string"
        ) {
          context.analysisFeedback = content.detailedSummary;
        }
      }
    }

    // Extract existing PRD (latest version)
    const prd = existingDocuments
      .filter((doc) => doc.documentType.equals(DocumentType.PRD))
      .sort((a, b) => b.version.value - a.version.value)[0];
    if (prd) {
      const content = prd.content as unknown;
      if (typeof content === "string") {
        context.existingPRD = content;
      } else if (
        typeof content === "object" &&
        content !== null &&
        "markdown" in content
      ) {
        context.existingPRD = String(
          (content as Record<string, unknown>).markdown
        );
      }
    }

    // Extract existing Technical Design (latest version)
    const technicalDesign = existingDocuments
      .filter((doc) => doc.documentType.equals(DocumentType.TECHNICAL_DESIGN))
      .sort((a, b) => b.version.value - a.version.value)[0];
    if (technicalDesign) {
      const content = technicalDesign.content as unknown;
      if (typeof content === "string") {
        context.existingTechnicalDesign = content;
      } else if (
        typeof content === "object" &&
        content !== null &&
        "markdown" in content
      ) {
        context.existingTechnicalDesign = String(
          (content as Record<string, unknown>).markdown
        );
      }
    }

    // Extract existing Architecture (latest version)
    const architecture = existingDocuments
      .filter((doc) => doc.documentType.equals(DocumentType.ARCHITECTURE))
      .sort((a, b) => b.version.value - a.version.value)[0];
    if (architecture) {
      const content = architecture.content as unknown;
      if (typeof content === "string") {
        context.existingArchitecture = content;
      } else if (
        typeof content === "object" &&
        content !== null &&
        "markdown" in content
      ) {
        context.existingArchitecture = String(
          (content as Record<string, unknown>).markdown
        );
      }
    }

    return context;
  }

  /**
   * Refund credits to user after a failed regeneration
   */
  private async refundCredits(
    userId: UserId,
    amount: number,
    originalError: unknown
  ): Promise<void> {
    try {
      const userResult = await this.userRepository.findById(userId);

      if (!userResult.success || !userResult.data) {
        logger.error(
          LogCategory.BUSINESS,
          "Failed to load user for credit refund",
          {
            userId: userId.value,
          }
        );
        return;
      }

      const user = userResult.data;
      user.addCredits(amount);

      await this.userRepository.updateCredits(user.id, user.credits);

      // Record refund transaction
      const transaction = CreditTransaction.create({
        userId,
        amount,
        type: TransactionType.REFUND,
        description: "Refund for failed document regeneration",
        metadata: {
          reason:
            originalError instanceof Error
              ? originalError.message
              : "Unknown error",
        },
      });

      await this.transactionRepository.recordTransaction(transaction);

      logger.info(LogCategory.BUSINESS, "Credits refunded successfully", {
        userId: userId.value,
        amount,
      });
    } catch (refundError) {
      logger.error(LogCategory.BUSINESS, "Failed to refund credits", {
        userId: userId.value,
        amount,
        error:
          refundError instanceof Error ? refundError.message : "Unknown error",
      });
    }
  }
}
