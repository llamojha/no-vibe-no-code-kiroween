/**
 * FileGenerator service
 *
 * Generates all export files including steering files, example specs, README, and roadmap copy.
 * Orchestrates the TemplateEngine and ContentExtractor to produce the complete export package.
 *
 * Requirements: 2.1, 3.1, 4.1, 5.1, 6.2, 6.3, 6.4, 6.5, 7.1, 8.1, 8.2, 8.3, 8.4, 12.1, 12.2, 12.3, 12.4
 */

import type { GeneratedFiles, ExtractedContent } from "./types";
import { TemplateEngine } from "./TemplateEngine";
import { ContentExtractor, type SourceDocuments } from "./ContentExtractor";

/**
 * Input for file generation
 */
export interface FileGeneratorInput {
  ideaName: string;
  documents: SourceDocuments;
}

/**
 * Result of file generation
 */
export interface FileGeneratorResult {
  success: boolean;
  files?: GeneratedFiles;
  error?: string;
}

/**
 * File reference format used in steering files
 * Format: #[[file:path/to/file.md]]
 */
const FILE_REFERENCE_FORMAT = "#[[file:{{path}}]]";

/**
 * Generates all export files from source documents
 */
export class FileGenerator {
  private templateEngine: TemplateEngine;
  private contentExtractor: ContentExtractor;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.contentExtractor = new ContentExtractor();
  }

  /**
   * Generate all export files
   * @param input - Input containing idea name and source documents
   * @returns FileGeneratorResult with generated files or error
   */
  generate(input: FileGeneratorInput): FileGeneratorResult {
    try {
      // Extract content from source documents
      const extractedContent = this.contentExtractor.extract(input.documents);

      // Generate timestamp
      const timestamp = this.generateTimestamp();

      // Generate all files
      const files = this.generateAllFiles(
        input.ideaName,
        extractedContent,
        timestamp,
        input.documents
      );

      return {
        success: true,
        files,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during file generation",
      };
    }
  }

  /**
   * Generate all files for the export package
   */
  private generateAllFiles(
    ideaName: string,
    content: ExtractedContent,
    timestamp: string,
    sourceDocuments: SourceDocuments
  ): GeneratedFiles {
    // Generate steering files
    const steering = this.generateSteeringFiles(ideaName, content);

    // Specs are generated on-demand via Kiro using spec-generation.md guide
    const specs = {};

    // Generate docs (roadmap copy)
    const docs = this.generateDocs(content, sourceDocuments);

    // Generate README
    const readme = this.generateReadme(ideaName, timestamp);

    return {
      steering,
      specs,
      docs,
      "README.md": readme,
    };
  }

  /**
   * Generate steering files
   * Requirements: 2.1, 3.1, 4.1, 5.1
   */
  private generateSteeringFiles(
    ideaName: string,
    content: ExtractedContent
  ): GeneratedFiles["steering"] {
    return {
      "product.md": this.templateEngine.generateProductSteering(
        content.product,
        ideaName
      ),
      "tech.md": this.templateEngine.generateTechSteering(
        content.tech,
        ideaName
      ),
      "architecture.md": this.templateEngine.generateArchitectureSteering(
        content.architecture,
        ideaName
      ),
      "spec-generation.md":
        this.templateEngine.generateSpecGenerationSteering(ideaName),
    };
  }

  /**
   * Generate docs folder with roadmap and source documents
   * Requirements: 8.1, 8.2, 8.3, 8.4
   */
  private generateDocs(
    content: ExtractedContent,
    sourceDocuments: SourceDocuments
  ): GeneratedFiles["docs"] {
    // Preserve roadmap and source documents exactly as-is
    return {
      "roadmap.md": content.roadmap.rawContent,
      "PRD.md": sourceDocuments.prd,
      "tech-architecture.md": sourceDocuments.techArchitecture,
      "design.md": sourceDocuments.design,
    };
  }

  /**
   * Generate README file
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  private generateReadme(ideaName: string, timestamp: string): string {
    return this.templateEngine.generateReadme(ideaName, timestamp);
  }

  /**
   * Format a file reference using the correct format
   * Requirements: 12.3
   */
  formatFileReference(path: string): string {
    return FILE_REFERENCE_FORMAT.replace("{{path}}", path);
  }

  /**
   * Validate that all file references in content point to existing files
   * Requirements: 12.5
   */
  validateFileReferences(
    files: GeneratedFiles,
    references: string[]
  ): { valid: boolean; invalidReferences: string[] } {
    const invalidReferences: string[] = [];
    const existingPaths = this.getExistingPaths(files);

    for (const ref of references) {
      // Extract path from reference format #[[file:path]]
      const match = ref.match(/#\[\[file:(.+?)\]\]/);
      if (match) {
        const path = match[1];
        if (!existingPaths.includes(path)) {
          invalidReferences.push(path);
        }
      }
    }

    return {
      valid: invalidReferences.length === 0,
      invalidReferences,
    };
  }

  /**
   * Get all existing file paths in the generated files
   */
  private getExistingPaths(files: GeneratedFiles): string[] {
    const paths: string[] = [];

    // Steering files
    paths.push("steering/product.md");
    paths.push("steering/tech.md");
    paths.push("steering/architecture.md");
    paths.push("steering/spec-generation.md");

    // Spec files
    for (const specName of Object.keys(files.specs)) {
      paths.push(`specs/${specName}/requirements.md`);
      paths.push(`specs/${specName}/design.md`);
      paths.push(`specs/${specName}/tasks.md`);
    }

    // Docs
    paths.push("docs/roadmap.md");
    paths.push("docs/PRD.md");
    paths.push("docs/tech-architecture.md");
    paths.push("docs/design.md");

    // README
    paths.push("README.md");

    return paths;
  }

  /**
   * Generate a formatted timestamp
   */
  private generateTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  }

  /**
   * Extract all file references from generated content
   */
  extractFileReferences(files: GeneratedFiles): string[] {
    const references: string[] = [];
    const pattern = /#\[\[file:[^\]]+\]\]/g;

    // Check all steering files
    for (const content of Object.values(files.steering)) {
      const matches = content.match(pattern);
      if (matches) {
        references.push(...matches);
      }
    }

    // Check all spec files
    for (const spec of Object.values(files.specs)) {
      for (const content of Object.values(spec)) {
        const matches = content.match(pattern);
        if (matches) {
          references.push(...matches);
        }
      }
    }

    // Check docs
    for (const content of Object.values(files.docs)) {
      const matches = content.match(pattern);
      if (matches) {
        references.push(...matches);
      }
    }

    // Check README
    const readmeMatches = files["README.md"].match(pattern);
    if (readmeMatches) {
      references.push(...readmeMatches);
    }

    // Return unique references
    return [...new Set(references)];
  }

  /**
   * Get the feature name from the first spec
   */
  getFirstSpecFeatureName(files: GeneratedFiles): string | null {
    const specNames = Object.keys(files.specs);
    return specNames.length > 0 ? specNames[0] : null;
  }

  /**
   * Count total files in the generated package
   */
  countFiles(files: GeneratedFiles): number {
    let count = 0;

    // Steering files (4)
    count += Object.keys(files.steering).length;

    // Spec files (3 per spec)
    for (const spec of Object.values(files.specs)) {
      count += Object.keys(spec).length;
    }

    // Docs
    count += Object.keys(files.docs).length;

    // README (1)
    count += 1;

    return count;
  }

  /**
   * Get all file paths with their content
   */
  getAllFilesFlat(
    files: GeneratedFiles
  ): Array<{ path: string; content: string }> {
    const result: Array<{ path: string; content: string }> = [];

    // Steering files
    for (const [name, content] of Object.entries(files.steering)) {
      result.push({ path: `steering/${name}`, content });
    }

    // Spec files
    for (const [specName, specFiles] of Object.entries(files.specs)) {
      for (const [fileName, content] of Object.entries(specFiles)) {
        result.push({ path: `specs/${specName}/${fileName}`, content });
      }
    }

    // Docs
    for (const [name, content] of Object.entries(files.docs)) {
      result.push({ path: `docs/${name}`, content });
    }

    // README
    result.push({ path: "README.md", content: files["README.md"] });

    return result;
  }
}
