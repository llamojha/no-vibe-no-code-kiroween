import { DocumentType } from "../../domain/value-objects/DocumentType";
import { Result } from "../../shared/types/common";

/**
 * Context information for document generation
 * Contains all data needed to generate contextually relevant documents
 */
export interface DocumentGenerationContext {
  /** The original idea text */
  ideaText: string;

  /** Analysis scores (if available) */
  analysisScores?: Record<string, number>;

  /** Analysis feedback/summary (if available) */
  analysisFeedback?: string;

  /** Existing PRD content (for Technical Design, Architecture, Roadmap) */
  existingPRD?: string;

  /** Existing Technical Design content (for Architecture, Roadmap) */
  existingTechnicalDesign?: string;

  /** Existing Architecture content (for reference) */
  existingArchitecture?: string;
}

/**
 * AI Document Generator Service Interface (Port)
 *
 * Defines the contract for AI-powered document generation services.
 * This is a port in hexagonal architecture - implementations are adapters
 * in the infrastructure layer.
 *
 * Implementations should:
 * - Generate documents using AI based on document type and context
 * - Handle AI service errors gracefully
 * - Return structured results with success/failure states
 * - Support all document types (PRD, Technical Design, Architecture, Roadmap)
 */
export interface IAIDocumentGeneratorService {
  /**
   * Generate a document using AI
   *
   * @param documentType - The type of document to generate
   * @param context - Context information for generation (idea, analysis, existing docs)
   * @returns Result containing the generated document content or an error
   */
  generateDocument(
    documentType: DocumentType,
    context: DocumentGenerationContext
  ): Promise<Result<string, Error>>;
}
