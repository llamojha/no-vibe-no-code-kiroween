import {
  CriteriaScore,
  CriteriaAnalysis,
  ProjectSubmission,
} from "@/lib/types";

/**
 * Scoring criteria definitions for hackathon evaluation
 */
const SCORING_CRITERIA = {
  "Potential Value": {
    description:
      "Market uniqueness, UI intuitiveness, and scalability potential",
    subCriteria: {
      marketUniqueness: {
        name: "Market Uniqueness",
        weight: 0.4,
        description:
          "How unique and differentiated the solution is in the market",
      },
      uiIntuitiveness: {
        name: "UI Intuitiveness",
        weight: 0.3,
        description: "How intuitive and user-friendly the interface design is",
      },
      scalability: {
        name: "Scalability",
        weight: 0.3,
        description: "Potential for growth and expansion of the solution",
      },
    },
  },
  Implementation: {
    description:
      "Variety of Kiro features used, depth of understanding, and strategic integration",
    subCriteria: {
      kiroFeaturesVariety: {
        name: "Kiro Features Variety",
        weight: 0.4,
        description: "Breadth and variety of Kiro features utilized",
      },
      depthOfUnderstanding: {
        name: "Depth of Understanding",
        weight: 0.3,
        description:
          "Demonstrated understanding of Kiro capabilities and limitations",
      },
      strategicIntegration: {
        name: "Strategic Integration",
        weight: 0.3,
        description:
          "How strategically and thoughtfully Kiro is integrated into the solution",
      },
    },
  },
  "Quality and Design": {
    description: "Creativity, originality, and polish of the solution",
    subCriteria: {
      creativity: {
        name: "Creativity",
        weight: 0.4,
        description: "Creative and innovative approach to problem-solving",
      },
      originality: {
        name: "Originality",
        weight: 0.3,
        description: "Uniqueness and originality of the concept and execution",
      },
      polish: {
        name: "Polish",
        weight: 0.3,
        description:
          "Overall quality, attention to detail, and professional finish",
      },
    },
  },
} as const;

/**
 * Evaluates Potential Value criteria
 */
function evaluatePotentialValue(submission: ProjectSubmission): CriteriaScore {
  const projectText = submission.description.toLowerCase();

  // Market Uniqueness (1-5 scale)
  const marketUniqueness = evaluateMarketUniqueness(projectText);

  // UI Intuitiveness (1-5 scale)
  const uiIntuitiveness = evaluateUIIntuitiveness(
    projectText,
    submission.supportingMaterials
  );

  // Scalability (1-5 scale)
  const scalability = evaluateScalability(projectText);

  // Calculate weighted average
  const weights = SCORING_CRITERIA["Potential Value"].subCriteria;
  const score =
    Math.round(
      (marketUniqueness * weights.marketUniqueness.weight +
        uiIntuitiveness * weights.uiIntuitiveness.weight +
        scalability * weights.scalability.weight) *
        10
    ) / 10;

  const subScores = {
    "Market Uniqueness": {
      score: marketUniqueness,
      explanation: generateMarketUniquenessExplanation(
        marketUniqueness,
        projectText
      ),
    },
    "UI Intuitiveness": {
      score: uiIntuitiveness,
      explanation: generateUIIntuitivenessExplanation(
        uiIntuitiveness,
        projectText,
        submission.supportingMaterials
      ),
    },
    Scalability: {
      score: scalability,
      explanation: generateScalabilityExplanation(scalability, projectText),
    },
  };

  const justification = generatePotentialValueJustification(score, subScores);

  return {
    name: "Potential Value",
    score,
    justification,
    subScores,
  };
}

/**
 * Evaluates Implementation criteria
 */
