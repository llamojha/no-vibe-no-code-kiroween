/**
 * ExportPackager service
 *
 * Packages generated files into ZIP or individual file downloads.
 * Handles browser download triggers and filename generation.
 *
 * Requirements: 1.2, 1.3, 1.4, 11.1, 11.2, 11.3, 11.4, 11.5, 13.4, 13.5
 */

import JSZip from "jszip";
import type { GeneratedFiles, ExportedFile, ExportFormat } from "./types";

/**
 * Root folder name for the export package
 * Requirements: 11.1
 */
const ROOT_FOLDER = "kiro-setup";

/**
 * Subfolder names within the export package
 * Requirements: 11.2, 11.3, 11.4
 */
const SUBFOLDERS = {
  steering: "steering",
  specs: "specs",
  docs: "docs",
} as const;

/**
 * Result of packaging operation
 */
export interface PackageResult {
  success: boolean;
  blob?: Blob;
  files?: ExportedFile[];
  filename?: string;
  error?: string;
}

/**
 * Options for packaging
 */
export interface PackageOptions {
  ideaName: string;
  format: ExportFormat;
  timestamp?: Date;
}

/**
 * Packages generated files into downloadable formats
 */
export class ExportPackager {
  /**
   * Package files according to the specified format
   * @param files - Generated files to package
   * @param options - Packaging options
   * @returns PackageResult with blob or individual files
   */
  async package(
    files: GeneratedFiles,
    options: PackageOptions
  ): Promise<PackageResult> {
    try {
      if (options.format === "zip") {
        return await this.packageAsZip(files, options);
      } else {
        return this.packageAsIndividualFiles(files, options);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during packaging",
      };
    }
  }

  /**
   * Package files as a ZIP archive
   * Requirements: 1.2, 11.1, 11.2, 11.3, 11.4, 11.5, 13.4
   * @param files - Generated files to package
   * @param options - Packaging options
   * @returns PackageResult with ZIP blob
   */
  async packageAsZip(
    files: GeneratedFiles,
    options: PackageOptions
  ): Promise<PackageResult> {
    const zip = new JSZip();
    const rootFolder = zip.folder(ROOT_FOLDER);

    if (!rootFolder) {
      return {
        success: false,
        error: "Failed to create root folder in ZIP",
      };
    }

    // Create steering folder and add files
    // Requirements: 11.2
    const steeringFolder = rootFolder.folder(SUBFOLDERS.steering);
    if (steeringFolder) {
      for (const [filename, content] of Object.entries(files.steering)) {
        steeringFolder.file(filename, content);
      }
    }

    // Create specs folder and add spec subfolders
    // Requirements: 11.3
    const specsFolder = rootFolder.folder(SUBFOLDERS.specs);
    if (specsFolder) {
      for (const [specName, specFiles] of Object.entries(files.specs)) {
        const specFolder = specsFolder.folder(specName);
        if (specFolder) {
          for (const [filename, content] of Object.entries(specFiles)) {
            specFolder.file(filename, content);
          }
        }
      }
    }

    // Create docs folder and add files
    // Requirements: 11.4
    const docsFolder = rootFolder.folder(SUBFOLDERS.docs);
    if (docsFolder) {
      for (const [filename, content] of Object.entries(files.docs)) {
        docsFolder.file(filename, content);
      }
    }

    // Add README at root level
    // Requirements: 11.5
    rootFolder.file("README.md", files["README.md"]);

    // Generate ZIP blob
    const blob = await zip.generateAsync({ type: "blob" });
    const filename = this.generateFilename(options.ideaName, options.timestamp);

    return {
      success: true,
      blob,
      filename,
    };
  }

  /**
   * Package files as individual downloadable files
   * Requirements: 13.5
   * @param files - Generated files to package
   * @param options - Packaging options
   * @returns PackageResult with array of ExportedFile
   */
  packageAsIndividualFiles(
    files: GeneratedFiles,
    options: PackageOptions
  ): PackageResult {
    const exportedFiles: ExportedFile[] = [];

    // Add steering files with folder-prefixed names
    for (const [filename, content] of Object.entries(files.steering)) {
      exportedFiles.push({
        name: `${SUBFOLDERS.steering}-${filename}`,
        content,
        path: `${ROOT_FOLDER}/${SUBFOLDERS.steering}/${filename}`,
      });
    }

    // Add spec files with folder-prefixed names
    for (const [specName, specFiles] of Object.entries(files.specs)) {
      for (const [filename, content] of Object.entries(specFiles)) {
        exportedFiles.push({
          name: `${SUBFOLDERS.specs}-${specName}-${filename}`,
          content,
          path: `${ROOT_FOLDER}/${SUBFOLDERS.specs}/${specName}/${filename}`,
        });
      }
    }

    // Add docs files with folder-prefixed names
    for (const [filename, content] of Object.entries(files.docs)) {
      exportedFiles.push({
        name: `${SUBFOLDERS.docs}-${filename}`,
        content,
        path: `${ROOT_FOLDER}/${SUBFOLDERS.docs}/${filename}`,
      });
    }

    // Add README with folder prefix
    exportedFiles.push({
      name: `${ROOT_FOLDER}-README.md`,
      content: files["README.md"],
      path: `${ROOT_FOLDER}/README.md`,
    });

    return {
      success: true,
      files: exportedFiles,
      filename: this.generateFilename(options.ideaName, options.timestamp),
    };
  }

