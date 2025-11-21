import { Entity } from "./shared/Entity";
import { DocumentId } from "../value-objects/DocumentId";
import { IdeaId } from "../value-objects/IdeaId";
import { UserId } from "../value-objects/UserId";
import { DocumentType } from "../value-objects/DocumentType";
import { InvariantViolationError } from "../../shared/types/errors";

/**
 * Properties required to create at
 */
export interface CreateDocumentProps {
  ideaId: IdeaId;
  userId: UserId;
  documentType: DocumentType;
  title?: string;
  content: any;
}

/**
 * Properties for reconstructing a Document from persistence
 */
export interface ReconstructDocumentProps {
  id: DocumentId;
  ideaId: IdeaId;
  userId: UserId;
  documentType: DocumentType;
  title: string | null;
  content: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document entity
 * Represents an analysis or generated document related to an idea
 * For MVP: startup_analysis and hackathon_analysis only
 */
export class Document extends Entity<DocumentId> {
  private readonly _ideaId: IdeaId;
  private readonly _userId: UserId;
  private readonly _documentType: DocumentType;
  private _title: string | null;
  private readonly _content: any;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: DocumentId,
    ideaId: IdeaId,
    userId: UserId,
    documentType: DocumentType,
    title: string | null,
    content: any,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._ideaId = ideaId;
    this._userId = userId;
    this._documentType = documentType;
    this._title = title;
    this._content = content;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;

    this.validateInvariants();
  }

  /**
   * Create a new Document entity
   */
  static create(props: CreateDocumentProps): Document {
    const now = new Date();
    const id = DocumentId.generate();

    return new Document(
      id,
      props.ideaId,
      props.userId,
      props.documentType,
      props.title || null,
      props.content,
      now,
      now
    );
  }

  /**
   * Reconstruct a Document from persistence data
   */
  static reconstruct(props: ReconstructDocumentProps): Document {
    return new Document(
      props.id,
      props.ideaId,
      props.userId,
      props.documentType,
      props.title,
      props.content,
      props.createdAt,
      props.updatedAt
    );
  }

  /**
   * Validate business invariants
   */
  private validateInvariants(): void {
    if (!this._content) {
      throw new InvariantViolationError(
        "Document content cannot be null or undefined"
      );
    }

    if (this._title !== null && this._title.length > 500) {
      throw new InvariantViolationError(
        "Document title cannot exceed 500 characters"
      );
    }

    // Validate content structure based on document type
    if (this._documentType.isStartupAnalysis()) {
      this.validateStartupAnalysisContent();
    } else if (this._documentType.isHackathonAnalysis()) {
      this.validateHackathonAnalysisContent();
    }
  }

  /**
   * Validate startup analysis content structure
   */
  private validateStartupAnalysisContent(): void {
    if (typeof this._content !== "object") {
      throw new InvariantViolationError(
        "Startup analysis content must be an object"
      );
    }

    // Basic validation - content should have expected fields
    // More detailed validation can be added as needed
    const requiredFields = ["viability", "innovation", "market"];
    for (const field of requiredFields) {
      if (!(field in this._content)) {
        throw new InvariantViolationError(
          `Startup analysis content must include ${field} field`
        );
      }
    }
  }

  /**
   * Validate hackathon analysis content structure
   */
  private validateHackathonAnalysisContent(): void {
    if (typeof this._content !== "object") {
      throw new InvariantViolationError(
        "Hackathon analysis content must be an object"
      );
    }

    // Basic validation - content should have expected fields
    const requiredFields = ["technical", "creativity", "impact"];
    for (const field of requiredFields) {
      if (!(field in this._content)) {
        throw new InvariantViolationError(
          `Hackathon analysis content must include ${field} field`
        );
      }
    }
  }

  /**
   * Get the document content
   */
  getContent(): any {
    // Return a deep copy to prevent external modification
    return JSON.parse(JSON.stringify(this._content));
  }

  /**
   * Get the document type
   */
  getType(): DocumentType {
    return this._documentType;
  }

  /**
   * Check if the document belongs to a specific user
   */
  belongsToUser(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  /**
   * Check if the document belongs to a specific idea
   */
  belongsToIdea(ideaId: IdeaId): boolean {
    return this._ideaId.equals(ideaId);
  }

  /**
   * Check if the document is recent (created within last 24 hours)
   */
  isRecent(): boolean {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this._createdAt > twentyFourHoursAgo;
  }

  /**
   * Get the age of the document in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._createdAt.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  /**
   * Check if the document has a title
   */
  hasTitle(): boolean {
    return this._title !== null && this._title.trim().length > 0;
  }

  // Getters
  get ideaId(): IdeaId {
    return this._ideaId;
  }

  get userId(): UserId {
    return this._userId;
  }

  get documentType(): DocumentType {
    return this._documentType;
  }

  get title(): string | null {
    return this._title;
  }

  get content(): any {
    return this.getContent();
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * Get a summary of the document
   */
  getSummary(): string {
    const typeLabel = this._documentType.isStartupAnalysis()
      ? "Startup Analysis"
      : "Hackathon Analysis";

    const titlePart = this._title ? `: ${this._title}` : "";

    return `${typeLabel}${titlePart}`;
  }
}
