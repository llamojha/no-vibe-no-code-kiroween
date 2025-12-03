# E2E Test Audit

## Current CI Coverage
- `.github/workflows/e2e-tests.yml` runs on PRs to `main`/`develop`, pushes to `main`, and manual dispatch. It installs Node 18, runs `npm ci`, installs Playwright browsers, builds the app with mock-mode env vars, starts the production build via `npm run start`, waits for `/` and `/api/test/mock-status`, and only then executes `npm run test:e2e:coverage`.
- The workflow enforces deterministic mocks by exporting `FF_USE_MOCK_API`, `FF_MOCK_SCENARIO`, dummy Supabase keys, and `NODE_ENV=test` in both build/start phases. A dedicated step curls `/api/test/mock-status` and fails fast if mock mode is off.
- Playwright execution inherits CI-friendly defaults from `playwright.config.ts`: retries (2) and reduced workers (2) on CI, HTML/JSON/JUnit reporters into `tests/e2e/reports`, artifacts under `tests/e2e/artifacts`, and global `global-setup.ts` / `global-teardown.ts`.
- Post-run steps always generate human-readable coverage (`npm run test:e2e:coverage-report`), upload artifacts/results/coverage, produce a PR summary comment, and gate the job with a final JSON review to ensure failures fail the workflow.

## Suite Coverage Snapshot
- `tests/e2e/analyzer.spec.ts` – Startup Analyzer happy path, section verification, mock error scenarios, latency/loading checks, and multi-language assertions.
- `tests/e2e/hackathon.spec.ts` – Kiroween Analyzer flows for multiple project fixtures, category recommendations, mock failure scenarios (`api_error`, `timeout`, `rate_limit`), loading-state, and locale toggles.
- `tests/e2e/frankenstein.spec.ts` – Doctor Frankenstein (companies + AWS modes), localization, animation gating, and explicit API-error handling.
- `tests/e2e/dashboard.spec.ts` – Dashboard load, empty states, navigation CTAs for Analyzer/Kiroween/Frankenstein, saved-analysis viewing, and Frankenstein cards seeded via localStorage.
- `tests/e2e/setup.spec.ts` – Smoke verifications (home page load, viewport config, console logging) to catch catastrophic regressions quickly.
- `tests/e2e/global-setup.ts` / `tests/e2e/setup/mock-mode-setup.ts` – Pre-flight directories + mock-mode enforcement; `tests/e2e/global-teardown.ts` merges Playwright coverage for reporting.

## Gaps & Issues
- Workflow triggers omit any non `main/develop` branches (e.g., release branches). If those need the same guardrail, extend the trigger list.
- The “Generate coverage reports” step is marked `continue-on-error`. Coverage report failures currently don’t fail CI; ensure that’s intentional.

## Best Practices (Keep Doing)
- Keep mock mode mandatory in CI to avoid flaky external API calls; always verify `/api/test/mock-status` before running tests, just like `global-setup` does locally.
- Prefer `npm run test:e2e:coverage` before opening a PR so local behavior matches CI (same env vars + coverage instrumentation).
- Use the Playwright page-object helpers under `tests/e2e/helpers/page-objects` to avoid duplicated selectors and keep tests resilient.
- When adding new tests, extend `tests/e2e/helpers/fixtures.ts` instead of inlining data, so scenarios stay reusable and localized.
- Store artifacts (screens, traces, reports) under `tests/e2e/artifacts`/`reports` to get them automatically uploaded by the workflow when failures happen.

## Improvements & Next Steps
1. **Broaden workflow triggers**  
   - If release/hotfix branches also need E2E coverage, add them to `on.pull_request.branches`/`on.push.branches`.
2. **Treat coverage-report generation as required**  
   - Remove `continue-on-error: true` once the script is stable so broken reports fail the job.
3. **Add a nightly or scheduled run**  
   - A `schedule:` trigger could catch regressions that slip through inactive periods and provides continuous coverage metrics.
4. **Track flake rate**  
   - Monitor retry counts in the Playwright summary; if certain specs retry often, prioritize stabilizing them (e.g., shorter waits, targeted mocks).
