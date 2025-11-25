# Document Generation API Routes Integration Tests

## Overview

Comprehensive integration tests for the Document Generation API routes, covering all aspects of the document generation feature including authentication, credit system, feature flags, version management, and export functionality.

## Test File

`tests/integration/document-generation-api-routes.test.ts`

## Test Coverage

### 1. Feature Flag Protection (5 tests)

Tests that all API endpoints respect the `ENABLE_DOCUMENT_GENERATION` feature flag:

- ✅ Generate document endpoint returns 403 when disabled
- ✅ Update document endpoint returns 403 when disabled
- ✅ Regenerate document endpoint returns 403 when disabled
- ✅ Get versions endpoint returns 403 when disabled
- ✅ Export document endpoint returns 403 when disabled

**Requirements Validated:** 21.1, 21.2

### 2. Authentication (2 tests)

Tests that all endpoints require proper authentication:

- ✅ Generate document requires authentication
- ✅ Update document requires authentication

**Requirements Validated:** All endpoints require authentication

### 3. Complete Document Generation Flow (4 tests)

Tests the end-to-end document generation process:

- ✅ Successfully generate PRD document
- ✅ Successfully generate Technical Design document
- ✅ Validate required fields (ideaId, documentType)
- ✅ Validate document type is one of allowed types (prd, technical_design, architecture, roadmap)

**Requirements Validated:** 2.1, 4.1, 6.1, 8.1

### 4. Credit System Integration (3 tests)

Tests credit deduction, validation, and refund logic:

- ✅ Return 402 (Payment Required) when user has insufficient credits
- ✅ Deduct credits on successful generation
- ✅ Handle credit refund on generation failure

**Requirements Validated:** 2.2, 4.2, 6.2, 8.2, 15.1, 15.2, 15.3, 15.4, 15.5, 19.1, 19.2

### 5. Error Handling and Rollback (4 tests)

Tests comprehensive error handling across different failure scenarios:

- ✅ Return 404 when idea not found
- ✅ Return 403 for unauthorized access
- ✅ Handle AI service errors gracefully
- ✅ Handle database errors during save

**Requirements Validated:** 19.1, 19.2, 19.3, 19.4, 19.5

### 6. Version Management (5 tests)

Tests document versioning functionality:

- ✅ Create new version when updating document
- ✅ Retrieve all versions of a document
- ✅ Restore a previous version
- ✅ Validate version number when restoring
- ✅ Create new version when regenerating document

**Requirements Validated:** 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 13.4, 13.5

### 7. Export Functionality (5 tests)

Tests document export in multiple formats:

- ✅ Export document as Markdown
- ✅ Export document as PDF
- ✅ Validate export format parameter
- ✅ Require format parameter for export
- ✅ Include metadata in export headers (title, version, type, date)

**Requirements Validated:** 14.1, 14.2, 14.3, 14.4, 14.5

### 8. Request Validation (3 tests)

Tests input validation across all endpoints:

- ✅ Validate required query parameters for getVersions
- ✅ Validate content field for updateDocument
- ✅ Validate ideaId for regenerateDocument

**Requirements Validated:** All endpoints validate inputs properly

## Test Statistics

- **Total Tests:** 31
- **Test File Size:** 898 lines
- **All Tests Passing:** ✅

## Test Structure

The tests follow the established integration testing patterns:

1. **Mocking Strategy:**

   - Mock all use cases to isolate controller logic
   - Mock feature flags via `@/lib/featureFlags`
   - Mock authentication middleware
   - Use proper TypeScript types for all mocks

2. **Test Organization:**

   - Grouped by functional area (Feature Flags, Authentication, etc.)
   - Clear test names describing what is being tested
   - Consistent setup/teardown with `beforeEach`/`afterEach`

3. **Assertions:**
   - Verify HTTP status codes
   - Verify response body structure
   - Verify use case calls with correct parameters
   - Verify use cases are NOT called when validation fails

## Running the Tests

```bash
# Run all integration tests
npm test -- tests/integration --run

# Run only document generation tests
npm test -- tests/integration/document-generation-api-routes.test.ts --run

# Run with coverage
npm test -- tests/integration/document-generation-api-routes.test.ts --run --coverage
```

## Integration with CI/CD

These tests are designed to run in CI/CD pipelines:

- No external dependencies required (all mocked)
- Fast execution (< 3 seconds)
- Deterministic results
- Clear failure messages

## Next Steps

After these integration tests pass, the following should be implemented:

1. **E2E Tests** (Task 18): Test complete user workflows in browser
2. **Analytics Tracking** (Task 19): Track document generation events
3. **Documentation** (Task 20): Update API and feature documentation

## Related Files

- Controller: `src/infrastructure/web/controllers/DocumentGeneratorController.ts`
- Use Cases: `src/application/use-cases/Generate*.ts`
- API Routes: `app/api/v2/documents/**/*.ts`
- Design Doc: `.kiro/specs/idea-panel-document-generation/design.md`
- Requirements: `.kiro/specs/idea-panel-document-generation/requirements.md`

## Test Maintenance

When adding new endpoints or modifying existing ones:

1. Add corresponding test cases to this file
2. Follow the existing test structure and naming conventions
3. Ensure all error paths are tested
4. Verify feature flag protection
5. Verify authentication requirements
6. Update this documentation

---

**Last Updated:** November 25, 2025
**Status:** ✅ All tests passing (31/31)
