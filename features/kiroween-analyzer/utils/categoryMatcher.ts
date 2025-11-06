import {
  KiroweenCategory,
  CategoryEvaluation,
  CategoryAnalysis,
  ProjectSubmission,
} from "@/lib/types";

/**
 * Category definitions and scoring criteria for Kiroween hackathon categories
 */
const CATEGORY_DEFINITIONS = {
  resurrection: {
    name: "Resurrection",
    description: "Reviving obsolete technology with modern innovations",
    keywords: [
      "legacy",
      "old",
      "vintage",
      "retro",
      "revival",
      "modernize",
      "update",
      "refresh",
      "reboot",
    ],
    scoringCriteria: {
      obsoleteTech:
        "Identifies and uses genuinely obsolete or forgotten technology",
      modernInnovation:
        "Applies contemporary techniques, frameworks, or approaches",
      practicalValue: "Demonstrates real-world utility beyond nostalgia",
      creativeFusion: "Creatively combines old and new elements",
    },
  },
  frankenstein: {
    name: "Frankenstein",
    description: "Integration of seemingly incompatible technologies",
    keywords: [
      "integration",
      "combine",
      "merge",
      "hybrid",
      "fusion",
      "incompatible",
      "different",
      "mix",
      "blend",
    ],
    scoringCriteria: {
      incompatibility:
        "Uses technologies thate typically incompatible or rarely combined",
      technicalChallenge:
        "Overcomes significant technical hurdles in integration",
      novelApproach: "Creates something genuinely new from the combination",
      functionalHarmony:
        "Makes the incompatible technologies work together effectively",
    },
  },
  "skeleton-crew": {
    name: "Skeleton Crew",
    description: "Flexible foundation with multiple use cases",
    keywords: [
      "framework",
      "foundation",
      "flexible",
      "extensible",
      "modular",
      "adaptable",
      "versatile",
      "platform",
      "base",
    ],
    scoringCriteria: {
      flexibility: "Provides a flexible, adaptable foundation",
      multipleUseCases:
        "Demonstrates multiple distinct use cases or applications",
      extensibility: "Shows clear paths for extension and customization",
      minimalism: "Achieves maximum utility with minimal core components",
    },
  },
  "costume-contest": {
    name: "Costume Contest",
    description: "UI polish and spooky design elements",
    keywords: [
      "ui",
      "design",
      "visual",
      "interface",
      "polish",
      "aesthetic",
      "theme",
      "spooky",
      "halloween",
    ],
    scoringCriteria: {
      visualPolish: "Demonstrates exceptional UI/UX design and polish",
      thematicElements:
        "Incorporates Halloween or spooky design elements effectively",
      userExperience: "Provides an engaging and intuitive user experience",
      designInnovation: "Shows creative and innovative design approaches",
    },
  },
} as const;

/**
 * Evaluates how well a project fits a specific Kiroween category
 */
export function evaluateProjectForCategory(
  submission: ProjectSubmission,
  category: KiroweenCategory
): CategoryEvaluation {
  const categoryDef = CATEGORY_DEFINITIONS[category];
  const projectText =
    `${submission.description} ${submission.kiroUsage}`.toLowerCase();

  // Calculate keyword match score (0-3 points)
  const keywordMatches = categoryDef.keywords.filter((keyword) =>
    projectText.includes(keyword.toLowerCase())
  ).length;
  const keywordScore = Math.min(keywordMatches * 0.5, 3);

  // Calculate thematic alignment score (0-4 points)
  const thematicScore = calculateThematicAlignment(submission, category);

  // Calculate implementation quality score (0-3 points)
  const implementationScore = calculateImplementationQuality(
    submission,
    category
  );

  // Total score out of 10
  const fitScore = Math.min(
    Math.round((keywordScore + thematicScore + implementationScore) * 10) / 10,
    10
  );

  const explanation = generateCategoryExplanation(
    submission,
    category,
    fitScore,
    {
      keywordScore,
      thematicScore,
      implementationScore,
    }
  );

  const improvementSuggestions = generateImprovementSuggestions(
    submission,
    category,
    {
      keywordScore,
      thematicScore,
      implementationScore,
    }
  );

  return {
    category,
    fitScore,
    explanation,
    improvementSuggestions,
  };
}

/**
 * Calculates thematic alignment score based on category-specific criteria
 */
function calculateThematicAlignment(
  submission: ProjectSubmission,
  category: KiroweenCategory
): number {
  const projectText = submission.description.toLowerCase();
  const kiroUsage = submission.kiroUsage.toLowerCase();

  switch (category) {
    case "resurrection":
      return calculateResurrectionAlignment(projectText, kiroUsage);
    case "frankenstein":
      return calculateFrankensteinAlignment(projectText, kiroUsage);
    case "skeleton-crew":
      return calculateSkeletonCrewAlignment(projectText, kiroUsage);
    case "costume-contest":
      return calculateCostumeContestAlignment(
        projectText,
        kiroUsage,
        submission.supportingMaterials
      );
    default:
      return 0;
  }
}

