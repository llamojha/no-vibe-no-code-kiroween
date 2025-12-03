/**
 * Base Entity class for domain entities with strongly-typed IDs
 * All domain entities must extend this class and provide a typed ID
 */
export abstract class Entity<TId extends EntityId> {
  protected constructor(private readonly _id: TId) {
    if (!_id) {
      throw new Error('Entity ID cannot be null or undefined');
    }
  }

  /**
   * Get the entity's unique identifier
   */
  get id(): TId {
    return this._id;
  }

  /**
   * Check if two entities are equal based on their IDs
   */
  equals(other: Entity<TId>): boolean {
    if (!other) {
      return false;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    return this._id.equals(other._id);
  }

  /**
   * Get string representation of the entity
   */
  toString(): string {
    return `${this.constructor.name}(${this._id.toString()})`;
  }
}

/**
 * Base EntityId class for strongly-typed entity identifiers
 * All entity IDs must extend this class
 */
export abstract class EntityId {
  protected constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('EntityId value cannot be empty');
    }
  }

  /**
   * Get the raw value of the ID
   */
  get value(): string {
    return this._value;
  }

  /**
   * Check if two entity IDs are equal
   */
  equals(other: EntityId): boolean {
    if (!other) {
      return false;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    return this._value === other._value;
  }

  /**
   * Get string representation of the ID
   */
  toString(): string {
    return this._value;
  }
}