/**
 * Value object representing a score in the analysis system
 * Scores are constrained to be between 0 and 100 inclusive
 */
export class Score {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * Create a Score from a numeric value
   * Validates that the score is within the valid range (0-100)
   */
  static create(value: number): Score {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Score must be a valid number');
    }

    if (value < 0 || value > 100) {
      throw new Error('Score must be between 0 and 100 inclusive');
    }

    return new Score(Math.round(value * 100) / 100); // Round to 2 decimal places
  }

  /**
   * Create Score for reconstruction from persistence
   */
  static reconstruct(value: number): Score {
    return new Score(value);
  }

  /**
   * Get the numeric value of the score
   */
  get value(): number {
    return this._value;
  }

  /**
   * Check if two scores are equal
   */
  equals(other: Score): boolean {
    return this._value === other._value;
  }

  /**
   * Compare this score with another score
   * Returns negative if this < other, positive if this > other, 0 if equal
   */
  compareTo(other: Score): number {
    return this._value - other._value;
  }

  /**
   * Check if this score is higher than another score
   */
  isHigherThan(other: Score): boolean {
    return this._value > other._value;
  }

  /**
   * Check if this score is lower than another score
   */
  isLowerThan(other: Score): boolean {
    return this._value < other._value;
  }

  /**
   * Get a percentage representation of the score
   */
  toPercentage(): string {
    return `${this._value}%`;
  }

  /**
   * Get string representation of the score
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): number {
    return this._value;
  }
}