function calculateResurrectionAlignment(
  projectText: string,
  kiroUsage: string
): number {
  let score = 0;

  // Check for obsolete technology mentions (0-1.5 points)
  const obsoleteTechTerms = [
    "legacy",
    "old",
    "vintage",
    "retro",
    "deprecated",
    "outdated",
    "ancient",
  ];
  if (obsoleteTechTerms.some((term) => projectText.includes(term))) {
    score += 1.5;
  }

  // Check for modernization approach (0-1.5 points)
  const modernizationTerms = [
    "modern",
    "update",
    "refresh",
    "revive",
    "reboot",
    "contemporary",
  ];
  if (
    modernizationTerms.some(
      (term) => projectText.includes(term) || kiroUsage.includes(term)
    )
  ) {
    score += 1.5;
  }

  // Check for practical value beyond nostalgia (0-1 point)
  const practicalTerms = [
    "useful",
    "practical",
    "solve",
    "improve",
    "benefit",
    "value",
  ];
  if (practicalTerms.some((term) => projectText.includes(term))) {
    score += 1;
  }

  return Math.min(score, 4);
}

function calculateFrankensteinAlignment(
  projectText: string,
  kiroUsage: string
): number {
  let score = 0;

  // Check for integration/combination language (0-2 points)
  const integrationTerms = [
    "combine",
    "integrate",
    "merge",
    "fusion",
    "hybrid",
    "mix",
    "blend",
  ];
  const integrationCount = integrationTerms.filter(
    (term) => projectText.includes(term) || kiroUsage.includes(term)
  ).length;
  score += Math.min(integrationCount * 0.5, 2);

  // Check for mention of different technologies (0-1.5 points)
  const techDiversityTerms = [
    "different",
    "various",
    "multiple",
    "diverse",
    "incompatible",
  ];
  if (
    techDiversityTerms.some(
      (term) => projectText.includes(term) || kiroUsage.includes(term)
    )
  ) {
    score += 1.5;
  }

  // Check for technical challenge indicators (0-0.5 points)
  const challengeTerms = ["challenge", "difficult", "complex", "overcome"];
  if (challengeTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  return Math.min(score, 4);
}

function calculateSkeletonCrewAlignment(
  projectText: string,
  kiroUsage: string
): number {
  let score = 0;

  // Check for framework/foundation language (0-2 points)
  const foundationTerms = [
    "framework",
    "foundation",
    "platform",
    "base",
    "core",
    "skeleton",
  ];
  if (
    foundationTerms.some(
      (term) => projectText.includes(term) || kiroUsage.includes(term)
    )
  ) {
    score += 2;
  }

  // Check for flexibility/extensibility mentions (0-1.5 points)
  const flexibilityTerms = [
    "flexible",
    "extensible",
    "modular",
    "adaptable",
    "customizable",
    "configurable",
  ];
  if (
    flexibilityTerms.some(
      (term) => projectText.includes(term) || kiroUsage.includes(term)
    )
  ) {
    score += 1.5;
  }

  // Check for multiple use case indicators (0-0.5 points)
  const useCaseTerms = [
    "multiple",
    "various",
    "different uses",
    "versatile",
    "multi-purpose",
  ];
  if (useCaseTerms.some((term) => projectText.includes(term))) {
    score += 0.5;
  }

  return Math.min(score, 4);
}

function calculateCostumeContestAlignment(
  projectText: string,
  kiroUsage: string,
  supportingMaterials?: ProjectSubmission["supportingMaterials"]
): number {
  let score = 0;

  // Check for UI/design focus (0-2 points)
  const designTerms = [
    "ui",
    "ux",
    "design",
    "interface",
    "visual",
    "aesthetic",
    "beautiful",
    "polished",
  ];
  const designCount = designTerms.filter(
    (term) => projectText.includes(term) || kiroUsage.includes(term)
  ).length;
  score += Math.min(designCount * 0.4, 2);

  // Check for Halloween/spooky theme (0-1.5 points)
  const spookyTerms = [
    "halloween",
    "spooky",
    "scary",
    "ghost",
    "pumpkin",
    "witch",
    "dark",
    "theme",
  ];
  if (
    spookyTerms.some(
      (term) => projectText.includes(term) || kiroUsage.includes(term)
    )
  ) {
    score += 1.5;
  }

  // Bonus for supporting materials (screenshots, demo links) (0-0.5 points)
  if (
    supportingMaterials?.screenshots?.length ||
    supportingMaterials?.demoLink
  ) {
    score += 0.5;
  }

  return Math.min(score, 4);
}

/**
 * Calculates implementation quality score based on Kiro usage description
 */
function calculateImplementationQuality(
  submission: ProjectSubmission,
  category: KiroweenCategory
): number {
  const kiroUsage = submission.kiroUsage.toLowerCase();
  let score = 0;

  // Check for variety of Kiro features mentioned (0-1.5 points)
  const kiroFeatures = [
    "agent",
    "tool",
    "function",
    "api",
    "integration",
    "automation",
    "workflow",
  ];
  const featureCount = kiroFeatures.filter((feature) =>
    kiroUsage.includes(feature)
  ).length;
  score += Math.min(featureCount * 0.3, 1.5);

  // Check for depth of understanding (0-1 point)
  const depthIndicators = [
    "because",
    "specifically",
    "detailed",
    "comprehensive",
    "strategic",
  ];
  if (depthIndicators.some((indicator) => kiroUsage.includes(indicator))) {
    score += 1;
  }

  // Check for strategic thinking (0-0.5 points)
  const strategyTerms = ["strategy", "approach", "methodology", "systematic"];
  if (strategyTerms.some((term) => kiroUsage.includes(term))) {
    score += 0.5;
  }

  return Math.min(score, 3);
}

/**
 * Generates explanation for category fit score
 */
function generateCategoryExplanation(
  submission: ProjectSubmission,
  category: KiroweenCategory,
  fitScore: number,
  scores: {
    keywordScore: number;
    thematicScore: number;
    implementationScore: number;
  }
): string {
  const categoryDef = CATEGORY_DEFINITIONS[category];
  const { keywordScore, thematicScore, implementationScore } = scores;

  let explanation = `This project scores ${fitScore}/10 for the ${categoryDef.name} category. `;

  if (fitScore >= 8) {
    explanation += `This is an excellent fit! `;
  } else if (fitScore >= 6) {
    explanation += `This is a good fit with room for improvement. `;
  } else if (fitScore >= 4) {
    explanation += `This shows some alignment but needs significant enhancement. `;
  } else {
    explanation += `This project has limited alignment with this category. `;
  }

  // Add specific scoring breakdown
  explanation += `The score breaks down as follows: `;
  explanation += `keyword relevance (${keywordScore.toFixed(1)}/3), `;
  explanation += `thematic alignment (${thematicScore.toFixed(1)}/4), `;
  explanation += `and implementation quality (${implementationScore.toFixed(
    1
  )}/3). `;

  // Add category-specific context
  explanation += `For the ${
    categoryDef.name
  } category, we look for projects that ${categoryDef.description.toLowerCase()}.`;

  return explanation;
}

/**
 * Generates improvement suggestions for better category alignment
 */
function generateImprovementSuggestions(
  submission: ProjectSubmission,
  category: KiroweenCategory,
  scores: {
    keywordScore: number;
    thematicScore: number;
    implementationScore: number;
  }
): string[] {
  const suggestions: string[] = [];
  const { keywordScore, thematicScore, implementationScore } = scores;

  // Keyword-based suggestions
  if (keywordScore < 2) {
    suggestions.push(
      `Include more ${category}-specific terminology in your project description`
    );
  }

  // Category-specific suggestions
  switch (category) {
    case "resurrection":
      if (thematicScore < 2) {
        suggestions.push(
          "Clearly identify the obsolete technology you're reviving and explain why it's worth bringing back"
        );
        suggestions.push(
          "Describe the modern innovations and techniques you're applying to update the old technology"
        );
      }
      break;

    case "frankenstein":
      if (thematicScore < 2) {
        suggestions.push(
          "Explicitly mention the different technologies you're combining and why they're typically incompatible"
        );
        suggestions.push(
          "Describe the technical challenges you're overcoming to make these technologies work together"
        );
      }
      break;

    case "skeleton-crew":
      if (thematicScore < 2) {
        suggestions.push(
          "Emphasize how your project serves as a flexible foundation that others can build upon"
        );
        suggestions.push(
          "Provide specific examples of different use cases your framework can support"
        );
      }
      break;

    case "costume-contest":
      if (thematicScore < 2) {
        suggestions.push(
          "Highlight the visual design elements and UI polish in your project"
        );
        suggestions.push(
          "Include Halloween or spooky themed elements to match the category spirit"
        );
        suggestions.push(
          "Add screenshots or demo links to showcase your visual design work"
        );
      }
      break;
  }

  // Implementation quality suggestions
  if (implementationScore < 1.5) {
    suggestions.push(
      "Provide more detail about how you're using Kiro's features and capabilities"
    );
    suggestions.push(
      "Explain the strategic reasoning behind your Kiro integration choices"
    );
  }

  return suggestions;
}

/**
 * Analyzes a project against all Kiroween categories and determines the best fit
 */
export function analyzeProjectCategories(
  submission: ProjectSubmission
): CategoryAnalysis {
  const categories: KiroweenCategory[] = [
    "resurrection",
    "frankenstein",
    "skeleton-crew",
    "costume-contest",
  ];

  const evaluations = categories.map((category) =>
    evaluateProjectForCategory(submission, category)
  );

  // Find the best matching category
  const bestEvaluation = evaluations.reduce((best, current) =>
    current.fitScore > best.fitScore ? current : best
  );

  const bestMatch = bestEvaluation.category;
  const bestMatchReason = `This project scores highest (${
    bestEvaluation.fitScore
  }/10) in the ${CATEGORY_DEFINITIONS[bestMatch].name} category because ${
    bestEvaluation.explanation.split(".")[1]?.trim() ||
    "it demonstrates strong alignment with the category criteria"
  }.`;

  return {
    evaluations,
    bestMatch,
    bestMatchReason,
  };
}
