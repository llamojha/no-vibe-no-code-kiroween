# Property Tests Branch Protection Configuration

This document describes how to configure branch protection rules to block PR merges when property-based tests fail.

## Overview

Property-based tests validate correctness properties across all architectural layers. These tests must pass before code can be merged to ensure systemy and prevent regressions.

## GitHub Repository Settings

### 1. Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click on **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule** or edit an existing rule for `main`

### 2. Add Property Tests to Required Status Checks

#### Status Checks Configuration

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Add Required Status Check**:
    - Search for: `property-tests / Property-Based Tests with Coverage`
    - Or: `Property-Based Tests with Coverage`

### 3. Complete Branch Protection Configuration

Ensure the following checks are also required (if not already configured):

**Required Status Checks:**

- `lint / ESLint Code Quality Check`
- `unit-tests / Vitest Unit Tests with Coverage`
- `e2e-tests / Run E2E Tests`
- `lighthouse / Lighthouse Accessibility Audit`
- `property-tests / Property-Based Tests with Coverage` ← **NEW**

## Workflow Behavior

### Test Execution

- Property tests run on every PR and push to `main`
- Tests execute with coverage tracking
- Coverage report is generated automatically
- Duration is monitored (warning if > 5 minutes)

### Failure Conditions

The workflow will **FAIL** and block merge if:

1. **Any property test fails** - Indicates a correctness property violation
2. **Test execution errors** - Infrastructure or configuration issues
3. **Coverage report generation fails** - Unable to track property coverage

The workflow will **WARN** but not fail if:

1. **Property coverage < 100%** - Some properties don't have tests yet
2. **Duration exceeds 5 minutes** - Tests are taking too long

### Success Criteria

For the workflow to pass and allow merge:

- ✅ All property tests must pass
- ✅ Coverage report must be generated successfully
- ✅ No test execution errors

## Testing the Configuration

### Verify Branch Protection Works

1. Create a test branch with a failing property test:

   ```typescript
   // tests/properties/domain/test-failure.properties.test.ts
   describe("Test Failure", () => {
     it("should fail intentionally", () => {
       expect(true).toBe(false);
     });
   });
   ```

2. Open a pull request to `main`
3. Wait for property tests to run and fail
4. Verify that the "Merge pull request" button is disabled
5. Check for message: "Merging is blocked - Required status check has not succeeded"
6. Remove the failing test and verify merge is allowed

### Verify Coverage Reporting

1. Create a PR with property test changes
2. Wait for workflow to complete
3. Check PR comments for property coverage report
4. Verify coverage percentage is displayed
5. Verify untested properties are listed (if any)

## Property Test Coverage Requirements

### Current Coverage Target

- **Target**: 100% of defined properties should have tests
- **Minimum**: All critical properties must be tested
- **Tracking**: Coverage report shows tested vs. total properties

### Coverage Report Format

The PR comment will include:

```markdown
### 🔍 Property-Based Tests

✅ **Passed** - All 64 properties tested
📊 Coverage: 100%
```

Or if incomplete:

```markdown
### 🔍 Property-Based Tests

⚠️ **Incomplete** - 60/64 properties tested
📊 Coverage: 93.8%

<details>
<summary>Untested Properties (4)</summary>

- P-DOM-015: Credit Transaction Immutability
- P-BIZ-010: Category Explanation Presence
- P-SYS-013: Parallel Execution Safety
- P-SYS-014: Artifact Retention

</details>
```

## Troubleshooting

### Property Tests Failing

**Symptom**: Tests fail with property violations

**Solutions**:

1. Review the failing property test output
2. Check if the code violates the correctness property
3. Verify test generators produce valid test data
4. Ensure property assertions are correct
5. Fix the code or update the property definition

### Coverage Report Not Generated

**Symptom**: Coverage report artifact is missing

**Solutions**:

1. Check if `scripts/generate-property-coverage.cjs` exists
2. Verify `tests/property-coverage-report.json` is created
3. Review workflow logs for script errors
4. Ensure `.kiro/specs/general-properties.md` exists

