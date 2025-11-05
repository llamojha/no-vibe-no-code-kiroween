import type { SupportedLocale } from "@/features/locale/translations";
import type { HackathonAnalysis, ProjectSubmission } from "@/lib/types";
import { getGenAiClient } from "@/lib/server/ai/client";
import { getHackathonAnalysisPrompt } from "@/lib/server/ai/hackathonPrompts";
import { analyzeProjectCategories } from "@/features/kiroween-analyzer/utils/categoryMatcher";
import { analyzeCriteria } from "@/features/kiroween-analyzer/utils/hackathonScoring";

interface CategoryEvaluation {
  category: string;
  fitScore: number;
  improvementSuggestions: string[];
}

interface CategoryAnalysis {
  bestMatch: string;
  evaluations: CategoryEvaluation[];
}

interface CriteriaScore {
  name: string;
  score: number;
}

interface CriteriaAnalysis {
  finalScore: number;
  finalScoreExplanation: string;
  scores: CriteriaScore[];
}

interface ImprovementSuggestion {
  title: string;
  description: string;
}

interface NextStep {
  title: string;
  description: string;
}

export const analyzeHackathonProject = async (
  submission: ProjectSubmission,
  locale: SupportedLocale
): Promise<HackathonAnalysis> => {
  const ai = getGenAiClient();

  try {
    // Get AI analysis
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: getHackathonAnalysisPrompt(submission, locale),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const rawText = response.text?.trim() ?? "";
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    // Parse JSON response
    const markdownMatch = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    let jsonText =
      markdownMatch && markdownMatch[2] ? markdownMatch[2] : rawText;

    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    const aiAnalysis = JSON.parse(jsonText);

    // Generate local category and criteria analysis as fallback/validation
    const localCategoryAnalysis = analyzeProjectCategories(submission);
    const localCriteriaAnalysis = analyzeCriteria(submission);

    // Merge AI analysis with local analysis, preferring AI but using local as fallback
    const hackathonAnalysis: HackathonAnalysis = {
      // Core analysis fields from AI
      detailedSummary:
        aiAnalysis.detailedSummary ||
        generateFallbackDetailedSummary(
          submission,
          localCategoryAnalysis,
          localCriteriaAnalysis
        ),
      viabilitySummary:
        aiAnalysis.viabilitySummary ||
        generateFallbackViabilitySummary(localCriteriaAnalysis),
      scoringRubric:
        aiAnalysis.scoringRubric ||
        localCriteriaAnalysis.scores.map((score) => ({
          name: score.name,
          score: score.score,
          justification: `${score.name} scored ${score.score}/5 based on project analysis`,
        })),
      competitors: aiAnalysis.competitors || [],
      improvementSuggestions: aiAnalysis.improvementSuggestions || [],
      nextSteps: aiAnalysis.nextSteps || [],
      finalScore: aiAnalysis.finalScore || localCriteriaAnalysis.finalScore,
      finalScoreExplanation:
        aiAnalysis.finalScoreExplanation ||
        localCriteriaAnalysis.finalScoreExplanation,

      // Hackathon-specific analysis
      categoryAnalysis: aiAnalysis.categoryAnalysis || localCategoryAnalysis,
      criteriaAnalysis: aiAnalysis.criteriaAnalysis || localCriteriaAnalysis,
      hackathonSpecificAdvice: aiAnalysis.hackathonSpecificAdvice || {
        categoryOptimization: generateCategoryOptimizationAdvice(
          submission,
          localCategoryAnalysis
        ),
        kiroIntegrationTips: generateKiroIntegrationTips(submission),
        competitionStrategy: generateCompetitionStrategy(
          submission,
          localCriteriaAnalysis
        ),
      },
    };

    return hackathonAnalysis;
  } catch (error) {
    console.error("Error calling Gemini API for hackathon analysis:", error);

    // Fallback to local analysis if AI fails
    console.log("Falling back to local analysis due to AI error");
    return generateFallbackAnalysis(submission);
  }
};

/**
 * Generates a complete fallback analysis using local utilities when AI fails
 */
