/**
 * Document Utility Functions
 * All functions delegate to DocumentType methods or DOCUMENT_TYPE_CONFIGS (no duplication)
 */

import { DocumentType } from "@/src/domain/value-objects/DocumentType";

/**
 * Get the display name for a document type
 * Delegates to DocumentType.getDisplayName()
 */
export function getDocumentDisplayName(type: DocumentType): string {
  return type.getDisplayName();
}

/**
 * Get the credit cost for generating a document type
 * Delegates to DocumentType.getCreditCost()
 */
export function getDocumentCreditCost(type: DocumentType): number {
  return type.getCreditCost();
}

/**
 * Get the icon identifier for a document type
 * Delegates to DocumentType.getIcon()
 */
export function getDocumentIcon(type: DocumentType): string {
  return type.getIcon();
}

/**
 * Get the color for a document type
 * Delegates to DocumentType.getColor()
 */
export function getDocumentColor(type: DocumentType): string {
  return type.getColor();
}

/**
 * Get the generator route for a document type
 * Maps document type to static route
 */
export function getGeneratorRoute(type: DocumentType, ideaId: string): string {
  const routeMap: Record<string, string> = {
    prd: `/generate/prd/${ideaId}`,
    technical_design: `/generate/technical-design/${ideaId}`,
    architecture: `/generate/architecture/${ideaId}`,
    roadmap: `/generate/roadmap/${ideaId}`,
  };

  return routeMap[type.value] || `/idea/${ideaId}`;
}
