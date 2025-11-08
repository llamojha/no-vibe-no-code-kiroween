import { EntityId } from '../entities/shared/Entity';
import { ValidationUtils } from '../../shared/utils/validation';

/**
 * Strongly-typed identifier for User entities
 * Encapsulates UUID validation and provides type safety
 */
export class UserId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new UserId from a string value
   * Validates that the value is a proper UUID
   */
  static fromString(value: string): UserId {
    if (!ValidationUtils.isValidUUID(value)) {
      throw new Error(`Invalid UserId format: ${value}. Must be a valid UUID.`);
    }
    return new UserId(value);
  }

  /**
   * Generate a new random UserId
   */
  static generate(): UserId {
    // Generate a UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return new UserId(uuid);
  }

  /**
   * Create UserId for reconstruction from persistence
   * Assumes the value is already validated
   */
  static reconstruct(value: string): UserId {
    return new UserId(value);
  }
}