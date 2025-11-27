/**
 * ExportKiroSetupUseCase
 *
 * Orchestrates the export of a complete Kiro workspace setup from generated project documentation.
 * Coordinates validation, parsing, extraction, generation, and packaging stages.
 *
 * Requirements: 1.2, 1.3, 9.1
 */

import { Result, success, failure } from "../../shared/types/common";
import { ValidationError } from "../../shared/types/errors";
import { browserLogger as logger, LogCategory } from "@/lib/logger/browser";
import {
  DocumentValidator,
  type DocumentsToValidate,
  type DocumentValidationResult,
} from "../services/DocumentValidator";
import {
  FileGenerator,
  type FileGeneratorResult,
} from "../../infrastructure/export/FileGenerator";
import {
  ExportPackager,
  type PackageResult,
} from "../../infrastructure/export/ExportPackager";
import type {
  ExportFormat,
  GeneratedFiles,
  ExportedFile,
} from "../../infrastructure/export/types";

/**
 * Input command for exporting Kiro setup
 */
export interface ExportKiroSetupCommand {
  /** Unique identifier for the idea */
  ideaId: string;
  /** Name of the idea (used for filename generation) */
  ideaName: string;
  /** Export format: ZIP or individual files */
  format: ExportFormat;
  /** Source documents to export */
  documents: {
    prd: string;
    design: string;
    techArchitecture: string;
    roadmap: string;
  };
}

/**
 * Result of the export operation
 */
export interface ExportKiroSetupResult {
  /** Whether the export was successful */
  success: boolean;
  /** Blob for ZIP download (when format is 'zip') */
  blob?: Blob;
  /** Individual files for download (when format is 'individual') */
  files?: ExportedFile[];
  /** Generated filename */
  filename?: string;
  /** Generated files structure (for inspection/testing) */
  generatedFiles?: GeneratedFiles;
  /** Error message if export failed */
  error?: string;
  /** Detailed error information */
  errorDetails?: {
    code: string;
    validationResult?: DocumentValidationResult;
    stage?: "validation" | "generation" | "packaging";
  };
}

/**
 * Export error codes
 */
export const ExportErrorCodes = {
  VALIDATION_FAILED: "EXPORT_VALIDATION_FAILED",
  GENERATION_FAILED: "EXPORT_GENERATION_FAILED",
  PACKAGING_FAILED: "EXPORT_PACKAGING_FAILED",
  UNKNOWN_ERROR: "EXPORT_UNKNOWN_ERROR",
} as const;

/**
 * Use case for exporting a complete Kiro workspace setup
 *
 * Flow:
 * 1. Validate all required documents exist and have content
 * 2. Generate all export files (steering, specs, README, roadmap)
 * 3. Package files into selected format (ZIP or individual)
 * 4. Return result with download data
 */
export class ExportKiroSetupUseCase {
  private readonly documentValidator: DocumentValidator;
  private readonly fileGenerator: FileGenerator;
  private readonly exportPackager: ExportPackager;

  constructor(
    documentValidator?: DocumentValidator,
    fileGenerator?: FileGenerator,
    exportPackager?: ExportPackager
  ) {
    this.documentValidator = documentValidator ?? new DocumentValidator();
    this.fileGenerator = fileGenerator ?? new FileGenerator();
    this.exportPackager = exportPackager ?? new ExportPackager();
  }

