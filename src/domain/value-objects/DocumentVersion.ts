/**
 * Document Version Value Object
 * Represents a version number for a document
 * Versions start at 1 and increment with each update
 */
export class DocumentVersion {
  private constructor(private readonly _value: number) {
    if (_value < 1) {
      throw new Error("Document version must be >= 1");
    }

    if (!Number.isInteger(_value)) {
      throw new Error("Document version must be an integer");
    }
  }

  /**
   * Create a DocumentVersion with a specific value
   */
  static create(version: number): DocumentVersion {
    return new DocumentVersion(version);
  }

  /**
   * Create the initial version (version 1)
   */
  static initial(): DocumentVersion {
    return new DocumentVersion(1);
  }

  /**
   * Get the raw value of the version
   */
  get value(): number {
    return this._value;
  }

  /**
   * Increment the version by 1
   * Returns a new DocumentVersion instance
   */
  increment(): DocumentVersion {
    return new DocumentVersion(this._value + 1);
  }

  /**
   * Check if two DocumentVersion instances are equal
   */
  equals(other: DocumentVersion): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `v${this._value}`;
  }

  /**
   * Check if this version is greater than another
   */
  isGreaterThan(other: DocumentVersion): boolean {
    return this._value > other._value;
  }

  /**
   * Check if this version is less than another
   */
  isLessThan(other: DocumentVersion): boolean {
    return this._value < other._value;
  }
}
