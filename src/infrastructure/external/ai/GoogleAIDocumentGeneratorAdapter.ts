import { GoogleGenAI } from "@google/genai";
import { DocumentType } from "../../../domain/value-objects/DocumentType";
import {
  IAIDocumentGeneratorService,
  DocumentGenerationContext,
} from "../../../application/services/IAIDocumentGeneratorService";
import { Result, success, failure } from "../../../shared/types/common";
import { logger, LogCategory } from "@/lib/logger";
import {
  generatePRDPrompt,
  generateTechnicalDesignPrompt,
  generateArchitecturePrompt,
  generateRoadmapPrompt,
  DocumentGenerationContext as PromptContext,
} from "@/lib/prompts/documentGeneration";

/**
 * Configuration for Google AI Document Generator
 */
export interface GoogleAIDocumentGeneratorConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Error class for document generation failures
 */
export class DocumentGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown,
    public readonly documentType?: string
  ) {
    super(message);
    this.name = "DocumentGenerationError";
  }
}

/**
 * Google AI Document Generator Adapter
 *
 * Infrastructure adapter that implements IAIDocumentGeneratorService
 * using Google Gemini AI for document generation.
 *
 * Features:
 * - Generates PRD, Technical Design, Architecture, and Roadmap documents
 * - Uses centralized prompt templates from @/lib/prompts/documentGeneration
 * - Handles AI service errors with retry logic
 * - Provides detailed logging for debugging
 * - Supports contextual generation (includes existing documents)
 *
 * @implements {IAIDocumentGeneratorService}
 */