  /**
   * Execute the export process
   *
   * @param command - Export command with idea details and documents
   * @returns Result with export data or error
   */
  async execute(
    command: ExportKiroSetupCommand
  ): Promise<Result<ExportKiroSetupResult, Error>> {
    const startTime = Date.now();

    logger.info(LogCategory.BUSINESS, "Starting Kiro setup export", {
      ideaId: command.ideaId,
      ideaName: command.ideaName,
      format: command.format,
    });

    try {
      // Stage 1: Validate documents
      const validationResult = this.validateDocuments(command.documents);
      if (!validationResult.isValid) {
        const errorMessage =
          DocumentValidator.getValidationMessage(validationResult);

        logger.warn(LogCategory.BUSINESS, "Export validation failed", {
          ideaId: command.ideaId,
          missingDocuments: validationResult.missingDocuments,
          emptyDocuments: validationResult.emptyDocuments,
        });

        return success({
          success: false,
          error: errorMessage,
          errorDetails: {
            code: ExportErrorCodes.VALIDATION_FAILED,
            validationResult,
            stage: "validation",
          },
        });
      }

      // Stage 2: Generate files
      const generationResult = this.generateFiles(command);
      if (!generationResult.success || !generationResult.files) {
        logger.error(LogCategory.BUSINESS, "Export file generation failed", {
          ideaId: command.ideaId,
          error: generationResult.error,
        });

        return success({
          success: false,
          error: generationResult.error ?? "Failed to generate export files",
          errorDetails: {
            code: ExportErrorCodes.GENERATION_FAILED,
            stage: "generation",
          },
        });
      }

      // Stage 3: Package files
      const packageResult = await this.packageFiles(
        generationResult.files,
        command
      );
      if (!packageResult.success) {
        logger.error(LogCategory.BUSINESS, "Export packaging failed", {
          ideaId: command.ideaId,
          error: packageResult.error,
        });

        return success({
          success: false,
          error: packageResult.error ?? "Failed to package export files",
          errorDetails: {
            code: ExportErrorCodes.PACKAGING_FAILED,
            stage: "packaging",
          },
        });
      }

      const duration = Date.now() - startTime;

      logger.info(LogCategory.BUSINESS, "Kiro setup export completed", {
        ideaId: command.ideaId,
        format: command.format,
        filename: packageResult.filename,
        fileCount: this.countFiles(generationResult.files),
        durationMs: duration,
      });

      return success({
        success: true,
        blob: packageResult.blob,
        files: packageResult.files,
        filename: packageResult.filename,
        generatedFiles: generationResult.files,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error during export";

      logger.error(LogCategory.BUSINESS, "Unexpected error during export", {
        ideaId: command.ideaId,
        error: errorMessage,
      });

      return failure(
        new ValidationError(
          `Export failed: ${errorMessage}`,
          [errorMessage],
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Validate that all required documents exist and have content
   */
  private validateDocuments(
    documents: ExportKiroSetupCommand["documents"]
  ): DocumentValidationResult {
    const documentsToValidate: DocumentsToValidate = {
      prd: {
        type: "prd",
        content: documents.prd,
        exists: !!documents.prd,
      },
      design: {
        type: "design",
        content: documents.design,
        exists: !!documents.design,
      },
      techArchitecture: {
        type: "techArchitecture",
        content: documents.techArchitecture,
        exists: !!documents.techArchitecture,
      },
      roadmap: {
        type: "roadmap",
        content: documents.roadmap,
        exists: !!documents.roadmap,
      },
    };

    return this.documentValidator.validate(documentsToValidate);
  }

  /**
   * Generate all export files from source documents
   */
  private generateFiles(command: ExportKiroSetupCommand): FileGeneratorResult {
    return this.fileGenerator.generate({
      ideaName: command.ideaName,
      documents: {
        prd: command.documents.prd,
        design: command.documents.design,
        techArchitecture: command.documents.techArchitecture,
        roadmap: command.documents.roadmap,
      },
    });
  }

  /**
   * Package generated files into the selected format
   */
  private async packageFiles(
    files: GeneratedFiles,
    command: ExportKiroSetupCommand
  ): Promise<PackageResult> {
    return this.exportPackager.package(files, {
      ideaName: command.ideaName,
      format: command.format,
    });
  }

  /**
   * Count total files in the generated package
   */
  private countFiles(files: GeneratedFiles): number {
    return this.exportPackager.countFiles(files);
  }

  /**
   * Validate documents without performing export
   * Useful for checking export readiness before user clicks export
   */
  validateForExport(
    documents: ExportKiroSetupCommand["documents"]
  ): DocumentValidationResult {
    return this.validateDocuments(documents);
  }

  /**
   * Get human-readable validation message
   */
  getValidationMessage(result: DocumentValidationResult): string {
    return DocumentValidator.getValidationMessage(result);
  }
}
