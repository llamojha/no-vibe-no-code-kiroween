/**
 * Client-side API wrappers for Idea Panel feature
 *
 * These functions provide a clean interface for interacting with the
 * Idea Panel API endpoints from React components.
 */

export { getIdeaWithDocuments } from "./getIdeaWithDocuments";
export { getUserIdeas } from "./getUserIdeas";
export { updateStatus } from "./updateStatus";
export { saveMetadata } from "./saveMetadata";
export type { SaveMetadataOptions } from "./saveMetadata";
export { getDocumentsByIdea } from "./getDocumentsByIdea";
export { getDocumentById } from "./getDocumentById";
export { deleteIdea } from "./deleteIdea";
export { createIdea } from "./createIdea";
export type { CreateIdeaInput } from "./createIdea";

// Document Generation API wrappers
export {
  generateDocument,
  updateDocument,
  regenerateDocument,
  getDocumentVersions,
  restoreDocumentVersion,
  exportDocument,
  downloadExportedDocument,
} from "./documentGeneration";
export type {
  GeneratableDocumentType,
  GenerateDocumentOptions,
  UpdateDocumentOptions,
  ExportFormat,
  ExportResult,
} from "./documentGeneration";
