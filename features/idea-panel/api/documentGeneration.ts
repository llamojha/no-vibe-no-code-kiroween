/**
 * Client-side API wrappers for Document Generation feature
 *
 * These functions provide a clean interface for interacting with the
 * Document Generation API endpoints from React components.
 *
 * Requirements: 2.1, 4.1, 6.1, 8.1, 11.2, 12.1, 12.5, 13.1, 14.1
 */

import type { DocumentDTO } from "@/src/infrastructure/database/supabase/mappers/DocumentMapper";

/**
 * Document types that can be generated
 */
export type GeneratableDocumentType =
  | "prd"
  | "technical_design"
  | "architecture"
  | "roadmap";

/**
 * Options for generating a document
 */
export interface GenerateDocumentOptions {
  ideaId: string;
  documentType: GeneratableDocumentType;
}

/**
 * Options for updating a document
 */
export interface UpdateDocumentOptions {
  content: string;
}

/**
 * Export format options
 */
export type ExportFormat = "markdown" | "pdf";

/**
 * Export result containing the file data
 */
export interface ExportResult {
  blob: Blob;
  filename: string;
  contentType: string;
}

/**
 * Generate a new document using AI
 * @param options - The generation options (ideaId and documentType)
 * @returns Promise resolving to the generated document
 * @throws Error if request fails, insufficient credits, or feature disabled
 *
 * Requirements: 2.1, 4.1, 6.1, 8.1
 */
export async function generateDocument(
  options: GenerateDocumentOptions
): Promise<DocumentDTO> {
  const response = await fetch("/api/v2/documents/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ideaId: options.ideaId,
      documentType: options.documentType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 403) {
      // Could be feature flag disabled or permission denied
      throw new Error(
        errorData.error || "Document generation is not available"
      );
    }

    if (response.status === 402) {
      // Insufficient credits
      throw new Error(
        errorData.error ||
          "Insufficient credits. Please purchase more credits to continue."
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    if (response.status === 404) {
      throw new Error(errorData.error || "Idea not found");
    }

    if (response.status === 400) {
      throw new Error(errorData.error || "Invalid request");
    }

    throw new Error(errorData.error || "Failed to generate document");
  }

  const result = await response.json();
  return result.document as DocumentDTO;
}

/**
 * Update a document's content (creates a new version)
 * @param documentId - The ID of the document to update
 * @param options - The update options (content)
 * @returns Promise resolving to the updated document with new version
 * @throws Error if request fails or validation fails
 *
 * Requirements: 11.2
 */
export async function updateDocument(
  documentId: string,
  options: UpdateDocumentOptions
): Promise<DocumentDTO> {
  const response = await fetch(`/api/v2/documents/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: options.content,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 404) {
      throw new Error(errorData.error || "Document not found");
    }

    if (response.status === 403) {
      throw new Error(
        errorData.error || "You do not have permission to update this document"
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    if (response.status === 400) {
      throw new Error(errorData.error || "Invalid content");
    }

    throw new Error(errorData.error || "Failed to update document");
  }

  const result = await response.json();
  return result.document as DocumentDTO;
}

/**
 * Regenerate a document using AI (creates a new version)
 * @param documentId - The ID of the document to regenerate
 * @returns Promise resolving to the regenerated document with new version
 * @throws Error if request fails, insufficient credits, or feature disabled
 *
 * Requirements: 13.1
 */
export async function regenerateDocument(
  documentId: string
): Promise<DocumentDTO> {
  const response = await fetch(`/api/v2/documents/${documentId}/regenerate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 403) {
      throw new Error(
        errorData.error || "Document regeneration is not available"
      );
    }

    if (response.status === 402) {
      // Insufficient credits
      throw new Error(
        errorData.error ||
          "Insufficient credits. Please purchase more credits to continue."
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    if (response.status === 404) {
      throw new Error(errorData.error || "Document not found");
    }

    throw new Error(errorData.error || "Failed to regenerate document");
  }

  const result = await response.json();
  return result.document as DocumentDTO;
}

/**
 * Get all versions of a document
 * @param documentId - The ID of the document
 * @returns Promise resolving to array of document versions (newest first)
 * @throws Error if request fails or document not found
 *
 * Requirements: 12.1
 */
export async function getDocumentVersions(
  documentId: string
): Promise<DocumentDTO[]> {
  const response = await fetch(`/api/v2/documents/${documentId}/versions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 404) {
      throw new Error(errorData.error || "Document not found");
    }

    if (response.status === 403) {
      throw new Error(
        errorData.error ||
          "You do not have permission to view this document's versions"
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    throw new Error(errorData.error || "Failed to retrieve document versions");
  }

  const result = await response.json();
  return result.versions as DocumentDTO[];
}

/**
 * Restore a previous version of a document (creates a new version with that content)
 * @param documentId - The ID of the document
 * @param version - The version number to restore
 * @returns Promise resolving to the new document with restored content
 * @throws Error if request fails or version not found
 *
 * Requirements: 12.5
 */
export async function restoreDocumentVersion(
  documentId: string,
  version: number
): Promise<DocumentDTO> {
  const response = await fetch(
    `/api/v2/documents/${documentId}/versions/${version}/restore`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 404) {
      throw new Error(errorData.error || "Document or version not found");
    }

    if (response.status === 403) {
      throw new Error(
        errorData.error ||
          "You do not have permission to restore this document version"
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    if (response.status === 400) {
      throw new Error(errorData.error || "Invalid version number");
    }

    throw new Error(errorData.error || "Failed to restore document version");
  }

  const result = await response.json();
  return result.document as DocumentDTO;
}

/**
 * Export a document in the specified format
 * @param documentId - The ID of the document to export
 * @param format - The export format (markdown or pdf)
 * @returns Promise resolving to the export result with blob and metadata
 * @throws Error if request fails or document not found
 *
 * Requirements: 14.1
 */
export async function exportDocument(
  documentId: string,
  format: ExportFormat
): Promise<ExportResult> {
  const response = await fetch(
    `/api/v2/documents/${documentId}/export?format=${format}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    // Try to get error message from JSON response
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 404) {
      throw new Error(errorData.error || "Document not found");
    }

    if (response.status === 403) {
      throw new Error(
        errorData.error || "You do not have permission to export this document"
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    if (response.status === 400) {
      throw new Error(errorData.error || "Invalid export format");
    }

    throw new Error(errorData.error || "Failed to export document");
  }

  // Get the blob from the response
  const blob = await response.blob();

  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `document.${format === "pdf" ? "pdf" : "md"}`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  // Get content type
  const contentType =
    response.headers.get("Content-Type") ||
    (format === "pdf" ? "application/pdf" : "text/markdown");

  return {
    blob,
    filename,
    contentType,
  };
}

/**
 * Helper function to trigger download of exported document
 * @param exportResult - The export result from exportDocument
 */
export function downloadExportedDocument(exportResult: ExportResult): void {
  const url = URL.createObjectURL(exportResult.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportResult.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
