/**
 * Document Validator Service
 *
 * Validates document availability and content for the Kiro Setup Export feature.
 * Ensures all required documents (PRD, Design, Tech Architecture, Roadmap) exist
 * and contain valid content before allowing export.
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */

/**
 * Document types required for Kiro Setup Export
 */
export type ExportDocumentType =
  | "prd"
  | "design"
  | "techArchitecture"
  | "roadmap";

/**
 * Document input for validation
 */
export interface DocumentInput {
  type: ExportDocumentType;
  content: string | null | undefined;
  exists: boolean;
}

/**
 * Documents to validate for export
 */
export interface DocumentsToValidate {
  prd?: DocumentInput;
  design?: DocumentInput;
  techArchitecture?: DocumentInput;
  roadmap?: DocumentInput;
}

/**
 * Result of document validation
 */
export interface DocumentValidationResult {
  /** Whether all required documents are valid (exist and have content) */
  isValid: boolean;
  /** List of document types that are missing (don't exist) */
  missingDocuments: ExportDocumentType[];
  /** List of document types that exist but have no content */
  emptyDocuments: ExportDocumentType[];
}

/**
 * All required document types for export
 */
const REQUIRED_DOCUMENT_TYPES: ExportDocumentType[] = [
  "prd",
  "design",
  "techArchitecture",
  "roadmap",
];

/**
 * DocumentValidator service
 *
 * Validates that all required documents for Kiro Setup Export are present
 * and contain valid content.
 */
export class DocumentValidator {
  /**
   * Validate documents for export
   *
   * @param documents - The documents to validate
   * @returns DocumentValidationResult indicating validity and any issues
   *
   * Requirements:
   * - 9.1: Verify that PRD, Design Document, Tech Architecture, and Roadmap documents exist
   * - 9.2: Export Button disabled when any required document is missing
   * - 9.4: Export Button enabled when all required documents exist
   * - 9.5: Document with no content is treated as missing
   */
  validate(documents: DocumentsToValidate): DocumentValidationResult {
    const missingDocuments: ExportDocumentType[] = [];
    const emptyDocuments: ExportDocumentType[] = [];

    for (const docType of REQUIRED_DOCUMENT_TYPES) {
      const doc = documents[docType];

      if (!doc || !doc.exists) {
        // Document doesn't exist
        missingDocuments.push(docType);
      } else if (!this.hasContent(doc.content)) {
        // Document exists but has no content (treated as missing per 9.5)
        emptyDocuments.push(docType);
      }
    }

    const isValid =
      missingDocuments.length === 0 && emptyDocuments.length === 0;

    return {
      isValid,
      missingDocuments,
      emptyDocuments,
    };
  }

  /**
   * Check if content is non-empty
   *
   * @param content - The content to check
   * @returns true if content exists and is non-empty
   */
  private hasContent(content: string | null | undefined): boolean {
    if (content === null || content === undefined) {
      return false;
    }

    // Trim whitespace and check if there's actual content
    const trimmed = content.trim();
    return trimmed.length > 0;
  }

  /**
   * Get display names for document types
   *
   * @param docType - The document type
   * @returns Human-readable display name
   */
  static getDisplayName(docType: ExportDocumentType): string {
    const displayNames: Record<ExportDocumentType, string> = {
      prd: "PRD",
      design: "Design Document",
      techArchitecture: "Tech Architecture",
      roadmap: "Roadmap",
    };
    return displayNames[docType];
  }

  /**
   * Get a human-readable message describing validation issues
   *
   * @param result - The validation result
   * @returns A message describing what's missing or empty
   */
  static getValidationMessage(result: DocumentValidationResult): string {
    if (result.isValid) {
      return "All required documents are available";
    }

    const issues: string[] = [];

    if (result.missingDocuments.length > 0) {
      const missingNames = result.missingDocuments.map((d) =>
        DocumentValidator.getDisplayName(d)
      );
      issues.push(`Missing: ${missingNames.join(", ")}`);
    }

    if (result.emptyDocuments.length > 0) {
      const emptyNames = result.emptyDocuments.map((d) =>
        DocumentValidator.getDisplayName(d)
      );
      issues.push(`Empty: ${emptyNames.join(", ")}`);
    }

    return issues.join(". ");
  }
}
