/**
 * Test data generators for property-based testing
 * Uses @faker-js/faker for realistic test data generation
 */

import { faker } from "@faker-js/faker";
import { Analysis, CreateAnalysisProps } from "@/src/domain/entities/Analysis";
import { User, CreateUserProps } from "@/src/domain/entities/User";
import {
  CreditTransaction,
  CreateCreditTransactionProps,
} from "@/src/domain/entities/CreditTransaction";
import { Idea, CreateIdeaProps } from "@/src/domain/entities/Idea";
import { Document, CreateDocumentProps } from "@/src/domain/entities/Document";
import { AnalysisId } from "@/src/domain/value-objects/AnalysisId";
import { UserId } from "@/src/domain/value-objects/UserId";
import { IdeaId } from "@/src/domain/value-objects/IdeaId";
import { DocumentId } from "@/src/domain/value-objects/DocumentId";
import { Score } from "@/src/domain/value-objects/Score";
import { Email } from "@/src/domain/value-objects/Email";
import { Locale } from "@/src/domain/value-objects/Locale";
import { Category } from "@/src/domain/value-objects/Category";
import { TransactionType } from "@/src/domain/value-objects/TransactionType";
import { IdeaSource } from "@/src/domain/value-objects/IdeaSource";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import { ProjectStatus } from "@/src/domain/value-objects/ProjectStatus";

/**
 * Generate random valid AnalysisId
 */
export function generateAnalysisId(): AnalysisId {
  return AnalysisId.generate();
}

/**
 * Generate random valid UserId
 */
export function generateUserId(): UserId {
  return UserId.generate();
}

/**
 * Generate random valid Score (0-100)
 */
export function generateScore(): Score {
  return Score.create(faker.number.int({ min: 0, max: 100 }));
}

/**
 * Generate random valid Email
 */
export function generateEmail(): Email {
  return Email.create(faker.internet.email());
}

/**
 * Generate random valid Locale
 */
export function generateLocale(): Locale {
  return faker.helpers.arrayElement([Locale.english(), Locale.spanish()]);
}

/**
 * Generate random valid Category
 */
export function generateCategory(): Category {
  const type = faker.helpers.arrayElement(["general", "hackathon"] as const);
  if (type === "general") {
    const categories = Category.getGeneralCategories();
    return Category.createGeneral(faker.helpers.arrayElement(categories));
  } else {
    const categories = Category.getHackathonCategories();
    return Category.createHackathon(faker.helpers.arrayElement(categories));
  }
}

/**
 * Generate random valid User
 */
export function generateUser(overrides?: Partial<CreateUserProps>): User {
  const props: CreateUserProps = {
    email: generateEmail(),
    name: faker.person.fullName(),
    credits: faker.number.int({ min: 0, max: 10 }),
    preferences: {
      defaultLocale: generateLocale(),
      emailNotifications: faker.datatype.boolean(),
      analysisReminders: faker.datatype.boolean(),
      theme: faker.helpers.arrayElement(["light", "dark", "auto"] as const),
    },
    ...overrides,
  };

  return User.create(props);
}

/**
 * Generate random valid Analysis
 */
export function generateAnalysis(
  overrides?: Partial<CreateAnalysisProps>
): Analysis {
  const props: CreateAnalysisProps = {
    idea: faker.lorem.paragraph({ min: 1, max: 3 }),
    userId: generateUserId(),
    score: generateScore(),
    locale: generateLocale(),
    category: faker.datatype.boolean() ? generateCategory() : undefined,
    feedback: faker.datatype.boolean()
      ? faker.lorem.paragraphs({ min: 1, max: 3 })
      : undefined,
    suggestions: faker.datatype.boolean()
      ? faker.helpers.multiple(() => faker.lorem.sentence(), {
          count: { min: 0, max: 5 },
        })
      : undefined,
    ...overrides,
  };

  return Analysis.create(props);
}

/**
 * Generate random valid CreditTransaction
 */
