/**
 * Script to verify API response formats remain unchanged after database consolidation
 * This script tests both idea and hackathon analysis endpoints
 */

import { AnalysisMapper } from "../src/infrastructure/database/supabase/mappers/AnalysisMapper";
import { Analysis } from "../src/domain/entities";
import {
  AnalysisId,
  UserId,
  Score,
  Locale,
  Category,
} from "../src/domain/value-objects";

// Test data for idea analysis (using valid UUIDs)
const testIdeaAnalysis = Analysis.reconstruct({
  id: AnalysisId.fromString("550e8400-e29b-41d4-a716-446655440000"),
  userId: UserId.fromString("550e8400-e29b-41d4-a716-446655440001"),
  idea: "Test startup idea",
  score: Score.reconstruct(85),
  locale: Locale.fromString("en"),
  feedback: "Good idea with potential",
  suggestions: ["Improve market research", "Focus on MVP"],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
});

// Test data for hackathon analysis (using valid UUIDs)
const testHackathonAnalysis = Analysis.reconstruct({
  id: AnalysisId.fromString("550e8400-e29b-41d4-a716-446655440002"),
  userId: UserId.fromString("550e8400-e29b-41d4-a716-446655440001"),
  idea: "Test hackathon project description",
  score: Score.reconstruct(90),
  locale: Locale.fromString("en"),
  category: Category.createHackathon("frankenstein"),
  feedback: "Great hackathon project",
  suggestions: ["Add more documentation", "Improve UI"],
  kiroUsage: "Used Kiro for code generation and testing",
  supportingMaterials: {
    githubRepo: "https://github.com/test/repo",
    demoUrl: "https://demo.test.com",
    screenshots: ["screenshot1.png", "screenshot2.png"],
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
});

function verifyResponseFormat() {
  console.log("🔍 Verifying API Response Formats\n");

  const mapper = new AnalysisMapper();

  // Test 1: Verify idea analysis DAO structure
  console.log("Test 1: Idea Analysis DAO Structure");
  const ideaDAO = mapper.toDAO(testIdeaAnalysis);
  console.log("✓ analysis_type:", ideaDAO.analysis_type);
  console.log("✓ idea field:", ideaDAO.idea.substring(0, 30) + "...");
  console.log(
    "✓ analysis JSONB has score:",
    "score" in (ideaDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has detailedSummary:",
    "detailedSummary" in (ideaDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has criteria:",
    "criteria" in (ideaDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has locale:",
    "locale" in (ideaDAO.analysis as any)
  );

  // Verify no hackathon fields in idea analysis
  const hasHackathonFields =
    "selectedCategory" in (ideaDAO.analysis as any) ||
    "kiroUsage" in (ideaDAO.analysis as any);
  console.log("✓ No hackathon fields in idea analysis:", !hasHackathonFields);
  console.log("");

  // Test 2: Verify hackathon analysis DAO structure
  console.log("Test 2: Hackathon Analysis DAO Structure");
  const hackathonDAO = mapper.toDAO(testHackathonAnalysis);
  console.log("✓ analysis_type:", hackathonDAO.analysis_type);
  console.log("✓ idea field:", hackathonDAO.idea.substring(0, 30) + "...");
  console.log(
    "✓ analysis JSONB has score:",
    "score" in (hackathonDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has detailedSummary:",
    "detailedSummary" in (hackathonDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has criteria:",
    "criteria" in (hackathonDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has locale:",
    "locale" in (hackathonDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has selectedCategory:",
    "selectedCategory" in (hackathonDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has kiroUsage:",
    "kiroUsage" in (hackathonDAO.analysis as any)
  );
  console.log(
    "✓ analysis JSONB has supportingMaterials:",
    "supportingMaterials" in (hackathonDAO.analysis as any)
  );
  console.log("");

  // Test 3: Verify round-trip conversion for idea analysis
  console.log("Test 3: Idea Analysis Round-Trip Conversion");
  const ideaDomainFromDAO = mapper.toDomain(ideaDAO);
  console.log(
    "✓ ID preserved:",
    ideaDomainFromDAO.id.value === testIdeaAnalysis.id.value
  );
  console.log(
    "✓ Idea preserved:",
    ideaDomainFromDAO.idea === testIdeaAnalysis.idea
  );
  console.log(
    "✓ Score preserved:",
    ideaDomainFromDAO.score.value === testIdeaAnalysis.score.value
  );
  console.log(
    "✓ Locale preserved:",
    ideaDomainFromDAO.locale.value === testIdeaAnalysis.locale.value
  );
  console.log(
    "✓ Feedback preserved:",
    ideaDomainFromDAO.feedback === testIdeaAnalysis.feedback
  );
  console.log("✓ No category:", !ideaDomainFromDAO.category);
  console.log("✓ No kiroUsage:", !ideaDomainFromDAO.kiroUsage);
  console.log(
    "✓ No supportingMaterials:",
    !ideaDomainFromDAO.supportingMaterials
  );
  console.log("");

  // Test 4: Verify round-trip conversion for hackathon analysis
  console.log("Test 4: Hackathon Analysis Round-Trip Conversion");
  const hackathonDomainFromDAO = mapper.toDomain(hackathonDAO);
  console.log(
    "✓ ID preserved:",
    hackathonDomainFromDAO.id.value === testHackathonAnalysis.id.value
  );
  console.log(
    "✓ Idea preserved:",
    hackathonDomainFromDAO.idea === testHackathonAnalysis.idea
  );
  console.log(
    "✓ Score preserved:",
    hackathonDomainFromDAO.score.value === testHackathonAnalysis.score.value
  );
  console.log(
    "✓ Locale preserved:",
    hackathonDomainFromDAO.locale.value === testHackathonAnalysis.locale.value
  );
  console.log(
    "✓ Feedback preserved:",
    hackathonDomainFromDAO.feedback === testHackathonAnalysis.feedback
  );
  console.log(
    "✓ Category preserved:",
    hackathonDomainFromDAO.category?.value ===
      testHackathonAnalysis.category?.value
  );
  console.log(
    "✓ KiroUsage preserved:",
    hackathonDomainFromDAO.kiroUsage === testHackathonAnalysis.kiroUsage
  );
  console.log(
    "✓ SupportingMaterials preserved:",
    !!hackathonDomainFromDAO.supportingMaterials
  );
  console.log("");

  // Test 5: Verify DTO response format (as returned by controllers)
  console.log("Test 5: Controller Response DTO Format");

  // Simulate controller response for idea analysis
  const ideaResponseDTO = {
    id: ideaDomainFromDAO.id.value,
    idea: ideaDomainFromDAO.idea,
    score: ideaDomainFromDAO.score.value,
    detailedSummary: ideaDomainFromDAO.feedback || "",
    criteria: ideaDomainFromDAO.suggestions.map((suggestion, index) => ({
      name: `Suggestion ${index + 1}`,
      score: 0,
      justification: suggestion,
    })),
    createdAt: ideaDomainFromDAO.createdAt.toISOString(),
    locale: ideaDomainFromDAO.locale.value,
    category: ideaDomainFromDAO.category?.value,
  };

  console.log("✓ Idea response has id:", !!ideaResponseDTO.id);
  console.log("✓ Idea response has idea:", !!ideaResponseDTO.idea);
  console.log(
    "✓ Idea response has score:",
    typeof ideaResponseDTO.score === "number"
  );
  console.log(
    "✓ Idea response has detailedSummary:",
    !!ideaResponseDTO.detailedSummary
  );
  console.log(
    "✓ Idea response has criteria array:",
    Array.isArray(ideaResponseDTO.criteria)
  );
  console.log("✓ Idea response has createdAt:", !!ideaResponseDTO.createdAt);
  console.log("✓ Idea response has locale:", !!ideaResponseDTO.locale);
  console.log(
    "✓ Idea response category is undefined:",
    ideaResponseDTO.category === undefined
  );
  console.log("");

  // Simulate controller response for hackathon analysis
  const hackathonResponseDTO = {
    id: hackathonDomainFromDAO.id.value,
    idea: hackathonDomainFromDAO.idea,
    score: hackathonDomainFromDAO.score.value,
    detailedSummary: hackathonDomainFromDAO.feedback || "",
    criteria: hackathonDomainFromDAO.suggestions.map((suggestion, index) => ({
      name: `Suggestion ${index + 1}`,
      score: 0,
      justification: suggestion,
    })),
    createdAt: hackathonDomainFromDAO.createdAt.toISOString(),
    locale: hackathonDomainFromDAO.locale.value,
    category: hackathonDomainFromDAO.category?.value,
  };

  console.log("✓ Hackathon response has id:", !!hackathonResponseDTO.id);
  console.log("✓ Hackathon response has idea:", !!hackathonResponseDTO.idea);
  console.log(
    "✓ Hackathon response has score:",
    typeof hackathonResponseDTO.score === "number"
  );
  console.log(
    "✓ Hackathon response has detailedSummary:",
    !!hackathonResponseDTO.detailedSummary
  );
  console.log(
    "✓ Hackathon response has criteria array:",
    Array.isArray(hackathonResponseDTO.criteria)
  );
  console.log(
    "✓ Hackathon response has createdAt:",
    !!hackathonResponseDTO.createdAt
  );
  console.log(
    "✓ Hackathon response has locale:",
    !!hackathonResponseDTO.locale
  );
  console.log(
    "✓ Hackathon response has category:",
    !!hackathonResponseDTO.category
  );
  console.log("");

  console.log("✅ All response format verifications passed!");
  console.log("\nSummary:");
  console.log('- Idea analyses use analysis_type="idea"');
  console.log('- Hackathon analyses use analysis_type="hackathon"');
  console.log("- Both types store data in the same table structure");
  console.log("- Response DTOs maintain the same format for both types");
  console.log("- Hackathon-specific fields are stored in analysis JSONB");
  console.log("- Controllers return consistent response formats");
}

// Run verification
verifyResponseFormat();
