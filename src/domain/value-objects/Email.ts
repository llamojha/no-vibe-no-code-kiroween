import { ValidationUtils } from '../../shared/utils/validation';

/**
 * Value object representing an email address
 * Ensures email format validation and immutability
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase().trim();
  }

  /**
   * Create an Email from a string value
   * Validates email format using standard email validation
   */
  static create(value: string): Email {
    if (!value || typeof value !== 'string') {
      throw new Error('Email value cannot be empty');
    }

    const trimmedValue = value.trim();
    if (!ValidationUtils.isValidEmail(trimmedValue)) {
      throw new Error(`Invalid email format: ${value}`);
    }

    return new Email(trimmedValue);
  }

  /**
   * Create Email for reconstruction from persistence
   */
  static reconstruct(value: string): Email {
    return new Email(value);
  }

  /**
   * Get the email address value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Get the local part of the email (before @)
   */
  get localPart(): string {
    return this._value.split('@')[0];
  }

  /**
   * Get the domain part of the email (after @)
   */
  get domain(): string {
    return this._value.split('@')[1];
  }

  /**
   * Check if two emails are equal
   */
  equals(other: Email): boolean {
    return this._value === other._value;
  }

  /**
   * Check if the email belongs to a specific domain
   */
  belongsToDomain(domain: string): boolean {
    return this.domain.toLowerCase() === domain.toLowerCase();
  }

  /**
   * Get string representation of the email
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