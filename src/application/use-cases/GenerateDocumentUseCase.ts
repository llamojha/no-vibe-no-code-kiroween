import { Document } from "../../domain/entities";
import { IdeaId, UserId, DocumentType } from "../../domain/value-objects";
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
} from "../../shared/types/errors";
import { CreditTransaction } from "../../domain/entities/CreditTransaction";
import { TransactionType } from "../../domain/value-objects/TransactionType";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Input for generating a document
 */
export interface GenerateDocumentInput {
  ideaId: IdeaId;
  userId: UserId;
  documentType: DocumentType;
}

/**
 * Output from generating a document
 */
export interface GenerateDocumentOutput {
  document: Document;
}

/**
 * Use case for generating a new document using AI
 *
 * Flow:
 * 1. Load idea and existing documents
 * 2. Check credit balance
 * 3. Deduct credits
 * 4. Generate document with AI (include context from existing docs)
 * 5. Save document to repository
 * 6. Return document
 * 7. On error: refund credits and throw
 *
 * Requirements: 2.1, 2.2, 2.4, 4.1, 4.2, 4.4, 6.1, 6.2, 6.4, 8.1, 8.2, 8.4,
 *               15.1, 15.2, 15.3, 15.4, 15.5, 19.1, 19.2, 19.3, 19.4, 19.5
 */
export class GenerateDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ideaRepository: IIdeaRepository,
    private readonly userRepository: IUserRepository,
    private readonly transactionRepository: ICreditTransactionRepository,
    private readonly aiService: IAIDocumentGeneratorService,
    private readonly creditPolicy: CreditPolicy
  ) {}

  /**
   * Execute the document generation process
   */
  async execute(
    input: GenerateDocumentInput
  ): Promise<Result<GenerateDocumentOutput, Error>> {
    logger.info(LogCategory.BUSINESS, "Starting document generation", {
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

      // Step 2: Load existing documents for context
      const documentsResult = await this.documentRepository.findByIdeaId(
        input.ideaId
      );

      if (!documentsResult.success) {
        return failure(documentsResult.error);
      }

      const existingDocuments = documentsResult.data;

      // Step 3: Check credit balance
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
          "Insufficient credits for document generation",
          {
            userId: input.userId.value,
            required: creditCost,
            available: user.credits,
          }
        );
        return failure(new InsufficientCreditsError(input.userId.value));
      }

      // Step 4: Deduct credits
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
        description: `Document generation: ${input.documentType.getDisplayName()}`,
        metadata: {
          documentType: input.documentType.value,
          ideaId: input.ideaId.value,
        },
      });

      await this.transactionRepository.recordTransaction(transaction);

      logger.info(
        LogCategory.BUSINESS,
        "Credits deducted for document generation",
        {
          userId: input.userId.value,
          amount: creditCost,
          remainingCredits: user.credits,
        }
      );

      // Step 5: Build context for AI generation
      const context = this.buildGenerationContext(
        idea.ideaText,
        existingDocuments
      );

      // Step 6: Generate document with AI
      logger.info(LogCategory.AI, "Generating document with AI", {
        documentType: input.documentType.value,
        hasAnalysis: !!context.analysisScores || !!context.analysisFeedback,
        hasPRD: !!context.existingPRD,
        hasTechnicalDesign: !!context.existingTechnicalDesign,
        hasArchitecture: !!context.existingArchitecture,
      });

      const generationResult = await this.aiService.generateDocument(
        input.documentType,
        context
      );

      if (!generationResult.success) {
        logger.error(LogCategory.AI, "Document generation failed", {
          error: generationResult.error.message,
          documentType: input.documentType.value,
        });
        throw generationResult.error;
      }

      const generatedContent = generationResult.data;

      // Step 7: Create and save document
      const document = Document.create({
        ideaId: input.ideaId,
        userId: input.userId,
        documentType: input.documentType,
        title: `${input.documentType.getDisplayName()} - ${new Date().toLocaleDateString()}`,
        content: generatedContent,
      });

      const saveResult = await this.documentRepository.save(document);

      if (!saveResult.success) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to save generated document",
          {
            error: saveResult.error.message,
          }
        );
        throw saveResult.error;
      }

      logger.info(LogCategory.BUSINESS, "Document generated successfully", {
        documentId: document.id.value,
        documentType: input.documentType.value,
        version: document.version.value,
      });

      return success({
        document: saveResult.data,
      });
    } catch (error) {
      // Step 8: On error, refund if they were deducted
      if (creditsDeducted) {
        logger.warn(
          LogCategory.BUSINESS,
          "Refunding credits due to generation failure",
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
          : new Error("Unknown error during document generation")
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

    // Extract existing PRD
    const prd = existingDocuments.find((doc) =>
      doc.documentType.equals(DocumentType.PRD)
    );
    if (prd) {
      const content = prd.content as unknown;
      if (typeof content === "string") {
        context.existingPRD = content;
      } else if (
        typeof content === "object" &&
        content !== null &&
        "markdown" in content
      ) {
        context.existingPRD = String((content as Record<string, unknown>).markdown);
      }
    }

    // Extract existing Technical Design
    const technicalDesign = existingDocuments.find((doc) =>
      doc.documentType.equals(DocumentType.TECHNICAL_DESIGN)
    );
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

    // Extract existing Architecture
    const architecture = existingDocuments.find((doc) =>
      doc.documentType.equals(DocumentType.ARCHITECTURE)
    );
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
   * Refund credits to user after a failed generation
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
        description: "Refund for failed document generation",
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
