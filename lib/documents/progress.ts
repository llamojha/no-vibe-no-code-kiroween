/**
 * Document Progress Utilities
 * Functions for calculating document generation progress and recommendations
 */

import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import { DOCUMENT_TYPE_CONFIGS } from "@/src/domain/config/documentTypeConfig";

/**
 * Document DTO interface (minimal for progress calculation)
 */
interface DocumentDTO {
  documentType: string;
}

/**
 * Get the recommended next document to generate
 * Recommended workflow order: Analysis → PRD → Technical Design → Architecture → Roadmap
 * Note: This is just a suggestion - users can generate any document at any time
 *
 * @param existingDocuments - Array of existing documents
 * @returns The recommended next DocumentType, or null if all documents are generated or no analysis exists
 */
export function getRecommendedNextDocument(
  existingDocuments: DocumentDTO[]
): DocumentType | null {
  const hasAnalysis = existingDocuments.some(
    (d) =>
      d.documentType === "startup_analysis" ||
      d.documentType === "hackathon_analysis"
  );
  const hasPRD = existingDocuments.some((d) => d.documentType === "prd");
  const hasTechnicalDesign = existingDocuments.some(
    (d) => d.documentType === "technical_design"
  );
  const hasArchitecture = existingDocuments.some(
    (d) => d.documentType === "architecture"
  );
  const hasRoadmap = existingDocuments.some(
    (d) => d.documentType === "roadmap"
  );

  // Recommend analysis first if none exists (but don't block other documents)
  if (!hasAnalysis) {
    return null; // Show "Consider creating an analysis first" message
  }

  // Then recommend following the logical order, but don't enforce it
  if (!hasPRD) return DocumentType.PRD;
  if (!hasTechnicalDesign) return DocumentType.TECHNICAL_DESIGN;
  if (!hasArchitecture) return DocumentType.ARCHITECTURE;
  if (!hasRoadmap) return DocumentType.ROADMAP;

  return null; // All documents generated
}

/**
 * Calculate progress percentage based on completed documents
 * 5 total steps: Analysis, PRD, Technical Design, Architecture, Roadmap
 *
 * @param existingDocuments - Array of existing documents
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(existingDocuments: DocumentDTO[]): number {
  const steps = [
    existingDocuments.some(
      (d) =>
        d.documentType === "startup_analysis" ||
        d.documentType === "hackathon_analysis"
    ),
    existingDocuments.some((d) => d.documentType === "prd"),
    existingDocuments.some((d) => d.documentType === "technical_design"),
    existingDocuments.some((d) => d.documentType === "architecture"),
    existingDocuments.some((d) => d.documentType === "roadmap"),
  ];

  const completedSteps = steps.filter(Boolean).length;
  return Math.round((completedSteps / steps.length) * 100);
}

/**
 * Check if a document type has been generated
 *
 * @param existingDocuments - Array of existing documents
 * @param documentType - The document type to check
 * @returns True if the document type exists in the array
 */
export function hasDocumentType(
  existingDocuments: DocumentDTO[],
  documentType: DocumentType
): boolean {
  return existingDocuments.some((d) => d.documentType === documentType.value);
}

/**
 * Get the workflow order for a document type
 * Returns the order number from the configuration
 *
 * @param documentType - The document type
 * @returns The order number (0 for analysis, 1-4 for generated documents)
 */
export function getDocumentOrder(documentType: DocumentType): number {
  const config = DOCUMENT_TYPE_CONFIGS[documentType.value];
  return config?.order ?? 999; // Default to high number if not found
}

/**
 * Get all document types in workflow order
 * Returns document types sorted by their order in the workflow
 *
 * @returns Array of DocumentType instances in workflow order
 */
export function getDocumentTypesInOrder(): DocumentType[] {
  const types = [
    DocumentType.STARTUP_ANALYSIS,
    DocumentType.PRD,
    DocumentType.TECHNICAL_DESIGN,
    DocumentType.ARCHITECTURE,
    DocumentType.ROADMAP,
  ];

  return types.sort((a, b) => getDocumentOrder(a) - getDocumentOrder(b));
}
