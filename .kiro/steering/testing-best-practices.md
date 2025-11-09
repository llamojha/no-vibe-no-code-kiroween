---
title: Testing Best Practices
inclusion: always
---

# Testing Best Practices

## Test Framework: Vitest

This project uses Vitest as the testing framework. Vitest is a fast, modern test runner built for Vite projects with native ESM support.

## Test Execution Commands

```bash
# Run tests once (default for CI/automated contexts)
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage reports
npm run test:coverage
```

## Test File Patterns

- **Location**: Tests are located in `src/**/*.test.ts` and `lib/**/*.test.ts`
- **Naming**: Use `.test.ts` suffix for test files
- **Structure**: Use `describe/it/expect` pattern (Vitest globals enabled)
- **Mocking**: Use Vitest's `vi.mock()` for mocking modules

Example test structure:

```typescript
import { describe, it, expect } from "vitest";

describe("ComponentName", () => {
  describe("methodName", () => {
    it("should perform expected behavior", () => {
      // Arrange
      const input = "test";

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

## Test Organization by Hexagonal Architecture Layer

### Domain Layer Tests

- **Pure unit tests**: Test entities, value objects, and domain services in isolation
- **No mocks**: Domain logic should not depend on external systems
- **Focus**: Business rules, invariants, and validation logic
- **Example**: `src/domain/entities/__tests__/Analysis.test.ts`

### Application Layer Tests

- **Mock dependencies**: Mock repositories and external services
- **Test use cases**: Verify orchestration and business flow
- **Focus**: Use case logic, error handling, and service coordination
- **Example**: `src/application/use-cases/__tests__/AnalyzeIdeaUseCase.test.ts`

### Infrastructure Layer Tests

- **Integration tests**: Test with real dependencies when possible
- **Test adapters**: Verify database repositories, external API clients
- **Focus**: Data mapping, persistence, and external integrations
- **Example**: `src/infrastructure/database/supabase/repositories/__tests__/`

## Vitest Configuration

Configuration is defined in `vitest.config.ts`:

- **Environment**: Node.js
- **Globals**: Enabled (no need to import describe/it/expect)
- **Coverage**: V8 provider with text, JSON, and HTML reporters
- **Path aliases**: Configured to match TypeScript paths (@/domain, @/application, etc.)

## Tesecution Best Practices

- **Minimal verbosity**: Tests run with minimal output by default to prevent timeouts
- **Focused testing**: Use `.only()` to run specific tests during development
- **Skip tests**: Use `.skip()` to temporarily disable tests
- **Parallel execution**: Vitest runs tests in parallel by default for better performance
- **Bail on failure**: Use `--bail` flag to stop on first failure when debugging

## Performance Optimization

- **Parallel execution**: Enabled by default in Vitest
- **Test isolation**: Each test file runs in its own environment
- **Fast re-runs**: Vitest's watch mode only re-runs affected tests
- **Coverage caching**: Coverage reports are cached for faster subsequent runs

## Filtering and Targeting Tests

```bash
# Run tests matching a pattern
npm test -- --grep "Analysis"

# Run tests in a specific file
npm test -- src/domain/entities/__tests__/Analysis.test.ts

# Run only tests marked with .only()
npm test -- --run

# Update snapshots
npm test -- -u
```

## Coverage Requirements

Coverage configuration excludes:

- Type definition files (`*.d.ts`)
- Configuration files (`*.config.*`)
- Test files themselves (`*.test.*`, `*.spec.*`)
- Test utilities (`test-runner.ts`)

Coverage reports are generated in:

- Console output (text format)
- `coverage/` directory (HTML and JSON formats)
