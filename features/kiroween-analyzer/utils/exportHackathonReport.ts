import type { HackathonAnalysis, KiroweenCategory } from "@/lib/types";
import type { SupportedLocale } from "@/features/locale/translations";
import { translations } from "@/features/locale/translations";

type Format = "md" | "txt";

const categoryToLocaleKey: Record<KiroweenCategory, string> = {
  resurrection: "categoryResurrection",
  frankenstein: "categoryFrankenstein",
  "skeleton-crew": "categorySkeletonCrew",
  "costume-contest": "categoryCostumeContest",
};

const criteriaToLocaleKey: Record<string, string> = {
  "Potential Value": "criteriaPotentialValue",
  Implementation: "criteriaImplementation",
  "Quality and Design": "criteriaQualityDesign",
};

export const generateHackathonReport = (
  analysis: HackathonAnalysis,
  locale: SupportedLocale,
  format: Format,
  options?: { forTts?: boolean }
): string => {
  const dict = translations[locale];
  const translationDict = dict as Record<string, string>;
  const isMd = format === "md";
  const h1 = (text: string) =>
    isMd ? `# ${text}\n\n` : `\n\n====== ${text.toUpperCase()} ======\n\n`;
  const h2 = (text: string) =>
    isMd ? `## ${text}\n\n` : `\n--- ${text} ---\n\n`;
  const h3 = (text: string) => (isMd ? `### ${text}\n\n` : `${text}\n`);
  const bold = (text: string) => (isMd ? `**${text}**` : text);
  const italic = (text: string) => (isMd ? `*${text}*` : text);
  const link = (text: string, url: string) =>
    isMd ? `[${text}](${url})` : `${text} (${url})`;
  const listItem = (text: string) => (isMd ? `* ${text}\n` : `- ${text}\n`);
  const blockquote = (text: string) =>
    isMd ? `> ${text}\n\n` : `  "${text}"\n\n`;

  let report = "";

  // Title
  report += h1(dict.kiroweenAnalyzerTitle);

  // Final Score & Viability Summary
  report += h2(dict.finalScoreTitle);

  // Calculate combined score (average of best category fit converted to 0-5 and criteria final score)
  const evaluations = analysis.categoryAnalysis?.evaluations || [];
  const bestCategory = evaluations.reduce(
    (acc, cur) => (cur.fitScore > (acc?.fitScore ?? -Infinity) ? cur : acc),
    evaluations[0] ?? null
  );
  const bestCategoryScore5 = bestCategory
    ? Math.round(bestCategory.fitScore / 2 / 0.5) * 0.5
    : 0;
  const criteriaScore5 =
    Math.round((analysis.criteriaAnalysis?.finalScore ?? 0) / 0.5) * 0.5;
  const combinedScore =
    Math.round(((bestCategoryScore5 + criteriaScore5) / 2) * 10) / 10;

  report += `${bold(dict.viabilityVerdict)}: ${combinedScore.toFixed(1)}/5\n\n`;
  report += `${analysis.viabilitySummary}\n\n`;
  report += `${italic(analysis.finalScoreExplanation)}\n\n`;

  // Detailed Summary
  report += h2(dict.detailedSummaryTitle);
  report += `${analysis.detailedSummary}\n\n`;

  // Category Evaluation
  if (analysis.categoryAnalysis) {
    report += h2(dict.categoryEvaluationTitle);

    if (isMd) {
      report += `| ${dict.categorySelectionLabel} | ${dict.categoryFitScore} | ${dict.improvementSuggestions} |\n`;
      report += `|---|:---:|---|\n`;
      analysis.categoryAnalysis.evaluations.forEach((evaluation) => {
        const key = categoryToLocaleKey[evaluation.category];
        const translatedName = key
          ? translationDict[key] ?? evaluation.category
          : evaluation.category;
        const suggestions = evaluation.improvementSuggestions.join("; ");
        report += `| ${translatedName} | ${evaluation.fitScore.toFixed(
          1
        )}/10 | ${suggestions.replace(/\n/g, " ")} |\n`;
      });
      report += "\n";
    } else {
      analysis.categoryAnalysis.evaluations.forEach((evaluation) => {
        const key = categoryToLocaleKey[evaluation.category];
        const translatedName = key
          ? translationDict[key] ?? evaluation.category
          : evaluation.category;
        report += `${bold(translatedName)} - ${evaluation.fitScore.toFixed(
          1
        )}/10\n`;
        report += `${evaluation.explanation}\n`;
        if (evaluation.improvementSuggestions.length > 0) {
          report += `${bold(dict.improvementSuggestions)}:\n`;
          evaluation.improvementSuggestions.forEach((suggestion) => {
            report += listItem(suggestion);
          });
        }
        report += "\n";
      });
    }

    // Best matching category
    const bestMatchKey =
      categoryToLocaleKey[analysis.categoryAnalysis.bestMatch];
    const bestMatchName = bestMatchKey
      ? translationDict[bestMatchKey] ?? analysis.categoryAnalysis.bestMatch
      : analysis.categoryAnalysis.bestMatch;
    report += `${bold(dict.bestMatchingCategory)}: ${bestMatchName}\n`;
    report += `${analysis.categoryAnalysis.bestMatchReason}\n\n`;
  }

  // Criteria Scoring
  if (analysis.criteriaAnalysis) {
    report += h2(dict.criteriaScoreTitle);

    if (isMd) {
      report += `| ${dict.rubricCriterion} | ${dict.rubricScore} | ${dict.rubricJustification} |\n`;
      report += `|---|:---:|---|\n`;
      analysis.criteriaAnalysis.scores.forEach((criterion) => {
        const key = criteriaToLocaleKey[criterion.name];
        const translatedName = key
          ? translationDict[key] ?? criterion.name
          : criterion.name;
        report += `| ${translatedName} | ${criterion.score.toFixed(
          1
        )}/5 | ${criterion.justification.replace(/\n/g, " ")} |\n`;
      });
      report += "\n";
    } else {
      analysis.criteriaAnalysis.scores.forEach((criterion) => {
        const key = criteriaToLocaleKey[criterion.name];
        const translatedName = key
          ? translationDict[key] ?? criterion.name
          : criterion.name;
        report += `${bold(translatedName)} - ${criterion.score.toFixed(1)}/5\n`;
        report += `${criterion.justification}\n\n`;
      });
    }

    report += `${bold(dict.finalScoreExplanation)}: ${
      analysis.criteriaAnalysis.finalScoreExplanation
    }\n\n`;
  }

  // Hackathon-Specific Advice
  if (analysis.hackathonSpecificAdvice) {
    report += h2(dict.hackathonSpecificAdvice);

    // Category Optimization
    if (analysis.hackathonSpecificAdvice.categoryOptimization.length > 0) {
      report += h3(dict.categoryOptimization);
      analysis.hackathonSpecificAdvice.categoryOptimization.forEach((tip) => {
        report += listItem(tip);
      });
      report += "\n";
    }

    // Kiro Integration Tips
    if (analysis.hackathonSpecificAdvice.kiroIntegrationTips.length > 0) {
      report += h3(dict.kiroIntegrationTips);
      analysis.hackathonSpecificAdvice.kiroIntegrationTips.forEach((tip) => {
        report += listItem(tip);
      });
      report += "\n";
    }

    // Competition Strategy
    if (analysis.hackathonSpecificAdvice.competitionStrategy.length > 0) {
      report += h3(dict.competitionStrategy);
      analysis.hackathonSpecificAdvice.competitionStrategy.forEach((tip) => {
        report += listItem(tip);
      });
      report += "\n";
    }
  }

  // Competitors Section
  if ((analysis?.competitors || []).length > 0) {
    report += h2(dict.spookyCompetition || dict.competitorsTitle);
    analysis.competitors.forEach((competitor) => {
      const name = competitor.sourceLink
        ? link(competitor.name, competitor.sourceLink)
        : competitor.name;
      report += h3(name);
      report += `${competitor.description}\n\n`;
      report += `${bold(dict.competitorStrengths || dict.strengths)}:\n`;
      competitor.strengths.forEach((strength) => {
        report += listItem(strength);
      });
      report += "\n";
      report += `${bold(dict.competitorWeaknesses || dict.weaknesses)}:\n`;
      competitor.weaknesses.forEach((weakness) => {
        report += listItem(weakness);
      });
      report += "\n";
    });
  }

  // Improvement Suggestions Section (only when not for TTS)
  if (!options?.forTts && (analysis?.improvementSuggestions || []).length > 0) {
    report += h2(dict.improvementSuggestionsTitle);
    analysis.improvementSuggestions.forEach((suggestion) => {
      report += `${bold(suggestion.title)}\n`;
      report += `${suggestion.description}\n\n`;
    });
  }

  // Next Steps Section
  if ((analysis?.nextSteps || []).length > 0) {
    report += h2(dict.nextStepsTitle);
    analysis.nextSteps.forEach((step, index) => {
      report += `${index + 1}. ${bold(step.title)}\n`;
      report += `${step.description}\n\n`;
    });
  }

  return report;
};
