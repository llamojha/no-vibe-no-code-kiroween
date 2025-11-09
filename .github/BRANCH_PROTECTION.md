# Branch Protection Configuration

This document describes how to configure branch protection rules to block PR merges when E2E tests fail.

## GitHub Repository Settings

To enable PR merge blocking based on E2E test results, configure the following branch protection rules:

### 1. Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click on **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule** or edit an existing rule

### 2. Configure Protection Rules for `main` Branch

#### Basic Settings
- **Branch name pattern**: `main`
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1 (recommended)
  - ✅ Dismiss stale pull request approvals when new commits are pushed

#### Status Checks
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks**:
    - `Run E2E Tests` (this is the job name from the workflow)
    - Or search for: `e2e-tests / Run E2E Tests`

#### Additional Settings (Recommended)
- ✅ **Require conversation resolution before merging**
- ✅ **Do not allow bypassing the above settings** (for strict enforcement)
- ⚠️ **Allow force pushes**: Disabled (recommended)
- ⚠️ **Allow deletions**: Disabled (recommended)

### 3. Configure Protection Rules for `develop` Branch (Optional)

Repeat the same configuration for the `develop` branch if you use a development branch workflow.

## Manual Override Options

If you need to allow manual overrides in specific cases:

1. **Option 1: Admin Override**
   - Uncheck "Do not allow bypassing the above settings"
   - Repository admins can then bypass status checks when necessary
   - ⚠️ Use with caution - defeats the purpose of automated testing

2. **Option 2: Workflow Dispatch**
   - The workflow includes `workflow_dispatch` trigger
   - Admins can manually re-run failed tests from the Actions tab
   - If tests pass on re-run, the PR can be merged

3. **Option 3: Skip CI Label**
   - Add a workflow condition to skip tests when a specific label is present
   - Example: Add `[skip-ci]` label to PR to bypass tests
   - ⚠️ Should only be used in emergency situations

## Workflow Status Check Names

The E2E test workflow creates the following status checks:

- **Job Name**: `Run E2E Tests`
- **Workflow Name**: `E2E Tests`
- **Full Status Check Name**: `e2e-tests / Run E2E Tests`

When configuring required status checks, search for "Run E2E Tests" or "e2e-tests".

## Testing the Configuration

To verify that branch protection is working correctly:

1. Create a test branch and make a change that will cause tests to fail
2. Open a pull request to `main`
3. Wait for the E2E tests to run and fail
4. Verify that the "Merge pull request" button is disabled
5. Check that a message appears: "Merging is blocked - Required status check 'Run E2E Tests' has not succeeded"

## Troubleshooting

### Status Check Not Appearing

If the required status check doesn't appear in the list:

1. Ensure the workflow has run at least once on a PR
2. Check that the job name in the workflow matches exactly
3. Try searching for partial names like "E2E" or "Run E2E"
4. Verify the workflow file is in `.github/workflows/` directory

### Tests Passing But Merge Still Blocked

1. Check if there are other required status checks configured
2. Verify that "Require branches to be up to date" is not causing issues
3. Ensure the PR branch is up to date with the base branch
4. Check for any other branch protection rules that might be blocking

### False Positives

If tests are failing due to infrastructure issues (not code issues):

1. Re-run the workflow from the Actions tab
2. Check the workflow logs for infrastructure errors
3. Consider adjusting test timeouts or retry logic
4. Review the test environment configuration

## CI/CD Best Practices

1. **Fast Feedback**: Keep E2E tests fast (< 10 minutes) for quick feedback
2. **Reliable Tests**: Ensure tests are not flaky to avoid false negatives
3. **Clear Errors**: Test failures should provide clear, actionable error messages
4. **Artifacts**: Always upload test artifacts (screenshots, logs) for debugging
5. **Notifications**: Configure GitHub notifications for failed status checks

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)

## Example Configuration (YAML)

For repositories using GitHub's REST API or Terraform to manage settings:

```yaml
# Branch protection configuration
branch_protection:
  pattern: main
  required_status_checks:
    strict: true
    contexts:
      - "e2e-tests / Run E2E Tests"
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
  enforce_admins: true
  restrictions: null
```

## Notes

- The workflow automatically fails if any E2E test fails (see "Check test status" step)
- Test results are posted as PR comments for visibility
- Artifacts are retained for 7 days (failures) or 30 days (all results)
- The workflow runs on both `pull_request` and `push` events to `main`
