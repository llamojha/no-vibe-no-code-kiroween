/**
 * Type of document in the system
 * For MVP: startup_analysis and hackathon_analysis
 * Future: prd, design_doc, roadmap, architecture
 */
export class DocumentType {
  private constructor(
    private readonly _value: "startup_analysis" | "hackathon_analysis"
  ) {}

  static readonly STARTUP_ANALYSIS = new DocumentType("startup_analysis");
  static readonly HACKATHON_ANALYSIS = new DocumentType("hackathon_analysis");

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
      default:
        throw new Error(
          `Invalid DocumentType value: ${value}. Must be 'startup_analysis' or 'hackathon_analysis'.`
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
}