function generateFallbackAnalysis(
  submission: ProjectSubmission
): HackathonAnalysis {
  const categoryAnalysis = analyzeProjectCategories(submission);
  const criteriaAnalysis = analyzeCriteria(submission);

  return {
    detailedSummary: generateFallbackDetailedSummary(
      submission,
      categoryAnalysis,
      criteriaAnalysis
    ),
    viabilitySummary: generateFallbackViabilitySummary(criteriaAnalysis),
    scoringRubric: criteriaAnalysis.scores.map((score) => ({
      name: score.name,
      score: score.score,
      justification: `${score.name} scored ${score.score}/5 based on project analysis`,
    })),
    competitors: [],
    improvementSuggestions: generateFallbackImprovementSuggestions(
      categoryAnalysis,
      criteriaAnalysis
    ),
    nextSteps: generateFallbackNextSteps(submission, criteriaAnalysis),
    finalScore: criteriaAnalysis.finalScore,
    finalScoreExplanation: criteriaAnalysis.finalScoreExplanation,
    categoryAnalysis,
    criteriaAnalysis,
    hackathonSpecificAdvice: {
      categoryOptimization: generateCategoryOptimizationAdvice(
        submission,
        categoryAnalysis
      ),
      kiroIntegrationTips: generateKiroIntegrationTips(submission),
      competitionStrategy: generateCompetitionStrategy(
        submission,
        criteriaAnalysis
      ),
    },
  };
}

/**
 * Generates fallback detailed summary
 */
function generateFallbackDetailedSummary(
  submission: ProjectSubmission,
  categoryAnalysis: CategoryAnalysis,
  criteriaAnalysis: CriteriaAnalysis
): string {
  const bestCategory = categoryAnalysis.bestMatch;
  const bestCategoryScore =
    categoryAnalysis.evaluations.find((e) => e.category === bestCategory)
      ?.fitScore || 0;

  return `This hackathon project demonstrates ${
    criteriaAnalysis.finalScore >= 4
      ? "strong"
      : criteriaAnalysis.finalScore >= 3
      ? "good"
      : "moderate"
  } potential for the Kiroween competition. The project aligns best with the ${bestCategory.replace(
    "-",
    " "
  )} category (${bestCategoryScore}/10 fit score) and achieves an overall score of ${
    criteriaAnalysis.finalScore
  }/5 across all judging criteria. Key strengths include ${criteriaAnalysis.scores
    .reduce((max, score) => (score.score > max.score ? score : max))
    .name.toLowerCase()} (${
    criteriaAnalysis.scores.reduce((max, score) =>
      score.score > max.score ? score : max
    ).score
  }/5). The project shows ${
    submission.kiroUsage.length > 100 ? "detailed" : "basic"
  } integration with Kiro's capabilities and ${
    submission.description.length > 200 ? "comprehensive" : "concise"
  } problem-solving approach.`;
}

/**
 * Generates fallback viability summary
 */
function generateFallbackViabilitySummary(
  criteriaAnalysis: CriteriaAnalysis
): string {
  const score = criteriaAnalysis.finalScore;
  if (score >= 4.5) {
    return `Excellent hackathon viability with a ${score}/5 final score. This project demonstrates exceptional potential across all evaluation criteria and is well-positioned for competition success.`;
  } else if (score >= 3.5) {
    return `Strong hackathon viability with a ${score}/5 final score. This project shows solid potential with notable strengths and good competitive positioning.`;
  } else if (score >= 2.5) {
    return `Moderate hackathon viability with a ${score}/5 final score. This project has potential but would benefit from focused improvements in key areas.`;
  } else {
    return `Limited hackathon viability with a ${score}/5 final score. This project requires significant enhancements to be competitive in the hackathon.`;
  }
}

/**
 * Generates fallback improvement suggestions
 */
function generateFallbackImprovementSuggestions(
  categoryAnalysis: CategoryAnalysis,
  criteriaAnalysis: CriteriaAnalysis
): ImprovementSuggestion[] {
  const suggestions = [];

  // Category-based suggestions
  const bestCategory = categoryAnalysis.evaluations.find(
    (e) => e.category === categoryAnalysis.bestMatch
  );
  if (bestCategory && bestCategory.improvementSuggestions.length > 0) {
    suggestions.push({
      title: `Enhance ${bestCategory.category.replace(
        "-",
        " "
      )} Category Alignment`,
      description: bestCategory.improvementSuggestions[0],
    });
  }

  // Criteria-based suggestions
  const weakestCriteria = criteriaAnalysis.scores.reduce((min, score) =>
    score.score < min.score ? score : min
  );
  suggestions.push({
    title: `Improve ${weakestCriteria.name}`,
    description: `Focus on strengthening ${weakestCriteria.name.toLowerCase()} to boost your overall score from ${
      weakestCriteria.score
    }/5.`,
  });

  return suggestions;
}

/**
 * Generates fallback next steps
 */
