/**
 * ContentExtractor service
 *
 * Extracts specific content from parsed documents and maps them to template-ready format.
 * Handles extraction from PRD, Tech Architecture, Design Document, and Roadmap.
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5, 3.2,, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5
 */

import type {
  ParsedDocument,
  ExtractedContent,
  ProductContent,
  TechContent,
  ArchitectureContent,
  RoadmapContent,
  DocumentSection,
} from "./types";
import { DocumentParser } from "./DocumentParser";
import { RoadmapParser } from "./RoadmapParser";

/**
 * Input documents for content extraction
 */
export interface SourceDocuments {
  prd: string;
  techArchitecture: string;
  design: string;
  roadmap: string;
}

/**
 * Extracts specific content from parsed documents for template population
 */
export class ContentExtractor {
  private documentParser: DocumentParser;
  private roadmapParser: RoadmapParser;

  constructor() {
    this.documentParser = new DocumentParser();
    this.roadmapParser = new RoadmapParser();
  }

  /**
   * Extract all content from source documents
   * @param documents - Raw markdown content of all source documents
   * @returns ExtractedContent with product, tech, architecture, and roadmap data
   */
  extract(documents: SourceDocuments): ExtractedContent {
    const parsedPrd = this.documentParser.parse(documents.prd);
    const parsedTech = this.documentParser.parse(documents.techArchitecture);
    const parsedDesign = this.documentParser.parse(documents.design);
    const parsedRoadmap = this.roadmapParser.parse(documents.roadmap);

    return {
      product: this.extractProductContent(parsedPrd),
      tech: this.extractTechContent(parsedTech),
      architecture: this.extractArchitectureContent(parsedDesign),
      roadmap: {
        items: parsedRoadmap.items,
        rawContent: documents.roadmap,
      },
    };
  }

  /**
   * Extract product content from PRD
   * Requirements: 2.2, 2.3, 2.4, 2.5
   */
  private extractProductContent(prd: ParsedDocument): ProductContent {
    return {
      vision: this.extractSectionContent(prd, [
        "vision",
        "product vision",
        "our vision",
      ]),
      mission: this.extractSectionContent(prd, [
        "mission",
        "product mission",
        "our mission",
      ]),
      targetUsers: this.extractSectionContent(prd, [
        "target users",
        "users",
        "target audience",
        "audience",
        "who is this for",
      ]),
      personas: this.extractSectionContent(prd, [
        "personas",
        "user personas",
        "customer personas",
        "user profiles",
      ]),
      metrics: this.extractSectionContent(prd, [
        "metrics",
        "success metrics",
        "kpis",
        "key performance indicators",
        "measurements",
        "goals",
      ]),
      constraints: this.extractSectionContent(prd, [
        "constraints",
        "limitations",
        "boundaries",
        "restrictions",
        "non-goals",
      ]),
      valueProposition: this.extractSectionContent(prd, [
        "value proposition",
        "value prop",
        "unique value",
        "why us",
        "benefits",
        "core value",
      ]),
    };
  }

  /**
   * Extract tech content from Tech Architecture document
   * Requirements: 3.2, 3.3, 3.4, 3.5
   */
  private extractTechContent(techDoc: ParsedDocument): TechContent {
    return {
      stack: this.extractSectionContent(techDoc, [
        "technology stack",
        "tech stack",
        "stack",
        "technologies",
        "tools",
      ]),
      dependencies: this.extractSectionContent(techDoc, [
        "dependencies",
        "packages",
        "libraries",
        "external dependencies",
      ]),
      frameworkVersions: this.extractSectionContent(techDoc, [
        "framework versions",
        "versions",
        "framework",
        "runtime",
      ]),
      setupInstructions: this.extractSectionContent(techDoc, [
        "setup",
        "setup instructions",
        "installation",
        "getting started",
        "development setup",
        "environment setup",
      ]),
      buildConfig: this.extractSectionContent(techDoc, [
        "build",
        "build configuration",
        "build config",
        "compilation",
        "bundling",
      ]),
      technicalConstraints: this.extractSectionContent(techDoc, [
        "technical constraints",
        "constraints",
        "limitations",
        "requirements",
        "system requirements",
      ]),
    };
  }

  /**
   * Extract architecture content from Design Document
   * Requirements: 4.2, 4.3, 4.4, 4.5
   */
  private extractArchitectureContent(
    designDoc: ParsedDocument
  ): ArchitectureContent {
    return {
      patterns: this.extractSectionContent(designDoc, [
        "patterns",
        "architectural patterns",
        "design patterns",
        "architecture",
      ]),
      layerResponsibilities: this.extractSectionContent(designDoc, [
        "layer responsibilities",
        "layers",
        "layer",
        "responsibilities",
        "separation of concerns",
      ]),
      codeOrganization: this.extractSectionContent(designDoc, [
        "code organization",
        "organization",
        "structure",
        "folder structure",
        "directory structure",
        "project structure",
      ]),
      namingConventions: this.extractSectionContent(designDoc, [
        "naming conventions",
        "naming",
        "conventions",
        "style guide",
      ]),
      importPatterns: this.extractSectionContent(designDoc, [
        "import patterns",
        "imports",
        "module imports",
        "dependencies",
      ]),
    };
  }

