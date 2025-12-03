/**
 * Property-based tests for document generation credit system
 *
 * Tests correctness properties for credit handling during document generation:
 * - Property 5: Credit deduction on generation (Requirements 2.2, 4.2, 6.2, 8.2)
 * - Property 14: No credit deduction on insufficient balance (Requirements 15.5)
 * - Property 17: Credit refund on generation failure (Requirements 19.1)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { GenerateDocumentUseCase } from "@/src/application/use-cases/GenerateDocumentUseCase";
import {
  IDocumentRepository,
  IIdeaRepository,
} from "@/src/domain/repositories";
import { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import { ICreditTransactionRepository } from "@/src/domain/repositories/ICreditTransactionRepository";
import { IAIDocumentGeneratorService } from "@/src/application/services/IAIDocumentGeneratorService";
import { CreditPolicy } from "@/src/domain/services/CreditPolicy";
import { User } from "@/src/domain/entities/User";
import { Idea } from "@/src/domain/entities/Idea";
import { Document } from "@/src/domain/entities/Document";
import { UserId } from "@/src/domain/value-objects/UserId";
import { IdeaId } from "@/src/domain/value-objects/IdeaId";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import { IdeaSource } from "@/src/domain/value-objects/IdeaSource";
import { ProjectStatus } from "@/src/domain/value-objects/ProjectStatus";
import { Email } from "@/src/domain/value-objects/Email";
import { success, failure } from "@/src/shared/types/common";
import { InsufficientCreditsError } from "@/src/shared/types/errors";

/**
 * Create mock repositories and services for testing
 */
function createMocks() {
  const documentRepository: Partial<IDocumentRepository> = {
    save: vi.fn(),
    findByIdeaId: vi.fn(),
  };

  const ideaRepository: Partial<IIdeaRepository> = {
    findById: vi.fn(),
  };

  const userRepository: Partial<IUserRepository> = {
    findById: vi.fn(),
    updateCredits: vi.fn(),
  };

  const transactionRepository: Partial<ICreditTransactionRepository> = {
    recordTransaction: vi.fn(),
  };

  const aiService: Partial<IAIDocumentGeneratorService> = {
    generateDocument: vi.fn(),
  };

  const creditPolicy = new CreditPolicy();

  return {
    documentRepository: documentRepository as IDocumentRepository,
    ideaRepository: ideaRepository as IIdeaRepository,
    userRepository: userRepository as IUserRepository,
    transactionRepository:
      transactionRepository as ICreditTransactionRepository,
    aiService: aiService as IAIDocumentGeneratorService,
    creditPolicy,
  };
}

/**
 * Generate random user with specified credits
 */
