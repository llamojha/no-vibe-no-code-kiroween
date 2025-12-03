/**
 * Property tests for localStorage entity serialization round-trip
 * **Feature: open-source-mode, Property 6: Entity serialization round-trip**
 * **Validates: Requirements 3.6, 3.7**
 *
 * For any domain entity (Analysis, Idea, Document, CreditTransaction),
 * serializing to JSON and deserializing back SHALL produce an equivalent
 * entity with all properties preserved.
 */

import { describe, it, expect } from "vitest";
import { forAll } from "../utils/property-helpers";
import {
  generateAnalysis,
  generateIdea,
  generateDocument,
  generateCreditTransaction,
  generateUser,
} from "../utils/generators";

// Import stored types and conversion functions
import { StoredAnalysis } from "@/src/infrastructure/database/localStorage/LocalStorageAnalysisRepository";
import { StoredIdea } from "@/src/infrastructure/database/localStorage/LocalStorageIdeaRepository";
import { StoredDocument } from "@/src/infrastructure/database/localStorage/LocalStorageDocumentRepository";
import { StoredCreditTransaction } from "@/src/infrastructure/database/localStorage/LocalStorageCreditTransactionRepository";
import { StoredUser } from "@/src/infrastructure/database/localStorage/LocalStorageUserRepository";

import { Analysis } from "@/src/domain/entities/Analysis";
import { Idea } from "@/src/domain/entities/Idea";
import { Document } from "@/src/domain/entities/Document";
import { CreditTransaction } from "@/src/domain/entities/CreditTransaction";
import { User } from "@/src/domain/entities/User";
import {
  AnalysisId,
  UserId,
  Score,
  Locale,
  Category,
} from "@/src/domain/value-objects";
import { IdeaId, IdeaSource, ProjectStatus } from "@/src/domain/value-objects";
import {
  DocumentId,
  DocumentType,
  DocumentVersion,
} from "@/src/domain/value-objects";
import {
  CreditTransactionId,
  TransactionType,
} from "@/src/domain/value-objects";
import { Email } from "@/src/domain/value-objects";

