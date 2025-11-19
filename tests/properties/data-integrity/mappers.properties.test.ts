/**
 * Property tests for Mapper Bidirectionality (P-DATA-001, P-DATA-002, P-DATA-003, P-DATA-004)
 * Tests entity-DAO round-trip fidelity, null field preservation, and JSONB structure consistency
 *
 * Feature: property-testing-framework
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect } from "vitest";
import { AnalysisMapper } from "@/src/infrastructure/database/supabase/mappers/AnalysisMapper";
import { UserMapper } from "@/src/infrastructure/database/supabase/mappers/UserMapper";
import { HackathonAnalysisMapper } from "@/src/infrastructure/database/supabase/mappers/HackathonAnalysisMapper";
import {
  generateAnalysis,
  generateUser,
  generateMany,
} from "../utils/generators";
import { forAll, entityEquals } from "../utils/property-helpers";
import { Category } from "@/src/domain/value-objects/Category";

describe("Property: Mapper Bidirectionality", () => {
  const analysisMapper = new AnalysisMapper();
  const userMapper = new UserMapper();
  const hackathonMapper = new HackathonAnalysisMapper();

  describe("P-DATA-001: Entity-DAO Round-Trip Fidelity", () => {
    /**
     * Property: For any entity, converting to DAO and back should preserve the entity
     * Validates: Requirements 3.1, 3.2
     */
    it("should preserve Analysis entity through DAO conversion (idea type)", () => {
      forAll(
        () => generateAnalysis({ category: undefined }), // Generate idea-type analysis
        (entity) => {
          // Convert entity -> DAO -> entity
          const dao = analysisMapper.toDAO(entity);
          const reconstructed = analysisMapper.toDomain(dao);

          // Verify entity identity is preserved
          const idMatch = entityEquals(entity, reconstructed);

          // Verify core properties are preserved
          const ideaMatch = entity.idea === reconstructed.idea;
          const scoreMatch = entity.score.value === reconstructed.score.value;
          const localeMatch =
            entity.locale.value === reconstructed.locale.value;
          const userIdMatch = entity.userId.equals(reconstructed.userId);

          // Verify optional properties are preserved
          const feedbackMatch = entity.feedback === reconstructed.feedback;
          const suggestionsMatch =
            JSON.stringify(entity.suggestions) ===
            JSON.stringify(reconstructed.suggestions);

          return (
            idMatch &&
            ideaMatch &&
            scoreMatch &&
            localeMatch &&
            userIdMatch &&
            feedbackMatch &&
            suggestionsMatch
          );
        },
        100
      );
    });

    it("should preserve Analysis entity through DAO conversion (hackathon type)", () => {
      forAll(
        () => {
          const categories = Category.getHackathonCategories();
          const category = Category.createHackathon(categories[0]);
          return generateAnalysis({ category });
        },
        (entity) => {
          // Convert entity -> DAO -> entity
          const dao = analysisMapper.toDAO(entity);
          const reconstructed = analysisMapper.toDomain(dao);

          // Verify entity identity is preserved
          const idMatch = entityEquals(entity, reconstructed);

          // Verify core properties are preserved
          const ideaMatch = entity.idea === reconstructed.idea;
          const scoreMatch = entity.score.value === reconstructed.score.value;
          const localeMatch =
            entity.locale.value === reconstructed.locale.value;
          const userIdMatch = entity.userId.equals(reconstructed.userId);

          // Verify category is preserved for hackathon type
          const categoryMatch =
            entity.category?.value === reconstructed.category?.value;

          return (
            idMatch &&
            ideaMatch &&
            scoreMatch &&
            localeMatch &&
            userIdMatch &&
            categoryMatch
          );
        },
        100
      );
    });

    it("should preserve User entity through DAO conversion", () => {
      forAll(
        generateUser,
        (entity) => {
          // Convert entity -> DAO -> entity
          const dao = userMapper.toDAO(entity);
          const reconstructed = userMapper.toDomain(dao, entity.email.value);

          // Verify entity identity is preserved
          const idMatch = entityEquals(entity, reconstructed);

          // Verify core properties are preserved
          const creditsMatch = entity.credits === reconstructed.credits;

          return idMatch && creditsMatch;
        },
        100
      );
    });
  });

  describe("P-DATA-002: DAO-Entity Round-Trip Fidelity", () => {
    /**
     * Property: For any DAO, converting to entity and back should preserve the DAO structure
     * Validates: Requirements 3.1, 3.2
     */
    it("should preserve DAO structure through entity conversion (idea type)", () => {
      forAll(
        () => generateAnalysis({ category: undefined }),
        (entity) => {
          // Start with a DAO
          const originalDao = analysisMapper.toDAO(entity);

          // Convert DAO -> entity -> DAO
          const domainEntity = analysisMapper.toDomain(originalDao);
          const reconstructedDao = analysisMapper.toDAO(domainEntity);

          // Verify DAO structure is preserved
          const idMatch = originalDao.id === reconstructedDao.id;
          const userIdMatch = originalDao.user_id === reconstructedDao.user_id;
          const ideaMatch = originalDao.idea === reconstructedDao.idea;
          const typeMatch =
            originalDao.analysis_type === reconstructedDao.analysis_type;

          // Verify analysis JSONB structure
          const originalAnalysis = originalDao.analysis as any;
          const reconstructedAnalysis = reconstructedDao.analysis as any;

          const scoreMatch =
            originalAnalysis.score === reconstructedAnalysis.score;
          const localeMatch =
            originalAnalysis.locale === reconstructedAnalysis.locale;

          return (
            idMatch &&
            userIdMatch &&
            ideaMatch &&
            typeMatch &&
            scoreMatch &&
            localeMatch
          );
        },
        100
      );
    });

    it("should preserve DAO structure through entity conversion (hackathon type)", () => {
      forAll(
        () => {
          const categories = Category.getHackathonCategories();
          const category = Category.createHackathon(categories[0]);
          return generateAnalysis({ category });
        },
        (entity) => {
          // Start with a DAO
          const originalDao = analysisMapper.toDAO(entity);

          // Convert DAO -> entity -> DAO
          const domainEntity = analysisMapper.toDomain(originalDao);
          const reconstructedDao = analysisMapper.toDAO(domainEntity);

          // Verify DAO structure is preserved
          const idMatch = originalDao.id === reconstructedDao.id;
          const userIdMatch = originalDao.user_id === reconstructedDao.user_id;
          const typeMatch =
            originalDao.analysis_type === reconstructedDao.analysis_type;

          // Verify analysis JSONB structure includes hackathon fields
          const originalAnalysis = originalDao.analysis as any;
          const reconstructedAnalysis = reconstructedDao.analysis as any;

          const categoryMatch =
            originalAnalysis.selectedCategory ===
            reconstructedAnalysis.selectedCategory;

          return idMatch && userIdMatch && typeMatch && categoryMatch;
        },
        100
      );
    });

    it("should preserve User DAO structure through entity conversion", () => {
      forAll(
        generateUser,
        (entity) => {
          // Start with a DAO
          const originalDao = userMapper.toDAO(entity);

          // Convert DAO -> entity -> DAO
          const domainEntity = userMapper.toDomain(
            originalDao,
            entity.email.value
          );
          const reconstructedDao = userMapper.toDAO(domainEntity);

          // Verify DAO structure is preserved
          const idMatch = originalDao.id === reconstructedDao.id;
          const tierMatch = originalDao.tier === reconstructedDao.tier;
          const creditsMatch = originalDao.credits === reconstructedDao.credits;

          return idMatch && tierMatch && creditsMatch;
        },
        100
      );
    });
  });

  describe("P-DATA-003: Null Field Preservation", () => {
    /**
     * Property: For any entity with null/undefined optional fields, those fields should remain null/undefined through conversion
     * Validates: Requirements 3.1, 3.3
     */
    it("should preserve undefined feedback through Analysis conversion", () => {
      forAll(
        () => generateAnalysis({ feedback: undefined }),
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const reconstructed = analysisMapper.toDomain(dao);

          return reconstructed.feedback === undefined;
        },
        100
      );
    });

    it("should preserve empty suggestions array through Analysis conversion", () => {
      forAll(
        () => generateAnalysis({ suggestions: [] }),
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const reconstructed = analysisMapper.toDomain(dao);

          return (
            Array.isArray(reconstructed.suggestions) &&
            reconstructed.suggestions.length === 0
          );
        },
        100
      );
    });

    it("should preserve undefined category through Analysis conversion", () => {
      forAll(
        () => generateAnalysis({ category: undefined }),
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const reconstructed = analysisMapper.toDomain(dao);

          return reconstructed.category === undefined;
        },
        100
      );
    });

    it("should preserve null audio_base64 through DAO conversion", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = analysisMapper.toDAO(entity);

          // audio_base64 should always be null in current implementation
          return dao.audio_base64 === null;
        },
        100
      );
    });

    it("should handle undefined name in User entity", () => {
      forAll(
        () => generateUser({ name: undefined }),
        (entity) => {
          const dao = userMapper.toDAO(entity);
          const reconstructed = userMapper.toDomain(dao, entity.email.value);

          return reconstructed.name === undefined;
        },
        100
      );
    });
  });

  describe("P-DATA-004: JSONB Structure Consistency", () => {
    /**
     * Property: For any entity, the JSONB analysis field should have consistent structure
     * Validates: Requirements 3.1, 3.4
     */
    it("should maintain consistent JSONB structure for idea-type analyses", () => {
      forAll(
        () => generateAnalysis({ category: undefined }),
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // Verify required fields exist
          const hasScore = typeof analysis.score === "number";
          const hasDetailedSummary =
            typeof analysis.detailedSummary === "string";
          const hasCriteria = Array.isArray(analysis.criteria);
          const hasLocale = typeof analysis.locale === "string";

          // Verify no hackathon-specific fields
          const noSelectedCategory = !("selectedCategory" in analysis);

          // Verify criteria structure
          const criteriaValid = analysis.criteria.every(
            (c: any) =>
              typeof c.name === "string" &&
              typeof c.score === "number" &&
              typeof c.justification === "string"
          );

          return (
            hasScore &&
            hasDetailedSummary &&
            hasCriteria &&
            hasLocale &&
            noSelectedCategory &&
            criteriaValid
          );
        },
        100
      );
    });

    it("should maintain consistent JSONB structure for hackathon-type analyses", () => {
      forAll(
        () => {
          const categories = Category.getHackathonCategories();
          const category = Category.createHackathon(categories[0]);
          return generateAnalysis({ category });
        },
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // Verify required fields exist (including hackathon-specific)
          const hasScore = typeof analysis.score === "number";
          const hasDetailedSummary =
            typeof analysis.detailedSummary === "string";
          const hasCriteria = Array.isArray(analysis.criteria);
          const hasLocale = typeof analysis.locale === "string";
          const hasSelectedCategory =
            typeof analysis.selectedCategory === "string";

          // Verify selectedCategory is valid
          const validCategories = [
            "resurrection",
            "frankenstein",
            "skeleton-crew",
            "costume-contest",
          ];
          const categoryValid = validCategories.includes(
            analysis.selectedCategory
          );

          return (
            hasScore &&
            hasDetailedSummary &&
            hasCriteria &&
            hasLocale &&
            hasSelectedCategory &&
            categoryValid
          );
        },
        100
      );
    });

    it("should maintain score bounds in JSONB structure", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // Score should be within valid range (0-100)
          const scoreInRange = analysis.score >= 0 && analysis.score <= 100;

          // If finalScore exists, it should be within 0-5 range
          const finalScoreValid =
            !analysis.finalScore ||
            (analysis.finalScore >= 0 && analysis.finalScore <= 5);

          return scoreInRange && finalScoreValid;
        },
        100
      );
    });

    it("should maintain locale consistency in JSONB structure", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // Locale should match entity locale
          const localeMatch = analysis.locale === entity.locale.value;

          // Locale should be valid (en or es)
          const localeValid = ["en", "es"].includes(analysis.locale);

          return localeMatch && localeValid;
        },
        100
      );
    });

    it("should maintain criteria array structure in JSONB", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // Criteria should be an array
          if (!Array.isArray(analysis.criteria)) {
            return false;
          }

          // Each criterion should have required fields
          const allCriteriaValid = analysis.criteria.every(
            (criterion: any) =>
              criterion &&
              typeof criterion === "object" &&
              typeof criterion.name === "string" &&
              typeof criterion.score === "number" &&
              typeof criterion.justification === "string" &&
              criterion.name.length > 0 &&
              criterion.justification.length > 0
          );

          return allCriteriaValid;
        },
        100
      );
    });

    it("should maintain analysis_type discriminator consistency", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = analysisMapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // If entity has hackathon category, analysis_type should be 'hackathon'
          if (entity.category && entity.category.isHackathon) {
            const typeMatch = dao.analysis_type === "hackathon";
            const hasSelectedCategory = "selectedCategory" in analysis;
            return typeMatch && hasSelectedCategory;
          } else {
            // Otherwise, analysis_type should be 'idea'
            const typeMatch = dao.analysis_type === "idea";
            const noSelectedCategory = !("selectedCategory" in analysis);
            return typeMatch && noSelectedCategory;
          }
        },
        100
      );
    });
  });
});
