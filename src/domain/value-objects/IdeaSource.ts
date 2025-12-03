/**
 * Source of an idea in the system
 * Indicates whether the idea was manually entered or generated via Doctor Frankenstein
 */
export class IdeaSource {
  private constructor(private readonly _value: "manual" | "frankenstein") {}

  static readonly MANUAL = new IdeaSource("manual");
  static readonly FRANKENSTEIN = new IdeaSource("frankenstein");

  /**
   * Get the raw value of the source
   */
  get value(): string {
    return this._value;
  }

  /**
   * Create IdeaSource from a string value
   */
  static fromString(value: string): IdeaSource {
    switch (value.toLowerCase()) {
      case "manual":
        return IdeaSource.MANUAL;
      case "frankenstein":
        return IdeaSource.FRANKENSTEIN;
      default:
        throw new Error(
          `Invalid IdeaSource value: ${value}. Must be 'manual' or 'frankenstein'.`
        );
    }
  }

  /**
   * Check if two IdeaSource instances are equal
   */
  equals(other: IdeaSource): boolean {
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
   * Check if this is a manual idea
   */
  isManual(): boolean {
    return this._value === "manual";
  }

  /**
   * Check if this is a Frankenstein-generated idea
   */
  isFrankenstein(): boolean {
    return this._value === "frankenstein";
  }
}