### Tests Taking Too Long

**Symptom**: Duration warning appears (> 5 minutes)

**Solutions**:

1. Reduce test iterations (currently 100 per property)
2. Optimize test data generators
3. Review slow property tests
4. Consider parallelization options
5. Check for unnecessary async operations

### Status Check Not Appearing

**Symptom**: Property tests check not in required list

**Solutions**:

1. Ensure workflow has run at least once on a PR
2. Check workflow file is named `property-tests.yml`
3. Verify job name: `Property-Based Tests with Coverage`
4. Search for "property-tests" or "Property-Based" in status checks
5. Re-run the workflow if needed

## Performance Monitoring

### Duration Thresholds

- **Target**: < 3 minutes for all property tests
- **Warning**: 5 minutes (logged but doesn't fail)
- **Timeout**: 15 minutes (workflow fails)

### Optimization Tips

1. **Reduce Iterations**: Lower from 100 to 50 for faster tests
2. **Parallel Execution**: Vitest runs tests in parallel by default
3. **Fast Generators**: Optimize faker.js usage
4. **Minimal Setup**: Avoid expensive test setup
5. **Smart Sampling**: Use representative test cases

## CI/CD Integration

### Workflow Triggers

- `pull_request`: opened, synchronize, reopened
- `push`: to `main` branch
- `workflow_dispatch`: manual trigger

### Artifacts Generated

1. **Property Coverage Report** (`property-coverage-report.json`)

   - Total properties count
   - Tested properties count
   - Coverage percentage
   - List of untested properties
   - Retention: 30 days

2. **Property Test Results** (`property-test-results.json`)

   - Test execution results
   - Pass/fail status
   - Test duration
   - Retention: 30 days

3. **Duration Metrics** (`workflow-duration.json`)
   - Workflow execution time
   - Performance tracking
   - Retention: 30 days

### PR Comment Integration

Property test results are automatically posted to PRs via the unified PR comment workflow. The comment includes:

- Overall pass/fail status
- Property coverage percentage
- List of untested properties
- Workflow duration
- Links to detailed reports

## Best Practices

### Writing Property Tests

1. **Clear Property Definitions**: Each property should be well-defined
2. **Valid Test Data**: Generators must produce valid domain data
3. **Meaningful Assertions**: Test the actual property, not implementation
4. **Fast Execution**: Keep tests under 100ms each
5. **Deterministic**: Tests should not be flaky

### Maintaining Coverage

1. **Add Tests for New Properties**: When adding correctness properties
2. **Update Tests for Changes**: When modifying domain logic
3. **Review Coverage Reports**: Check untested properties regularly
4. **Prioritize Critical Properties**: Test security and data integrity first
5. **Document Exceptions**: If a property can't be tested, document why

### Handling Failures

1. **Don't Skip Tests**: Fix the issue, don't disable the test
2. **Investigate Root Cause**: Property violations indicate real bugs
3. **Update Specifications**: If property is wrong, update design doc
4. **Communicate Issues**: Discuss property violations with team
5. **Track Technical Debt**: Log untested properties as issues

## Additional Resources

- [Property-Based Testing Guide](../tests/properties/README.md)
- [General Properties Catalog](../.kiro/specs/general-properties.md)
- [Property Testing Framework Design](../.kiro/specs/property-testing-framework/design.md)
- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

## Example GitHub API Configuration

For automated branch protection setup:

```bash
# Add property tests to required status checks
gh api repos/{owner}/{repo}/branches/main/protection/required_status_checks \
  --method PATCH \
  -f strict=true \
  -f contexts[]="property-tests / Property-Based Tests with Coverage"
```

## Notes

- Property tests complement unit and E2E tests
- 100% property coverage is the goal but not required for merge
- Test failures always block merge (coverage warnings don't)
- Duration warnings help identify performance issues
- Coverage tracking helps maintain test completeness
