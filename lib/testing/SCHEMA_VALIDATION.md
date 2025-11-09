# Mock Response Schema Validation

This document describes the schema validation system for mock responses in the testing automation framework.

## Overview

The schema validation system ensures that all mock response data files conform to expected structures using Zod schemas. This helps catch data inconsistencies early and maintains data quality across the testing infrastructure.

## Components

### 1. Zod Schemas (`lib/testing/schemas.ts`)

Defines comprehensive Zod schemas for all mock response types:

- **AnalyzerMockResponseSchema**: Validates analyzer mock responses
- **HackathonMockResponseSchema**: Validates hackathon analyzer mock responses
- **FrankensteinMockResponseSchema**: Validates Doctor Frankenstein mock responses

Each schema validates:
- Required fields and their types
- Nested object structures
- Array contents
- Numeric ranges (e.g., scores between 0-100)
- String constraints (e.g., minimum length)
- Enum values (e.g., language codes)

### 2. TestDataManager Validation (`lib/testing/TestDataManager.ts`)

The TestDataManager class includes validation methods:

#### `validateMockResponse(response, type)`
Validates a single mock response against its schema.

**Parameters:**
- `response`: The mock response object to validate
- `type`: The response type ('analyzer', 'hackathon', or 'frankenstein')

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
```

#### `validateAllResponses(type)`
Validates all responses in a data file for a specific type.

**Parameters:**
- `type`: The response type to validate

**Returns:**
A Map of scenario names to arrays of validation results.

#### Automatic Validation on Load

When mock data files are loaded, they are automatically validated in development and test environments. This behavior can be controlled with the `FF_STRICT_MOCK_VALIDATION` environment variable:

- **Strict mode** (`FF_STRICT_MOCK_VALIDATION=true`): Throws an error if validation fails
- **Non-strict mode** (default): Logs warnings but continues execution

### 3. CLI Validation Tool (`scripts/validate-mocks.js`)

A command-line tool for validating mock response files.

## Usage

### Running Validation

```bash
# Validate all mock response files
npm run validate:mocks

# Validate a specific type
node scripts/validate-mocks.js --type analyzer

# Verbose output with detailed errors
node scripts/validate-mocks.js --verbose

# Strict mode (exit with error code on failure)
node scripts/validate-mocks.js --strict

# Combine options
node scripts/validate-mocks.js --type hackathon --verbose --strict
```

### CLI Options

- `-t, --type <type>`: Validate specific type only (analyzer, hackathon, frankenstein)
- `-s, --strict`: Exit with error code if any validation fails
- `-v, --verbose`: Show detailed validation results
- `-h, --help`: Show help message

### Example Output

```
🔍 Mock Response Validation
============================

📋 Validating analyzer mock responses...
  ✅ Scenario: success (1 variant(s))
  ✅ Scenario: api_error (1 variant(s))
  ✅ Scenario: timeout (1 variant(s))
  ✅ Scenario: rate_limit (1 variant(s))
  ✅ Scenario: invalid_input (1 variant(s))

  Summary:
    Total scenarios: 5
    Total variants: 5
    Failed variants: 0
    Success rate: 100.0%

  ✅ All analyzer mock responses are valid!

============================
✅ All mock responses are valid!
```

## Validation Rules

### Common Rules (All Response Types)

- `statusCode`: Must be a number between 100-599
- `delay`: Optional number >= 0 (milliseconds)
- `data`: Must be an object (either success data or error data)

### Error Responses

All error responses must have:
- `error`: Non-empty string (error code)
- `message`: Non-empty string (error message)

### Analyzer Responses

Success responses must include:
- `detailedSummary`: Non-empty string
- `founderQuestions`: Array of question objects
- `swotAnalysis`: Object with strengths, weaknesses, opportunities, threats arrays
- `currentMarketTrends`: Array of trend objects
- `scoringRubric`: Array of scoring items
- `competitors`: Array of competitor objects
- `monetizationStrategies`: Array of strategy objects
- `improvementSuggestions`: Array of suggestion objects
- `nextSteps`: Array of step objects
- `finalScore`: Number between 0-100
- `finalScoreExplanation`: Non-empty string
- `viabilitySummary`: Non-empty string

### Hackathon Responses

Success responses must include all analyzer fields plus:
- `categoryAnalysis`: Object with evaluations, bestMatch, and bestMatchReason
- `criteriaAnalysis`: Object with scores array and finalScore (0-5)
- `hackathonSpecificAdvice`: Object with optimization tips and strategies

### Frankenstein Responses

Success responses must include:
- `idea_title`: Non-empty string
- `idea_description`: Non-empty string
- `core_concept`: Non-empty string
- `problem_statement`: Non-empty string
- `proposed_solution`: Non-empty string
- `unique_value_proposition`: Non-empty string
- `target_audience`: Non-empty string
- `business_model`: Non-empty string
- `growth_strategy`: Non-empty string
- `tech_stack_suggestion`: Non-empty string
- `risks_and_challenges`: Non-empty string
- `metrics`: Object with 5 scores (0-100 each)
- `summary`: Non-empty string
- `language`: Either 'en' or 'es'

## Integration with Development Workflow

### Pre-commit Validation

Consider adding validation to your pre-commit hooks:

```bash
# In .git/hooks/pre-commit
npm run validate:mocks -- --strict
```

### CI/CD Integration

Add validation to your CI pipeline:

```yaml
# In .github/workflows/ci.yml
- name: Validate Mock Responses
  run: npm run validate:mocks -- --strict
```

### Development Mode

During development, validation warnings are logged but don't block execution. This allows you to iterate on mock data while being aware of validation issues.

### Production Mode

In production environments, validation is skipped entirely to avoid unnecessary overhead, as mock data should not be used in production.

## Troubleshooting

### Common Validation Errors

1. **Missing required field**: Add the missing field to your mock data
2. **Invalid type**: Ensure the field has the correct type (string, number, array, etc.)
3. **Out of range**: Check that numeric values are within valid ranges
4. **Empty string**: Ensure strings have content (minimum length 1)
5. **Invalid enum value**: Use only allowed values (e.g., 'en' or 'es' for language)

### Debugging Validation Issues

1. Run validation with `--verbose` flag to see detailed error messages
2. Check the specific field path in the error message
3. Compare your data structure with the schema in `lib/testing/schemas.ts`
4. Use the TypeScript types exported from schemas for type checking

## Best Practices

1. **Validate early and often**: Run validation after modifying mock data files
2. **Use strict mode in CI**: Ensure validation failures block deployments
3. **Keep schemas updated**: Update schemas when API response structures change
4. **Document custom fields**: Add comments to schemas for non-obvious fields
5. **Test with real data**: Periodically validate that mock data matches production responses

## Future Enhancements

Potential improvements to the validation system:

1. **Schema versioning**: Support multiple schema versions for backward compatibility
2. **Custom validators**: Allow custom validation rules beyond Zod schemas
3. **Auto-fix suggestions**: Provide suggestions for fixing common validation errors
4. **Performance optimization**: Cache validation results for faster repeated validations
5. **Integration with IDE**: Provide real-time validation in code editors