// Helper functions to convert entities to stored format and back
function analysisToStored(a: Analysis): StoredAnalysis {
  return {
    id: a.id.value,
    userId: a.userId.value,
    idea: a.idea,
    locale: a.locale.value,
    category: a.category
      ? { value: a.category.value, type: a.category.type }
      : undefined,
    score: a.score.value,
    feedback: a.feedback,
    suggestions: [...a.suggestions],
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function storedToAnalysis(s: StoredAnalysis): Analysis {
  return Analysis.reconstruct({
    id: AnalysisId.reconstruct(s.id),
    userId: UserId.reconstruct(s.userId),
    idea: s.idea,
    locale: Locale.reconstruct(s.locale as "en" | "es"),
    category: s.category
      ? Category.reconstruct(s.category.value, s.category.type)
      : undefined,
    score: Score.reconstruct(s.score),
    feedback: s.feedback,
    suggestions: s.suggestions,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  });
}

function ideaToStored(i: Idea): StoredIdea {
  return {
    id: i.id.value,
    userId: i.userId.value,
    ideaText: i.ideaText,
    source: i.source.value as "manual" | "frankenstein",
    projectStatus: i.projectStatus.value as
      | "idea"
      | "in_progress"
      | "completed"
      | "archived",
    notes: i.notes,
    tags: [...i.tags],
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

function storedToIdea(s: StoredIdea): Idea {
  return Idea.reconstruct({
    id: IdeaId.reconstruct(s.id),
    userId: UserId.reconstruct(s.userId),
    ideaText: s.ideaText,
    source: IdeaSource.fromString(s.source),
    projectStatus: ProjectStatus.fromString(s.projectStatus),
    notes: s.notes,
    tags: s.tags,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  });
}

function documentToStored(d: Document): StoredDocument {
  return {
    id: d.id.value,
    ideaId: d.ideaId.value,
    userId: d.userId.value,
    documentType: d.documentType.value,
    title: d.title,
    content: d.content,
    version: d.version.value,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function storedToDocument(s: StoredDocument): Document {
  return Document.reconstruct({
    id: DocumentId.reconstruct(s.id),
    ideaId: IdeaId.reconstruct(s.ideaId),
    userId: UserId.reconstruct(s.userId),
    documentType: DocumentType.fromString(s.documentType),
    title: s.title,
    content: s.content,
    version: DocumentVersion.create(s.version),
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  });
}

function creditTransactionToStored(
  t: CreditTransaction
): StoredCreditTransaction {
  return {
    id: t.id.value,
    userId: t.userId.value,
    amount: t.amount,
    type: t.type as "deduct" | "add" | "refund" | "admin_adjustment",
    description: t.description,
    timestamp: t.timestamp.toISOString(),
    createdAt: t.createdAt.toISOString(),
    metadata: t.metadata,
  };
}

function storedToCreditTransaction(
  s: StoredCreditTransaction
): CreditTransaction {
  return CreditTransaction.reconstruct({
    id: CreditTransactionId.reconstruct(s.id),
    userId: UserId.reconstruct(s.userId),
    amount: s.amount,
    type: s.type as TransactionType,
    description: s.description,
    timestamp: new Date(s.timestamp),
    createdAt: new Date(s.createdAt),
    metadata: s.metadata,
  });
}

function userToStored(u: User): StoredUser {
  return {
    id: u.id.value,
    email: u.email.value,
    name: u.name,
    preferences: {
      defaultLocale: u.preferences.defaultLocale.value as "en" | "es",
      emailNotifications: u.preferences.emailNotifications,
      analysisReminders: u.preferences.analysisReminders,
      theme: u.preferences.theme,
    },
    credits: u.credits,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString(),
  };
}

function storedToUser(s: StoredUser): User {
  return User.reconstruct({
    id: UserId.reconstruct(s.id),
    email: Email.reconstruct(s.email),
    name: s.name,
    preferences: {
      defaultLocale: Locale.reconstruct(s.preferences.defaultLocale),
      emailNotifications: s.preferences.emailNotifications,
      analysisReminders: s.preferences.analysisReminders,
      theme: s.preferences.theme,
    },
    credits: s.credits,
    isActive: s.isActive,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    lastLoginAt: s.lastLoginAt ? new Date(s.lastLoginAt) : undefined,
  });
}

describe("Property 6: Entity serialization round-trip", () => {
  describe("Analysis serialization", () => {
    it("should preserve all Analysis properties through serialization round-trip", () => {
      forAll(
        generateAnalysis,
        (original) => {
          const stored = analysisToStored(original);
          const jsonString = JSON.stringify(stored);
          const parsed = JSON.parse(jsonString) as StoredAnalysis;
          const restored = storedToAnalysis(parsed);

          // Verify all properties are preserved
          return (
            original.id.value === restored.id.value &&
            original.userId.value === restored.userId.value &&
            original.idea === restored.idea &&
            original.locale.value === restored.locale.value &&
            original.score.value === restored.score.value &&
            original.feedback === restored.feedback &&
            JSON.stringify(original.suggestions) ===
              JSON.stringify(restored.suggestions) &&
            original.category?.value === restored.category?.value &&
            original.category?.type === restored.category?.type
          );
        },
        100
      );
    });
  });

  describe("Idea serialization", () => {
    it("should preserve all Idea properties through serialization round-trip", () => {
      forAll(
        generateIdea,
        (original) => {
          const stored = ideaToStored(original);
          const jsonString = JSON.stringify(stored);
          const parsed = JSON.parse(jsonString) as StoredIdea;
          const restored = storedToIdea(parsed);

          return (
            original.id.value === restored.id.value &&
            original.userId.value === restored.userId.value &&
            original.ideaText === restored.ideaText &&
            original.source.value === restored.source.value &&
            original.projectStatus.value === restored.projectStatus.value &&
            original.notes === restored.notes &&
            JSON.stringify(original.tags) === JSON.stringify(restored.tags)
          );
        },
        100
      );
    });
  });

  describe("Document serialization", () => {
    it("should preserve all Document properties through serialization round-trip", () => {
      forAll(
        generateDocument,
        (original) => {
          const stored = documentToStored(original);
          const jsonString = JSON.stringify(stored);
          const parsed = JSON.parse(jsonString) as StoredDocument;
          const restored = storedToDocument(parsed);

          return (
            original.id.value === restored.id.value &&
            original.ideaId.value === restored.ideaId.value &&
            original.userId.value === restored.userId.value &&
            original.documentType.value === restored.documentType.value &&
            original.title === restored.title &&
            original.version.value === restored.version.value &&
            JSON.stringify(original.content) ===
              JSON.stringify(restored.content)
          );
        },
        100
      );
    });
  });

  describe("CreditTransaction serialization", () => {
    it("should preserve all CreditTransaction properties through serialization round-trip", () => {
      forAll(
        generateCreditTransaction,
        (original) => {
          const stored = creditTransactionToStored(original);
          const jsonString = JSON.stringify(stored);
          const parsed = JSON.parse(jsonString) as StoredCreditTransaction;
          const restored = storedToCreditTransaction(parsed);

          return (
            original.id.value === restored.id.value &&
            original.userId.value === restored.userId.value &&
            original.amount === restored.amount &&
            original.type === restored.type &&
            original.description === restored.description &&
            JSON.stringify(original.metadata) ===
              JSON.stringify(restored.metadata)
          );
        },
        100
      );
    });
  });

  describe("User serialization", () => {
    it("should preserve all User properties through serialization round-trip", () => {
      forAll(
        generateUser,
        (original) => {
          const stored = userToStored(original);
          const jsonString = JSON.stringify(stored);
          const parsed = JSON.parse(jsonString) as StoredUser;
          const restored = storedToUser(parsed);

          return (
            original.id.value === restored.id.value &&
            original.email.value === restored.email.value &&
            original.name === restored.name &&
            original.credits === restored.credits &&
            original.isActive === restored.isActive &&
            original.preferences.defaultLocale.value ===
              restored.preferences.defaultLocale.value &&
            original.preferences.emailNotifications ===
              restored.preferences.emailNotifications &&
            original.preferences.analysisReminders ===
              restored.preferences.analysisReminders &&
            original.preferences.theme === restored.preferences.theme
          );
        },
        100
      );
    });
  });
});
