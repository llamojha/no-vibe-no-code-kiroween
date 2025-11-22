import type { DocumentDTO } from "@/src/infrastructure/web/dto/DocumentDTO";

/**
 * Fetches a single document by ID from the documents table.
 * Used when viewing reports from the idea panel.
 *
 * @param documentId - The document ID to fetch
 * @returns Promise resolving to the document DTO
 * @throws Error if request fails or document not found
 */
export async function getDocumentById(
  documentId: string
): Promise<DocumentDTO> {
  const response = await fetch(`/api/v2/documents/${documentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to load document: ${response.statusText}`
    );
  }

  return response.json();
}
