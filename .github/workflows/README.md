# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated testing and CI/CD.

## Available Workflows

### E2E Tests (`e2e-tests.yml`)

Automated end-to-end testing workflow that runs Playwright tests against the application.

#### Triggers

- **Pull Requests**: Runs on PRs targeting `main` or `develop` branches
- **Push**: Runs on direct pushes to `main` branch
- **Manual**: Can be triggered manually via `workflow_dispatch`

#### Workflow Steps

1. **Setup Environment**
   - Checkout code
   - Setup Node.js 18 with npm caching
   - Install dependencies with `npm ci`

2. **Install Playwright**
   - Installs Playwright browsers (Chromium only for speed)
   - Includes system dependencies with `--with-deps`

3. **Build Application**
   - Builds Next.js application with mock mode enabled
   - Uses dummy Supabase credentials for build (not needed with mocks)

4. **Start Application**
   - Starts production server on port 3000
   - Runs in background with mock mode enabled
   - Waits for server to be ready (60s timeout)

5. **Run E2E Tests**
   - Executes all Playwright tests
   - Captures screenshots on failure
   - Generates test reports (HTML, JSON, JUnit)

6. **Upload Artifacts**
   - **On Failure**: Uploads screenshots, videos, and full reports (7 days retention)
   - **Always**: Uploads test results and reports (30 days retention)

7. **Generate Summary**
   - Creates test summary in GitHub Actions UI
   - Shows pass/fail counts and duration
   - Lists failed tests with error messages

8. **Comment on PR**
   - Posts test results as PR comment
   - Updates existing comment if present
   - Includes pass rate and links to artifacts

9. **Check Status**
   - Fails the workflow if any tests failed
   - Blocks PR merge when configured with branch protection

#### Environment Variables

The workflow uses the following environment variables:

```bash
# Mock Mode Configuration
FF_USE_MOCK_API=true                    # Enable mock API mode
NEXT_PUBLIC_FF_USE_MOCK_API=true        # Client-side mock mode flag
FF_MOCK_SCENARIO=success                # Default test scenario
FF_SIMULATE_LATENCY=false               # Disable latency simulation for speed

# E2E Test Configuration
E2E_BASE_URL=http://localhost:3000      # Application URL
E2E_HEADLESS=true                       # Run in headless mode
E2E_SCREENSHOT_ON_FAILURE=true          # Capture screenshots on failure
E2E_VIDEO_ON_FAILURE=false              # Disable video recording for speed
E2E_TIMEOUT=30000                       # Test timeout (30 seconds)

# Supabase (Dummy values for build)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key-for-build
```

#### Artifacts

The workflow produces the following artifacts:

1. **test-artifacts-{run_number}** (on failure only)
   - Screenshots of failed tests
   - Videos of failed tests (if enabled)
   - Full test reports
   - Retention: 7 days

2. **test-results-{run_number}** (always)
   - JSON test results
   - JUnit XML report
   - HTML test report
   - Retention: 30 days

#### Performance Optimization

- Uses `npm ci` for faster, deterministic installs
- Caches npm dependencies between runs
- Only installs Chromium browser (not Firefox/WebKit)
- Runs 2 parallel workers on CI
- Disables video recording by default
- Retries failed tests up to 2 times

#### Viewing Test Results

1. **In GitHub Actions UI**
   - Go to Actions tab → E2E Tests workflow
   - Click on a workflow run
   - View summary in the run page
   - Download artifacts for detailed analysis

2. **In Pull Request**
   - Test results are automatically posted as a comment
   - Comment updates on each new run
   - Includes pass/fail counts and links to artifacts

3. **HTML Report**
   - Download `test-results` artifact
   - Extract and open `html/index.html` in browser
   - Interactive report with screenshots and traces

#### Troubleshooting

##### Workflow Fails to Start Application

- Check that build step completed successfully
- Verify environment variables are set correctly
- Increase wait timeout if application is slow to start
- Check application logs in workflow output

##### Tests Fail Intermittently

- Review retry configuration (currently 2 retries)
- Check for race conditions in tests
- Verify mock data is deterministic
- Consider increasing timeouts for slow operations

##### Artifacts Not Uploaded

- Ensure test reports are generated in correct location
- Check file paths in upload-artifact steps
- Verify tests actually ran (not skipped)
- Review workflow logs for upload errors

##### PR Comment Not Posted

- Verify `actions/github-script@v7` has permissions
- Check that test results JSON file exists
- Review script errors in workflow logs
- Ensure PR number is available in context

## Adding New Workflows

To add a new workflow:

1. Create a new `.yml` file in this directory
2. Define triggers (`on:` section)
3. Define jobs and steps
4. Test locally with `act` (GitHub Actions local runner)
5. Commit and push to trigger the workflow

## Best Practices

1. **Keep Workflows Fast**
   - Use caching for dependencies
   - Run only necessary tests
   - Parallelize when possible

2. **Make Workflows Reliable**
   - Use specific action versions (not `@latest`)
   - Add retries for flaky operations
   - Handle errors gracefully

3. **Provide Clear Feedback**
   - Generate summaries and reports
   - Upload artifacts for debugging
   - Post results to PRs

4. **Secure Workflows**
   - Use secrets for sensitive data
   - Limit permissions with `permissions:` key
   - Validate inputs in `workflow_dispatch`

5. **Monitor and Maintain**
   - Review workflow run times regularly
   - Update action versions periodically
   - Clean up old artifacts

## Local Testing

To test the E2E workflow locally:

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps

# Build application
npm run build

# Start application with mock mode
FF_USE_MOCK_API=true npm run start &

# Wait for application
npx wait-on http://localhost:3000

# Run E2E tests
npm run test:e2e

# View HTML report
npm run test:e2e:report
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [Branch Protection Setup](./../BRANCH_PROTECTION.md)
- [E2E Test Documentation](../../tests/e2e/README.md)
