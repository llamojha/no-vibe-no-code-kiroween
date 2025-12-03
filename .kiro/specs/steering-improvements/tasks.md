#ion Plan

- [x] 1. Update testing-best-practices.md with Vitest-specific content

  - Replace all generic testing framework references with Vitest-only content
  - Include actual npm test commands from package.json (test, test:watch, test:coverage)
  - Document the describe/it/expect pattern used in existing tests
  - Add hexagonal architecture testing guidelines (domain: no mocks, application: mock dependencies, infrastructure: integration tests)
  - Reference vitest.config.ts for configuration details
  - Remove all mentions of Jest, Pytest, and Mocha
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Enhance philosophy.md with critical thinking guidance

  - Add new "Critical Thinking and Reality Check" section after "Scope Control & Minimalism"
  - Include instruction to challenge requests that violate best practices
  - Add requirement to prioritize hexagonal architecture standards over user preferences
  - Include guidance to propose 2-3 alternative approaches when challenging requests
  - Add instruction to maintain respectful but firm tone
  - Include requirement to justify any deviations from standards
  - Add proactive technical debt prevention guidance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Expand structure.md with comprehensive file index
- [x] 3.1 Add Quick Reference Index section organized by hexagonal layers

  - Create Domain Layer subsection with entities, value objects, repositories, and services
  - Create Application Layer subsection with use cases, handlers, and application services
  - Create Infrastructure Layer subsection with database, external services, web layer, factories, and config
  - Create Feature Modules subsection with analyzer, kiroween-analyzer, auth, and dashboard
  - Create Shared Libraries subsection with lib/ contents
  - Create API Routes subsection with app/api/ endpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3.2 Add file-to-purpose mappings for all major files

  - Document each entity file with its purpose
  - Document each value object with its validation rules
  - Document each repository interface and implementation
  - Document each use case with its business operation
  - Document each handler with its command/query type
  - Document each controller with its HTTP endpoints
  - Document each mapper with its conversion responsibility
  - _Requirements: 4.2, 4.3_

- [x] 3.3 Add "Finding Files by Purpose" quick reference section

  - Add guidance for where to add business validation
  - Add guidance for where to add API endpoints
  - Add guidance for where to add database queries
  - Add guidance for where to add AI integration
  - Add guidance for where to add UI components
  - Add guidance for where to find tests
  - _Requirements: 4.5_

- [x] 3.4 Preserve existing structure.md content

  - Keep existing "Architecture Pattern" section
  - Keep existing "Naming Conventions" section
  - Keep existing "Import Patterns" section
  - Keep existing "Component Organization" section
  - Keep existing "API Structure" section
  - _Requirements: 4.6_

- [x] 4. Create agent hook for automatic structure.md updates

  - Create `.kiro/hooks/update-structure-index.json` file
  - Configure manual trigger with descriptive label
  - Write prompt that instructs agent to scan src/, features/, lib/, app/ directories
  - Include instruction to update file index while preserving documentation
  - Add instruction to append timestamp comment
  - Include .kiro/steering/structure.md and relevant directories in context
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Verify git-best-practices.md is properly disabled
  - Confirm frontmatter contains `inclusion: never`
  - Verify file is not being included in agent context
  - _Requirements: 3.1, 3.2, 3.3_
