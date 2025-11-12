import { Entity } from "./shared/Entity";
import { UserId } from "../value-objects/UserId";
import { Email } from "../value-objects/Email";
import { Locale } from "../value-objects/Locale";
import {
  BusinessRuleViolationError,
  InvariantViolationError,
  InsufficientCreditsError,
} from "../../shared/types/errors";

/**
 * User preferences for the application
 */
export interface UserPreferences {
  defaultLocale: Locale;
  emailNotifications: boolean;
  analysisReminders: boolean;
  theme: "light" | "dark" | "auto";
}

/**
 * Properties required to create a new User
 */
export interface CreateUserProps {
  email: Email;
  name?: string;
  preferences?: Partial<UserPreferences>;
  credits?: number;
}

/**
 * Properties for reconstructing a User from persistence
 */
export interface ReconstructUserProps extends CreateUserProps {
  id: UserId;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  preferences: UserPreferences;
  credits: number;
}

/**
 * User entity representing a user in the system
 * Contains business logic for user operations and validation
 */
export class User extends Entity<UserId> {
  private readonly _email: Email;
  private _name?: string;
  private _preferences: UserPreferences;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;
  private _isActive: boolean;
  private _credits: number;

  private constructor(
    id: UserId,
    email: Email,
    createdAt: Date,
    updatedAt: Date,
    isActive: boolean,
    preferences: UserPreferences,
    credits: number,
    name?: string,
    lastLoginAt?: Date
  ) {
    super(id);
    this._email = email;
    this._name = name;
    this._preferences = preferences;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._lastLoginAt = lastLoginAt;
    this._isActive = isActive;
    this._credits = credits;

    this.validateInvariants();
  }

  /**
   * Create a new User entity
   */
  static create(props: CreateUserProps): User {
    const now = new Date();
    const id = UserId.generate();

    const defaultPreferences: UserPreferences = {
      defaultLocale: Locale.english(),
      emailNotifications: true,
      analysisReminders: true,
      theme: "auto",
    };

    const preferences: UserPreferences = {
      ...defaultPreferences,
      ...props.preferences,
    };

    const credits = props.credits ?? 3; // Default 3 credits

    return new User(
      id,
      props.email,
      now,
      now,
      true,
      preferences,
      credits,
      props.name
    );
  }

  /**
   * Reconstruct a User from persistence data
   */
  static reconstruct(props: ReconstructUserProps): User {
    return new User(
      props.id,
      props.email,
      props.createdAt,
      props.updatedAt,
      props.isActive,
      props.preferences,
      props.credits,
      props.name,
      props.lastLoginAt
    );
  }

  /**
   * Validate business invariants
   */
  private validateInvariants(): void {
    if (this._name && this._name.trim().length === 0) {
      throw new InvariantViolationError(
        "User name cannot be empty if provided"
      );
    }

    if (this._name && this._name.length > 100) {
      throw new InvariantViolationError(
        "User name cannot exceed 100 characters"
      );
    }

    if (this._name && this._name.length < 2) {
      throw new InvariantViolationError(
        "User name must be at least 2 characters long"
      );
    }

    if (this._credits < 0) {
      throw new InvariantViolationError("User credits cannot be negative");
    }

    if (!Number.isInteger(this._credits)) {
      throw new InvariantViolationError("User credits must be an integer");
    }
  }

  /**
   * Update the user's name
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new BusinessRuleViolationError("Name cannot be empty");
    }

    if (name.length > 100) {
      throw new BusinessRuleViolationError("Name cannot exceed 100 characters");
    }

    if (name.length < 2) {
      throw new BusinessRuleViolationError(
        "Name must be at least 2 characters long"
      );
    }

    this._name = name.trim();
    this._updatedAt = new Date();
  }

  /**
   * Clear the user's name
   */
  clearName(): void {
    this._name = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this._preferences = {
      ...this._preferences,
      ...preferences,
    };
    this._updatedAt = new Date();
  }

  /**
   * Update the default locale preference
   */
  updateDefaultLocale(locale: Locale): void {
    this._preferences.defaultLocale = locale;
    this._updatedAt = new Date();
  }

  /**
   * Enable or disable email notifications
   */
  setEmailNotifications(enabled: boolean): void {
    this._preferences.emailNotifications = enabled;
    this._updatedAt = new Date();
  }

  /**
   * Enable or disable analysis reminders
   */
  setAnalysisReminders(enabled: boolean): void {
    this._preferences.analysisReminders = enabled;
    this._updatedAt = new Date();
  }

  /**
   * Update the theme preference
   */
  updateTheme(theme: "light" | "dark" | "auto"): void {
    this._preferences.theme = theme;
    this._updatedAt = new Date();
  }

  /**
   * Record a login event
   */
  recordLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Check if the user has credits available
   */
  hasCredits(): boolean {
    return this._credits > 0;
  }

  /**
   * Deduct one credit from the user's balance
   * Throws InsufficientCreditsError if no credits available
   */
  deductCredit(): void {
    if (this._credits <= 0) {
      throw new InsufficientCreditsError(this.id.value);
    }
    this._credits -= 1;
    this._updatedAt = new Date();
  }

  /**
   * Add credits to the user's balance
   * @param amount - Number of credits to add (must be positive)
   */
  addCredits(amount: number): void {
    if (amount <= 0) {
      throw new BusinessRuleViolationError("Credit amount must be positive");
    }
    if (!Number.isInteger(amount)) {
      throw new BusinessRuleViolationError("Credit amount must be an integer");
    }
    this._credits += amount;
    this._updatedAt = new Date();
  }

  /**
   * Activate the user account
   */
  activate(): void {
    if (this._isActive) {
      throw new BusinessRuleViolationError("User is already active");
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate the user account
   */
  deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleViolationError("User is already inactive");
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Check if the user has logged in recently (within last 30 days)
   */
  hasRecentActivity(): boolean {
    if (!this._lastLoginAt) {
      return false;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this._lastLoginAt > thirtyDaysAgo;
  }

  /**
   * Check if the user is a new user (created within last 7 days)
   */
  isNewUser(): boolean {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this._createdAt > sevenDaysAgo;
  }

  /**
   * Get the number of days since the user was created
   */
  getDaysSinceCreation(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._createdAt.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  /**
   * Get the number of days since last login
   */
  getDaysSinceLastLogin(): number | null {
    if (!this._lastLoginAt) {
      return null;
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._lastLoginAt.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  /**
   * Check if the user has a complete profile
   */
  hasCompleteProfile(): boolean {
    return this._name !== undefined && this._name.trim().length > 0;
  }

  /**
   * Check if the user belongs to a specific email domain
   */
  belongsToEmailDomain(domain: string): boolean {
    return this._email.belongsToDomain(domain);
  }

  // Getters
  get email(): Email {
    return this._email;
  }

  get name(): string | undefined {
    return this._name;
  }

  get displayName(): string {
    return this._name || this._email.localPart;
  }

  get preferences(): UserPreferences {
    return { ...this._preferences };
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt ? new Date(this._lastLoginAt) : undefined;
  }

  get credits(): number {
    return this._credits;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Get a summary of the user
   */
  getSummary(): string {
    const status = this._isActive ? "Active" : "Inactive";
    const name = this._name || "Unnamed";
    return `${name} (${this._email.value}) - ${status}`;
  }
}
