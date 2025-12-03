# Contributing to No Vibe No Code

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Architecture Guidelines](#architecture-guidelines)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Areas We Need Help](#areas-we-need-help)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- Be respectful and constructive in all interactions
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the project and community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Google Gemini API key
- Supabase account (or use local storage mode when available)
- Familiarity with TypeScript, React, and Next.js

### Setup Development Environment

1. **Fork and clone the repository**

```bash
git clone https://github.com/amllamojha/no-vibe-no-code-kiroween.git
cd no-vibe-no-code
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. **Run the development server**

```bash
npm run dev
```

5. **Run tests to verify setup**

```bash
npm test
npm run test:properties
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

### Development Process

1. **Create a new branch** from `main`

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our architecture guidelines

3. **Write tests** for new functionality

   - Unit tests for domain logic
   - Property tests for business rules
   - E2E tests for user workflows

4. **Run quality checks**

   ```bash
   npm run lint          # ESLint
   npm test              # Unit tests
   npm run test:properties  # Property tests
   npm run test:e2e      # E2E tests (optional locally)
   ```

5. **Commit your changes** using conventional commits

6. **Push and create a Pull Request**

## Architecture Guidelines

This project follows **hexagonal architecture** (Ports and Adapters pattern). Please read [hexagonal-architecture-standards.md](.kiro/steering/hexagonal-architecture-standards.md) before contributing.

### Key Principles

1. **Domain Layer** (`src/domain/`)

   - Pure business logic with NO external dependencies
   - Entities, value objects, and domain services
   - Repository interfaces (ports)

2. **Application Layer** (`src/application/`)

   - Use cases and application services
   - Orchestrates domain logic
   - Depends only on domain layer

3. **Infrastructure Layer** (`src/infrastructure/`)

   - External adapters (database, AI, web)
   - Implements domain repository interfaces
   - Depends on domain and application layers

4. **Features Layer** (`features/`)
   - UI components and client-side logic
   - Feature-specific code organization

### Dependency Rules

```
Domain ← Application ← Infrastructure
                    ← Features
```

- Domain has NO dependencies
- Application depends only on Domain
- Infrastructure depends on Domain and Application
- Features depend on Application and Infrastructure

### File Organization

- Keep related files together (entities, value objects, repositories)
- Use index.ts for clean exports
- Co-locate tests with source files
- Follow existing naming conventions

## Testing Requirements

### Test Coverage

All new code must include appropriate tests:

1. **Unit Tests** (Vitest)

   - Test domain entities and value objects
   - Test use cases with mocked dependencies
   - Test utility functions

2. **Property Tests** (Vitest + Faker)

   - Test business rules and invariants
   - Test data integrity (serialization, persistence)
   - Test system properties (idempotency, caching)

3. **E2E Tests** (Playwright)
   - Test critical user workflows
   - Test integration between components

### Writing Tests

**Unit Test Example:**

```typescript
import { describe, it, expect } from "vitest";
import { Score } from "../Score";

describe("Score", () => {
  it("should accept valid scores", () => {
    const score = new Score(75);
    expect(score.value).toBe(75);
  });

  it("should reject invalid scores", () => {
    expect(() => new Score(101)).toThrow();
  });
});
```

**Property Test Example:**

```typescript
import { describe, it, expect } from "vitest";
import { forAll } from "../utils/property-helpers";
import { generateScore } from "../utils/generators";

describe("Score Properties", () => {
  it("should maintain value after serialization", () => {
    forAll(generateScore, (score) => {
      const json = JSON.stringify(score.value);
      const restored = new Score(JSON.parse(json));
      expect(restored.equals(score)).toBe(true);
    });
  });
});
```

### Running Tests

```bash
# Unit tests
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Property tests
npm run test:properties
npm run test:properties:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui         # Interactive mode
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear and structured commit history.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(analyzer): add support for multi-language analysis

Implements Spanish language support for startup idea analysis.
Adds locale detection and translation utilities.

Closes #123

---

fix(credits): prevent negative credit balance

Adds validation to ensure credit balance cannot go below zero.
Includes property test for credit invariants.

Fixes #456

---

docs(readme): update installation instructions

Clarifies Supabase setup steps and adds troubleshooting section.
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass locally
2. ✅ Code follows architecture guidelines
3. ✅ New tests added for new functionality
4. ✅ Documentation updated if needed
5. ✅ Commits follow conventional commit format
6. ✅ No merge conflicts with main branch

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Property tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing

## Checklist

- [ ] Follows hexagonal architecture
- [ ] Code is self-documenting or includes comments
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues

Closes #issue_number
```

### Review Process

1. **Automated Checks**: CI runs linting, tests, and accessibility audits
2. **Code Review**: Maintainers review code quality and architecture
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, maintainers will merge

### After Merge

- Your contribution will be included in the next release
- You'll be added to the contributors list
- Thank you for making the project better! 🎉

## Areas We Need Help

### High Priority

- 🐛 **Bug Fixes**: Check [open issues](https://github.com/amllamojha/no-vibe-no-code-kiroween/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
- 📝 **Documentation**: Improve guides, add examples, fix typos
- 🧪 **Property Tests**: Add more property-based tests for system correctness

### Medium Priority

- 🌍 **Translations**: Add support for more languages (French, German, Portuguese, etc.)
- ✨ **Features**: Implement features from the [roadmap](README.md#roadmap)
- 🎨 **UI/UX**: Improve user interface and experience

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/amllamojha/no-vibe-no-code-kiroween/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) - these are great for newcomers!

## Questions?

- 💬 [GitHub Discussions](https://github.com/amllamojha/no-vibe-no-code-kiroween/discussions)
- 📧 Email: support@novibenocode.com
- 📖 [Documentation](docs/)

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0-or-later license.

---

Thank you for contributing to No Vibe No Code! 🚀
