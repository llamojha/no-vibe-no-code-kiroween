import { Entity } from "./shared/Entity";
import { AnalysisId } from "../value-objects/AnalysisId";
import { UserId } from "../value-objects/UserId";
import { Score } from "../value-objects/Score";
import { Locale } from "../value-objects/Locale";
import { Category } from "../value-objects/Category";
import {
  BusinessRuleViolationError,
  InvariantViolationError,
} from "../../shared/types/errors";

/**
 * Supporting materials for hackathon analyses
 */
// Note: SupportingMaterials removed from domain. Hackathon-specific
// attachments are not persisted in the unified model.

/**
 * Properties required to create a new Analysis
 */
export interface CreateAnalysisProps {
  idea: string;
  userId: UserId;
  score: Score;
  locale: Locale;
  category?: Category;
  feedback?: string;
  suggestions?: string[];
}

/**
 * Properties for reconstructing an Analysis from persistence
 */
export interface ReconstructAnalysisProps extends CreateAnalysisProps {
  id: AnalysisId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analysis entity representing an idea analysis in the system
 * Contains business logic for analysis operations and validation
 */
export class Analysis extends Entity<AnalysisId> {
  private readonly _idea: string;
  private readonly _userId: UserId;
  private _score: Score;
  private readonly _locale: Locale;
  private _category?: Category;
  private _feedback?: string;
  private _suggestions: string[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: AnalysisId,
    idea: string,
    userId: UserId,
    score: Score,
    locale: Locale,
    createdAt: Date,
    updatedAt: Date,
    category?: Category,
    feedback?: string,
    suggestions: string[] = []
  ) {
    super(id);
    this._idea = idea;
    this._userId = userId;
    this._score = score;
    this._locale = locale;
    this._category = category;
    this._feedback = feedback;
    this._suggestions = suggestions;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;

    this.validateInvariants();
  }

  /**
   * Create a new Analysis entity
   */
  static create(props: CreateAnalysisProps): Analysis {
    const now = new Date();
    const id = AnalysisId.generate();

    return new Analysis(
      id,
      props.idea,
      props.userId,
      props.score,
      props.locale,
      now,
      now,
      props.category,
      props.feedback,
      props.suggestions || []
    );
  }

  /**
   * Reconstruct an Analysis from persistence data
   */
  static reconstruct(props: ReconstructAnalysisProps): Analysis {
    return new Analysis(
      props.id,
      props.idea,
      props.userId,
      props.score,
      props.locale,
      props.createdAt,
      props.updatedAt,
      props.category,
      props.feedback,
      props.suggestions || []
    );
  }

  /**
   * Validate business invariants
   */
  private validateInvariants(): void {
    if (!this._idea || this._idea.trim().length === 0) {
      throw new InvariantViolationError("Analysis idea cannot be empty");
    }

    if (this._idea.trim().length < 10) {
      throw new InvariantViolationError(
        "Analysis idea must be at least 10 characters long"
      );
    }

    if (this._idea.trim().length > 5000) {
      throw new InvariantViolationError(
        "Analysis idea cannot exceed 5000 characters"
      );
    }

    if (this._feedback && this._feedback.length > 10000) {
      throw new InvariantViolationError(
        "Analysis feedback cannot exceed 10000 characters"
      );
    }

    if (this._suggestions.length > 50) {
      throw new InvariantViolationError(
        "Analysis cannot have more than 50 suggestions"
      );
    }
  }

  /**
   * Update the analysis score
   */
  updateScore(newScore: Score): void {
    if (this.isCompleted()) {
      throw new BusinessRuleViolationError(
        "Cannot update score of a completed analysis"
      );
    }

    this._score = newScore;
    this._updatedAt = new Date();
  }

  /**
   * Update the analysis feedback
   */
  updateFeedback(feedback: string): void {
    if (feedback && feedback.length > 10000) {
      throw new BusinessRuleViolationError(
        "Feedback cannot exceed 10000 characters"
      );
    }

    this._feedback = feedback;
    this._updatedAt = new Date();
  }

  /**
   * Add a suggestion to the analysis
   */
  addSuggestion(suggestion: string): void {
    if (!suggestion || suggestion.trim().length === 0) {
      throw new BusinessRuleViolationError("Suggestion cannot be empty");
    }

    if (suggestion.length > 500) {
      throw new BusinessRuleViolationError(
        "Suggestion cannot exceed 500 characters"
      );
    }

    if (this._suggestions.length >= 50) {
      throw new BusinessRuleViolationError(
        "Cannot add more than 50 suggestions to an analysis"
      );
    }

    if (this._suggestions.includes(suggestion.trim())) {
      throw new BusinessRuleViolationError("Suggestion already exists");
    }

    this._suggestions.push(suggestion.trim());
    this._updatedAt = new Date();
  }

  /**
   * Remove a suggestion from the analysis
   */
  removeSuggestion(suggestion: string): void {
    const index = this._suggestions.indexOf(suggestion);
    if (index === -1) {
      throw new BusinessRuleViolationError("Suggestion not found");
    }

    this._suggestions.splice(index, 1);
    this._updatedAt = new Date();
  }

  /**
   * Set the category for the analysis
   */
  setCategory(category: Category): void {
    this._category = category;
    this._updatedAt = new Date();
  }

  /**
   * Check if the analysis is considered high quality (score >= 80)
   */
  isHighQuality(): boolean {
    return this._score.value >= 80;
  }

  /**
   * Check if the analysis is considered low quality (score < 40)
   */
  isLowQuality(): boolean {
    return this._score.value < 40;
  }

  /**
   * Check if the analysis is completed (has feedback and score)
   */
  isCompleted(): boolean {
    return this._feedback !== undefined && this._feedback.trim().length > 0;
  }

  /**
   * Check if the analysis belongs to a specific user
   */
  belongsToUser(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  /**
   * Check if the analysis is recent (created within last 24 hours)
   */
  isRecent(): boolean {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this._createdAt > twentyFourHoursAgo;
  }

  /**
   * Get the age of the analysis in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Getters
  get idea(): string {
    return this._idea;
  }

  get userId(): UserId {
    return this._userId;
  }

  get score(): Score {
    return this._score;
  }

  get locale(): Locale {
    return this._locale;
  }

  get category(): Category | undefined {
    return this._category;
  }

  get feedback(): string | undefined {
    return this._feedback;
  }

  get suggestions(): readonly string[] {
    return [...this._suggestions];
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * Get a summary of the analysis
   */
  getSummary(): string {
    const ideaPreview =
      this._idea.length > 100
        ? this._idea.substring(0, 100) + "..."
        : this._idea;

    return `Analysis (${this._score.toPercentage()}): ${ideaPreview}`;
  }
}
