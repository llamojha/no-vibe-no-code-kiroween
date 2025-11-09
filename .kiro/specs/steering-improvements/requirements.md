# Requirements Document

## Introduction

This specification defines improvements to the project's steering files to ensure they accurately reflect current practices, provide better guidance to AI agents, and maintain up-to-date project structure documentation. The steering files serve as contextual guidance for development work and must be accurate, actionable, and automatically maintained.

## Glossary

- **Steering Files**: Markdown files in `.kiro/steering/` that provide contextual guidance and standards for AI-assisted development
- **Vitest**: The testing framework currently used in the project for unit and integration tests
- **Agent Hook**: An automated trigger that executes agent tasks when specific events occur in the IDE
- **Hexagonal Architecture**: The architectural pattern (Ports and Adapters) used to organize the codebase into domain, application, and infrastructure layers
- **File Index**: A comprehensive mapping of file paths to their purposes and responsibilities within the project

## Requirements

### Requirement 1: Accurate Testing Documentation

**User Story:** As a developer using AI assistance, I want the testing best practices to reflect the actual testing tools and commands used in this project, so that I receive accurate guidance when writing or running tests.

#### Acceptance Criteria

1. WHEN the testing-best-practices.md file is read, THE Steering_System SHALL provide only Vitest-specific commands and patterns
2. THE Steering_System SHALL remove all references to Jest, Pytest, and Mocha from testing-best-practices.md
3. THE Steering_System SHALL include the actual npm test commands defined in package.json
4. THE Steering_System SHALL document the Vitest configuration patterns used in the project
5. THE Steering_System SHALL include examples of the describe/it/expect patterns used in existing test files

### Requirement 2: Critical Thinking Guidance

**User Story:** As a project maintainer, I want AI agents to challenge user requests that violate best practices or architectural standards, so that code quality and architectural integrity are maintained.

#### Acceptance Criteria

1. WHEN philosophy.md is read, THE Steering_System SHALL include a "Critical Thinking and Reality Check" section
2. THE Steering_System SHALL instruct agents to prioritize best practices over user preferences
3. THE Steering_System SHALL require agents to challenge requests that violate hexagonal architecture principles
4. THE Steering_System SHALL instruct agents to provide alternative approaches when user requests are suboptimal
5. THE Steering_System SHALL maintain a respectful but firm tone when challenging user decisions

### Requirement 3: Git Practices Deactivation

**User Story:** As a developer, I want git-related guidance disabled since Kiro doesn't automatically manage git operations, so that agents don't provide irrelevant git-related suggestions.

#### Acceptance Criteria

1. WHEN git-best-practices.md is evaluated for inclusion, THE Steering_System SHALL exclude it from agent context
2. THE Steering_System SHALL maintain the file with `inclusion: never` in the frontmatter
3. THE Steering_System SHALL preserve the file content for potential future use

### Requirement 4: Comprehensive Structure Documentation

**User Story:** As an AI agent, I want a comprehensive index of all project files with their purposes and locations, so that I can quickly locate relevant files without expensive search operations.

#### Acceptance Criteria

1. WHEN structure.md is read, THE Steering_System SHALL provide a complete file index organized by architectural layer
2. THE Steering_System SHALL document the purpose and responsibility of each major file and directory
3. THE Steering_System SHALL include path mappings for domain entities, value objects, repositories, use cases, handlers, and controllers
4. THE Steering_System SHALL document the relationship between hexagonal architecture layers and file locations
5. THE Steering_System SHALL include examples of where to find specific types of functionality
6. THE Steering_System SHALL maintain the existing naming conventions and import patterns sections

### Requirement 5: Automated Structure Maintenance

**User Story:** As a project maintainer, I want the structure.md file to be automatically updated after significant changes, so that the file index remains accurate without manual intervention.

#### Acceptance Criteria

1. WHEN a spec task is completed, THE Agent_Hook_System SHALL trigger an update to structure.md
2. WHEN new files are created in src/ directories, THE Agent_Hook_System SHALL add them to the file index
3. THE Agent_Hook_System SHALL preserve manual documentation while updating the file index
4. THE Agent_Hook_System SHALL organize files by hexagonal architecture layers
5. THE Agent_Hook_System SHALL include a timestamp of the last automatic update