function generateFallbackNextSteps(
  submission: ProjectSubmission,
  criteriaAnalysis: CriteriaAnalysis
): NextStep[] {
  const steps = [];

  // Always include demo preparation
  steps.push({
    title: "Prepare Demo Materials",
    description:
      "Create compelling screenshots, demo videos, or live demonstration materials to showcase your project effectively.",
  });

  // Add category-specific step
  const categorySteps: Record<string, NextStep> = {
    resurrection: {
      title: "Document Legacy Technology Revival",
      description:
        "Clearly document the obsolete technology you're reviving and the modern innovations you're applying.",
    },
    frankenstein: {
      title: "Highlight Technology Integration",
      description:
        "Emphasize the technical challenges overcome in combining incompatible technologies.",
    },
    "skeleton-crew": {
      title: "Demonstrate Flexibility",
      description:
        "Show multiple use cases and extension points to highlight your project's foundational nature.",
    },
    "costume-contest": {
      title: "Polish Visual Design",
      description:
        "Focus on UI refinement and Halloween-themed visual elements to maximize design impact.",
    },
  };

  if (categorySteps[submission.selectedCategory]) {
    steps.push(categorySteps[submission.selectedCategory]);
  }

  // Add improvement step based on weakest criteria
  const weakestCriteria = criteriaAnalysis.scores.reduce((min, score) =>
    score.score < min.score ? score : min
  );
  steps.push({
    title: `Strengthen ${weakestCriteria.name}`,
    description: `Focus development efforts on improving ${weakestCriteria.name.toLowerCase()} aspects of your project.`,
  });

  return steps;
}

/**
 * Generates category optimization advice
 */
function generateCategoryOptimizationAdvice(
  submission: ProjectSubmission,
  categoryAnalysis: CategoryAnalysis
): string[] {
  const bestCategory = categoryAnalysis.evaluations.find(
    (e) => e.category === categoryAnalysis.bestMatch
  );
  const advice = [];

  if (bestCategory && bestCategory.improvementSuggestions.length > 0) {
    advice.push(...bestCategory.improvementSuggestions.slice(0, 2));
  }

  // Add general category advice
  const categoryAdvice: Record<string, string> = {
    resurrection:
      "Emphasize the historical significance of the technology you're reviving and the modern value it provides.",
    frankenstein:
      "Highlight the technical complexity and innovation required to integrate disparate technologies.",
    "skeleton-crew":
      "Focus on demonstrating the extensibility and multiple use cases of your foundational approach.",
    "costume-contest":
      "Prioritize visual polish, user experience, and Halloween-themed design elements.",
  };

  if (categoryAdvice[submission.selectedCategory]) {
    advice.push(categoryAdvice[submission.selectedCategory]);
  }

  return advice;
}

/**
 * Generates Kiro integration tips
 */
function generateKiroIntegrationTips(submission: ProjectSubmission): string[] {
  const tips = [];
  const kiroUsage = submission.kiroUsage.toLowerCase();

  if (!kiroUsage.includes("agent")) {
    tips.push(
      "Consider leveraging Kiro's agent capabilities for more sophisticated automation and workflow integration."
    );
  }

  if (!kiroUsage.includes("tool") && !kiroUsage.includes("function")) {
    tips.push(
      "Explore Kiro's tool and function calling capabilities to extend your project's functionality."
    );
  }

  if (!kiroUsage.includes("mcp")) {
    tips.push(
      "Investigate Model Context Protocol (MCP) integration for enhanced AI model connectivity and data access."
    );
  }

  if (tips.length === 0) {
    tips.push(
      "Document the strategic reasoning behind your Kiro feature choices to demonstrate deeper understanding."
    );
    tips.push(
      "Consider how additional Kiro capabilities could enhance your project's core functionality."
    );
  }

  return tips;
}

/**
 * Generates competition strategy advice
 */
function generateCompetitionStrategy(
  submission: ProjectSubmission,
  criteriaAnalysis: CriteriaAnalysis
): string[] {
  const strategy = [];
  const score = criteriaAnalysis.finalScore;

  if (score >= 4) {
    strategy.push(
      "Focus on polishing your presentation and demo to highlight your project's strong technical foundation."
    );
    strategy.push(
      "Prepare to discuss the strategic decisions behind your Kiro integration approach."
    );
  } else if (score >= 3) {
    strategy.push(
      "Identify and address the weakest scoring criteria to boost your competitive position."
    );
    strategy.push(
      "Develop compelling use case scenarios that demonstrate practical value."
    );
  } else {
    strategy.push(
      "Prioritize fundamental improvements in your lowest-scoring criteria areas."
    );
    strategy.push(
      "Consider pivoting focus to your strongest category alignment for maximum impact."
    );
  }

  // Always include presentation advice
  strategy.push(
    "Prepare a clear, concise demo that showcases your project's unique value proposition within the hackathon context."
  );

  return strategy;
}
