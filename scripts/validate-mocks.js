#!/usr/bin/env node

/**
 * CLI tool for validating mock response data files
 * 
 * Usage:
 *   npm run validate:mocks
 *   npm run validate:mocks -- --type analyzer
 *   npm run validate:mocks -- --strict
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define Zod schemas inline for validation
const FounderQuestionSchema = z.object({
  question: z.string().min(1),
  ask: z.string().min(1),
  why: z.string().min(1),
  source: z.string().min(1),
  analysis: z.string().min(1),
});

const SwotAnalysisSchema = z.object({
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  opportunities: z.array(z.string().min(1)),
  threats: z.array(z.string().min(1)),
});

const MarketTrendSchema = z.object({
  trend: z.string().min(1),
  impact: z.string().min(1),
});

const ScoringRubricItemSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(100),
  justification: z.string().min(1),
});

const CompetitorSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
});

const MonetizationStrategySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

const ImprovementSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const NextStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const AnalyzerMockResponseDataSchema = z.object({
  detailedSummary: z.string().min(1),
  founderQuestions: z.array(FounderQuestionSchema),
  swotAnalysis: SwotAnalysisSchema,
  currentMarketTrends: z.array(MarketTrendSchema),
  scoringRubric: z.array(ScoringRubricItemSchema),
  competitors: z.array(CompetitorSchema),
  monetizationStrategies: z.array(MonetizationStrategySchema),
  improvementSuggestions: z.array(ImprovementSuggestionSchema),
  nextSteps: z.array(NextStepSchema),
  finalScore: z.number().min(0).max(100),
  finalScoreExplanation: z.string().min(1),
  viabilitySummary: z.string().min(1),
});

const ErrorResponseDataSchema = z.object({
  error: z.string().min(1),
  message: z.string().min(1),
});

const AnalyzerMockResponseSchema = z.object({
  data: z.union([AnalyzerMockResponseDataSchema, ErrorResponseDataSchema]),
  statusCode: z.number().min(100).max(599),
  delay: z.number().min(0).optional(),
});

const CategoryEvaluationSchema = z.object({
  category: z.string().min(1),
  fitScore: z.number().min(0).max(10),
  explanation: z.string().min(1),
  improvementSuggestions: z.array(z.string().min(1)),
});

const CategoryAnalysisSchema = z.object({
  evaluations: z.array(CategoryEvaluationSchema),
  bestMatch: z.string().min(1),
  bestMatchReason: z.string().min(1),
});

const SubScoreSchema = z.object({
  score: z.number().min(0).max(5),
  explanation: z.string().min(1),
});

const CriteriaScoreSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(5),
  justification: z.string().min(1),
  subScores: z.record(z.string(), SubScoreSchema),
});

const CriteriaAnalysisSchema = z.object({
  scores: z.array(CriteriaScoreSchema),
  finalScore: z.number().min(0).max(5),
  finalScoreExplanation: z.string().min(1),
});

const HackathonSpecificAdviceSchema = z.object({
  categoryOptimization: z.array(z.string().min(1)),
  kiroIntegrationTips: z.array(z.string().min(1)),
  competitionStrategy: z.array(z.string().min(1)),
});

const HackathonMockResponseDataSchema = z.object({
  detailedSummary: z.string().min(1),
  categoryAnalysis: CategoryAnalysisSchema,
  criteriaAnalysis: CriteriaAnalysisSchema,
  hackathonSpecificAdvice: HackathonSpecificAdviceSchema,
  scoringRubric: z.array(ScoringRubricItemSchema),
  competitors: z.array(CompetitorSchema),
  improvementSuggestions: z.array(ImprovementSuggestionSchema),
  nextSteps: z.array(NextStepSchema),
  finalScore: z.number().min(0).max(100),
  finalScoreExplanation: z.string().min(1),
  viabilitySummary: z.string().min(1),
});

const HackathonMockResponseSchema = z.object({
  data: z.union([HackathonMockResponseDataSchema, ErrorResponseDataSchema]),
  statusCode: z.number().min(100).max(599),
  delay: z.number().min(0).optional(),
});

const FrankensteinMetricsSchema = z.object({
  originality_score: z.number().min(0).max(100),
  feasibility_score: z.number().min(0).max(100),
  impact_score: z.number().min(0).max(100),
  scalability_score: z.number().min(0).max(100),
  wow_factor: z.number().min(0).max(100),
});

const FrankensteinMockResponseDataSchema = z.object({
  idea_title: z.string().min(1),
  idea_description: z.string().min(1),
  core_concept: z.string().min(1),
  problem_statement: z.string().min(1),
  proposed_solution: z.string().min(1),
  unique_value_proposition: z.string().min(1),
  target_audience: z.string().min(1),
  business_model: z.string().min(1),
  growth_strategy: z.string().min(1),
  tech_stack_suggestion: z.string().min(1),
  risks_and_challenges: z.string().min(1),
  metrics: FrankensteinMetricsSchema,
  summary: z.string().min(1),
  language: z.enum(['en', 'es']),
});

const FrankensteinMockResponseSchema = z.object({
  data: z.union([FrankensteinMockResponseDataSchema, ErrorResponseDataSchema]),
  statusCode: z.number().min(100).max(599),
  delay: z.number().min(0).optional(),
});

const SCHEMAS = {
  analyzer: AnalyzerMockResponseSchema,
  hackathon: HackathonMockResponseSchema,
  frankenstein: FrankensteinMockResponseSchema,
};

const FILE_NAMES = {
  analyzer: 'analyzer-mocks.json',
  hackathon: 'hackathon-mocks.json',
  frankenstein: 'frankenstein-mocks.json',
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: null,
    strict: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--type':
      case '-t':
        const typeValue = args[++i];
        if (typeValue && ['analyzer', 'hackathon', 'frankenstein'].includes(typeValue)) {
          options.type = typeValue;
        } else {
          console.error(`Invalid type: ${typeValue}. Must be one of: analyzer, hackathon, frankenstein`);
          process.exit(1);
        }
        break;

      case '--strict':
      case '-s':
        options.strict = true;
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Mock Response Validation Tool

Usage:
  npm run validate:mocks [options]

Options:
  -t, --type <type>     Validate specific type only (analyzer, hackathon, frankenstein)
  -s, --strict          Exit with error code if any validation fails
  -v, --verbose         Show detailed validation results
  -h, --help            Show this help message

Examples:
  npm run validate:mocks
  npm run validate:mocks -- --type analyzer
  npm run validate:mocks -- --strict --verbose
  `);
}

/**
 * Validate a specific mock response type
 */
