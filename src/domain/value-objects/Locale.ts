/**
 * Value object representing a supported locale in the application
 * Currently supports English (en) and Spanish (es)
 */
export class Locale {
  private readonly _value: 'en' | 'es';

  private constructor(value: 'en' | 'es') {
    this._value = value;
  }

  /**
   * Create a Locale from a string value
   * Validates that the locale is supported
   */
  static create(value: string): Locale {
    if (!value || typeof value !== 'string') {
      throw new Error('Locale value cannot be empty');
    }

    const normalizedValue = value.toLowerCase().trim();
    if (normalizedValue !== 'en' && normalizedValue !== 'es') {
      throw new Error(`Unsupported locale: ${value}. Supported locales are: en, es`);
    }

    return new Locale(normalizedValue as 'en' | 'es');
  }

  /**
   * Create a Locale from a string value (alias for create)
   * @deprecated Use create() instead
   */
  static fromString(value: string): Locale {
    return Locale.create(value);
  }

  /**
   * Create Locale for reconstruction from persistence
   */
  static reconstruct(value: 'en' | 'es'): Locale {
    return new Locale(value);
  }

  /**
   * Create English locale
   */
  static english(): Locale {
    return new Locale('en');
  }

  /**
   * Create Spanish locale
   */
  static spanish(): Locale {
    return new Locale('es');
  }

  /**
   * Get all supported locales
   */
  static getSupportedLocales(): ('en' | 'es')[] {
    return ['en', 'es'];
  }

  /**
   * Get the locale value
   */
  get value(): 'en' | 'es' {
    return this._value;
  }

  /**
   * Check if this is English locale
   */
  get isEnglish(): boolean {
    return this._value === 'en';
  }

  /**
   * Check if this is Spanish locale
   */
  get isSpanish(): boolean {
    return this._value === 'es';
  }

  /**
   * Get the display name of the locale
   */
  get displayName(): string {
    switch (this._value) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      default:
        return this._value;
    }
  }

  /**
   * Check if two locales are equal
   */
  equals(other: Locale): boolean {
    return this._value === other._value;
  }

  /**
   * Get string representation of the locale
   */
  toString(): string {
    return this._value;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): string {
    return this._value;
  }
}