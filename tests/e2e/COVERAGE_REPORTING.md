# E2E Test Coverage Reporting

This document describes the code coverage reporting system for E2E tests.

## Overview

The E2E test suite now includes automatic code coverage collection and reporting. Coverage data is collected during test execution using Playwright's built-in coverage APIs and processed into human-readable reports.

## Features

- **Automatic Coverage Collection**: Coverage is collected automatically during test execution when enabled
- **HTML Reports**: Beautiful, interactive HTML reports showing coverage by file
- **JSON Reports**: Machine-readable JSON reports for CI/CD integration
- **PR Comments**: Coverage metrics are automatically added to pull request comments
- **Threshold Checking**: Configurable coverage thresholds (default: 70%)
- **File-Level Metrics**: Detailed coverage information for each application file

## Running Tests with Coverage

### Local Development

Run E2E tests with coverage collection:

```bash
npm run test:e2e:coverage
```

Generate coverage reports after tests complete:

```bash
npm run test:e2e:coverage-report
```

View the HTML coverage report:

```bash
open tests/e2e/reports/coverage.html
```

### CI/CD

Coverage is automatically collected and reported in GitHub Actions:

1. Tests run with coverage collection enabled
2. Coverage reports are generated automatically
3. Reports are uploaded as artifacts
4. Coverage metrics are added to PR comments
5. Coverage summary is added to workflow summary

## Coverage Reports

### HTML Report

The HTML report (`tests/e2e/reports/coverage.html`) includes:

- Overall coverage percentage
- Number of files covered
- Total code size and executed code size
- File-by-file coverage breakdown
- Visual indicators for coverage levels (high/medium/low)
- Sortable file list

**Coverage Levels:**
- **High (≥70%)**: Green - Good coverage
- **Medium (50-69%)**: Yellow - Fair coverage
- **Low (<50%)**: Red - Needs improvement

### JSON Report

The JSON report (`tests/e2e/reports/coverage.json`) includes:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "summary": {
    "totalBytes": 1000000,
    "usedBytes": 750000,
    "percentage": 75.0,
    "files": 42
  },
  "files": {
    "app/page.tsx": {
      "url": "http://localhost:3000/_next/static/chunks/app/page.tsx",
      "totalBytes": 5000,
      "coveredBytes": 4000,
      "percentage": 80.0,
      "ranges": 15
    }
  },
  "thresholds": {
    "overall": 70,
    "file": 50
  },
  "meetsThresholds": true
}
```

## Configuration

### Coverage Collection

Coverage collection is controlled by the `E2E_COLLECT_COVERAGE` environment variable:

```bash
# Enable coverage collection
E2E_COLLECT_COVERAGE=true npm run test:e2e

# Disable coverage collection (default for regular test runs)
npm run test:e2e
```

### Coverage Thresholds

Default thresholds are configured in the coverage report generator:

- **Overall Coverage**: 70% minimum
- **File Coverage**: 50% minimum

To modify thresholds, edit `scripts/generate-coverage-report.js`:

```javascript
thresholds: {
  overall: 70,  // Change this value
  file: 50,     // Change this value
}
```

## How It Works

### 1. Coverage Collection

During test execution, the coverage fixture (`tests/e2e/fixtures/coverage-fixture.ts`) automatically:

1. Starts JavaScript and CSS coverage collection before each test
2. Runs the test normally
3. Stops coverage collection after the test
4. Saves coverage data to `tests/e2e/coverage/`

### 2. Coverage Processing

After all tests complete, the global teardown (`tests/e2e/global-teardown.ts`):

1. Reads all individual coverage files
2. Merges coverage data from all tests
3. Filters to include only application code (excludes node_modules, test files, etc.)
4. Saves merged coverage data

### 3. Report Generation

The report generator (`scripts/generate-coverage-report.js`):

1. Reads merged coverage data
2. Calculates detailed metrics for each file
3. Generates HTML report with visualizations
4. Generates JSON report for programmatic access
5. Checks coverage against thresholds

### 4. CI/CD Integration

In GitHub Actions (`.github/workflows/e2e-tests.yml`):

1. Tests run with coverage enabled
2. Coverage reports are generated
3. Reports are uploaded as artifacts
4. Coverage metrics are added to PR comments
5. Coverage summary is added to workflow summary

## Coverage Data Files

Coverage data is stored in `tests/e2e/coverage/`:

- `*-js.json`: Individual test JavaScript coverage
- `*-css.json`: Individual test CSS coverage
- `coverage-merged.json`: Merged coverage from all tests
- `coverage-summary.json`: Coverage summary with thresholds

## Filtering Application Code

Coverage is filtered to include only application code:

**Included:**
- `/app/` - Next.js app directory
- `/features/` - Feature modules
- `/lib/` - Shared libraries
- `/src/` - Source code

**Excluded:**
- `node_modules/` - Third-party dependencies
- `/tests/` - Test files
- `.test.` and `.spec.` files
- Webpack and Next.js internal files

## Troubleshooting

### Coverage Data Not Generated

If coverage data is not being generated:

1. Ensure `E2E_COLLECT_COVERAGE=true` is set
2. Check that tests are running successfully
3. Verify the coverage directory exists: `tests/e2e/coverage/`
4. Check for errors in test output

### Coverage Report Generation Fails

If report generation fails:

1. Ensure merged coverage file exists: `tests/e2e/coverage/coverage-merged.json`
2. Check that the file contains valid JSON
3. Run the generator manually: `npm run test:e2e:coverage-report`
4. Check for errors in the output

### Low Coverage Percentage

If coverage is lower than expected:

1. Review the HTML report to see which files have low coverage
2. Check if important user flows are being tested
3. Consider adding more E2E tests for critical paths
4. Verify that tests are actually exercising the application code

### Coverage Not Appearing in PR Comments

If coverage metrics don't appear in PR comments:

1. Ensure the workflow completed successfully
2. Check that coverage reports were generated
3. Verify the PR comment step didn't fail
4. Check GitHub Actions logs for errors

## Best Practices

1. **Run with Coverage Locally**: Test coverage collection locally before pushing
2. **Review Coverage Reports**: Regularly review coverage reports to identify gaps
3. **Focus on Critical Paths**: Prioritize coverage for critical user flows
4. **Don't Chase 100%**: Aim for meaningful coverage, not perfect coverage
5. **Use Coverage as a Guide**: Coverage is a tool, not a goal
6. **Monitor Trends**: Track coverage over time to ensure it doesn't decrease

## Performance Impact

Coverage collection adds minimal overhead to test execution:

- **Collection**: ~5-10% slower test execution
- **Processing**: ~1-2 seconds for merging and report generation
- **Storage**: ~1-5 MB of coverage data per test run

For faster test runs during development, disable coverage collection:

```bash
npm run test:e2e  # No coverage collection
```

## Future Enhancements

Potential improvements for the coverage system:

1. **Coverage Trends**: Track coverage changes over time
2. **Diff Coverage**: Show coverage for changed files only
3. **Visual Regression**: Integrate with visual regression testing
4. **Custom Thresholds**: Per-file or per-directory thresholds
5. **Coverage Badges**: Generate coverage badges for README
6. **Integration with SonarQube**: Export coverage to code quality platforms

## Related Documentation

- [E2E Testing Setup](./SETUP.md)
- [E2E Testing Infrastructure](./INFRASTRUCTURE_SETUP.md)
- [Playwright Configuration](../../playwright.config.ts)
- [GitHub Actions Workflow](../../.github/workflows/e2e-tests.yml)
