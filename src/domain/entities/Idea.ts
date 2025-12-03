import { Entity } from "./shared/Entity";
import { IdeaId } from "../value-objects/IdeaId";
import { UserId } from "../value-objects/UserId";
import { IdeaSource } from "../value-objects/IdeaSource";
import { ProjectStatus } from "../value-objects/ProjectStatus";
import {
  BusinessRuleViolationError,
  InvariantViolationError,
} from "../../shared/types/errors";

/**
 * Properties required to create a new Idea
 */
export interface CreateIdeaProps {
  userId: UserId;
  ideaText: string;
  source: IdeaSource;
  projectStatus?: ProjectStatus;
  notes?: string;
  tags?: string[];
}

/**
 * Properties for reconstructing an Idea from persistence
 */
export interface ReconstructIdeaProps extends CreateIdeaProps {
  id: IdeaId;
  projectStatus: ProjectStatus;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Idea aggregate root entity
 * Represents a startup concept or project idea in the system
 * Can be manually entered or generated via Doctor Frankenstein
 */
export class Idea extends Entity<IdeaId> {
  private readonly _userId: UserId;
  private readonly _ideaText: string;
  private readonly _source: IdeaSource;
  private _projectStatus: ProjectStatus;
  private _notes: string;
  private _tags: string[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: IdeaId,
    userId: UserId,
    ideaText: string,
    source: IdeaSource,
    projectStatus: ProjectStatus,
    notes: string,
    tags: string[],
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._userId = userId;
    this._ideaText = ideaText;
    this._source = source;
    this._projectStatus = projectStatus;
    this._notes = notes;
    this._tags = tags;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;

    this.validateInvariants();
  }

  /**
   * Create a new Idea entity
   */
  static create(props: CreateIdeaProps): Idea {
    const now = new Date();
    const id = IdeaId.generate();

    return new Idea(
      id,
      props.userId,
      props.ideaText,
      props.source,
      props.projectStatus || ProjectStatus.IDEA,
      props.notes || "",
      props.tags || [],
      now,
      now
    );
  }

  /**
   * Reconstruct an Idea from persistence data
   */
  static reconstruct(props: ReconstructIdeaProps): Idea {
    return new Idea(
      props.id,
      props.userId,
      props.ideaText,
      props.source,
      props.projectStatus,
      props.notes,
      props.tags,
      props.createdAt,
      props.updatedAt
    );
  }

  /**
   * Validate business invariants
   */
  private validateInvariants(): void {
    if (!this._ideaText || this._ideaText.trim().length === 0) {
      throw new InvariantViolationError("Idea text cannot be empty");
    }

    if (this._ideaText.trim().length < 10) {
      throw new InvariantViolationError(
        "Idea text must be at least 10 characters long"
      );
    }

    if (this._ideaText.trim().length > 5000) {
      throw new InvariantViolationError(
        "Idea text cannot exceed 5000 characters"
      );
    }

    if (this._notes.length > 10000) {
      throw new InvariantViolationError("Notes cannot exceed 10000 characters");
    }

    if (this._tags.length > 50) {
      throw new InvariantViolationError("Cannot have more than 50 tags");
    }

    // Validate each tag
    for (const tag of this._tags) {
      if (!tag || tag.trim().length === 0) {
        throw new InvariantViolationError("Tag cannot be empty");
      }
      if (tag.length > 50) {
        throw new InvariantViolationError("Tag cannot exceed 50 characters");
      }
    }
  }

  /**
   * Update the project status
   * Validates status transitions according to business rules
   */
  updateStatus(newStatus: ProjectStatus): void {
    if (!this._projectStatus.canTransitionTo(newStatus)) {
      throw new BusinessRuleViolationError(
        `Cannot transition from ${this._projectStatus.value} to ${newStatus.value}`
      );
    }

    this._projectStatus = newStatus;
    this._updatedAt = new Date();
  }

  /**
   * Update the notes
   */
  updateNotes(notes: string): void {
    if (notes.length > 10000) {
      throw new BusinessRuleViolationError(
        "Notes cannot exceed 10000 characters"
      );
    }

    this._notes = notes;
    this._updatedAt = new Date();
  }

  /**
   * Add a tag to the idea
   */
  addTag(tag: string): void {
    const trimmedTag = tag.trim();

    if (!trimmedTag || trimmedTag.length === 0) {
      throw new BusinessRuleViolationError("Tag cannot be empty");
    }

    if (trimmedTag.length > 50) {
      throw new BusinessRuleViolationError("Tag cannot exceed 50 characters");
    }

    if (this._tags.length >= 50) {
      throw new BusinessRuleViolationError(
        "Cannot add more than 50 tags to an idea"
      );
    }

    if (this._tags.includes(trimmedTag)) {
      throw new BusinessRuleViolationError("Tag already exists");
    }

    this._tags.push(trimmedTag);
    this._updatedAt = new Date();
  }

  /**
   * Remove a tag from the idea
   */
  removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index === -1) {
      throw new BusinessRuleViolationError("Tag not found");
    }

    this._tags.splice(index, 1);
    this._updatedAt = new Date();
  }

  /**
   * Get all tags
   */
  getTags(): readonly string[] {
    return [...this._tags];
  }

  /**
   * Get the idea text
   */
  getIdeaText(): string {
    return this._ideaText;
  }

  /**
   * Check if the idea belongs to a specific user
   */
  belongsToUser(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  /**
   * Check if the idea is recent (created within last 24 hours)
   */
  isRecent(): boolean {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this._createdAt > twentyFourHoursAgo;
  }

  /**
   * Get the age of the idea in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._createdAt.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  /**
   * Check if the idea has any tags
   */
  hasTags(): boolean {
    return this._tags.length > 0;
  }

  /**
   * Check if the idea has notes
   */
  hasNotes(): boolean {
    return this._notes.trim().length > 0;
  }

  // Getters
  get userId(): UserId {
    return this._userId;
  }

  get ideaText(): string {
    return this._ideaText;
  }

  get source(): IdeaSource {
    return this._source;
  }

  get projectStatus(): ProjectStatus {
    return this._projectStatus;
  }

  get notes(): string {
    return this._notes;
  }

  get tags(): readonly string[] {
    return this.getTags();
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * Get a summary of the idea
   */
  getSummary(): string {
    const ideaPreview =
      this._ideaText.length > 100
        ? this._ideaText.substring(0, 100) + "..."
        : this._ideaText;

    return `Idea (${this._source.value}): ${ideaPreview}`;
  }
}
