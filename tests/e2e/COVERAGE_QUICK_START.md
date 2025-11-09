# E2E Coverage Quick Start Guide

## Quick Commands

### Run Tests with Coverage
```bash
npm run test:e2e:coverage
```

### Generate Coverage Report
```bash
npm run test:e2e:coverage-report
```

### View HTML Report
```bash
# Windows
start tests/e2e/reports/coverage.html

# macOS
open tests/e2e/reports/coverage.html

# Linux
xdg-open tests/e2e/reports/coverage.html
```

## What Gets Measured

Coverage is collected for:
- ✅ `/app/` - Next.js pages and layouts
- ✅ `/features/` - Feature components and logic
- ✅ `/lib/` - Shared utilities and services
- ✅ `/src/` - Source code

Coverage excludes:
- ❌ `node_modules/` - Third-party code
- ❌ `/tests/` - Test files
- ❌ Webpack/Next.js internals

## Coverage Thresholds

- **70%+** = ✅ Good (Green)
- **50-69%** = ⚠️ Fair (Yellow)
- **<50%** = ❌ Low (Red)

## CI/CD Integration

Coverage is automatically:
1. Collected during test runs
2. Generated as HTML/JSON reports
3. Uploaded as artifacts
4. Added to PR comments
5. Shown in workflow summaries

## Troubleshooting

**No coverage data?**
- Ensure `E2E_COLLECT_COVERAGE=true` is set
- Check tests ran successfully
- Verify `tests/e2e/coverage/` directory exists

**Report generation fails?**
- Ensure merged coverage file exists
- Run: `npm run test:e2e:coverage-report`
- Check for errors in output

**Low coverage?**
- Review HTML report for gaps
- Add tests for critical user flows
- Focus on important features first

## More Information

See [COVERAGE_REPORTING.md](./COVERAGE_REPORTING.md) for complete documentation.
