/**
 * Document Type Configuration
 * Single source of truth for document type metadata
 * All DocumentType helper methods delegate to this configuration
 */

export interface DocumentTypeConfig {
  displayName: string;
  creditCost: number;
  icon: string; // Icon name/identifier
  color: string; // Tailwind color class
  order: number; // For workflow display
}

/**
 * Configuration for all document types
 * This is the single source of truth - no duplication elsewhere
 */
export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  startup_analysis: {
    displayName: "Startup Analysis",
    creditCost: 0, // Analysis is free (uses existing analyzer)
    icon: "chart",
    color: "purple",
    order: 0,
  },
  hackathon_analysis: {
    displayName: "Hackathon Analysis",
    creditCost: 0, // Analysis is free (uses existing analyzer)
    icon: "trophy",
    color: "orange",
    order: 0,
  },
  prd: {
    displayName: "Product Requirements Document",
    creditCost: 50,
    icon: "file-text",
    color: "blue",
    order: 1,
  },
  technical_design: {
    displayName: "Technical Design Document",
    creditCost: 75,
    icon: "code",
    color: "purple",
    order: 2,
  },
  architecture: {
    displayName: "Architecture Document",
    creditCost: 75,
    icon: "layers",
    color: "green",
    order: 3,
  },
  roadmap: {
    displayName: "Project Roadmap",
    creditCost: 50,
    icon: "map",
    color: "orange",
    order: 4,
  },
};
