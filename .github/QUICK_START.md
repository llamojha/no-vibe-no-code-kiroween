# CI/CD Quick Start Guide

## 🚀 Getting Started

This guide helps you quickly set up and use the CI/CD integration for E2E testing.

## Prerequisites

- GitHub repository with Actions enabled
- Node.js 18+ installed locally
- npm or yarn package manager

## Installation

```bash
# Install dependencies (includes wait-on for CI)
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

## Local Testing

Test the E2E workflow locally before pushing:

```bash
# Build the application
npm run build

# Start with mock mode
FF_USE_MOCK_API=true npm run start &

# Wait for server
npx wait-on http://localhost:3000

# Run E2E tests
npm run test:e2e

# View HTML report
npm run test:e2e:report
```

## CI/CD Workflow

### Automatic Triggers

The workflow runs automatically on:
- ✅ Pull requests to `main` or `develop`
- ✅ Pushes to `main` branch
- ✅ Manual trigger from Actions tab

### What Happens

1. **Setup**: Installs Node.js and dependencies
2. **Build**: Builds application with mock mode
3. **Test**: Runs all E2E tests with Playwright
4. **Report**: Posts results as PR comment
5. **Artifacts**: Uploads screenshots and reports
6. **Status**: Fails if any tests fail (blocks merge)

## Viewing Results

### In Pull Request
- Test results appear as a comment
- Shows pass/fail counts and duration
- Lists failed tests with errors
- Links to full report

### In GitHub Actions
- Go to Actions tab → E2E Tests
- Click on workflow run
- View summary with test statistics
- Download artifacts for detailed analysis

### HTML Report
- Download `test-results` artifact
- Extract and open `html/index.html`
- Interactive report with screenshots

## Branch Protection

Enable merge blocking when tests fail:

1. Settings → Branches → Add rule
2. Branch name: `main`
3. ✅ Require status checks to pass
4. Add: "Run E2E Tests"
5. Save changes

See [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) for details.

## Common Commands

```bash
# Run tests locally
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Troubleshooting

### Tests fail locally but pass in CI
- Check environment variables
- Verify mock mode is enabled
- Ensure dependencies are up to date

### Tests fail in CI but pass locally
- Check CI logs for errors
- Verify build completed successfully
- Check application startup logs

### Merge blocked despite passing tests
- Verify branch protection is configured
- Check status check name matches
- Ensure branch is up to date

### Artifacts not available
- Check workflow completed
- Verify tests actually ran
- Look for upload errors in logs

## Environment Variables

### Local Development
```bash
FF_USE_MOCK_API=true
NEXT_PUBLIC_FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=false
```

### CI/CD (Automatic)
All environment variables are set automatically in the workflow file.

## Best Practices

1. **Run tests locally** before pushing
2. **Keep tests fast** (< 10 minutes total)
3. **Fix flaky tests** immediately
4. **Review artifacts** when tests fail
5. **Update tests** when features change

## Getting Help

- [Workflow Documentation](workflows/README.md)
- [Branch Protection Guide](BRANCH_PROTECTION.md)
- [Implementation Details](CI_CD_IMPLEMENTATION.md)
- [E2E Test Docs](../tests/e2e/README.md)

## Quick Links

- [GitHub Actions](https://github.com/YOUR_ORG/YOUR_REPO/actions)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Need help?** Check the troubleshooting section or review the detailed documentation.