  /**
   * Extract content from a section matching any of the given keywords
   * @param document - Parsed document to search
   * @param keywords - Array of keywords to match section headings
   * @returns Extracted content or empty string if not found
   */
  private extractSectionContent(
    document: ParsedDocument,
    keywords: string[]
  ): string {
    // Try each keyword to find a matching section
    for (const keyword of keywords) {
      const section = this.documentParser.findSection(document, keyword);
      if (section) {
        return this.formatSectionContent(section);
      }
    }

    // If no section found, try to find content in the document body
    return this.searchContentInDocument(document, keywords);
  }

  /**
   * Format section content including subsections
   */
  private formatSectionContent(section: DocumentSection): string {
    let content = section.content.trim();

    // Include subsection content if present
    if (section.subsections.length > 0) {
      for (const subsection of section.subsections) {
        const subsectionContent =
          this.documentParser.getSectionWithSubsections(subsection);
        if (subsectionContent) {
          content += `\n\n### ${subsection.heading}\n\n${subsectionContent}`;
        }
      }
    }

    return content.trim();
  }

  /**
   * Search for content related to keywords in the entire document
   * Used as fallback when no explicit section is found
   */
  private searchContentInDocument(
    document: ParsedDocument,
    keywords: string[]
  ): string {
    // Search through all sections for relevant content
    const relevantContent: string[] = [];

    for (const section of document.sections) {
      const content = this.searchInSection(section, keywords);
      if (content) {
        relevantContent.push(content);
      }
    }

    return relevantContent.join("\n\n").trim();
  }

  /**
   * Search for keyword-related content within a section
   */
  private searchInSection(
    section: DocumentSection,
    keywords: string[]
  ): string | null {
    const contentLower = section.content.toLowerCase();
    const headingLower = section.heading.toLowerCase();

    // Check if section heading or content contains any keyword
    for (const keyword of keywords) {
      if (
        headingLower.includes(keyword.toLowerCase()) ||
        contentLower.includes(keyword.toLowerCase())
      ) {
        // Extract relevant paragraphs containing the keyword
        return this.extractRelevantParagraphs(section.content, keyword);
      }
    }

    // Search in subsections
    for (const subsection of section.subsections) {
      const found = this.searchInSection(subsection, keywords);
      if (found) return found;
    }

    return null;
  }

  /**
   * Extract paragraphs containing a specific keyword
   */
  private extractRelevantParagraphs(content: string, keyword: string): string {
    const paragraphs = content.split(/\n\n+/);
    const relevant: string[] = [];
    const keywordLower = keyword.toLowerCase();

    for (const paragraph of paragraphs) {
      if (paragraph.toLowerCase().includes(keywordLower)) {
        relevant.push(paragraph.trim());
      }
    }

    return relevant.join("\n\n");
  }

  /**
   * Extract product content only
   */
  extractProduct(prdContent: string): ProductContent {
    const parsed = this.documentParser.parse(prdContent);
    return this.extractProductContent(parsed);
  }

  /**
   * Extract tech content only
   */
  extractTech(techContent: string): TechContent {
    const parsed = this.documentParser.parse(techContent);
    return this.extractTechContent(parsed);
  }

  /**
   * Extract architecture content only
   */
  extractArchitecture(designContent: string): ArchitectureContent {
    const parsed = this.documentParser.parse(designContent);
    return this.extractArchitectureContent(parsed);
  }

  /**
   * Extract roadmap content only
   */
  extractRoadmap(roadmapContent: string): RoadmapContent {
    const parsed = this.roadmapParser.parse(roadmapContent);
    return {
      items: parsed.items,
      rawContent: roadmapContent,
    };
  }

  /**
   * Check if extracted content has meaningful data
   */
  hasContent(content: ExtractedContent): boolean {
    return (
      this.hasProductContent(content.product) ||
      this.hasTechContent(content.tech) ||
      this.hasArchitectureContent(content.architecture) ||
      content.roadmap.items.length > 0
    );
  }

  /**
   * Check if product content has meaningful data
   */
  private hasProductContent(product: ProductContent): boolean {
    return !!(
      product.vision ||
      product.mission ||
      product.targetUsers ||
      product.personas ||
      product.metrics ||
      product.constraints ||
      product.valueProposition
    );
  }

  /**
   * Check if tech content has meaningful data
   */
  private hasTechContent(tech: TechContent): boolean {
    return !!(
      tech.stack ||
      tech.dependencies ||
      tech.frameworkVersions ||
      tech.setupInstructions ||
      tech.buildConfig ||
      tech.technicalConstraints
    );
  }

  /**
   * Check if architecture content has meaningful data
   */
  private hasArchitectureContent(architecture: ArchitectureContent): boolean {
    return !!(
      architecture.patterns ||
      architecture.layerResponsibilities ||
      architecture.codeOrganization ||
      architecture.namingConventions ||
      architecture.importPatterns
    );
  }
}
