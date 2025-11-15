# Implementation Plan

## Overview

This implementation plan transforms the CI/CD enhancement design into actionable coding tasks. The plan builds incrementally, starting with fixing existing E2E tests, then adding new quality checks (lint, unit tests, Lighthouse), and finally implementing unified PR reporting. Each task references specific requirements and builds on previous work.

---

- [x] 1. Fix and stabilize existing Playwright E2E tests

  - Review current E2E test failures in CI workflow runs
  - Update test selectors and wait conditions for reliability
  - Add proper error handling and retry logic for flaky tests
  - Ensure all E2E tests pass consistently in CI environment
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create ESLint workflow for code quality checks

  - [x] 2.1 Create `.github/workflows/lint.yml` workflow file

    - Configure workflow to trigger on pull request events (opened, synchronize, reopened)
    - Set up Node.js environment with dependency caching
    - Add step to install dependencies with `npm ci`
    - _Requirements: 4.1, 4.5_

  - [x] 2.2 Implement ESLint execution with dual output formats

    - Run ESLint with JSON reporter for machine-readable output
    - Run ESLint with stylish reporter for human-readable summary
    - Configure to capture results even when linting fails
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [x] 2.3 Add artifact upload for lint results

    - Upload `lint-results.json` with detailed ESLint output
    - Upload `lint-summary.txt` with human-readable summary
    - Set 30-day retention period for lint artifacts
    - _Requirements: 4.4, 4.6_

  - [x] 2.4 Implement fail-fast logic for lint errors
    - Parse lint results to distinguish errors from warnings
    - Fail workflow if any ESLint errors are detected
    - Allow workflow to pass with warnings only
    - _Requirements: 4.2, 4.3, 5.1_

- [x] 3. Create unit tests workflow with coverage reporting

  - [x] 3.1 Create `.github/workflows/unit-tests.yml` workflow file

    - Configure workflow to trigger on pull request events
    - Set up Node.js environment with dependency caching
    - Add step to install dependencies with `npm ci`
    - _Requirements: 2.1, 2.6_

  - [x] 3.2 Implement Vitest execution with coverage collection

    - Run Vitest with coverage enabled using `npm run test:coverage`
    - Configure JSON reporter for machine-readable test results
    - Generate coverage reports in multiple formats (JSON, HTML, text)
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.3 Add coverage threshold validation

    - Parse `coverage-summary.json` to extract coverage percentage
    - Check if coverage meets 70% threshold
    - Log warning if coverage is below threshold (non-blocking)
    - _Requirements: 2.7_

  - [x] 3.4 Implement artifact upload for test results and coverage

    - Upload `coverage/` directory with all coverage reports
    - Upload `test-results.json` with test execution details
    - Set 30-day retention period for test artifacts
    - _Requirements: 2.4_

  - [x] 3.5 Add workflow failure logic for failed tests
    - Parse test results to count failures
    - Fail workflow if any unit tests fail
    - Ensure coverage reports are uploaded even on test failure
    - _Requirements: 2.3_

- [x] 4. Create Lighthouse accessibility audit workflow

  - [x] 4.1 Install and configure Lighthouse CI

    - Add `@lhci/cli` package to devDependencies
    - Create `.lighthouserc.json` configuration file
    - Configure audit settings for accessibility, best practices, and SEO
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Configure Lighthouse audit targets

    - Define URLs for home page (`/`)
    - Define URLs for analyzer page (`/analyzer`)
    - Define URLs for dashboard page (`/dashboard`)
    - Define URLs for login page (`/login`)
    - Set numberOfRuns to 3 for averaging results
    - _Requirements: 3.2_

  - [x] 4.3 Set accessibility score thresholds

    - Configure minimum accessibility score of 90 (0.9)
    - Set assertion to error level for accessibility failures
    - Configure best practices as warning level (0.8 threshold)
    - _Requirements: 3.4_

  - [x] 4.4 Create `.github/workflows/lighthouse.yml` workflow file

    - Configure workflow to trigger on pull request events
    - Set up Node.js environment with dependency caching
    - Add steps to build Next.js application
    - Add step to start production server in background
    - _Requirements: 3.1, 6.1_

  - [x] 4.5 Implement Lighthouse audit execution

    - Run `lhci autorun` with configuration file
    - Wait for server readiness before running audits
    - Capture audit results in JSON format
    - _Requirements: 3.1, 3.3_

  - [x] 4.6 Add artifact upload for Lighthouse reports

    - Upload HTML reports for each audited page
    - Upload `lighthouse-results.json` with aggregated scores
    - Set 30-day retention period for Lighthouse artifacts
    - _Requirements: 3.5, 3.7_

  - [x] 4.7 Implement workflow failure logic for accessibility scores
    - Parse Lighthouse results to extract accessibility scores
    - Fail workflow if any page scores below 90
    - Generate list of WCAG violations from audit results
    - _Requirements: 3.4, 3.8_

