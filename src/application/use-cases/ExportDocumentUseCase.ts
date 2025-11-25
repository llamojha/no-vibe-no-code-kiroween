import { Document } from "../../domain/entities";
import { DocumentId, UserId } from "../../domain/value-objects";
import { IDocumentRepository } from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  DocumentNotFoundError,
  UnauthorizedAccessError,
} from "../../shared/types/errors";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Export format types
 */
export type ExportFormat = "markdown" | "pdf";

/**
 * Input for exporting a document
 */
export interface ExportDocumentInput {
  documentId: DocumentId;
  userId: UserId;
  format: ExportFormat;
}

/**
 * Export result containing file data and metadata
 */
export interface ExportResult {
  content: string | Buffer;
  filename: string;
  mimeType: string;
  metadata: {
    title: string;
    version: number;
    exportDate: string;
    documentType: string;
  };
}

/**
 * Output from exporting a document
 */
export interface ExportDocumentOutput {
  export: ExportResult;
}

/**
 * Use case for exporting a document in various formats
 *
 * Flow:
 * 1. Load document
 * 2. Format based on export type (pdf/markdown)
 * 3. Include metadata (title, version, date)
 * 4. Return file buffer and metadata
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 *
 * Note: This is a basic implementation. PDF export will be enhanced
 * when IPDFExportService is implemented in the infrastructure layer.
 */
export class ExportDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  /**
   * Execute the document export process
   */
  async execute(
    input: ExportDocumentInput
  ): Promise<Result<ExportDocumentOutput, Error>> {
    logger.info(LogCategory.BUSINESS, "Starting document export", {
      documentId: input.documentId.value,
      format: input.format,
      userId: input.userId.value,
    });

    try {
      // Step 1: Load document
      const documentResult = await this.documentRepository.findById(
        input.documentId,
        input.userId
      );

      if (!documentResult.success) {
        return failure(documentResult.error);
      }

      if (!documentResult.data) {
        return failure(new DocumentNotFoundError(input.documentId.value));
      }

      const document = documentResult.data;

      // Step 2: Verify user owns the document
      if (!document.belongsToUser(input.userId)) {
        return failure(
          new UnauthorizedAccessError(
            input.userId.value,
            input.documentId.value
          )
        );
      }

      // Step 3: Format based on export type
      let exportResult: ExportResult;

      if (input.format === "markdown") {
        exportResult = this.exportAsMarkdown(document);
      } else if (input.format === "pdf") {
        exportResult = this.exportAsPDF(document);
      } else {
        return failure(new Error(`Unsupported export format: ${input.format}`));
      }

      logger.info(LogCategory.BUSINESS, "Document exported successfully", {
        documentId: input.documentId.value,
        format: input.format,
        filename: exportResult.filename,
      });

      return success({
        export: exportResult,
      });
    } catch (error) {
      logger.error(LogCategory.BUSINESS, "Error exporting document", {
        error: error instanceof Error ? error.message : "Unknown error",
        documentId: input.documentId.value,
        format: input.format,
      });

      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during document export")
      );
    }
  }

  /**
   * Export document as Markdown
   */
  private exportAsMarkdown(document: Document): ExportResult {
    const content = document.content;
    let markdownContent = "";

    // Extract markdown content
    if (typeof content === "string") {
      markdownContent = content;
    } else if (
      typeof content === "object" &&
      content !== null &&
      "markdown" in content
    ) {
      markdownContent = String(content.markdown);
    } else {
      // Fallback: convert content to JSON string
      markdownContent = JSON.stringify(content, null, 2);
    }

    // Add metadata header
    const metadata = this.buildMetadata(document);
    const header = this.buildMarkdownHeader(metadata);
    const fullContent = `${header}\n\n${markdownContent}`;

    const filename = this.buildFilename(document, "md");

    return {
      content: fullContent,
      filename,
      mimeType: "text/markdown",
      metadata,
    };
  }

  /**
   * Export document as PDF
   *
   * Note: This is a placeholder implementation that returns markdown.
   * A proper PDF export service (IPDFExportService) will be implemented
   * in the infrastructure layer using a library like jsPDF or puppeteer.
   */
  private exportAsPDF(document: Document): ExportResult {
    // For now, return markdown content with PDF mime type
    // This will be replaced with actual PDF generation
    const markdownExport = this.exportAsMarkdown(document);

    logger.warn(
      LogCategory.BUSINESS,
      "PDF export not fully implemented, returning markdown",
      {
        documentId: document.id.value,
      }
    );

    return {
      content: markdownExport.content,
      filename: this.buildFilename(document, "pdf"),
      mimeType: "application/pdf",
      metadata: markdownExport.metadata,
    };
  }

  /**
   * Build metadata for export
   */
  private buildMetadata(document: Document): {
    title: string;
    version: number;
    exportDate: string;
    documentType: string;
  } {
    return {
      title: document.title || document.documentType.getDisplayName(),
      version: document.version.value,
      exportDate: new Date().toISOString(),
      documentType: document.documentType.getDisplayName(),
    };
  }

  /**
   * Build markdown header with metadata
   */
  private buildMarkdownHeader(metadata: {
    title: string;
    version: number;
    exportDate: string;
    documentType: string;
  }): string {
    return `---
title: ${metadata.title}
type: ${metadata.documentType}
version: ${metadata.version}
exported: ${metadata.exportDate}
---`;
  }

  /**
   * Build filename for export
   */
  private buildFilename(document: Document, extension: string): string {
    const sanitizedTitle = (document.title || document.documentType.value)
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const timestamp = new Date().toISOString().split("T")[0];
    const version = `v${document.version.value}`;

    return `${sanitizedTitle}_${version}_${timestamp}.${extension}`;
  }
}