export function generateCreditTransaction(
  overrides?: Partial<CreateCreditTransactionProps>
): CreditTransaction {
  const type = faker.helpers.arrayElement([
    TransactionType.DEDUCT,
    TransactionType.ADD,
    TransactionType.REFUND,
    TransactionType.ADMIN_ADJUSTMENT,
  ]);

  // Ensure amount sign matches transaction type
  let amount: number;
  if (type === TransactionType.DEDUCT) {
    amount = -faker.number.int({ min: 1, max: 5 });
  } else if (type === TransactionType.ADD || type === TransactionType.REFUND) {
    amount = faker.number.int({ min: 1, max: 10 });
  } else {
    // ADMIN_ADJUSTMENT can be positive or negative
    amount = faker.number.int({ min: -10, max: 10 });
    // Ensure it's not zero
    if (amount === 0) amount = 1;
  }

  const props: CreateCreditTransactionProps = {
    userId: generateUserId(),
    amount,
    type,
    description: faker.lorem.sentence(),
    metadata: faker.datatype.boolean()
      ? {
          reason: faker.lorem.words(3),
          adminId: faker.string.uuid(),
        }
      : undefined,
    ...overrides,
  };

  return CreditTransaction.create(props);
}

/**
 * Generate array of test data
 */
export function generateMany<T>(generator: () => T, count: number = 10): T[] {
  return Array.from({ length: count }, generator);
}

/**
 * Generate random valid IdeaId
 */
export function generateIdeaId(): IdeaId {
  return IdeaId.generate();
}

/**
 * Generate random valid DocumentId
 */
export function generateDocumentId(): DocumentId {
  return DocumentId.generate();
}

/**
 * Generate random valid IdeaSource
 */
export function generateIdeaSource(): IdeaSource {
  return faker.helpers.arrayElement([
    IdeaSource.MANUAL,
    IdeaSource.FRANKENSTEIN,
  ]);
}

/**
 * Generate random valid DocumentType
 */
export function generateDocumentType(): DocumentType {
  return faker.helpers.arrayElement([
    DocumentType.STARTUP_ANALYSIS,
    DocumentType.HACKATHON_ANALYSIS,
  ]);
}

/**
 * Generate random valid ProjectStatus
 */
export function generateProjectStatus(): ProjectStatus {
  return faker.helpers.arrayElement([
    ProjectStatus.IDEA,
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED,
  ]);
}

/**
 * Generate random valid Idea
 */
export function generateIdea(overrides?: Partial<CreateIdeaProps>): Idea {
  const props: CreateIdeaProps = {
    userId: generateUserId(),
    ideaText: faker.lorem.paragraph({ min: 1, max: 3 }),
    source: generateIdeaSource(),
    projectStatus: generateProjectStatus(),
    notes: faker.datatype.boolean() ? faker.lorem.paragraphs(2) : "",
    tags: faker.datatype.boolean()
      ? faker.helpers.arrayElements(
          [
            "startup",
            "tech",
            "mvp",
            "saas",
            "mobile",
            "web",
            "ai",
            "blockchain",
            "fintech",
            "healthtech",
          ],
          { min: 0, max: 5 }
        )
      : [],
    ...overrides,
  };

  return Idea.create(props);
}

/**
 * Generate random valid Document
 */
export function generateDocument(
  overrides?: Partial<CreateDocumentProps>
): Document {
  const documentType = overrides?.documentType || generateDocumentType();

  // Generate appropriate content based on document type
  let content: any;
  if (documentType.isStartupAnalysis()) {
    content = {
      viability: faker.number.int({ min: 0, max: 100 }),
      innovation: faker.number.int({ min: 0, max: 100 }),
      market: faker.number.int({ min: 0, max: 100 }),
      feedback: faker.lorem.paragraph(),
      suggestions: faker.helpers.arrayElements(
        [
          "Focus on MVP",
          "Validate market fit",
          "Build prototype",
          "Talk to customers",
          "Refine value proposition",
        ],
        { min: 1, max: 3 }
      ),
    };
  } else {
    content = {
      technical: faker.number.int({ min: 0, max: 100 }),
      creativity: faker.number.int({ min: 0, max: 100 }),
      impact: faker.number.int({ min: 0, max: 100 }),
      feedback: faker.lorem.paragraph(),
      suggestions: faker.helpers.arrayElements(
        [
          "Improve technical implementation",
          "Add more features",
          "Better UI/UX",
          "Optimize performance",
          "Add documentation",
        ],
        { min: 1, max: 3 }
      ),
    };
  }

  const props: CreateDocumentProps = {
    ideaId: generateIdeaId(),
    userId: generateUserId(),
    documentType,
    title: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    content,
    ...overrides,
  };

  return Document.create(props);
}
