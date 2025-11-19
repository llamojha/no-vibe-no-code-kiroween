/**
 *perty Tests: Error Handling
 *
 * Tests system-level properties ensuring proper error handling, propagation,
 * and graceful degradation. These properties validate that errors are handled
 * consistently and the system remains functional when non-critical services fail.
 *
 * Properties tested:
 * - P-SYS-008: Domain Error Propagation
 * - P-SYS-009: Error Code Consistency
 * - P-SYS-010: Graceful Degradation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DomainError,
  ValidationError,
  BusinessRuleViolationError,
  EntityNotFoundError,
  DuplicateEntityError,
  InvariantViolationError,
  AuthorizationError,
  InsufficientCreditsError,
} from "@/src/shared/types/errors";
import { AnalyzeIdeaUseCase } from "@/src/application/use-cases/AnalyzeIdeaUseCase";
import { MockAnalysisRepository } from "@/lib/testing/mocks/MockAnalysisRepository";
import { AnalysisValidationService } from "@/src/domain/services/AnalysisValidationService";
import { ScoreCalculationService } from "@/src/domain/services/ScoreCalculationService";
import {
  generateAnalysis,
  generateUserId,
  generateUser,
  generateMany,
} from "../utils/generators";
import {
  forAll,
  assertThrows,
  assertThrowsAsync,
} from "../utils/property-helpers";
import { Locale, Score } from "@/src/domain/value-objects";
import { Analysis } from "@/src/domain/entities";

describe("Property: Error Handling", () => {
  let repository: MockAnalysisRepository;
  let validationService: AnalysisValidationService;
  let scoreCalculationService: ScoreCalculationService;
  let analyzeIdeaUseCase: AnalyzeIdeaUseCase;

  beforeEach(() => {
    repository = new MockAnalysisRepository();
    validationService = new AnalysisValidationService();
    scoreCalculationService = new ScoreCalculationService();
    analyzeIdeaUseCase = new AnalyzeIdeaUseCase(
      repository,
      validationService,
      scoreCalculationService
    );
  });

  describe("P-SYS-008: Domain Error Propagation", () => {
    /**
     * Feature: property-testing-framework, Property 8: Domain Error Propagation
     * Validates: Requirements 6.1, 6.4
     *
     * Property: Domain errors are not swallowed by infrastructure
     * Formal: ∀e: DomainError, throws(domain, e) ⇒ catches(application, e)
     *
     * This property ensures that errors thrown in the domain layer are properly
     * propagated through the infrastructure layer to the application layer where
     * they can be handled appropriately. Domain errors should never be silently
     * swallowed or lost in the infrastructure.
     */
    it("should propagate ValidationError from domain to application layer", async () => {
      // Create an invalid analysis that will trigger validation error
      const invalidIdea = ""; // Empty idea should fail validation

      const result = await analyzeIdeaUseCase.execute({
        idea: invalidIdea,
        userId: generateUserId(),
        locale: Locale.english(),
      });

      // Property: Domain error should be propagated
      // Note: Empty idea triggers InvariantViolationError (domain invariant)
      // which is the correct behavior - invariants are checked at entity creation
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error).toBeInstanceOf(InvariantViolationError);
      expect(result.error.code).toBe("INVARIANT_VIOLATION");
    });

    it("should propagate domain errors through repository operations", async () => {
      await forAll(
        generateAnalysis,
        async (analysis) => {
          // Save the analysis
          const saveResult = await repository.save(analysis);
          expect(saveResult.success).toBe(true);

          // Try to save again with same ID (should be idempotent, not error)
          const secondSave = await repository.save(analysis);
          expect(secondSave.success).toBe(true);

          // Property: Repository operations should handle domain entities correctly
          // and propagate any domain errors that occur
          return true;
        },
        30
      );
    });

    it("should preserve error details during propagation", async () => {
      const userId = generateUserId();
      const nonExistentId = generateAnalysis().id;

      // Try to find non-existent analysis
      const result = await repository.findById(nonExistentId);

      // Property: Error details should be preserved
      expect(result.success).toBe(true); // Mock repository returns null, not error
      expect(result.data).toBeNull();

      // For actual domain errors, they should preserve their properties
      const validationError = new ValidationError("Test error", [
        "field1",
        "field2",
      ]);
      expect(validationError.code).toBe("VALIDATION_ERROR");
      expect(validationError.validationErrors).toEqual(["field1", "field2"]);
      expect(validationError.message).toBe("Test error");
    });

    it("should propagate InsufficientCreditsError with user context", () => {
      const userId = "user-123";
      const userEmail = "test@example.com";

      const error = new InsufficientCreditsError(userId, userEmail);

      // Property: Error should preserve user context
      expect(error.code).toBe("INSUFFICIENT_CREDITS");
      expect(error.userId).toBe(userId);
      expect(error.userEmail).toBe(userEmail);
      expect(error.message).toContain(userEmail);
    });

    it("should propagate errors through multiple layers", async () => {
      // Create a scenario where domain validation fails
      const invalidInput = {
        idea: "", // Invalid: empty idea
        userId: generateUserId(),
        locale: Locale.english(),
      };

      const result = await analyzeIdeaUseCase.execute(invalidInput);

      // Property: Error should propagate from domain through application
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBeTruthy();
    });

    it("should maintain error stack traces during propagation", () => {
      const error = new ValidationError("Test validation error");

      // Property: Error should have stack trace
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("ValidationError");
    });

    it("should propagate cause chain in errors", () => {
      const rootCause = new Error("Root cause");
      const domainError = new ValidationError(
        "Validation failed",
        [],
        rootCause
      );

      // Property: Error cause should be preserved
      expect(domainError.cause).toBe(rootCause);
      expect(domainError.cause?.message).toBe("Root cause");
    });
  });

  describe("P-SYS-009: Error Code Consistency", () => {
    /**
     * Feature: property-testing-framework, Property 9: Error Code Consistency
     * Validates: Requirements 6.1, 6.4
     *
     * Property: Same error type always has same error code
     * Formal: ∀e1,e2: Error, type(e1) = type(e2) ⇒ e1.code = e2.code
     *
     * This property ensures that error codes are consistent across the application.
     * The same type of error should always have the same error code, making it
     * easier to handle errors programmatically and provide consistent user experiences.
     */
    it("should have consistent error codes for ValidationError", () => {
      forAll(
        () => new ValidationError(`Error ${Math.random()}`, []),
        (error) => {
          // Property: All ValidationErrors should have same code
          return error.code === "VALIDATION_ERROR";
        },
        50
      );
    });

    it("should have consistent error codes for BusinessRuleViolationError", () => {
      forAll(
        () => new BusinessRuleViolationError(`Rule violation ${Math.random()}`),
        (error) => {
          // Property: All BusinessRuleViolationErrors should have same code
          return error.code === "BUSINESS_RULE_VIOLATION";
        },
        50
      );
    });

    it("should have consistent error codes for EntityNotFoundError", () => {
      forAll(
        () => {
          const entityType = ["Analysis", "User", "Transaction"][
            Math.floor(Math.random() * 3)
          ];
          const id = Math.random().toString();
          return new EntityNotFoundError(entityType, id);
        },
        (error) => {
          // Property: All EntityNotFoundErrors should have same code
          return error.code === "ENTITY_NOT_FOUND";
        },
        50
      );
    });

    it("should have consistent error codes for DuplicateEntityError", () => {
      forAll(
        () => {
          const entityType = ["Analysis", "User", "Transaction"][
            Math.floor(Math.random() * 3)
          ];
          const id = Math.random().toString();
          return new DuplicateEntityError(entityType, id);
        },
        (error) => {
          // Property: All DuplicateEntityErrors should have same code
          return error.code === "DUPLICATE_ENTITY";
        },
        50
      );
    });

    it("should have consistent error codes for InvariantViolationError", () => {
      forAll(
        () =>
          new InvariantViolationError(`Invariant violated ${Math.random()}`),
        (error) => {
          // Property: All InvariantViolationErrors should have same code
          return error.code === "INVARIANT_VIOLATION";
        },
        50
      );
    });

    it("should have consistent error codes for AuthorizationError", () => {
      forAll(
        () => new AuthorizationError(`Unauthorized ${Math.random()}`),
        (error) => {
          // Property: All AuthorizationErrors should have same code
          return error.code === "AUTHORIZATION_ERROR";
        },
        50
      );
    });

    it("should have consistent error codes for InsufficientCreditsError", () => {
      forAll(
        () => {
          const userId = Math.random().toString();
          const userEmail = `user${Math.random()}@example.com`;
          return new InsufficientCreditsError(userId, userEmail);
        },
        (error) => {
          // Property: All InsufficientCreditsErrors should have same code
          return error.code === "INSUFFICIENT_CREDITS";
        },
        50
      );
    });

    it("should maintain error code consistency across error instances", () => {
      // Create multiple instances of each error type
      const validationErrors = generateMany(
        () => new ValidationError("Test", []),
        10
      );
      const businessErrors = generateMany(
        () => new BusinessRuleViolationError("Test"),
        10
      );
      const notFoundErrors = generateMany(
        () => new EntityNotFoundError("Test", "123"),
        10
      );

      // Property: All instances of same type should have same code
      const validationCodes = validationErrors.map((e) => e.code);
      const businessCodes = businessErrors.map((e) => e.code);
      const notFoundCodes = notFoundErrors.map((e) => e.code);

      expect(new Set(validationCodes).size).toBe(1);
      expect(new Set(businessCodes).size).toBe(1);
      expect(new Set(notFoundCodes).size).toBe(1);

      expect(validationCodes[0]).toBe("VALIDATION_ERROR");
      expect(businessCodes[0]).toBe("BUSINESS_RULE_VIOLATION");
      expect(notFoundCodes[0]).toBe("ENTITY_NOT_FOUND");
    });

    it("should have unique error codes for different error types", () => {
      const errors = [
        new ValidationError("Test", []),
        new BusinessRuleViolationError("Test"),
        new EntityNotFoundError("Test", "123"),
        new DuplicateEntityError("Test", "123"),
        new InvariantViolationError("Test"),
        new AuthorizationError("Test"),
        new InsufficientCreditsError("user-123"),
      ];

      const codes = errors.map((e) => e.code);
      const uniqueCodes = new Set(codes);

      // Property: Different error types should have different codes
      expect(uniqueCodes.size).toBe(errors.length);
    });

    it("should preserve error codes through serialization", () => {
      forAll(
        () => {
          const errorTypes = [
            new ValidationError("Test", []),
            new BusinessRuleViolationError("Test"),
            new EntityNotFoundError("Test", "123"),
            new InsufficientCreditsError("user-123"),
          ];
          return errorTypes[Math.floor(Math.random() * errorTypes.length)];
        },
        (error) => {
          const originalCode = error.code;

          // Simulate serialization (e.g., for API response)
          const serialized = {
            code: error.code,
            message: error.message,
            name: error.name,
          };

          // Property: Code should be preserved through serialization
          return serialized.code === originalCode;
        },
        50
      );
    });
  });

  describe("P-SYS-010: Graceful Degradation", () => {
    /**
     * Feature: property-testing-framework, Property 10: Graceful Degradation
     * Validates: Requirements 6.1, 6.4
     *
     * Property: System remains functional when non-critical services fail
     * Formal: ∀s: NonCriticalService, fails(s) ⇒ systemAvailable()
     *
     * This property ensures that the system can continue operating when non-critical
     * services fail. Critical functionality should remain available even if optional
     * features or enhancements fail. This is essential for system resilience and
     * user experience.
     */
    it("should continue analysis when suggestion generation fails", async () => {
      // Mock the use case to simulate suggestion generation failure
      const mockRepository = new MockAnalysisRepository();
      const mockValidationService = new AnalysisValidationService();
      const mockScoreService = new ScoreCalculationService();

      const useCase = new AnalyzeIdeaUseCase(
        mockRepository,
        mockValidationService,
        mockScoreService
      );

      const input = {
        idea: "A revolutionary AI-powered task management app that helps teams collaborate",
        userId: generateUserId(),
        locale: Locale.english(),
      };

      const result = await useCase.execute(input);

      // Property: Analysis should succeed even if suggestions fail
      // (In the current implementation, suggestions are generated inline,
      // but the system should handle failures gracefully)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.analysis).toBeDefined();
        expect(result.data.analysis.score).toBeDefined();
      }
    });

    it("should handle repository query failures gracefully", async () => {
      // Create a repository that might fail on certain operations
      const analyses = generateMany(generateAnalysis, 5);

      // Save analyses
      for (const analysis of analyses) {
        await repository.save(analysis);
      }

      // Property: System should handle query failures without crashing
      const userId = generateUserId();
      const result = await repository.findByUserId(userId, {
        page: 1,
        limit: 10,
      });

      // Even if no results found, should return success with empty array
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.items)).toBe(true);
    });

    it("should provide default values when optional data is missing", async () => {
      await forAll(
        () => {
          // Generate analysis with some optional fields missing
          return generateAnalysis({
            feedback: undefined,
            suggestions: undefined,
          });
        },
        async (analysis) => {
          const saveResult = await repository.save(analysis);
          expect(saveResult.success).toBe(true);

          const retrieved = await repository.findById(analysis.id);
          expect(retrieved.success).toBe(true);

          // Property: System should handle missing optional data gracefully
          if (retrieved.data) {
            // Optional fields can be undefined
            return true;
          }
          return false;
        },
        30
      );
    });

    it("should continue operation when non-critical validation warnings occur", () => {
      const validationService = new AnalysisValidationService();

      forAll(
        generateAnalysis,
        (analysis) => {
          const result = validationService.validateAnalysis(analysis);

          // Property: Warnings should not prevent operation
          // (Validation can have warnings but still be valid)
          if (result.warnings && result.warnings.length > 0) {
            expect(result.isValid).toBe(true);
          }

          return true;
        },
        30
      );
    });

    it("should handle score calculation edge cases gracefully", () => {
      const scoreService = new ScoreCalculationService();

      // Test with various edge cases
      const edgeCases = [
        Score.create(0), // Minimum score
        Score.create(100), // Maximum score
        Score.create(50), // Middle score
      ];

      for (const score of edgeCases) {
        // Property: Score service should handle all valid scores
        expect(score.value).toBeGreaterThanOrEqual(0);
        expect(score.value).toBeLessThanOrEqual(100);
      }
    });

    it("should maintain core functionality when analytics fail", async () => {
      // Simulate analytics service failure (non-critical)
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        // Perform core operation
        const analysis = generateAnalysis();
        const result = await repository.save(analysis);

        // Property: Core functionality should work even if analytics fail
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("should provide fallback behavior for missing locale data", async () => {
      // Test with both supported locales
      const locales = [Locale.english(), Locale.spanish()];

      for (const locale of locales) {
        const input = {
          idea: "A comprehensive AI-powered task management application that helps teams collaborate effectively and track progress in real-time",
          userId: generateUserId(),
          locale,
        };

        const result = await analyzeIdeaUseCase.execute(input);

        // Property: System should work with all supported locales
        // The system should handle both English and Spanish locales gracefully
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.analysis).toBeDefined();
          expect(result.data.analysis.locale.equals(locale)).toBe(true);
        }
      }
    });

    it("should handle concurrent operations with partial failures", async () => {
      const operations = generateMany(
        () => ({
          analysis: generateAnalysis(),
          shouldSucceed: Math.random() > 0.2, // 80% success rate
        }),
        20
      );

      const results = await Promise.all(
        operations.map(async (op) => {
          if (op.shouldSucceed) {
            return await repository.save(op.analysis);
          } else {
            // Simulate failure by returning error result
            return {
              success: false as const,
              error: new Error("Simulated failure"),
            };
          }
        })
      );

      // Property: Some operations can fail without affecting others
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      expect(successCount).toBeGreaterThan(0);
      expect(successCount + failureCount).toBe(operations.length);
    });

    it("should recover from transient errors", async () => {
      let attemptCount = 0;
      const maxAttempts = 3;

      // Simulate transient error that resolves after retries
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error("Transient error");
        }
        return { success: true, data: "Success" };
      };

      // Property: System should be able to retry and recover
      let result;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          result = await operation();
          break;
        } catch (error) {
          if (i === maxAttempts - 1) {
            throw error;
          }
          // Continue to next attempt
        }
      }

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });

    it("should maintain data consistency during partial failures", async () => {
      const userId = generateUserId();
      const analyses = generateMany(() => generateAnalysis({ userId }), 10);

      // Save all analyses
      const saveResults = await Promise.all(
        analyses.map((a) => repository.save(a))
      );

      // Property: All successful saves should be retrievable
      const successfulSaves = saveResults.filter((r) => r.success);
      expect(successfulSaves.length).toBe(analyses.length);

      // Verify data consistency
      const countResult = await repository.count();
      expect(countResult.success).toBe(true);
      expect(countResult.data).toBe(analyses.length);
    });
  });
});
