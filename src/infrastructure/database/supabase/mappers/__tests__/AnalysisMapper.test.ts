import { describe, it, expect } from "vitest";
import { AnalysisMapper } from "../AnalysisMapper";
import { Analysis } from "../../../../../domain/entities/Analysis";
import {
  AnalysisId,
  UserId,
  Score,
  Locale,
  Category,
} from "../../../../../domain/value-objects";
import { AnalysisDAO } from "../../../types/dao";

describe("AnalysisMapper Integration Tests", () => {
  let mapper: AnalysisMapper;
  let testAnalysis: Analysis;
  let testAnalysisDAO: AnalysisDAO;

  beforeEach(() => {
    mapper = new AnalysisMapper();

    // Create test analysis entity
    testAnalysis = Analysis.create({
      idea: "A revolutionary AI-powered development platform that helps developers create better applications",
      userId: UserId.generate(),
      score: Score.create(85),
      locale: Locale.english(),
      category: Category.createGeneral("technology"),
      feedback:
        "Excellent idea with strong market potential and clear implementation path",
      suggestions: [
        "Consider mobile app development",
        "Explore enterprise partnerships",
        "Add real-time collaboration features",
      ],
    });

    // Create corresponding DAO
    testAnalysisDAO = {
      id: testAnalysis.id.value,
      user_id: testAnalysis.userId.value,
      analysis_type: "idea",
      idea: testAnalysis.idea,
      analysis: {
        score: testAnalysis.score.value,
        detailedSummary: testAnalysis.feedback || "",
        criteria: [],
        locale: testAnalysis.locale.value,
      },
      audio_base64: null,
      created_at: testAnalysis.createdAt.toISOString(),
    };
  });

  describe("toDAO", () => {
    it("should convert Analysis entity to DAO correctly", () => {
      // Act
      const dao = mapper.toDAO(testAnalysis);

      // Assert
      expect(dao.id).toBe(testAnalysis.id.value);
      expect(dao.user_id).toBe(testAnalysis.userId.value);
      expect(dao.idea).toBe(testAnalysis.idea);
      expect(dao.analysis.score).toBe(testAnalysis.score.value);
      expect(dao.analysis.detailedSummary).toBe(testAnalysis.feedback);
      expect(dao.analysis.locale).toBe(testAnalysis.locale.value);
      expect(dao.created_at).toBe(testAnalysis.createdAt.toISOString());
      expect(dao.audio_base64).toBeNull();
    });

    it("should handle analysis without feedback", () => {
      // Arrange
      const analysisWithoutFeedback = Analysis.create({
        idea: "Simple idea without feedback",
        userId: UserId.generate(),
        score: Score.create(70),
        locale: Locale.spanish(),
      });

      // Act
      const dao = mapper.toDAO(analysisWithoutFeedback);

      // Assert
      expect(dao.analysis.detailedSummary).toBe("");
      expect(dao.analysis.locale).toBe("es");
    });

    it("should handle analysis with category", () => {
      // Arrange
      const analysisWithCategory = Analysis.create({
        idea: "Business-focused startup idea",
        userId: UserId.generate(),
        score: Score.create(75),
        locale: Locale.english(),
        category: Category.createGeneral("business"),
      });

      // Act
      const dao = mapper.toDAO(analysisWithCategory);

      // Assert
      expect(dao.analysis.locale).toBe("en");
      // Category information would be stored in the analysis data structure
      expect(dao.analysis).toBeDefined();
    });
  });

  describe("toDomain", () => {
    it("should convert DAO to Analysis entity correctly", () => {
      // Act
      const analysis = mapper.toDomain(testAnalysisDAO);

      // Assert
      expect(analysis.id.value).toBe(testAnalysisDAO.id);
      expect(analysis.userId.value).toBe(testAnalysisDAO.user_id);
      expect(analysis.idea).toBe(testAnalysisDAO.idea);
      expect(analysis.score.value).toBe(testAnalysisDAO.analysis.score);
      expect(analysis.feedback).toBe(testAnalysisDAO.analysis.detailedSummary);
      expect(analysis.locale.value).toBe(testAnalysisDAO.analysis.locale);
      expect(analysis.createdAt.toISOString()).toBe(testAnalysisDAO.created_at);
    });

    it("should handle DAO with empty feedback", () => {
      // Arrange
      const daoWithEmptyFeedback = {
        ...testAnalysisDAO,
        analysis: {
          ...testAnalysisDAO.analysis,
          detailedSummary: "",
        },
      };

      // Act
      const analysis = mapper.toDomain(daoWithEmptyFeedback);

      // Assert
      expect(analysis.feedback).toBeUndefined();
    });

    it("should handle DAO with different locale", () => {
      // Arrange
      const spanishDAO = {
        ...testAnalysisDAO,
        analysis: {
          ...testAnalysisDAO.analysis,
          locale: "es",
        },
      };

      // Act
      const analysis = mapper.toDomain(spanishDAO);

      // Assert
      expect(analysis.locale.value).toBe("es");
      expect(analysis.locale.isSpanish).toBe(true);
    });

    it("should reconstruct analysis with proper timestamps", () => {
      // Arrange
      const specificDate = "2023-12-01T10:30:00.000Z";
      const daoWithSpecificDate = {
        ...testAnalysisDAO,
        created_at: specificDate,
      };

      // Act
      const analysis = mapper.toDomain(daoWithSpecificDate);

      // Assert
      expect(analysis.createdAt.toISOString()).toBe(specificDate);
    });
  });

  describe("toDTO", () => {
    it("should convert Analysis entity to DTO correctly", () => {
      // Act
      const dto = mapper.toDTO(testAnalysis);

      // Assert
      expect(dto.id).toBe(testAnalysis.id.value);
      expect(dto.idea).toBe(testAnalysis.idea);
      expect(dto.score).toBe(testAnalysis.score.value);
      expect(dto.locale).toBe(testAnalysis.locale.value);
      expect(dto.feedback).toBe(testAnalysis.feedback);
      expect(dto.suggestions).toEqual(testAnalysis.suggestions);
      expect(dto.createdAt).toBe(testAnalysis.createdAt.toISOString());
      expect(dto.updatedAt).toBe(testAnalysis.updatedAt.toISOString());
      expect(dto.userId).toBe(testAnalysis.userId.value);
    });

    it("should handle analysis with category in DTO", () => {
      // Arrange
      const analysisWithCategory = Analysis.create({
        idea: "Technology startup idea",
        userId: UserId.generate(),
        score: Score.create(80),
        locale: Locale.english(),
        category: Category.createGeneral("technology"),
      });

      // Act
      const dto = mapper.toDTO(analysisWithCategory);

      // Assert
      expect(dto.category).toBe("technology");
    });

    it("should handle analysis without category in DTO", () => {
      // Arrange
      const analysisWithoutCategory = Analysis.create({
        idea: "Simple idea without category",
        userId: UserId.generate(),
        score: Score.create(60),
        locale: Locale.english(),
      });

      // Act
      const dto = mapper.toDTO(analysisWithoutCategory);

      // Assert
      expect(dto.category).toBeUndefined();
    });

    it("should handle analysis without feedback in DTO", () => {
      // Arrange
      const analysisWithoutFeedback = Analysis.create({
        idea: "Idea without feedback",
        userId: UserId.generate(),
        score: Score.create(50),
        locale: Locale.spanish(),
      });

      // Act
      const dto = mapper.toDTO(analysisWithoutFeedback);

      // Assert
      expect(dto.feedback).toBeUndefined();
      expect(dto.suggestions).toEqual([]);
    });
  });

  describe("round-trip conversion", () => {
    it("should maintain data integrity through DAO round-trip", () => {
      // Act
      const dao = mapper.toDAO(testAnalysis);
      const reconstructedAnalysis = mapper.toDomain(dao);

      // Assert
      expect(reconstructedAnalysis.id.equals(testAnalysis.id)).toBe(true);
      expect(reconstructedAnalysis.userId.equals(testAnalysis.userId)).toBe(
        true
      );
      expect(reconstructedAnalysis.idea).toBe(testAnalysis.idea);
      expect(reconstructedAnalysis.score.equals(testAnalysis.score)).toBe(true);
      expect(reconstructedAnalysis.locale.equals(testAnalysis.locale)).toBe(
        true
      );
      expect(reconstructedAnalysis.feedback).toBe(testAnalysis.feedback);
      // Note: suggestions are not stored in the current DAO structure, so they won't round-trip
    });

    it("should maintain data integrity through DTO round-trip", () => {
      // Act
      const dto = mapper.toDTO(testAnalysis);

      // Assert - DTO should contain all necessary data for API responses
      expect(dto.id).toBe(testAnalysis.id.value);
      expect(dto.userId).toBe(testAnalysis.userId.value);
      expect(dto.idea).toBe(testAnalysis.idea);
      expect(dto.score).toBe(testAnalysis.score.value);
      expect(dto.locale).toBe(testAnalysis.locale.value);
      expect(dto.suggestions).toEqual(testAnalysis.suggestions);
      expect(dto.createdAt).toBe(testAnalysis.createdAt.toISOString());
      expect(dto.updatedAt).toBe(testAnalysis.updatedAt.toISOString());
    });
  });

  describe("error handling", () => {
    it("should handle invalid DAO data gracefully", () => {
      // Arrange
      const invalidDAO = {
        id: "invalid-uuid",
        user_id: "invalid-user-uuid",
        idea: "",
        analysis: {
          score: 150, // Invalid score
          detailedSummary: "",
          criteria: [],
          locale: "invalid-locale",
        },
        audio_base64: null,
        created_at: "invalid-date",
      };

      // Act & Assert
      expect(() => mapper.toDomain(invalidDAO)).toThrow();
    });

    it("should handle missing required DAO fields", () => {
      // Arrange
      const incompleteDAO = {
        id: testAnalysisDAO.id,
        // Missing required fields
      } as any;

      // Act & Assert
      expect(() => mapper.toDomain(incompleteDAO)).toThrow();
    });
  });
});