function evaluateImplementation(submission: ProjectSubmission): CriteriaScore {
  const projectText = submission.description.toLowerCase();

  // Technical Features Variety (1-5 scale)
  const kiroFeaturesVariety = evaluateKiroFeaturesVariety(projectText);

  // Depth of Understanding (1-5 scale)
  const depthOfUnderstanding = evaluateDepthOfUnderstanding(projectText);

  // Strategic Integration (1-5 scale)
  const strategicIntegration = evaluateStrategicIntegration(projectText);

  // Calculate weighted average
  const weights = SCORING_CRITERIA["Implementation"].subCriteria;
  const score =
    Math.round(
      (kiroFeaturesVariety * weights.kiroFeaturesVariety.weight +
        depthOfUnderstanding * weights.depthOfUnderstanding.weight +
        strategicIntegration * weights.strategicIntegration.weight) *
        10
    ) / 10;

  const subScores = {
    "Kiro Features Variety": {
      score: kiroFeaturesVariety,
      explanation: generateKiroFeaturesExplanation(
        kiroFeaturesVariety,
        projectText
      ),
    },
    "Depth of Understanding": {
      score: depthOfUnderstanding,
      explanation: generateDepthExplanation(depthOfUnderstanding, projectText),
    },
    "Strategic Integration": {
      score: strategicIntegration,
      explanation: generateStrategicIntegrationExplanation(
        strategicIntegration,
        projectText
      ),
    },
  };

  const justification = generateImplementationJustification(score, subScores);

  return {
    name: "Implementation",
    score,
    justification,
    subScores,
  };
}

/**
 * Evaluates Quality and Design criteria
 */
function evaluateQualityAndDesign(
  submission: ProjectSubmission
): CriteriaScore {
  const projectText = submission.description.toLowerCase();

  // Creativity (1-5 scale)
  const creativity = evaluateCreativity(projectText);

  // Originality (1-5 scale)
  const originality = evaluateOriginality(projectText);

  // Polish (1-5 scale)
  const polish = evaluatePolish(projectText, submission.supportingMaterials);

  // Calculate weighted average
  const weights = SCORING_CRITERIA["Quality and Design"].subCriteria;
  const score =
    Math.round(
      (creativity * weights.creativity.weight +
        originality * weights.originality.weight +
        polish * weights.polish.weight) *
        10
    ) / 10;

  const subScores = {
    Creativity: {
      score: creativity,
      explanation: generateCreativityExplanation(creativity, projectText),
    },
    Originality: {
      score: originality,
      explanation: generateOriginalityExplanation(originality, projectText),
    },
    Polish: {
      score: polish,
      explanation: generatePolishExplanation(
        polish,
        projectText,
        submission.supportingMaterials
      ),
    },
  };

  const justification = generateQualityDesignJustification(score, subScores);

  return {
    name: "Quality and Design",
    score,
    justification,
    subScores,
  };
}

// Individual scoring functions