function validateType(type, options) {
  console.log(`\n📋 Validating ${type} mock responses...`);

  try {
    const dataDir = join(__dirname, '..', 'lib', 'testing', 'data');
    const filePath = join(dataDir, FILE_NAMES[type]);
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const schema = SCHEMAS[type];
    let hasErrors = false;
    let totalScenarios = 0;
    let totalVariants = 0;
    let failedVariants = 0;

    for (const [scenario, responses] of Object.entries(data.scenarios)) {
      if (!responses) continue;

      totalScenarios++;
      totalVariants += responses.length;

      const failedInScenario = [];

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        
        try {
          schema.parse(response);
        } catch (error) {
          failedVariants++;
          hasErrors = true;
          
          const errors = error.errors.map((err) => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
          });

          failedInScenario.push({
            variant: i + 1,
            errors,
          });
        }
      }

      if (failedInScenario.length > 0) {
        console.log(`\n  ❌ Scenario: ${scenario}`);

        for (const failure of failedInScenario) {
          if (options.verbose) {
            console.log(`     Variant ${failure.variant} errors:`);
            failure.errors.forEach((error) => {
              console.log(`       - ${error}`);
            });
          } else {
            console.log(`     Variant ${failure.variant}: ${failure.errors.length} validation error(s)`);
          }
        }
      } else if (options.verbose) {
        console.log(`  ✅ Scenario: ${scenario} (${responses.length} variant(s))`);
      }
    }

    // Print summary
    console.log(`\n  Summary:`);
    console.log(`    Total scenarios: ${totalScenarios}`);
    console.log(`    Total variants: ${totalVariants}`);
    console.log(`    Failed variants: ${failedVariants}`);
    console.log(`    Success rate: ${((totalVariants - failedVariants) / totalVariants * 100).toFixed(1)}%`);

    if (!hasErrors) {
      console.log(`\n  ✅ All ${type} mock responses are valid!`);
    }

    return !hasErrors;
  } catch (error) {
    console.error(`\n  ❌ Failed to validate ${type}:`, error.message);
    return false;
  }
}

/**
 * Main validation function
 */
function main() {
  const options = parseArgs();

  console.log('🔍 Mock Response Validation');
  console.log('============================');

  const typesToValidate = options.type
    ? [options.type]
    : ['analyzer', 'hackathon', 'frankenstein'];

  let allValid = true;

  for (const type of typesToValidate) {
    const isValid = validateType(type, options);
    allValid = allValid && isValid;
  }

  // Print final summary
  console.log('\n============================');
  if (allValid) {
    console.log('✅ All mock responses are valid!');
    process.exit(0);
  } else {
    console.log('❌ Some mock responses have validation errors.');
    
    if (options.strict) {
      console.log('\nExiting with error code due to --strict flag.');
      process.exit(1);
    } else {
      console.log('\nRun with --strict flag to exit with error code on validation failure.');
      console.log('Run with --verbose flag to see detailed error messages.');
      process.exit(0);
    }
  }
}

// Run the validation
main();
