/**
 * Property tests for Database Migration Integrity (P-DATA-005, P-DATA-006, P-DATA-007, P-DATA-008)
 * Tests migration record count preservation, data integrity, type discriminator correctness, and unified table queries
 *
 * Feature: property-testing-framework
 * Requirements: 3.1, 3.5
 */

import { describe, it, expect, beforeAll } from "vitest";
import { AnalysisMapper } from "@/src/infrastructure/database/supabase/mappers/AnalysisMapper";
import {
  generateAnalysis,
  generateMany,
  generateUserId,
} from "../utils/generators";
import { forAll, assertAll } from "../utils/property-helpers";
import { Category } from "@/src/domain/value-objects/Category";
import { Analysis } from "@/src/domain/entities/Analysis";

describe("Property: Database Migration Integrity", () => {
  const mapper = new AnalysisMapper();

  describe("P-DATA-005: Migration Record Count Preservation", () => {
    /**
     * Property: Migration preserves total record count
     * Formal: count(source_table) = count(target_table)
     * Validates: Requirements 3.1, 3.5
     */
    it("should preserve record count when converting entities to DAOs", () => {
      forAll(
        () => generateMany(generateAnalysis, 50),
        (entities) => {
          // Simulate migration: convert all entities to DAOs
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Verify count preservation
          return entities.length === daos.length;
        },
        100
      );
    });

    it("should preserve record count when converting DAOs back to entities", () => {
      forAll(
        () => generateMany(generateAnalysis, 50),
        (entities) => {
          // Convert to DAOs (simulating source table)
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Convert back to entities (simulating target table)
          const reconstructedEntities = daos.map((dao) => mapper.toDomain(dao));

          // Verify count preservation through full migration cycle
          return (
            entities.length === daos.length &&
            daos.length === reconstructedEntities.length
          );
        },
        100
      );
    });

    it("should preserve record count for mixed analysis types", () => {
      forAll(
        () => {
          // Generate mix of idea and hackathon analyses
          const ideaAnalyses = generateMany(
            () => generateAnalysis({ category: undefined }),
            25
          );
          const hackathonAnalyses = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ category });
          }, 25);

          return [...ideaAnalyses, ...hackathonAnalyses];
        },
        (entities) => {
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Count by type
          const ideaCount = entities.filter(
            (e) => !e.category || !e.category.isHackathon
          ).length;
          const hackathonCount = entities.filter(
            (e) => e.category && e.category.isHackathon
          ).length;

          const daoIdeaCount = daos.filter(
            (d) => d.analysis_type === "idea"
          ).length;
          const daoHackathonCount = daos.filter(
            (d) => d.analysis_type === "hackathon"
          ).length;

          // Verify counts match by type
          return (
            entities.length === daos.length &&
            ideaCount === daoIdeaCount &&
            hackathonCount === daoHackathonCount
          );
        },
        100
      );
    });

    it("should not lose or duplicate records during batch conversion", () => {
      forAll(
        () => generateMany(generateAnalysis, 100),
        (entities) => {
          // Get unique IDs from entities
          const entityIds = new Set(entities.map((e) => e.id.value));

          // Convert to DAOs
          const daos = entities.map((entity) => mapper.toDAO(entity));
          const daoIds = new Set(daos.map((d) => d.id));

          // Verify no IDs lost or duplicated
          return (
            entityIds.size === entities.length &&
            daoIds.size === daos.length &&
            entityIds.size === daoIds.size
          );
        },
        50
      );
    });
  });

  describe("P-DATA-006: Migration Data Integrity", () => {
    /**
     * Property: All source data fields are preserved in target
     * Formal: ∀r: SourceRecord, ∃t: TargetRecord, preservesData(r, t)
     * Validates: Requirements 3.1, 3.5
     */
    it("should preserve all core fields during migration", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = mapper.toDAO(entity);
          const reconstructed = mapper.toDomain(dao);

          // Verify all core fields preserved
          const idMatch = entity.id.equals(reconstructed.id);
          const userIdMatch = entity.userId.equals(reconstructed.userId);
          const ideaMatch = entity.idea === reconstructed.idea;
          const scoreMatch = entity.score.value === reconstructed.score.value;
          const localeMatch =
            entity.locale.value === reconstructed.locale.value;

          return (
            idMatch && userIdMatch && ideaMatch && scoreMatch && localeMatch
          );
        },
        100
      );
    });

    it("should preserve optional fields during migration", () => {
      forAll(
        () =>
          generateAnalysis({
            feedback: "This is detailed feedback",
            suggestions: ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
          }),
        (entity) => {
          const dao = mapper.toDAO(entity);
          const reconstructed = mapper.toDomain(dao);

          // Verify optional fields preserved
          const feedbackMatch = entity.feedback === reconstructed.feedback;
          const suggestionsMatch =
            JSON.stringify(entity.suggestions) ===
            JSON.stringify(reconstructed.suggestions);

          return feedbackMatch && suggestionsMatch;
        },
        100
      );
    });

    it("should preserve hackathon-specific fields during migration", () => {
      forAll(
        () => {
          const categories = Category.getHackathonCategories();
          const category = Category.createHackathon(categories[0]);
          return generateAnalysis({ category });
        },
        (entity) => {
          const dao = mapper.toDAO(entity);
          const reconstructed = mapper.toDomain(dao);

          // Verify hackathon category preserved
          const categoryMatch =
            entity.category?.value === reconstructed.category?.value;
          const isHackathonMatch =
            entity.category?.isHackathon ===
            reconstructed.category?.isHackathon;

          return categoryMatch && isHackathonMatch;
        },
        100
      );
    });

    it("should preserve JSONB structure integrity during migration", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = mapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // Verify JSONB structure has all required fields
          const hasScore = typeof analysis.score === "number";
          const hasDetailedSummary =
            typeof analysis.detailedSummary === "string";
          const hasCriteria = Array.isArray(analysis.criteria);
          const hasLocale = typeof analysis.locale === "string";

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
            criteriaValid
          );
        },
        100
      );
    });

    it("should not corrupt data during batch migration", () => {
      forAll(
        () => generateMany(generateAnalysis, 50),
        (entities) => {
          // Convert all to DAOs
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Convert all back to entities
          const reconstructed = daos.map((dao) => mapper.toDomain(dao));

          // Verify each entity matches its reconstructed version
          return entities.every((entity, index) => {
            const recon = reconstructed[index];
            return (
              entity.id.equals(recon.id) &&
              entity.userId.equals(recon.userId) &&
              entity.idea === recon.idea &&
              entity.score.value === recon.score.value
            );
          });
        },
        50
      );
    });
  });

  describe("P-DATA-007: Analysis Type Discriminator Correctness", () => {
    /**
     * Property: Analysis type discriminator matches analysis content
     * Formal: ∀a: Analysis, a.type = 'hackathon' ⇔ hasHackathonFields(a)
     * Validates: Requirements 3.1, 3.5
     */
    it("should set type to 'idea' for analyses without hackathon category", () => {
      forAll(
        () => generateAnalysis({ category: undefined }),
        (entity) => {
          const dao = mapper.toDAO(entity);

          // Verify type discriminator is 'idea'
          const typeCorrect = dao.analysis_type === "idea";

          // Verify no hackathon-specific fields in JSONB
          const analysis = dao.analysis as any;
          const noHackathonFields = !("selectedCategory" in analysis);

          return typeCorrect && noHackathonFields;
        },
        100
      );
    });

    it("should set type to 'hackathon' for analyses with hackathon category", () => {
      forAll(
        () => {
          const categories = Category.getHackathonCategories();
          const category = Category.createHackathon(categories[0]);
          return generateAnalysis({ category });
        },
        (entity) => {
          const dao = mapper.toDAO(entity);

          // Verify type discriminator is 'hackathon'
          const typeCorrect = dao.analysis_type === "hackathon";

          // Verify hackathon-specific fields present in JSONB
          const analysis = dao.analysis as any;
          const hasSelectedCategory = "selectedCategory" in analysis;
          const categoryValid = [
            "resurrection",
            "frankenstein",
            "skeleton-crew",
            "costume-contest",
          ].includes(analysis.selectedCategory);

          return typeCorrect && hasSelectedCategory && categoryValid;
        },
        100
      );
    });

    it("should maintain type discriminator consistency through round-trip", () => {
      forAll(
        () => {
          // Generate either idea (no category) or hackathon (with hackathon category)
          // Note: General categories are NOT persisted to database, so we don't test them here
          const useHackathon = Math.random() > 0.5;
          if (useHackathon) {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ category });
          } else {
            // Generate idea type without category (general categories are not persisted)
            return generateAnalysis({ category: undefined });
          }
        },
        (entity) => {
          const dao = mapper.toDAO(entity);
          const reconstructed = mapper.toDomain(dao);

          // Determine expected type from entity
          // Only hackathon categories result in 'hackathon' type
          const isHackathon = entity.category && entity.category.isHackathon;
          const expectedType = isHackathon ? "hackathon" : "idea";

          // Verify DAO has correct type
          const daoTypeCorrect = dao.analysis_type === expectedType;

          // Verify reconstructed entity has matching category state
          const reconstructedIsHackathon =
            reconstructed.category && reconstructed.category.isHackathon;
          const categoryStateMatch = isHackathon === reconstructedIsHackathon;

          return daoTypeCorrect && categoryStateMatch;
        },
        100
      );
    });

    it("should never have type mismatch with content", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = mapper.toDAO(entity);
          const analysis = dao.analysis as any;

          // Check consistency between type discriminator and content
          if (dao.analysis_type === "hackathon") {
            // Hackathon type must have selectedCategory
            return "selectedCategory" in analysis;
          } else if (dao.analysis_type === "idea") {
            // Idea type must not have selectedCategory
            return !("selectedCategory" in analysis);
          }

          // Unknown type is invalid
          return false;
        },
        100
      );
    });

    it("should correctly discriminate types in mixed batches", () => {
      forAll(
        () => {
          // Generate mix of idea and hackathon analyses
          const ideaAnalyses = generateMany(
            () => generateAnalysis({ category: undefined }),
            25
          );
          const hackathonAnalyses = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ category });
          }, 25);

          return [...ideaAnalyses, ...hackathonAnalyses];
        },
        (entities) => {
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Verify each DAO has correct type discriminator
          return entities.every((entity, index) => {
            const dao = daos[index];
            const isHackathon = entity.category && entity.category.isHackathon;
            const expectedType = isHackathon ? "hackathon" : "idea";

            return dao.analysis_type === expectedType;
          });
        },
        50
      );
    });
  });

  describe("P-DATA-008: Unified Table Query Correctness", () => {
    /**
     * Property: Querying by type returns only matching records
     * Formal: ∀t: AnalysisType, findByType(t).all(a => a.type = t)
     * Validates: Requirements 3.1, 3.5
     */
    it("should filter idea analyses correctly", () => {
      forAll(
        () => {
          // Generate mix of idea and hackathon analyses
          const ideaAnalyses = generateMany(
            () => generateAnalysis({ category: undefined }),
            30
          );
          const hackathonAnalyses = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ category });
          }, 20);

          return [...ideaAnalyses, ...hackathonAnalyses];
        },
        (entities) => {
          // Convert to DAOs (simulating database records)
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Simulate query: filter by type = 'idea'
          const ideaResults = daos.filter(
            (dao) => dao.analysis_type === "idea"
          );

          // Verify all results are idea type
          const allAreIdea = ideaResults.every(
            (dao) => dao.analysis_type === "idea"
          );

          // Verify no hackathon fields in results
          const noHackathonFields = ideaResults.every((dao) => {
            const analysis = dao.analysis as any;
            return !("selectedCategory" in analysis);
          });

          // Verify we got the expected count
          const expectedIdeaCount = entities.filter(
            (e) => !e.category || !e.category.isHackathon
          ).length;
          const countMatch = ideaResults.length === expectedIdeaCount;

          return allAreIdea && noHackathonFields && countMatch;
        },
        50
      );
    });

    it("should filter hackathon analyses correctly", () => {
      forAll(
        () => {
          // Generate mix of idea and hackathon analyses
          const ideaAnalyses = generateMany(
            () => generateAnalysis({ category: undefined }),
            20
          );
          const hackathonAnalyses = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ category });
          }, 30);

          return [...ideaAnalyses, ...hackathonAnalyses];
        },
        (entities) => {
          // Convert to DAOs (simulating database records)
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Simulate query: filter by type = 'hackathon'
          const hackathonResults = daos.filter(
            (dao) => dao.analysis_type === "hackathon"
          );

          // Verify all results are hackathon type
          const allAreHackathon = hackathonResults.every(
            (dao) => dao.analysis_type === "hackathon"
          );

          // Verify all have hackathon fields
          const allHaveHackathonFields = hackathonResults.every((dao) => {
            const analysis = dao.analysis as any;
            return "selectedCategory" in analysis;
          });

          // Verify we got the expected count
          const expectedHackathonCount = entities.filter(
            (e) => e.category && e.category.isHackathon
          ).length;
          const countMatch = hackathonResults.length === expectedHackathonCount;

          return allAreHackathon && allHaveHackathonFields && countMatch;
        },
        50
      );
    });

    it("should return all records when no type filter applied", () => {
      forAll(
        () => {
          // Generate mix of idea and hackathon analyses
          const ideaAnalyses = generateMany(
            () => generateAnalysis({ category: undefined }),
            25
          );
          const hackathonAnalyses = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ category });
          }, 25);

          return [...ideaAnalyses, ...hackathonAnalyses];
        },
        (entities) => {
          // Convert to DAOs (simulating database records)
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Simulate query: no type filter (get all)
          const allResults = daos;

          // Verify count matches
          return allResults.length === entities.length;
        },
        50
      );
    });

    it("should filter by user and type correctly", () => {
      forAll(
        () => {
          const userId1 = generateUserId();
          const userId2 = generateUserId();

          // Generate analyses for user 1 (mix of types)
          const user1Idea = generateMany(
            () => generateAnalysis({ userId: userId1, category: undefined }),
            15
          );
          const user1Hackathon = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ userId: userId1, category });
          }, 10);

          // Generate analyses for user 2 (mix of types)
          const user2Idea = generateMany(
            () => generateAnalysis({ userId: userId2, category: undefined }),
            10
          );
          const user2Hackathon = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ userId: userId2, category });
          }, 15);

          return {
            entities: [
              ...user1Idea,
              ...user1Hackathon,
              ...user2Idea,
              ...user2Hackathon,
            ],
            userId1,
            userId2,
          };
        },
        ({ entities, userId1, userId2 }) => {
          // Convert to DAOs
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Simulate query: user1 + idea type
          const user1IdeaResults = daos.filter(
            (dao) =>
              dao.user_id === userId1.value && dao.analysis_type === "idea"
          );

          // Verify all results match both filters
          const allMatchUser = user1IdeaResults.every(
            (dao) => dao.user_id === userId1.value
          );
          const allMatchType = user1IdeaResults.every(
            (dao) => dao.analysis_type === "idea"
          );

          // Verify expected count
          const expectedCount = entities.filter(
            (e) =>
              e.userId.equals(userId1) &&
              (!e.category || !e.category.isHackathon)
          ).length;
          const countMatch = user1IdeaResults.length === expectedCount;

          return allMatchUser && allMatchType && countMatch;
        },
        50
      );
    });

    it("should maintain query correctness with empty results", () => {
      forAll(
        () => {
          // Generate only idea analyses
          return generateMany(
            () => generateAnalysis({ category: undefined }),
            50
          );
        },
        (entities) => {
          // Convert to DAOs
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Simulate query: filter by type = 'hackathon' (should be empty)
          const hackathonResults = daos.filter(
            (dao) => dao.analysis_type === "hackathon"
          );

          // Verify empty result set
          return hackathonResults.length === 0;
        },
        50
      );
    });

    it("should handle type queries with sorting", () => {
      forAll(
        () => {
          // Generate mix with different scores
          const analyses = generateMany(() => {
            const categories = Category.getHackathonCategories();
            const category = Category.createHackathon(categories[0]);
            return generateAnalysis({ category });
          }, 50);

          return analyses;
        },
        (entities) => {
          // Convert to DAOs
          const daos = entities.map((entity) => mapper.toDAO(entity));

          // Simulate query: filter by hackathon type and sort by score
          const results = daos
            .filter((dao) => dao.analysis_type === "hackathon")
            .sort((a, b) => {
              const scoreA = (a.analysis as any).score || 0;
              const scoreB = (b.analysis as any).score || 0;
              return scoreB - scoreA; // Descending
            });

          // Verify all are hackathon type
          const allAreHackathon = results.every(
            (dao) => dao.analysis_type === "hackathon"
          );

          // Verify sorting is correct
          const isSorted = results.every((dao, index) => {
            if (index === 0) return true;
            const currentScore = (dao.analysis as any).score || 0;
            const previousScore =
              (results[index - 1].analysis as any).score || 0;
            return currentScore <= previousScore;
          });

          return allAreHackathon && isSorted;
        },
        50
      );
    });
  });
});