function evaluateMarketUniqueness(projectText: string): number {
  let score = 3; // Base score

  // Check for uniqueness indicators
  const uniquenessTerms = [
    "unique",
    "novel",
    "first",
    "innovative",
    "unprecedented",
    "new approach",
  ];
  const uniquenessCount = uniquenessTerms.filter((term) =>
    projectText.includes(term)
  ).length;
  score += Math.min(uniquenessCount * 0.3, 1);

  // Check for market differentiation
  const differentiationTerms = [
    "different",
    "unlike",
    "alternative",
    "better than",
    "improvement",
  ];
  if (differentiationTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Check for problem-solving focus
  const problemTerms = ["problem", "issue", "challenge", "pain point", "solve"];
  if (problemTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  return Math.min(Math.max(score, 1), 5);
}

function evaluateUIIntuitiveness(
  projectText: string,
  supportingMaterials?: ProjectSubmission["supportingMaterials"]
): number {
  let score = 2.5; // Base score

  // Check for UI/UX focus
  const uiTerms = [
    "ui",
    "ux",
    "user interface",
    "user experience",
    "intuitive",
    "easy to use",
    "user-friendly",
  ];
  const uiCount = uiTerms.filter((term) => projectText.includes(term)).length;
  score += Math.min(uiCount * 0.4, 1.5);

  // Check for design considerations
  const designTerms = ["design", "visual", "interface", "layout", "navigation"];
  if (designTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Bonus for visual materials
  if (
    supportingMaterials?.screenshots?.length ||
    supportingMaterials?.demoLink
  ) {
    score += 0.5;
  }

  return Math.min(Math.max(score, 1), 5);
}

function evaluateScalability(projectText: string): number {
  let score = 2.5; // Base score

  // Check for scalability mentions
  const scalabilityTerms = [
    "scalable",
    "scale",
    "grow",
    "expand",
    "extensible",
    "modular",
  ];
  if (scalabilityTerms.some((term) => projectText.includes(term))) {
    score += 1;
  }

  // Check for architecture considerations
  const architectureTerms = [
    "architecture",
    "framework",
    "platform",
    "infrastructure",
    "system",
  ];
  if (architectureTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Check for future planning
  const futureTerms = ["future", "roadmap", "plan", "vision", "potential"];
  if (futureTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  return Math.min(Math.max(score, 1), 5);
}

function evaluateKiroFeaturesVariety(projectText: string): number {
  const technicalFeatures = [
    "agent",
    "tool",
    "function",
    "api",
    "integration",
    "automation",
    "workflow",
    "mcp",
    "context",
    "prompt",
    "model",
    "ai",
    "llm",
    "chat",
    "assistant",
    "feature",
    "implement",
  ];

  const mentionedFeatures = technicalFeatures.filter((feature) =>
    projectText.includes(feature)
  ).length;

  // Score based on variety of features mentioned
  if (mentionedFeatures >= 6) return 5;
  if (mentionedFeatures >= 4) return 4;
  if (mentionedFeatures >= 3) return 3;
  if (mentionedFeatures >= 2) return 2;
  return 1;
}

function evaluateDepthOfUnderstanding(projectText: string): number {
  let score = 2; // Base score

  // Check for detailed explanations
  const depthIndicators = [
    "because",
    "specifically",
    "detailed",
    "comprehensive",
    "in-depth",
  ];
  if (depthIndicators.some((indicator) => projectText.includes(indicator))) {
    score += 1;
  }

  // Check for technical understanding
  const technicalTerms = [
    "implementation",
    "architecture",
    "integration",
    "configuration",
    "setup",
  ];
  if (technicalTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Check for understanding of limitations/challenges
  const challengeTerms = [
    "challenge",
    "limitation",
    "consideration",
    "trade-off",
  ];
  if (challengeTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Length and detail bonus
  if (projectText.length > 200) {
    score += 0.5;
  }

  return Math.min(Math.max(score, 1), 5);
}

function evaluateStrategicIntegration(projectText: string): number {
  let score = 2.5; // Base score

  // Check for strategic thinking
  const strategyTerms = [
    "strategy",
    "approach",
    "methodology",
    "systematic",
    "strategic",
  ];
  if (strategyTerms.some((term) => projectText.includes(term))) {
    score += 1;
  }

  // Check for integration rationale
  const rationaleTerms = ["why", "reason", "benefit", "advantage", "purpose"];
  if (rationaleTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Check for workflow integration
  const workflowTerms = [
    "workflow",
    "process",
    "pipeline",
    "automation",
    "integration",
  ];
  if (workflowTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  return Math.min(Math.max(score, 1), 5);
}

function evaluateCreativity(projectText: string): number {
  let score = 2.5; // Base score

  // Check for creative language
  const creativityTerms = [
    "creative",
    "innovative",
    "novel",
    "unique",
    "original",
    "inventive",
  ];
  const creativityCount = creativityTerms.filter((term) =>
    projectText.includes(term)
  ).length;
  score += Math.min(creativityCount * 0.3, 1);

  // Check for unconventional approaches
  const unconventionalTerms = [
    "unconventional",
    "different",
    "alternative",
    "new way",
    "fresh",
  ];
  if (unconventionalTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Check for problem-solving creativity
  const problemSolvingTerms = [
    "solution",
    "solve",
    "approach",
    "method",
    "technique",
  ];
  if (problemSolvingTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  return Math.min(Math.max(score, 1), 5);
}

function evaluateOriginality(projectText: string): number {
  let score = 3; // Base score

  // Check for originality claims
  const originalityTerms = [
    "original",
    "first",
    "never been done",
    "unprecedented",
    "groundbreaking",
  ];
  if (originalityTerms.some((term) => projectText.includes(term))) {
    score += 1;
  }

  // Check for unique combinations
  const combinationTerms = ["combine", "merge", "fusion", "hybrid", "mix"];
  if (combinationTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Penalty for common/generic descriptions
  const genericTerms = ["simple", "basic", "standard", "typical", "common"];
  if (genericTerms.some((term) => projectText.includes(term))) {
    score -= 0.5;
  }

  return Math.min(Math.max(score, 1), 5);
}

function evaluatePolish(
  projectText: string,
  supportingMaterials?: ProjectSubmission["supportingMaterials"]
): number {
  let score = 2; // Base score

  // Check for polish indicators
  const polishTerms = [
    "polished",
    "refined",
    "professional",
    "high-quality",
    "well-designed",
  ];
  if (polishTerms.some((term) => projectText.includes(term))) {
    score += 1;
  }

  // Check for attention to detail
  const detailTerms = [
    "detail",
    "careful",
    "thorough",
    "complete",
    "comprehensive",
  ];
  if (detailTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  // Bonus for supporting materials
  if (supportingMaterials?.screenshots?.length) {
    score += 0.5;
  }
  if (supportingMaterials?.demoLink) {
    score += 0.5;
  }
  if (supportingMaterials?.additionalNotes) {
    score += 0.25;
  }

  // Quality of description (length and structure)
  if (projectText.length > 300) {
    score += 0.25;
  }

  return Math.min(Math.max(score, 1), 5);
}

// Explanation generators

function generateMarketUniquenessExplanation(
  score: number,
  projectText: string
): string {
  if (score >= 4.5)
    return "Demonstrates exceptional market uniqueness with clear differentiation from existing solutions.";
  if (score >= 3.5)
    return "Shows good market uniqueness with some differentiation from competitors.";
  if (score >= 2.5)
    return "Has moderate market uniqueness but could benefit from clearer differentiation.";
  if (score >= 1.5)
    return "Limited market uniqueness evident; needs stronger differentiation strategy.";
  return "Minimal market uniqueness shown; requires significant differentiation to stand out.";
}

function generateUIIntuitivenessExplanation(
  score: number,
  projectText: string,
  supportingMaterials?: ProjectSubmission["supportingMaterials"]
): string {
  let explanation = "";
  if (score >= 4.5)
    explanation =
      "Excellent focus on UI intuitiveness with clear user experience considerations.";
  else if (score >= 3.5)
    explanation =
      "Good attention to UI intuitiveness and user experience design.";
  else if (score >= 2.5)
    explanation =
      "Moderate focus on UI intuitiveness with room for improvement.";
  else if (score >= 1.5)
    explanation =
      "Limited attention to UI intuitiveness; needs more user experience focus.";
  else
    explanation =
      "Minimal UI intuitiveness considerations; requires significant UX improvement.";

  if (
    supportingMaterials?.screenshots?.length ||
    supportingMaterials?.demoLink
  ) {
    explanation += " Supporting visual materials enhance the evaluation.";
  }

  return explanation;
}

function generateScalabilityExplanation(
  score: number,
  projectText: string
): string {
  if (score >= 4.5)
    return "Strong scalability potential with clear growth and expansion considerations.";
  if (score >= 3.5)
    return "Good scalability potential with some growth planning evident.";
  if (score >= 2.5)
    return "Moderate scalability potential; could benefit from more architectural planning.";
  if (score >= 1.5)
    return "Limited scalability considerations; needs more focus on growth potential.";
  return "Minimal scalability planning; requires significant architectural improvements for growth.";
}

function generateKiroFeaturesExplanation(
  score: number,
  projectText: string
): string {
  if (score >= 4.5)
    return "Excellent variety of technical features utilized, demonstrating comprehensive implementation.";
  if (score >= 3.5)
    return "Good variety of technical features used, showing solid implementation understanding.";
  if (score >= 2.5)
    return "Moderate use of technical features; could explore additional capabilities.";
  if (score >= 1.5)
    return "Limited variety of technical features; needs broader implementation.";
  return "Minimal technical feature variety; requires significant expansion of implementation.";
}

function generateDepthExplanation(score: number, projectText: string): string {
  if (score >= 4.5)
    return "Demonstrates deep understanding of technical capabilities with detailed implementation insights.";
  if (score >= 3.5)
    return "Shows good understanding with solid implementation details.";
  if (score >= 2.5)
    return "Moderate understanding; could provide more implementation depth.";
  if (score >= 1.5)
    return "Limited understanding of technical capabilities; needs more detailed explanation.";
  return "Minimal understanding demonstrated; requires significant improvement in technical knowledge.";
}

function generateStrategicIntegrationExplanation(
  score: number,
  projectText: string
): string {
  if (score >= 4.5)
    return "Excellent strategic integration with clear rationale and workflow considerations.";
  if (score >= 3.5)
    return "Good strategic thinking in integration with solid reasoning.";
  if (score >= 2.5)
    return "Moderate strategic integration; could benefit from clearer rationale.";
  if (score >= 1.5)
    return "Limited strategic thinking in integration; needs better justification.";
  return "Minimal strategic integration; requires significant improvement in approach rationale.";
}

function generateCreativityExplanation(
  score: number,
  projectText: string
): string {
  if (score >= 4.5)
    return "Highly creative approach with innovative problem-solving and unique perspectives.";
  if (score >= 3.5)
    return "Good creativity demonstrated with solid innovative elements.";
  if (score >= 2.5)
    return "Moderate creativity shown; could benefit from more innovative approaches.";
  if (score >= 1.5)
    return "Limited creativity evident; needs more innovative thinking.";
  return "Minimal creativity demonstrated; requires significant improvement in innovative approach.";
}

function generateOriginalityExplanation(
  score: number,
  projectText: string
): string {
  if (score >= 4.5)
    return "Highly original concept with unique approach and unprecedented elements.";
  if (score >= 3.5)
    return "Good originality with solid unique elements and fresh perspective.";
  if (score >= 2.5)
    return "Moderate originality; could benefit from more unique differentiation.";
  if (score >= 1.5)
    return "Limited originality; needs more distinctive and unique elements.";
  return "Minimal originality; requires significant improvement in uniqueness and differentiation.";
}

function generatePolishExplanation(
  score: number,
  projectText: string,
  supportingMaterials?: ProjectSubmission["supportingMaterials"]
): string {
  let explanation = "";
  if (score >= 4.5)
    explanation =
      "Excellent polish and attention to detail with professional presentation.";
  else if (score >= 3.5)
    explanation = "Good polish and quality with solid attention to detail.";
  else if (score >= 2.5)
    explanation =
      "Moderate polish; could benefit from more refinement and detail.";
  else if (score >= 1.5)
    explanation =
      "Limited polish evident; needs more attention to quality and detail.";
  else
    explanation =
      "Minimal polish; requires significant improvement in quality and presentation.";

  if (
    supportingMaterials?.screenshots?.length ||
    supportingMaterials?.demoLink ||
    supportingMaterials?.additionalNotes
  ) {
    explanation +=
      " Supporting materials contribute positively to the overall polish.";
  }

  return explanation;
}

// Justification generators

function generatePotentialValueJustification(
  score: number,
  subScores: any
): string {
  return (
    `The Potential Value score of ${score}/5 reflects the project's market potential and user value proposition. ` +
    `This combines market uniqueness (${subScores["Market Uniqueness"].score}/5), ` +
    `UI intuitiveness (${subScores["UI Intuitiveness"].score}/5), ` +
    `and scalability potential (${subScores["Scalability"].score}/5).`
  );
}

function generateImplementationJustification(
  score: number,
  subScores: any
): string {
  return (
    `The Implementation score of ${score}/5 evaluates the technical execution and Kiro integration. ` +
    `This combines Kiro features variety (${subScores["Kiro Features Variety"].score}/5), ` +
    `depth of understanding (${subScores["Depth of Understanding"].score}/5), ` +
    `and strategic integration (${subScores["Strategic Integration"].score}/5).`
  );
}

function generateQualityDesignJustification(
  score: number,
  subScores: any
): string {
  return (
    `The Quality and Design score of ${score}/5 assesses the creative and design aspects of the project. ` +
    `This combines creativity (${subScores["Creativity"].score}/5), ` +
    `originality (${subScores["Originality"].score}/5), ` +
    `and overall polish (${subScores["Polish"].score}/5).`
  );
}

/**
 * Main function to analyze project against all criteria
 */
export function analyzeCriteria(
  submission: ProjectSubmission
): CriteriaAnalysis {
  const potentialValue = evaluatePotentialValue(submission);
  const implementation = evaluateImplementation(submission);
  const qualityDesign = evaluateQualityAndDesign(submission);

  const scores = [potentialValue, implementation, qualityDesign];

  // Calculate final score as average of all criteria scores
  const finalScore =
    Math.round(
      (scores.reduce((sum, score) => sum + score.score, 0) / scores.length) * 10
    ) / 10;

  const finalScoreExplanation =
    `The final score of ${finalScore}/5 is calculated as the average of all three judging criteria: ` +
    `Potential Value (${potentialValue.score}/5), Implementation (${implementation.score}/5), ` +
    `and Quality & Design (${qualityDesign.score}/5). This provides a comprehensive evaluation of the project's ` +
    `overall strength across market potential, technical execution, and creative design.`;

  return {
    scores,
    finalScore,
    finalScoreExplanation,
  };
}