- [x] 5. Implement unified PR comment reporting

  - [x] 5.1 Create `.github/workflows/pr-comment.yml` workflow file

    - Configure workflow to trigger on workflow_run completion events
    - Set up permissions for pull-requests: write and checks: write
    - Add step to download artifacts from all completed workflows
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Implement result parsing for all check types

    - Parse `lint-results.json` to extract error and warning counts
    - Parse `test-results.json` to extract unit test statistics
    - Parse `coverage-summary.json` to extract coverage percentage
    - Parse E2E test results from `tests/e2e/reports/results.json`
    - Parse `lighthouse-results.json` to extract accessibility scores
    - _Requirements: 5.2_

  - [x] 5.3 Create unified report generation logic

    - Build markdown report with sections for each check type
    - Add emoji indicators for pass/fail status (✅/❌)
    - Include summary section with total checks passed/failed
    - Add links to detailed reports and artifacts
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [x] 5.4 Implement actionable recommendations generation

    - Analyze failed checks to generate specific recommendations
    - Include file paths and line numbers for lint errors
    - List failed test names with error messages
    - List WCAG violations from Lighthouse audits
    - _Requirements: 5.7, 3.8, 4.6_

  - [x] 5.5 Add comment creation and update logic
    - Use `peter-evans/find-comment@v2` to find existing bot comment
    - Use `peter-evans/create-or-update-comment@v3` to post or update comment
    - Ensure comment includes "CI/CD Quality Report" identifier
    - Configure to update existing comment rather than creating duplicates
    - _Requirements: 5.5_

- [x] 6. Implement workflow performance optimizations

  - [x] 6.1 Add dependency caching across all workflows

    - Configure npm cache in setup-node action for all workflows
    - Add Playwright browser caching for E2E workflow
    - Add Next.js build cache for workflows that build the app
    - _Requirements: 6.3_

  - [x] 6.2 Implement conditional workflow execution

    - Add changed files detection step
    - Skip Lighthouse workflow if only test files changed
    - Skip E2E workflow if only documentation files changed
    - _Requirements: 6.4_

  - [x] 6.3 Add workflow duration monitoring

    - Add step to calculate total workflow duration
    - Log warning if duration exceeds 15 minutes
    - Include duration metrics in PR comment
    - _Requirements: 6.2, 6.5_

  - [x] 6.4 Configure parallel execution strategy
    - Ensure lint, unit tests, E2E tests, and Lighthouse run in parallel
    - Configure appropriate timeouts for each workflow
    - Set up workflow dependencies for PR comment generation
    - _Requirements: 6.1_

- [x] 7. Create comprehensive documentation

  - [x] 7.1 Update `.github/workflows/README.md`

    - Document all new workflows (lint, unit-tests, lighthouse, pr-comment)
    - Include trigger conditions and execution flow
    - Add troubleshooting guide for common issues
    - Document environment variables for each workflow
    - _Requirements: All_

  - [x] 7.2 Create CI/CD enhancement completion summary

    - Document implementation status for all requirements
    - List all created files and their purposes
    - Provide testing instructions for validating the implementation
    - Include performance metrics and optimization details
    - _Requirements: All_

  - [x] 7.3 Update project README with CI/CD information
    - Add section describing automated quality checks
    - Include badges for workflow status
    - Document how to run checks locally before pushing
    - _Requirements: All_