  /**
   * Generate filename using the pattern "kiro-setup-{idea-name}-{timestamp}.zip"
   * Requirements: 1.4
   * @param ideaName - Name of the idea
   * @param timestamp - Optional timestamp (defaults to now)
   * @returns Formatted filename
   */
  generateFilename(ideaName: string, timestamp?: Date): string {
    const sanitizedName = this.sanitizeIdeaName(ideaName);
    const formattedTimestamp = this.formatTimestamp(timestamp || new Date());
    return `kiro-setup-${sanitizedName}-${formattedTimestamp}.zip`;
  }

  /**
   * Sanitize idea name for use in filename
   * Removes special characters and replaces spaces with hyphens
   * @param ideaName - Original idea name
   * @returns Sanitized name safe for filenames
   */
  sanitizeIdeaName(ideaName: string): string {
    return ideaName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Format timestamp for filename
   * Format: YYYYMMDD-HHmmss
   * @param date - Date to format
   * @returns Formatted timestamp string
   */
  formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Trigger browser download for a blob
   * Requirements: 1.3
   * @param blob - Blob to download
   * @param filename - Name for the downloaded file
   */
  triggerDownload(blob: Blob, filename: string): void {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error(
        "triggerDownload can only be called in browser environment"
      );
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Trigger browser download for a text file
   * @param content - Text content to download
   * @param filename - Name for the downloaded file
   * @param mimeType - MIME type for the file (default: text/markdown)
   */
  triggerTextDownload(
    content: string,
    filename: string,
    mimeType: string = "text/markdown"
  ): void {
    const blob = new Blob([content], { type: mimeType });
    this.triggerDownload(blob, filename);
  }

  /**
   * Trigger multiple file downloads
   * Requirements: 13.5
   * @param files - Array of files to download
   * @param delayMs - Delay between downloads in milliseconds (default: 100)
   */
  async triggerMultipleDownloads(
    files: ExportedFile[],
    delayMs: number = 100
  ): Promise<void> {
    for (const file of files) {
      this.triggerTextDownload(file.content, file.name);
      // Add delay between downloads to prevent browser blocking
      await this.delay(delayMs);
    }
  }

  /**
   * Utility function for adding delay
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the folder structure of the export package
   * Useful for validation and display
   * @returns Array of folder paths
   */
  getFolderStructure(): string[] {
    return [
      ROOT_FOLDER,
      `${ROOT_FOLDER}/${SUBFOLDERS.steering}`,
      `${ROOT_FOLDER}/${SUBFOLDERS.specs}`,
      `${ROOT_FOLDER}/${SUBFOLDERS.docs}`,
    ];
  }

  /**
   * Validate that the generated files have the correct structure
   * @param files - Generated files to validate
   * @returns Validation result with any issues found
   */
  validateStructure(files: GeneratedFiles): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check steering files
    const requiredSteeringFiles = [
      "product.md",
      "tech.md",
      "architecture.md",
      "spec-generation.md",
    ];
    for (const file of requiredSteeringFiles) {
      if (!(file in files.steering)) {
        issues.push(`Missing steering file: ${file}`);
      }
    }

    // Check docs files
    if (!("roadmap.md" in files.docs)) {
      issues.push("Missing docs file: roadmap.md");
    }
    if (!("PRD.md" in files.docs)) {
      issues.push("Missing docs file: PRD.md");
    }
    if (!("tech-architecture.md" in files.docs)) {
      issues.push("Missing docs file: tech-architecture.md");
    }
    if (!("design.md" in files.docs)) {
      issues.push("Missing docs file: design.md");
    }

    // Check README
    if (!files["README.md"]) {
      issues.push("Missing README.md");
    }

    // Check specs (at least one spec should exist)
    if (Object.keys(files.specs).length === 0) {
      issues.push("No spec folders found");
    } else {
      // Validate each spec has required files
      for (const [specName, specFiles] of Object.entries(files.specs)) {
        const requiredSpecFiles = ["requirements.md", "design.md", "tasks.md"];
        for (const file of requiredSpecFiles) {
          if (!(file in specFiles)) {
            issues.push(`Missing spec file in ${specName}: ${file}`);
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Calculate the total size of the export package
   * @param files - Generated files
   * @returns Total size in bytes
   */
  calculatePackageSize(files: GeneratedFiles): number {
    let totalSize = 0;

    // Steering files
    for (const content of Object.values(files.steering)) {
      totalSize += new Blob([content]).size;
    }

    // Spec files
    for (const specFiles of Object.values(files.specs)) {
      for (const content of Object.values(specFiles)) {
        totalSize += new Blob([content]).size;
      }
    }

    // Docs files
    for (const content of Object.values(files.docs)) {
      totalSize += new Blob([content]).size;
    }

    // README
    totalSize += new Blob([files["README.md"]]).size;

    return totalSize;
  }

  /**
   * Count total number of files in the package
   * @param files - Generated files
   * @returns Total file count
   */
  countFiles(files: GeneratedFiles): number {
    let count = 0;

    // Steering files
    count += Object.keys(files.steering).length;

    // Spec files
    for (const specFiles of Object.values(files.specs)) {
      count += Object.keys(specFiles).length;
    }

    // Docs files
    count += Object.keys(files.docs).length;

    // README
    count += 1;

    return count;
  }
}
