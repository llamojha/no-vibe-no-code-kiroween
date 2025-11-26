import { describe, it, expect } from "vitest";
import {
  generatePRDPrompt,
  generateTechnicalDesignPrompt,
  generateArchitecturePrompt,
  generateRoadmapPrompt,
  type DocumentGenerationContext,
} from "../documentGeneration";

describe("Document Generation Prompts", () => {
  const baseContext: DocumentGenerationContext = {
    ideaText: "A platform for connecting freelance developers with startups",
    analysisScores: {
      "Market Demand": 4.5,
      "Market Size": 4.0,
      Uniqueness: 3.5,
      Scalability: 4.5,
      "Potential Profitability": 4.0,
    },
    analysisFeedback:
      "Strong market demand with good scalability potential. Consider differentiation strategies.",
  };

  describe("generatePRDPrompt", () => {
    it("should generate a prompt with idea text", () => {
      const prompt = generatePRDPrompt(baseContext);

      expect(prompt).toContain(baseContext.ideaText);
      expect(prompt).toContain("Product Requirements Document");
      expect(prompt).toContain("Problem Statement");
      expect(prompt).toContain("Target Users & Personas");
      expect(prompt).toContain("User Stories");
      expect(prompt).toContain("Features & Requirements");
      expect(prompt).toContain("Success Metrics");
      expect(prompt).toContain("Out of Scope");
      expect(prompt).toContain("Assumptions & Dependencies");
    });

    it("should include analysis scores when provided", () => {
      const prompt = generatePRDPrompt(baseContext);

      expect(prompt).toContain("ANALYSIS SCORES");
      expect(prompt).toContain("Market Demand");
      expect(prompt).toContain("4.5");
    });

    it("should include analysis feedback when provided", () => {
      const prompt = generatePRDPrompt(baseContext);

      expect(prompt).toContain("ANALYSIS FEEDBACK");
      expect(prompt).toContain(baseContext.analysisFeedback!);
    });

    it("should work without analysis scores and feedback", () => {
      const minimalContext: DocumentGenerationContext = {
        ideaText: baseContext.ideaText,
      };

      const prompt = generatePRDPrompt(minimalContext);

      expect(prompt).toContain(baseContext.ideaText);
      expect(prompt).not.toContain("ANALYSIS SCORES");
      expect(prompt).not.toContain("ANALYSIS FEEDBACK");
    });
  });

  describe("generateTechnicalDesignPrompt", () => {
    it("should generate a prompt with idea text", () => {
      const prompt = generateTechnicalDesignPrompt(baseContext);

      expect(prompt).toContain(baseContext.ideaText);
      expect(prompt).toContain("Technical Design Document");
      expect(prompt).toContain("Architecture Overview");
      expect(prompt).toContain("Technology Stack Recommendations");
      expect(prompt).toContain("Data Models & Database Schema");
      expect(prompt).toContain("API Specifications");
      expect(prompt).toContain("Security Considerations");
      expect(prompt).toContain("Scalability & Performance");
      expect(prompt).toContain("Deployment Strategy");
      expect(prompt).toContain("Third-party Integrations");
    });

    it("should include existing PRD when provided", () => {
      const contextWithPRD: DocumentGenerationContext = {
        ...baseContext,
        existingPRD: "# PRD\n\n## Problem Statement\nFreelancers need work...",
      };

      const prompt = generateTechnicalDesignPrompt(contextWithPRD);

      expect(prompt).toContain("EXISTING PRD");
      expect(prompt).toContain(contextWithPRD.existingPRD!);
      expect(prompt).toContain(
        "Use the PRD above to inform your technical design decisions"
      );
    });

    it("should work without existing PRD", () => {
      const prompt = generateTechnicalDesignPrompt(baseContext);

      expect(prompt).toContain("No PRD is available yet");
      expect(prompt).toContain(
        "Base your technical design on the idea description"
      );
    });
  });

  describe("generateArchitecturePrompt", () => {
    it("should generate a prompt with idea text", () => {
      const prompt = generateArchitecturePrompt(baseContext);

      expect(prompt).toContain(baseContext.ideaText);
      expect(prompt).toContain("Architecture Document");
      expect(prompt).toContain("System Architecture Diagram");
      expect(prompt).toContain("Component Breakdown");
      expect(prompt).toContain("Data Flow");
      expect(prompt).toContain("Integration Points");
      expect(prompt).toContain("Infrastructure Requirements");
      expect(prompt).toContain("Scalability Considerations");
      expect(prompt).toContain("Disaster Recovery & Backup");
      expect(prompt).toContain("Monitoring & Observability");
    });

    it("should include existing technical design when provided", () => {
      const contextWithTechDesign: DocumentGenerationContext = {
        ...baseContext,
        existingTechnicalDesign:
          "# Technical Design\n\n## Architecture\nMicroservices...",
      };

      const prompt = generateArchitecturePrompt(contextWithTechDesign);

      expect(prompt).toContain("EXISTING TECHNICAL DESIGN");
      expect(prompt).toContain(contextWithTechDesign.existingTechnicalDesign!);
      expect(prompt).toContain(
        "Use the Technical Design above as the foundation"
      );
    });

    it("should work without existing technical design", () => {
      const prompt = generateArchitecturePrompt(baseContext);

      expect(prompt).toContain("No Technical Design is available yet");
      expect(prompt).toContain(
        "Create a comprehensive architecture based on the idea description"
      );
    });
  });

  describe("generateRoadmapPrompt", () => {
    it("should generate a prompt with idea text", () => {
      const prompt = generateRoadmapPrompt(baseContext);

      expect(prompt).toContain(baseContext.ideaText);
      expect(prompt).toContain("Project Roadmap");
      expect(prompt).toContain("Milestones");
      expect(prompt).toContain("Feature Prioritization");
      expect(prompt).toContain("MoSCoW");
      expect(prompt).toContain("Dependencies & Blockers");
      expect(prompt).toContain("Resource Considerations");
      expect(prompt).toContain("Risk Mitigation Strategies");
      expect(prompt).toContain("Success Criteria per Milestone");
      expect(prompt).toContain("Go-to-Market Strategy");
    });

    it("should explicitly instruct to avoid specific dates and timeframes", () => {
      const prompt = generateRoadmapPrompt(baseContext);

      expect(prompt).toContain("DO NOT include specific dates");
      expect(prompt).toContain("NO DATES OR TIMEFRAMES");
      expect(prompt).toContain("focus on logical ordering");
      expect(prompt).toContain(
        "user will determine their own timeline based on their team's velocity"
      );
    });

    it("should include existing PRD and technical design when provided", () => {
      const contextWithDocs: DocumentGenerationContext = {
        ...baseContext,
        existingPRD: "# PRD\n\n## Features\nUser auth, matching...",
        existingTechnicalDesign:
          "# Technical Design\n\n## Stack\nNext.js, PostgreSQL...",
      };

      const prompt = generateRoadmapPrompt(contextWithDocs);

      expect(prompt).toContain("EXISTING PRD");
      expect(prompt).toContain(contextWithDocs.existingPRD!);
      expect(prompt).toContain("EXISTING TECHNICAL DESIGN");
      expect(prompt).toContain(contextWithDocs.existingTechnicalDesign!);
      expect(prompt).toContain(
        "Ensure milestones align with PRD priorities and technical design constraints"
      );
    });

    it("should work without existing documents", () => {
      const prompt = generateRoadmapPrompt(baseContext);

      expect(prompt).toContain("No PRD or Technical Design available yet");
      expect(prompt).toContain(
        "Create a roadmap based on the idea description and typical product development best practices"
      );
    });
  });

  describe("Prompt Structure", () => {
    it("all prompts should have role context", () => {
      const prdPrompt = generatePRDPrompt(baseContext);
      const techPrompt = generateTechnicalDesignPrompt(baseContext);
      const archPrompt = generateArchitecturePrompt(baseContext);
      const roadmapPrompt = generateRoadmapPrompt(baseContext);

      expect(prdPrompt).toContain("=== ROLE CONTEXT ===");
      expect(techPrompt).toContain("=== ROLE CONTEXT ===");
      expect(archPrompt).toContain("=== ROLE CONTEXT ===");
      expect(roadmapPrompt).toContain("=== ROLE CONTEXT ===");
    });

    it("all prompts should have task description", () => {
      const prdPrompt = generatePRDPrompt(baseContext);
      const techPrompt = generateTechnicalDesignPrompt(baseContext);
      const archPrompt = generateArchitecturePrompt(baseContext);
      const roadmapPrompt = generateRoadmapPrompt(baseContext);

      expect(prdPrompt).toContain("=== TASK ===");
      expect(techPrompt).toContain("=== TASK ===");
      expect(archPrompt).toContain("=== TASK ===");
      expect(roadmapPrompt).toContain("=== TASK ===");
    });

    it("all prompts should have output format specification", () => {
      const prdPrompt = generatePRDPrompt(baseContext);
      const techPrompt = generateTechnicalDesignPrompt(baseContext);
      const archPrompt = generateArchitecturePrompt(baseContext);
      const roadmapPrompt = generateRoadmapPrompt(baseContext);

      expect(prdPrompt).toContain("=== OUTPUT FORMAT ===");
      expect(techPrompt).toContain("=== OUTPUT FORMAT ===");
      expect(archPrompt).toContain("=== OUTPUT FORMAT ===");
      expect(roadmapPrompt).toContain("=== OUTPUT FORMAT ===");
    });

    it("all prompts should have guidelines", () => {
      const prdPrompt = generatePRDPrompt(baseContext);
      const techPrompt = generateTechnicalDesignPrompt(baseContext);
      const archPrompt = generateArchitecturePrompt(baseContext);
      const roadmapPrompt = generateRoadmapPrompt(baseContext);

      expect(prdPrompt).toContain("=== GUIDELINES ===");
      expect(techPrompt).toContain("=== GUIDELINES ===");
      expect(archPrompt).toContain("=== GUIDELINES ===");
      expect(roadmapPrompt).toContain("=== GUIDELINES ===");
    });

    it("all prompts should specify Markdown output", () => {
      const prdPrompt = generatePRDPrompt(baseContext);
      const techPrompt = generateTechnicalDesignPrompt(baseContext);
      const archPrompt = generateArchitecturePrompt(baseContext);
      const roadmapPrompt = generateRoadmapPrompt(baseContext);

      expect(prdPrompt).toContain("Markdown");
      expect(techPrompt).toContain("Markdown");
      expect(archPrompt).toContain("Markdown");
      expect(roadmapPrompt).toContain("Markdown");
    });
  });

  describe("Context Handling", () => {
    it("should handle all context fields correctly", () => {
      const fullContext: DocumentGenerationContext = {
        ideaText: "Test idea",
        analysisScores: { test: 5 },
        analysisFeedback: "Test feedback",
        existingPRD: "Test PRD",
        existingTechnicalDesign: "Test Tech Design",
        existingArchitecture: "Test Architecture",
      };

      const prdPrompt = generatePRDPrompt(fullContext);
      const techPrompt = generateTechnicalDesignPrompt(fullContext);
      const archPrompt = generateArchitecturePrompt(fullContext);
      const roadmapPrompt = generateRoadmapPrompt(fullContext);

      // PRD should use idea, scores, and feedback
      expect(prdPrompt).toContain("Test idea");
      expect(prdPrompt).toContain("Test feedback");

      // Technical Design should use idea and PRD
      expect(techPrompt).toContain("Test idea");
      expect(techPrompt).toContain("Test PRD");

      // Architecture should use idea and technical design
      expect(archPrompt).toContain("Test idea");
      expect(archPrompt).toContain("Test Tech Design");

      // Roadmap should use idea, PRD, and technical design
      expect(roadmapPrompt).toContain("Test idea");
      expect(roadmapPrompt).toContain("Test PRD");
      expect(roadmapPrompt).toContain("Test Tech Design");
    });
  });
});
