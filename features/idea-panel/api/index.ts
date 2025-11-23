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
