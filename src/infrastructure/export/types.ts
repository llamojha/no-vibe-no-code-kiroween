/**
 * Export infrastructure types
 *
 * Type definitions for the Kiro Setup Export feature.
 */

/**
 * Document types that can be exported
 */
export type DocumentType = "prd" | "design" | "techArchitecture" | "roadmap";

/**
 * Export format options
 */
export type ExportFormat = "zip" | "individual";

/**
 * Represents a section within a parsed document
 */
export interface DocumentSection {
  heading: string;
  level: number;
  content: string;
  subsections: DocumentSection[];
}

/**
 * Result of parsing a markdown document
 */
export interface ParsedDocument {
  title: string;
  sections: DocumentSection[];
  metadata?: Record<string, unknown>;
}

/**
 * Represents a single roadmap item
 */
export interface RoadmapItem {
  title: string;
  description: string;
  goals: string[];
  acceptanceCriteria?: string[];
  dependencies?: string[];
}

/**
 * Result of parsing a roadmap document
 */
export interface ParsedRoadmap {
  items: RoadmapItem[];
  firstItem: RoadmapItem | null;
}

/**
 * Content extracted from PRD document
 */
export interface ProductContent {
  vision: string;
  mission: string;
  targetUsers: string;
  personas: string;
  metrics: string;
  constraints: string;
  valueProposition: string;
}

/**
 * Content extracted from Tech Architecture document
 */
export interface TechContent {
  stack: string;
  dependencies: string;
  frameworkVersions: string;
  setupInstructions: string;
  buildConfig: string;
  technicalConstraints: string;
}

/**
 * Content extracted from Design Document
 */
export interface ArchitectureContent {
  patterns: string;
  layerResponsibilities: string;
  codeOrganization: string;
  namingConventions: string;
  importPatterns: string;
}

/**
 * Content extracted from Roadmap document
 */
export interface RoadmapContent {
  items: RoadmapItem[];
  rawContent: string;
}

/**
 * All extracted content from source documents
 */
export interface ExtractedContent {
  product: ProductContent;
  tech: TechContent;
  architecture: ArchitectureContent;
  roadmap: RoadmapContent;
}

/**
 * Generated files structure for export
 */
export interface GeneratedFiles {
  steering: {
    "product.md": string;
    "tech.md": string;
    "architecture.md": string;
    "spec-generation.md": string;
  };
  specs: {
    [featureName: string]: {
      "requirements.md": string;
      "design.md": string;
      "tasks.md": string;
    };
  };
  docs: {
    "roadmap.md": string;
    "PRD.md": string;
    "tech-architecture.md": string;
    "design.md": string;
  };
  "README.md": string;
}

/**
 * Represents a single exported file
 */
export interface ExportedFile {
  name: string;
  content: string;
  path: string;
}

/**
 * Export configuration options
 */
export interface ExportConfig {
  format: ExportFormat;
  includeOriginalDocs: boolean;
  templateVersion: string;
  timestamp: Date;
}

/**
 * Template data for populating templates
 */
export interface TemplateData {
  ideaName: string;
  timestamp: string;
  product: ProductContent;
  tech: TechContent;
  architecture: ArchitectureContent;
  exampleSpec: {
    featureName: string;
    userStory: string;
    acceptanceCriteria: string[];
    technicalApproach: string;
    tasks: string[];
  };
}

/**
 * Export error with recovery information
 */
export interface ExportError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  suggestedAction?: string;
}