export class GoogleAIDocumentGeneratorAdapter
  implements IAIDocumentGeneratorService
{
  private readonly client: GoogleGenAI;
  private readonly config: GoogleAIDocumentGeneratorConfig;
  private readonly model: string;

  constructor(config: GoogleAIDocumentGeneratorConfig) {
    this.config = config;
    this.model =
      config.model || process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  /**
   * Generate a document using Google Gemini AI
   *
   * @param documentType - Type of document to generate (PRD, Technical Design, etc.)
   * @param context - Context information for generation
   * @returns Result containing generated document content or error
   */
  async generateDocument(
    documentType: DocumentType,
    context: DocumentGenerationContext
  ): Promise<Result<string, Error>> {
    logger.info(
      LogCategory.AI,
      "Starting document generation with Gemini",
      {
        documentType: documentType.value,
        ideaLength: context.ideaText.length,
        hasAnalysis: !!(context.analysisScores || context.analysisFeedback),
        hasPRD: !!context.existingPRD,
        hasTechnicalDesign: !!context.existingTechnicalDesign,
        hasArchitecture: !!context.existingArchitecture,
        model: this.model,
      }
    );

    const startTime = Date.now();

    return this.withRetry(async () => {
      try {
        // Build the prompt based on document type
        const prompt = this.buildPrompt(documentType, context);

        logger.debug(LogCategory.AI, "Sending document generation request", {
          documentType: documentType.value,
          promptLength: prompt.length,
        });

        // Call Google Gemini AI
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.7, // Higher temperature for creative document generation
          },
        });

        const duration = Date.now() - startTime;

        // Log slow responses
        if (duration > 15000) {
          logger.warn(
            LogCategory.AI,
            "Slow document generation response detected",
            {
              duration,
              documentType: documentType.value,
              model: this.model,
            }
          );
        }

        // Extract generated content
        const generatedContent = response.text?.trim();
        if (!generatedContent) {
          logger.error(
            LogCategory.AI,
            "Empty response from Gemini AI for document generation",
            {
              documentType: documentType.value,
              duration,
            }
          );
          return failure(
            new DocumentGenerationError(
              "Empty response from Gemini AI",
              "EMPTY_RESPONSE",
              null,
              documentType.value
            )
          );
        }

        logger.info(
          LogCategory.AI,
          "Document generation completed successfully",
          {
            documentType: documentType.value,
            contentLength: generatedContent.length,
            duration,
          }
        );

        return success(generatedContent);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const duration = Date.now() - startTime;

        // Handle specific error types
        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("429")
        ) {
          logger.error(
            LogCategory.AI,
            "API rate limit exceeded during document generation",
            {
              documentType: documentType.value,
              duration,
              error: errorMessage,
            }
          );
          return failure(
            new DocumentGenerationError(
              "API rate limit exceeded",
              "RATE_LIMIT",
              error,
              documentType.value
            )
          );
        }

        if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNABORTED")
        ) {
          logger.error(
            LogCategory.AI,
            "Request timeout during document generation",
            {
              documentType: documentType.value,
              duration,
              error: errorMessage,
            }
          );
          return failure(
            new DocumentGenerationError(
              "Request timeout",
              "TIMEOUT",
              error,
              documentType.value
            )
          );
        }

        // Generic error
        logger.error(
          LogCategory.AI,
          "Failed to generate document with Google AI",
          {
            documentType: documentType.value,
            duration,
            error: errorMessage,
          }
        );
        return failure(
          new DocumentGenerationError(
            "Failed to generate document with Google AI",
            "UNKNOWN_ERROR",
            error,
            documentType.value
          )
        );
      }
    });
  }

  /**
   * Build the appropriate prompt based on document type
   *
   * Selects the correct prompt template and interpolates context values.
   *
   * @param documentType - Type of document to generate
   * @param context - Context information for generation
   * @returns Formatted prompt string
   * @private
   */
  private buildPrompt(
    documentType: DocumentType,
    context: DocumentGenerationContext
  ): string {
    // Convert application context to prompt context
    const promptContext: PromptContext = {
      ideaText: context.ideaText,
      analysisScores: context.analysisScores,
      analysisFeedback: context.analysisFeedback,
      existingPRD: context.existingPRD,
      existingTechnicalDesign: context.existingTechnicalDesign,
      existingArchitecture: context.existingArchitecture,
    };

    // Select template based on document type
    switch (documentType.value) {
      case "prd":
        return generatePRDPrompt(promptContext);

      case "technical_design":
        return generateTechnicalDesignPrompt(promptContext);

      case "architecture":
        return generateArchitecturePrompt(promptContext);

      case "roadmap":
        return generateRoadmapPrompt(promptContext);

      default:
        throw new DocumentGenerationError(
          `Unsupported document type: ${documentType.value}`,
          "UNSUPPORTED_TYPE",
          null,
          documentType.value
        );
    }
  }

  /**
   * Retry mechanism for transient failures
   *
   * Implements exponential backoff for retryable errors.
   *
   * @param operation - The operation to retry
   * @param maxRetries - Maximum number of retry attempts
   * @returns Result from the operation
   * @private
   */
  private async withRetry<T>(
    operation: () => Promise<Result<T, Error>>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<Result<T, Error>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await operation();

      // If successful, return immediately
      if (result.success) {
        return result;
      }

      // Check if error is retryable
      const error = result.error;
      const isRetryable =
        error instanceof DocumentGenerationError &&
        (error.code === "TIMEOUT" ||
          error.code === "RATE_LIMIT" ||
          error.code === "UNKNOWN_ERROR");

      // If not retryable or last attempt, return the error
      if (!isRetryable || attempt === maxRetries) {
        return result;
      }

      lastError = error;

      // Exponential backoff: wait 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      logger.debug(
        LogCategory.AI,
        "Retrying document generation after failure",
        {
          attempt: attempt + 1,
          maxRetries,
          delay,
          errorCode: error.code,
        }
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // This should never be reached, but TypeScript needs it
    return failure(lastError || new Error("Unknown error during retry"));
  }

  /**
   * Create a configured GoogleAIDocumentGeneratorAdapter instance
   *
   * @param apiKey - Google AI API key (optional, reads from env if not provided)
   * @param model - Model name (optional, uses default if not provided)
   * @returns Configured adapter instance
   */
  static create(
    apiKey?: string,
    model?: string
  ): GoogleAIDocumentGeneratorAdapter {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY environment variable not set. Configure it in your environment or pass it directly."
      );
    }

    return new GoogleAIDocumentGeneratorAdapter({
      apiKey: key,
      model: model || process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      timeout: 30000,
      maxRetries: 3,
    });
  }
}

