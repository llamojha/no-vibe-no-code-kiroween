import type { Analysis } from '@/lib/types';
import type { SupportedLocale } from '@/features/locale/translations';
import { translations } from '@/features/locale/translations';

type Format = 'md' | 'txt';

const criterionToLocaleKey: Record<string, string> = {
  'Market Demand': 'rubricCriterionMarketDemand',
  'Market Size': 'rubricCriterionMarketSize',
  Uniqueness: 'rubricCriterionUniqueness',
  Scalability: 'rubricCriterionScalability',
  'Potential Profitability': 'rubricCriterionPotentialProfitability',
};

export const generateReport = (
  analysis: Analysis,
  locale: SupportedLocale,
  format: Format,
  options?: { forTts?: boolean },
): string => {
  const dict = translations[locale];
  const translationDict = dict as Record<string, string>;
  const isMd = format === 'md';
  const h1 = (text: string) => (isMd ? `# ${text}\n\n` : `\n\n====== ${text.toUpperCase()} ======\n\n`);
  const h2 = (text: string) => (isMd ? `## ${text}\n\n` : `\n--- ${text} ---\n\n`);
  const h3 = (text: string) => (isMd ? `### ${text}\n\n` : `${text}\n`);
  const bold = (text: string) => (isMd ? `**${text}**` : text);
  const italic = (text: string) => (isMd ? `*${text}*` : text);
  const link = (text: string, url: string) => (isMd ? `[${text}](${url})` : `${text} (${url})`);
  const listItem = (text: string) => (isMd ? `* ${text}\n` : `- ${text}\n`);
  const blockquote = (text: string) => (isMd ? `> ${text}\n\n` : `  "${text}"\n\n`);

  let report = '';

  report += h1(dict.finalScoreTitle);
  report += `${bold(dict.viabilityVerdict)}: ${analysis.finalScore.toFixed(1)}/5\n\n`;
  report += `${analysis.viabilitySummary}\n\n`;
  report += `${italic(analysis.finalScoreExplanation)}\n\n`;

  report += h2(dict.detailedSummaryTitle);
  report += `${analysis.detailedSummary}\n\n`;

  report += h2(dict.scoringRubricTitle);
  if (isMd) {
    report += `| ${dict.rubricCriterion} | ${dict.rubricScore} | ${dict.rubricJustification} |\n`;
    report += `|---|:---:|---|\n`;
    analysis.scoringRubric.forEach((criterion) => {
      const key = criterionToLocaleKey[criterion.name];
      const translatedName = key ? translationDict[key] ?? criterion.name : criterion.name;
      report += `| ${translatedName} | ${criterion.score.toFixed(1)}/5 | ${criterion.justification.replace(/\n/g, ' ')} |\n`;
    });
    report += '\n';
  } else {
    analysis.scoringRubric.forEach((criterion) => {
      const key = criterionToLocaleKey[criterion.name];
      const translatedName = key ? translationDict[key] ?? criterion.name : criterion.name;
      report += `${bold(translatedName)} - ${criterion.score.toFixed(1)}/5\n`;
      report += `${criterion.justification}\n\n`;
    });
  }

  report += h2(dict.checklistTitle);
  analysis.founderQuestions.forEach((question, index) => {
    report += h3(`${index + 1}. ${question.question}`);
    report += blockquote(question.ask);
    report += `${question.analysis}\n\n`;
    report += `${bold('Why it matters:')} ${question.why}\n`;
    report += `${italic(`Source: ${question.source}`)}\n\n`;
  });

  report += h2(dict.swotTitle);
  report += h3(dict.swotStrengths);
  analysis.swotAnalysis.strengths.forEach((item) => {
    report += listItem(item);
  });
  report += '\n';
  report += h3(dict.swotWeaknesses);
  analysis.swotAnalysis.weaknesses.forEach((item) => {
    report += listItem(item);
  });
  report += '\n';
  report += h3(dict.swotOpportunities);
  analysis.swotAnalysis.opportunities.forEach((item) => {
    report += listItem(item);
  });
  report += '\n';
  report += h3(dict.swotThreats);
  analysis.swotAnalysis.threats.forEach((item) => {
    report += listItem(item);
  });
  report += '\n';

  report += h2(dict.trendsTitle);
  analysis.currentMarketTrends.forEach((trend) => {
    report += `${bold(trend.trend)}\n`;
    report += `${trend.impact}\n\n`;
  });

  report += h2(dict.competitorsTitle);
  analysis.competitors.forEach((competitor) => {
    const name = competitor.sourceLink
      ? link(competitor.name, competitor.sourceLink)
      : competitor.name;
    report += h3(name);
    report += `${competitor.description}\n\n`;
    report += `${bold(dict.competitorStrengths)}:\n`;
    competitor.strengths.forEach((strength) => {
      report += listItem(strength);
    });
    report += '\n';
    report += `${bold(dict.competitorWeaknesses)}:\n`;
    competitor.weaknesses.forEach((weakness) => {
      report += listItem(weakness);
    });
    report += '\n';
  });

  report += h2(dict.monetizationTitle);
  analysis.monetizationStrategies.forEach((strategy) => {
    report += `${bold(strategy.name)}\n`;
    report += `${strategy.description}\n\n`;
  });

  if (!options?.forTts) {
    report += h2(dict.improvementSuggestionsTitle);
    analysis.improvementSuggestions.forEach((suggestion) => {
      report += `${bold(suggestion.title)}\n`;
      report += `${suggestion.description}\n\n`;
    });
  }

  report += h2(dict.nextStepsTitle);
  analysis.nextSteps.forEach((step, index) => {
    report += `${index + 1}. ${bold(step.title)}\n`;
    report += `${step.description}\n\n`;
  });

  return report;
};
