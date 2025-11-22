/**
 * Project status in the workflow
 * Represents the current state of an idea in the development lifecycle
 */
export class ProjectStatus {
  private constructor(
    private readonly _value: "idea" | "in_progress" | "completed" | "archived"
  ) {}

  static readonly IDEA = new ProjectStatus("idea");
  static readonly IN_PROGRESS = new ProjectStatus("in_progress");
  static readonly COMPLETED = new ProjectStatus("completed");
  static readonly ARCHIVED = new ProjectStatus("archived");

  /**
   * Get the raw value of the project status
   */
  get value(): string {
    return this._value;
  }

  /**
   * Create ProjectStatus from a string value
   */
  static fromString(value: string): ProjectStatus {
    switch (value.toLowerCase()) {
      case "idea":
        return ProjectStatus.IDEA;
      case "in_progress":
        return ProjectStatus.IN_PROGRESS;
      case "completed":
        return ProjectStatus.COMPLETED;
      case "archived":
        return ProjectStatus.ARCHIVED;
      default:
        throw new Error(
          `Invalid ProjectStatus value: ${value}. Must be 'idea', 'in_progress', 'completed', or 'archived'.`
        );
    }
  }

  /**
   * Check if two ProjectStatus instances are equal
   */
  equals(other: ProjectStatus): boolean {
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
   * Check if this is an idea status
   */
  isIdea(): boolean {
    return this._value === "idea";
  }

  /**
   * Check if this is in progress
   */
  isInProgress(): boolean {
    return this._value === "in_progress";
  }

  /**
   * Check if this is completed
   */
  isCompleted(): boolean {
    return this._value === "completed";
  }

  /**
   * Check if this is archived
   */
  isArchived(): boolean {
    return this._value === "archived";
  }

  /**
   * Check if status transition is valid
   * Business rule: Can only move forward in workflow or archive from any state
   */
  canTransitionTo(newStatus: ProjectStatus): boolean {
    // Can always archive from any state
    if (newStatus.isArchived()) {
      return true;
    }

    // Cannot transition from archived to any other state
    if (this.isArchived()) {
      return false;
    }

    // Can move forward in the workflow
    const statusOrder = ["idea", "in_progress", "completed"];
    const currentIndex = statusOrder.indexOf(this._value);
    const newIndex = statusOrder.indexOf(newStatus._value);

    // Allow moving forward or staying in the same state
    return newIndex >= currentIndex;
  }
}
