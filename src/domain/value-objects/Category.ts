/**
 * Value object representing analysis categories in the system
 * Supports both general analysis categories and hackathon-specific categories
 */
export class Category {
  private readonly _value: string;
  private readonly _type: 'general' | 'hackathon';

  private constructor(value: string, type: 'general' | 'hackathon') {
    this._value = value;
    this._type = type;
  }

  /**
   * Supported general analysis categories
   */
  private static readonly GENERAL_CATEGORIES = [
    'technology',
    'business',
    'market',
    'innovation',
    'feasibility'
  ] as const;

  /**
   * Supported hackathon categories (Kiroween themed)
   */
  private static readonly HACKATHON_CATEGORIES = [
    'resurrection',
    'frankenstein', 
    'skeleton-crew',
    'costume-contest'
  ] as const;

  /**
   * Create a general analysis category
   */
  static createGeneral(value: string): Category {
    const normalizedValue = value.toLowerCase().trim();
    if (!this.GENERAL_CATEGORIES.includes(normalizedValue as typeof this.GENERAL_CATEGORIES[number])) {
      throw new Error(`Invalid general category: ${value}. Supported categories are: ${this.GENERAL_CATEGORIES.join(', ')}`);
    }
    return new Category(normalizedValue, 'general');
  }

  /**
   * Create a hackathon category
   */
  static createHackathon(value: string): Category {
    const normalizedValue = value.toLowerCase().trim();
    if (!this.HACKATHON_CATEGORIES.includes(normalizedValue as typeof this.HACKATHON_CATEGORIES[number])) {
      throw new Error(`Invalid hackathon category: ${value}. Supported categories are: ${this.HACKATHON_CATEGORIES.join(', ')}`);
    }
    return new Category(normalizedValue, 'hackathon');
  }

  /**
   * Create Category for reconstruction from persistence
   */
  static reconstruct(value: string, type: 'general' | 'hackathon'): Category {
    return new Category(value, type);
  }

  /**
   * Get predefined general categories
   */
  static getGeneralCategories(): string[] {
    return [...this.GENERAL_CATEGORIES];
  }

  /**
   * Get predefined hackathon categories
   */
  static getHackathonCategories(): string[] {
    return [...this.HACKATHON_CATEGORIES];
  }

  /**
   * Get the category value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Get the category type
   */
  get type(): 'general' | 'hackathon' {
    return this._type;
  }

  /**
   * Check if this is a general category
   */
  get isGeneral(): boolean {
    return this._type === 'general';
  }

  /**
   * Check if this is a hackathon category
   */
  get isHackathon(): boolean {
    return this._type === 'hackathon';
  }

  /**
   * Get display name for the category
   */
  get displayName(): string {
    switch (this._value) {
      case 'resurrection':
        return 'Resurrection';
      case 'frankenstein':
        return 'Frankenstein';
      case 'skeleton-crew':
        return 'Skeleton Crew';
      case 'costume-contest':
        return 'Costume Contest';
      case 'technology':
        return 'Technology';
      case 'business':
        return 'Business';
      case 'market':
        return 'Market';
      case 'innovation':
        return 'Innovation';
      case 'feasibility':
        return 'Feasibility';
      default:
        return this._value.charAt(0).toUpperCase() + this._value.slice(1);
    }
  }

  /**
   * Check if two categories are equal
   */
  equals(other: Category): boolean {
    return this._value === other._value && this._type === other._type;
  }

  /**
   * Get string representation of the category
   */
  toString(): string {
    return this._value;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: string; type: 'general' | 'hackathon' } {
    return {
      value: this._value,
      type: this._type
    };
  }
}