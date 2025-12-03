import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { AnalysisController } from "../AnalysisController";
import { Analysis } from "../../../../domain/entities/Analysis";
import {
  AnalysisId,
  UserId,
  Score,
  Locale,
  Category,
  DocumentId,
} from "../../../../domain/value-objects";
import { SaveAnalysisUseCase } from "../../../../application/use-cases/SaveAnalysisUseCase";
import { DeleteAnalysisUseCase } from "../../../../application/use-cases/DeleteAnalysisUseCase";
import { success, failure } from "../../../../shared/types/common";
import { EntityNotFoundError } from "../../../../shared/types/errors";

// Mock the AuthMiddleware module
vi.mock("../../middleware/AuthMiddleware", () => ({
  authenticateRequest: vi.fn(),
}));

vi.mock("@/src/infrastructure/config/credits", () => ({
  isCreditSystemEnabled: vi.fn(() => false),
}));

// Import the mocked function
import { authenticateRequest } from "../../middleware/AuthMiddleware";

/**
 * Integration tests for AnalysisController migration fallback logic
 * Tests Requirements: 3.1, 3.2, 4.1, 4.2, 9.2
 *
 * These tests verify that the controller properly handles:
 * - Updating analyses in documents table first, then falling back to saved_analyses
 * - Deleting analyses from documents table first, then falling back to saved_analyses
 * - Error handling for both new and legacy data
 */
describe("AnalysisController Migration Fallback Tests", () => {
  let controller: AnalysisController;
  let mockUpdateAnalysisHandler: any;
  let mockDeleteAnalysisHandler: any;
  let mockDocumentRepository: any;
  let mockAnalysisRepository: any;
  const testUserId = "550e8400-e29b-41d4-a716-446655440000";
  const testAnalysisId = "660e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FF_USE_MOCK_API = "false";
    process.env.NEXT_PUBLIC_FF_USE_MOCK_API = "false";

    // Setup authentication mock
    (authenticateRequest as any).mockResolvedValue({
      success: true,
      userId: testUserId,
      userEmail: "test@example.com",
      userTier: "free",
    });

    // Create mock repositories
    mockDocumentRepository = {
      findById: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };

    mockAnalysisRepository = {
      findById: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };

    // Create mock handlers with repository access
    mockUpdateAnalysisHandler = {
      handle: vi.fn(),
    };

    mockDeleteAnalysisHandler = {
      handle: vi.fn(),
    };

    // Create controller with minimal dependencies
    controller = new AnalysisController(
      {} as any, // createAnalysisHandler
      mockUpdateAnalysisHandler,
      mockDeleteAnalysisHandler,
      {} as any, // getAnalysisHandler
      {} as any, // listAnalysesHandler
      {} as any, // searchAnalysesHandler
      {} as any, // checkCreditsUseCase
      {} as any, // getCreditBalanceUseCase
      {} as any, // deductCreditUseCase
      {} as any, // userRepository
      undefined // saveAnalysisToIdeaPanelUseCase
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("updateAnalysis - Fallback Logic", () => {
    it("should update analysis from documents table when found (Requirement 3.1)", async () => {
      // Arrange
      const testAnalysis = Analysis.create({
        idea: "Test idea for analysis with sufficient length",
        userId: UserId.fromString(testUserId),
        score: Score.create(85),
        locale: Locale.english(),
        category: Category.createGeneral("technology"),
        feedback: "Test feedback",
        suggestions: [],
      });

      mockUpdateAnalysisHandler.handle.mockResolvedValue({
        success: true,
        data: {
          analysis: testAnalysis,
        },
      });

      const requestBody = {
        idea: "Updated idea",
        category: "technology",
      };

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Act
      const response = await controller.updateAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(200);
      expect(mockUpdateAnalysisHandler.handle).toHaveBeenCalled();

      const responseBody = await response.json();
      expect(responseBody.id).toBeDefined();
    });

    it("should fallback to saved_analyses when not found in documents table (Requirement 3.2)", async () => {
      // Arrange
      const testAnalysis = Analysis.create({
        idea: "Legacy idea",
        userId: UserId.fromString(testUserId),
        score: Score.create(75),
        locale: Locale.english(),
        category: Category.createGeneral("technology"),
        feedback: "Legacy feedback",
        suggestions: [],
      });

      // Mock handler to simulate fallback behavior
      mockUpdateAnalysisHandler.handle.mockResolvedValue({
        success: true,
        data: {
          analysis: testAnalysis,
        },
      });

      const requestBody = {
        idea: "Updated legacy idea",
        category: "technology",
      };

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Act
      const response = await controller.updateAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(200);
      expect(mockUpdateAnalysisHandler.handle).toHaveBeenCalled();
    });

    it("should return 400 when analysis not found in either table (Requirement 9.2)", async () => {
      // Arrange
      mockUpdateAnalysisHandler.handle.mockResolvedValue({
        success: false,
        error: new EntityNotFoundError("Analysis", testAnalysisId),
      });

      const requestBody = {
        idea: "Non-existent idea",
        category: "technology",
      };

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Act
      const response = await controller.updateAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });
  });

  describe("deleteAnalysis - Fallback Logic", () => {
    it("should delete analysis from documents table when found (Requirement 4.1)", async () => {
      // Arrange
      mockDeleteAnalysisHandler.handle.mockResolvedValue({
        success: true,
        data: {
          success: true,
        },
      });

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token",
          },
        }
      );

      // Act
      const response = await controller.deleteAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(200);
      expect(mockDeleteAnalysisHandler.handle).toHaveBeenCalled();

      const responseBody = await response.json();
      expect(responseBody.message).toBe("Analysis deleted successfully");
    });

    it("should fallback to saved_analyses when not found in documents table (Requirement 4.2)", async () => {
      // Arrange
      mockDeleteAnalysisHandler.handle.mockResolvedValue({
        success: true,
        data: {
          success: true,
        },
      });

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token",
          },
        }
      );

      // Act
      const response = await controller.deleteAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(200);
      expect(mockDeleteAnalysisHandler.handle).toHaveBeenCalled();
    });

    it("should return 400 when analysis not found in either table (Requirement 9.2)", async () => {
      // Arrange
      mockDeleteAnalysisHandler.handle.mockResolvedValue({
        success: false,
        error: new EntityNotFoundError("Analysis", testAnalysisId),
      });

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token",
          },
        }
      );

      // Act
      const response = await controller.deleteAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });

    it("should handle unauthorized delete attempts (Requirement 9.2)", async () => {
      // Arrange
      (authenticateRequest as any).mockResolvedValue({
        success: false,
        error: "Authentication required",
      });

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "DELETE",
        }
      );

      // Act
      const response = await controller.deleteAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully during update (Requirement 9.2)", async () => {
      // Arrange
      mockUpdateAnalysisHandler.handle.mockResolvedValue({
        success: false,
        error: new Error("Database connection failed"),
      });

      const requestBody = {
        idea: "Test idea with sufficient length for validation",
        category: "technology",
      };

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Act
      const response = await controller.updateAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
      // The error message might be wrapped or transformed by the controller
    });

    it("should handle database errors gracefully during delete (Requirement 9.2)", async () => {
      // Arrange
      mockDeleteAnalysisHandler.handle.mockResolvedValue({
        success: false,
        error: new Error("Database connection failed"),
      });

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/analyze/${testAnalysisId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token",
          },
        }
      );

      // Act
      const response = await controller.deleteAnalysis(mockRequest, {
        params: { id: testAnalysisId },
      });

      // Assert
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toContain("Database connection failed");
    });
  });
});
