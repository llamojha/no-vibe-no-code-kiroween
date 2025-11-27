/**
 * Export infrastructure module
 *
 * This module provides the infrastructure for exporting Kiro workspace setups
 * from generated project documentation (PRD, Design Document, Tech Architecture, Roadmap).
 *
 * Components:
 * - DocumentParser: Parses markdown documents and extracts structure
 * - RoadmapParser: Parses roadmap documents and extracts items
 * - ContentExtractor: Extracts specific content from parsed documents
 * - TemplateEngine: Loads and populates file templates
 * - FileGenerator: Generates all export files
 * - ExportPackager: Packages files into ZIP or individual downloads
 */

// Types
export type {
  DocumentType,
  ExportFormat,
  DocumentSection,
  ParsedDocument,
  RoadmapItem,
  ParsedRoadmap,
  ProductContent,
  TechContent,
  ArchitectureContent,
  RoadmapContent,
  ExtractedContent,
  GeneratedFiles,
  ExportedFile,
  ExportConfig,
  TemplateData,
  ExportError,
} from "./types";

// Services
export { DocumentParser } from "./DocumentParser";
export { RoadmapParser } from "./RoadmapParser";
export { ContentExtractor } from "./ContentExtractor";
export type { SourceDocuments } from "./ContentExtractor";
export { TemplateEngine } from "./TemplateEngine";
export type { ExampleSpecData, FullTemplateData } from "./TemplateEngine";
export { FileGenerator } from "./FileGenerator";
export type { FileGeneratorInput, FileGeneratorResult } from "./FileGenerator";
export { ExportPackager } from "./ExportPackager";
export type { PackageResult, PackageOptions } from "./ExportPackager";