function generateUser(credits: number): User {
  return User.reconstruct({
    id: UserId.generate(),
    email: Email.create(faker.internet.email()),
    credits,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Generate random idea
 */
function generateIdea(userId: UserId): Idea {
  return Idea.create({
    userId,
    ideaText: faker.lorem.paragraphs(2),
    source: IdeaSource.MANUAL,
    projectStatus: ProjectStatus.IDEA,
  });
}

describe("Document Generation Credit Properties", () => {
  describe("Property 5: Credit deduction on generation", () => {
    it("Feature: idea-panel-document-generation, Property 5: Credit deduction on generation", async () => {
      // **Validates: Requirements 2.2, 4.2, 6.2, 8.2**
      // For any user with sufficient credits, generating a document should deduct the correct amount of credits

      const documentTypes = [
        DocumentType.PRD,
        DocumentType.TECHNICAL_DESIGN,
        DocumentType.ARCHITECTURE,
        DocumentType.ROADMAP,
      ];

      // Run 25 iterations per document type (100 total)
      for (const documentType of documentTypes) {
        for (let i = 0; i < 25; i++) {
          const mocks = createMocks();
          const useCase = new GenerateDocumentUseCase(
            mocks.documentRepository,
            mocks.ideaRepository,
            mocks.userRepository,
            mocks.transactionRepository,
            mocks.aiService,
            mocks.creditPolicy
          );

          // Generate random initial credits (ensure sufficient)
          const creditCost = documentType.getCreditCost();
          const initialCredits = faker.number.int({
            min: creditCost,
            max: 1000,
          });
          const user = generateUser(initialCredits);
          const idea = generateIdea(user.id);

          // Setup mocks
          vi.mocked(mocks.ideaRepository.findById).mockResolvedValue(
            success(idea)
          );
          vi.mocked(mocks.userRepository.findById).mockResolvedValue(
            success(user)
          );
          vi.mocked(mocks.userRepository.updateCredits).mockResolvedValue(
            success(undefined)
          );
          vi.mocked(
            mocks.transactionRepository.recordTransaction
          ).mockResolvedValue(success(undefined));
          vi.mocked(mocks.documentRepository.findByIdeaId).mockResolvedValue(
            success([])
          );
          vi.mocked(mocks.aiService.generateDocument).mockResolvedValue(
            success(faker.lorem.paragraphs(10))
          );
          vi.mocked(mocks.documentRepository.save).mockImplementation(
            async (doc: Document) => success(doc)
          );

          // Execute
          const result = await useCase.execute({
            ideaId: idea.id,
            userId: user.id,
            documentType,
          });

          // Property: Generation should succeed
          expect(result.success).toBe(true);

          // Property: Credits should be deducted by the correct amount
          expect(
            vi.mocked(mocks.userRepository.updateCredits)
          ).toHaveBeenCalledWith(user.id, initialCredits - creditCost);

          // Property: Transaction should be recorded
          expect(
            vi.mocked(mocks.transactionRepository.recordTransaction)
          ).toHaveBeenCalled();
        }
      }
    });
  });

  describe("Property 14: No credit deduction on insufficient balance", () => {
    it("Feature: idea-panel-document-generation, Property 14: No credit deduction on insufficient balance", async () => {
      // **Validates: Requirements 15.5**
      // For any user with insufficient credits, attempting to generate a document should not deduct any credits

      const documentTypes = [
        DocumentType.PRD,
        DocumentType.TECHNICAL_DESIGN,
        DocumentType.ARCHITECTURE,
        DocumentType.ROADMAP,
      ];

      // Run 25 iterations per document type (100 total)
      for (const documentType of documentTypes) {
        for (let i = 0; i < 25; i++) {
          const mocks = createMocks();
          const useCase = new GenerateDocumentUseCase(
            mocks.documentRepository,
            mocks.ideaRepository,
            mocks.userRepository,
            mocks.transactionRepository,
            mocks.aiService,
            mocks.creditPolicy
          );

          // Generate random insufficient credits
          const creditCost = documentType.getCreditCost();
          const insufficientCredits = faker.number.int({
            min: 0,
            max: creditCost - 1,
          });
          const user = generateUser(insufficientCredits);
          const idea = generateIdea(user.id);

          // Setup mocks
          vi.mocked(mocks.ideaRepository.findById).mockResolvedValue(
            success(idea)
          );
          vi.mocked(mocks.userRepository.findById).mockResolvedValue(
            success(user)
          );
          vi.mocked(mocks.documentRepository.findByIdeaId).mockResolvedValue(
            success([])
          );

          // Execute
          const result = await useCase.execute({
            ideaId: idea.id,
            userId: user.id,
            documentType,
          });

          // Property: Generation should fail
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(InsufficientCreditsError);
          }

          // Property: Credits should NOT be deducted
          expect(
            vi.mocked(mocks.userRepository.updateCredits)
          ).not.toHaveBeenCalled();

          // Property: No transaction should be recorded
          expect(
            vi.mocked(mocks.transactionRepository.recordTransaction)
          ).not.toHaveBeenCalled();

          // Property: AI service should NOT be called
          expect(
            vi.mocked(mocks.aiService.generateDocument)
          ).not.toHaveBeenCalled();

          // Property: Document should NOT be saved
          expect(
            vi.mocked(mocks.documentRepository.save)
          ).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe("Property 17: Credit refund on generation failure", () => {
    it("Feature: idea-panel-document-generation, Property 17: Credit refund on generation failure - AI service error", async () => {
      // **Validates: Requirements 19.1**
      // For any document generation that fails due to AI service error, the system should refund the deducted credits

      const documentTypes = [
        DocumentType.PRD,
        DocumentType.TECHNICAL_DESIGN,
        DocumentType.ARCHITECTURE,
        DocumentType.ROADMAP,
      ];

      // Run 25 iterations per document type (100 total)
      for (const documentType of documentTypes) {
        for (let i = 0; i < 25; i++) {
          const mocks = createMocks();
          const useCase = new GenerateDocumentUseCase(
            mocks.documentRepository,
            mocks.ideaRepository,
            mocks.userRepository,
            mocks.transactionRepository,
            mocks.aiService,
            mocks.creditPolicy
          );

          // Generate random initial credits (ensure sufficient)
          const creditCost = documentType.getCreditCost();
          const initialCredits = faker.number.int({
            min: creditCost,
            max: 1000,
          });
          const user = generateUser(initialCredits);
          const idea = generateIdea(user.id);

          // Setup mocks
          vi.mocked(mocks.ideaRepository.findById).mockResolvedValue(
            success(idea)
          );
          vi.mocked(mocks.userRepository.findById).mockResolvedValue(
            success(user)
          );
          vi.mocked(mocks.userRepository.updateCredits).mockResolvedValue(
            success(undefined)
          );
          vi.mocked(
            mocks.transactionRepository.recordTransaction
          ).mockResolvedValue(success(undefined));
          vi.mocked(mocks.documentRepository.findByIdeaId).mockResolvedValue(
            success([])
          );

          // Mock AI service to fail
          vi.mocked(mocks.aiService.generateDocument).mockResolvedValue(
            failure(new Error("AI service error"))
          );

          // Execute
          const result = await useCase.execute({
            ideaId: idea.id,
            userId: user.id,
            documentType,
          });

          // Property: Generation should fail
          expect(result.success).toBe(false);

          // Property: Credits should be deducted initially (first call)
          expect(
            vi.mocked(mocks.userRepository.updateCredits)
          ).toHaveBeenNthCalledWith(1, user.id, initialCredits - creditCost);

          // Property: Credits should be refunded (second call)
          expect(
            vi.mocked(mocks.userRepository.updateCredits)
          ).toHaveBeenNthCalledWith(
            2,
            user.id,
            initialCredits // Back to original amount
          );

          // Property: Two transactions should be recorded (deduction + refund)
          expect(
            vi.mocked(mocks.transactionRepository.recordTransaction)
          ).toHaveBeenCalledTimes(2);
        }
      }
    });

    it("Feature: idea-panel-document-generation, Property 17: Credit refund on generation failure - Database save error", async () => {
      // **Validates: Requirements 19.1**
      // For any document generation that fails due to database error, the system should refund the deducted credits

      const documentTypes = [
        DocumentType.PRD,
        DocumentType.TECHNICAL_DESIGN,
        DocumentType.ARCHITECTURE,
        DocumentType.ROADMAP,
      ];

      // Run 25 iterations per document type (100 total)
      for (const documentType of documentTypes) {
        for (let i = 0; i < 25; i++) {
          const mocks = createMocks();
          const useCase = new GenerateDocumentUseCase(
            mocks.documentRepository,
            mocks.ideaRepository,
            mocks.userRepository,
            mocks.transactionRepository,
            mocks.aiService,
            mocks.creditPolicy
          );

          // Generate random initial credits (ensure sufficient)
          const creditCost = documentType.getCreditCost();
          const initialCredits = faker.number.int({
            min: creditCost,
            max: 1000,
          });
          const user = generateUser(initialCredits);
          const idea = generateIdea(user.id);

          // Setup mocks
          vi.mocked(mocks.ideaRepository.findById).mockResolvedValue(
            success(idea)
          );
          vi.mocked(mocks.userRepository.findById).mockResolvedValue(
            success(user)
          );
          vi.mocked(mocks.userRepository.updateCredits).mockResolvedValue(
            success(undefined)
          );
          vi.mocked(
            mocks.transactionRepository.recordTransaction
          ).mockResolvedValue(success(undefined));
          vi.mocked(mocks.documentRepository.findByIdeaId).mockResolvedValue(
            success([])
          );
          vi.mocked(mocks.aiService.generateDocument).mockResolvedValue(
            success(faker.lorem.paragraphs(10))
          );

          // Mock database save to fail
          vi.mocked(mocks.documentRepository.save).mockResolvedValue(
            failure(new Error("Database error"))
          );

          // Execute
          const result = await useCase.execute({
            ideaId: idea.id,
            userId: user.id,
            documentType,
          });

          // Property: Generation should fail
          expect(result.success).toBe(false);

          // Property: Credits should be deducted initially (first call)
          expect(
            vi.mocked(mocks.userRepository.updateCredits)
          ).toHaveBeenNthCalledWith(1, user.id, initialCredits - creditCost);

          // Property: Credits should be refunded (second call)
          expect(
            vi.mocked(mocks.userRepository.updateCredits)
          ).toHaveBeenNthCalledWith(
            2,
            user.id,
            initialCredits // Back to original amount
          );

          // Property: Two transactions should be recorded (deduction + refund)
          expect(
            vi.mocked(mocks.transactionRepository.recordTransaction)
          ).toHaveBeenCalledTimes(2);
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero credits correctly", async () => {
      const mocks = createMocks();
      const useCase = new GenerateDocumentUseCase(
        mocks.documentRepository,
        mocks.ideaRepository,
        mocks.userRepository,
        mocks.transactionRepository,
        mocks.aiService,
        mocks.creditPolicy
      );

      const user = generateUser(0);
      const idea = generateIdea(user.id);

      vi.mocked(mocks.ideaRepository.findById).mockResolvedValue(success(idea));
      vi.mocked(mocks.userRepository.findById).mockResolvedValue(success(user));
      vi.mocked(mocks.documentRepository.findByIdeaId).mockResolvedValue(
        success([])
      );

      const result = await useCase.execute({
        ideaId: idea.id,
        userId: user.id,
        documentType: DocumentType.PRD,
      });

      // Should fail with insufficient credits
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InsufficientCreditsError);
      }
    });

    it("should handle exact credit amount correctly", async () => {
      const mocks = createMocks();
      const useCase = new GenerateDocumentUseCase(
        mocks.documentRepository,
        mocks.ideaRepository,
        mocks.userRepository,
        mocks.transactionRepository,
        mocks.aiService,
        mocks.creditPolicy
      );

      const documentType = DocumentType.PRD;
      const creditCost = documentType.getCreditCost();
      const user = generateUser(creditCost); // Exact amount
      const idea = generateIdea(user.id);

      vi.mocked(mocks.ideaRepository.findById).mockResolvedValue(success(idea));
      vi.mocked(mocks.userRepository.findById).mockResolvedValue(success(user));
      vi.mocked(mocks.userRepository.updateCredits).mockResolvedValue(
        success(undefined)
      );
      vi.mocked(
        mocks.transactionRepository.recordTransaction
      ).mockResolvedValue(success(undefined));
      vi.mocked(mocks.documentRepository.findByIdeaId).mockResolvedValue(
        success([])
      );
      vi.mocked(mocks.aiService.generateDocument).mockResolvedValue(
        success(faker.lorem.paragraphs(10))
      );
      vi.mocked(mocks.documentRepository.save).mockImplementation(
        async (doc: Document) => success(doc)
      );

      const result = await useCase.execute({
        ideaId: idea.id,
        userId: user.id,
        documentType,
      });

      // Should succeed
      expect(result.success).toBe(true);

      // Should deduct to zero
      expect(
        vi.mocked(mocks.userRepository.updateCredits)
      ).toHaveBeenCalledWith(user.id, 0);
    });
  });
});
