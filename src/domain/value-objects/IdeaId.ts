import { EntityId } from "../entities/shared/Entity";
import { ValidationUtils } from "../../shared/utils/validation";

/**
 * Strongly-typed identifier for Idea entities
 * Encapsulates UUID validation and provides type safety
 */
export class IdeaId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new IdeaId from a string value
   * Validates that the value is a proper UUID
   */
  static fromString(value: string): IdeaId {
    if (!ValidationUtils.isValidUUID(value)) {
      throw new Error(`Invalid IdeaId format: ${value}. Must be a valid UUID.`);
    }
    return new IdeaId(value);
  }

  /**
   * Generate a new random IdeaId
   */
  static generate(): IdeaId {
    // Generate a UUID v4
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
    return new IdeaId(uuid);
  }

  /**
   * Create IdeaId for reconstruction from persistence
   * Assumes the value is already validated
   */
  static reconstruct(value: string): IdeaId {
    return new IdeaId(value);
  }
}
