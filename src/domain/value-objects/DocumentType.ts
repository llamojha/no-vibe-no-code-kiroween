import { DOCUMENT_TYPE_CONFIGS } from "../config/documentTypeConfig";

export type DocumentTypeValue =
  | "startup_analysis"
  | "hackathon_analysis"
  | "prd"
  | "technical_design"
  | "architecture"
  | "roadmap";

/**
 * Type of document in the system
 * Supports analysis documents and generated documents (PRD, Technical Design, Architecture, Roadmap)
 */
export class DocumentType {
  private constructor(private readonly _value: DocumentTypeValue) {}

  static readonly STARTUP_ANALYSIS = new DocumentType("startup_analysis");
  static readonly HACKATHON_ANALYSIS = new DocumentType("hackathon_analysis");
  static readonly PRD = new DocumentType("prd");
  static readonly TECHNICAL_DESIGN = new DocumentType("technical_design");
  static readonly ARCHITECTURE = new DocumentType("architecture");
  static readonly ROADMAP = new DocumentType("roadmap");

  /**
   * Get the raw value of the document type
   */
  get value(): string {
    return this._value;
  }

  /**
   * Create DocumentType from a string value
   */
  static fromString(value: string): DocumentType {
    switch (value.toLowerCase()) {
      case "startup_analysis":
        return DocumentType.STARTUP_ANALYSIS;
      case "hackathon_analysis":
        return DocumentType.HACKATHON_ANALYSIS;
      case "prd":
        return DocumentType.PRD;
      case "technical_design":
        return DocumentType.TECHNICAL_DESIGN;
      case "architecture":
        return DocumentType.ARCHITECTURE;
      case "roadmap":
        return DocumentType.ROADMAP;
      default:
        throw new Error(
          `Invalid DocumentType value: ${value}. Must be one of: startup_analysis, hackathon_analysis, prd, technical_design, architecture, roadmap.`
        );
    }
  }

  /**
   * Check if two DocumentType instances are equal
   */
  equals(other: DocumentType): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * Check if this is a startup analysis document
   */
  isStartupAnalysis(): boolean {
    return this._value === "startup_analysis";
  }

  /**
   * Check if this is a hackathon analysis document
   */
  isHackathonAnalysis(): boolean {
    return this._value === "hackathon_analysis";
  }

  /**
   * Check if this is an analysis document (startup or hackathon)
   */
  isAnalysis(): boolean {
    return (
      this._value === "startup_analysis" || this._value === "hackathon_analysis"
    );
  }

  /**
   * Check if this is a generated document (PRD, Technical Design, Architecture, Roadmap)
   */
  isGeneratedDocument(): boolean {
    return !this.isAnalysis();
  }

  /**
   * Get the display name for this document type
   * Delegates to DOCUMENT_TYPE_CONFIGS (single source of truth)
   */
  getDisplayName(): string {
    const config = DOCUMENT_TYPE_CONFIGS[this._value];
    return config?.displayName || this._value;
  }

  /**
   * Get the credit cost for generating this document type
   * Delegates to DOCUMENT_TYPE_CONFIGS (single source of truth)
   */
  getCreditCost(): number {
    const config = DOCUMENT_TYPE_CONFIGS[this._value];
    return config?.creditCost || 0;
  }

  /**
   * Get the icon identifier for this document type
   * Delegates to DOCUMENT_TYPE_CONFIGS (single source of truth)
   */
  getIcon(): string {
    const config = DOCUMENT_TYPE_CONFIGS[this._value];
    return config?.icon || "file";
  }

  /**
   * Get the color for this document type
   * Delegates to DOCUMENT_TYPE_CONFIGS (single source of truth)
   */
  getColor(): string {
    const config = DOCUMENT_TYPE_CONFIGS[this._value];
    return config?.color || "gray";
  }
}
