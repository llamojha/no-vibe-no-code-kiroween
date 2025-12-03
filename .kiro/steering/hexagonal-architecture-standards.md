---
title: Project Hexagonal Arquitecture
inclusion: always
---

# Hexagonal Architecture Standards

## Architecture Overview

This project follows hexagonal architecture (Ports and Adapters pattern) with clear separation between domain, application, and infrastructure layers. All new code must adhere to these architectural principles.

## Directory Structure

```
src/
├── domain/                       # Pure business logic (no external dependencies)
│   ├── entities/                 # Domain entities with encapsulated IDs
│   ├── value-objects/            # Immutable value objects
│   ├── repositories/             # Repository interfaces (ports)
│   ├── services/                 # Domain services
│   └── types/                    # Domain types and errors
├── application/                  # Use cases and application logic
│   ├── use-cases/               # Business use cases
│   ├── handlers/                # Command and query handlers
│   ├── services/                # Application services
│   └── types/                   # Application types
├── infrastructure/              # External adapters and implementations
│   ├── database/                # Database adapters (Supabase)
│   ├── external/                # External service adapters
│   ├── web/                     # Web adapters (Next.js controllers)
│   ├── config/                  # Configuration management
│   └── factories/               # Service factories
└── shared/                      # Shared utilities and types
```

## Domain Layer Rules

### Entities
- Must extend base `Entity<TId>` class
- Must encapsulate strongly-typed ID as value object (e.g., `AnalysisId`, `UserId`)
- Must contain business logic and enforce invariants
- Must have factory methods for creation and reconstruction
- Must never depend on external frameworks or infrastructure

```typescript
export class Analysis extends Entity<AnalysisId> {
  private constructor(
    id: AnalysisId,
    private readonly idea: string,
    private readonly userId: UserId,
    private readonly score: Score
  ) {
    super(id);
  }

  static create(props: AnalysisProps): Analysis {
    // Business validation and invariant enforcement
  }
}
```

### Value Objects
- Must be immutable
- Must provide validation in constructor
- Must implement comparison methods
- Must be strongly typed

```typescript
export class Score {
  constructor(private readonly _value: number) {
    if (_value < 0 || _value > 100) {
      throw new Error('Score must be between 0 and 100');
    }
  }

  get value(): number { return this._value; }

  equals(other: Score): boolean {
    return this._value === other._value;
  }
}
```

### Repository Interfaces
- Must define contracts for data access
- Must separate command operations (write) from query operations (read)
- Must use domain entities, not DTOs or DAOs
- Must be implemented in infrastructure layer

## Application Layer Rules

### Use Cases
- Must orchestrate business operations
- Must receive dependencies through constructor injection
- Must validate input using domain services
- Must return domain entities or application-specific result types

### Command and Query Handlers
- Commands: Handle write operations with business validation
- Queries: Handle read operations optimized for data retrieval
- Must use Zod schemas for input validation
- Must handle errors gracefully

```typescript
export class CreateAnalysisHandler {
  constructor(
    private readonly analyzeIdeaUseCase: AnalyzeIdeaUseCase
  ) {}

  async handle(command: CreateAnalysisCommand): Promise<CreateAnalysisResult> {
    // Implementation with error handling
  }
}
```

## Infrastructure Layer Rules

### Repository Implementations
- Must implement domain repository interfaces
- Must use mappers to convert between domain entities and DAOs
- Must handle database-specific errors and convert to domain errors

### Data Mappers
- Must provide `toDAO()`, `toDomain()`, and `toDTO()` methods
- Must handle complex object mapping and nested structures
- Must validate data integrity during conversion

```typescript
export class AnalysisMapper {
  toDAO(analysis: Analysis): AnalysisDAO {
    return {
      id: analysis.id.value,
      idea: analysis.idea,
      user_id: analysis.userId.value,
      // ... other fields
    };
  }

  toDomain(dao: AnalysisDAO): Analysis {
    return Analysis.reconstruct({
      id: AnalysisId.fromString(dao.id),
      idea: dao.idea,
      userId: UserId.fromString(dao.user_id),
      // ... other fields
    });
  }
}
```

### DTOs and DAOs
- DTOs: For API boundaries only, never contain business logic
- DAOs: For database-specific data structures
- Must use Zod schemas for validation
- Must be converted to domain entities before business operations

## Next.js Integration

### API Routes
- Must use controllers that delegate to application layer
- Must validate requests using Zod schemas
- Must handle errors consistently
- Must convert domain entities to DTOs for responses

### Server Actions
- Must integrate with use cases through dependency injection
- Must validate input and handle errors
- Must work with React Server Components

### React Server Components
- Can directly access query handlers for read operations
- Must not perform write operations directly
- Must handle loading and error states

## Error Handling

### Domain Errors
```typescript
export abstract class DomainError extends Error {
  abstract readonly code: string;
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}
```

### Error Boundaries
- API routes must convert domain errors to appropriate HTTP responses
- Use consistent error response format
- Log infrastructure errors, return generic messages to clients

## Testing Standards

### Domain Layer Testing
- Test entities, value objects, and domain services in isolation
- Use pure unit tests without mocks
- Test business logic, validation, and invariants

### Application Layer Testing
- Mock all dependencies (repositories, external services)
- Test use cases and handlers with various scenarios
- Test error handling and edge cases

### Infrastructure Layer Testing
- Test repository implementations with real database connections
- Test mappers with various data scenarios
- Test external service adapters with mocked responses

## Service Composition

### Factory Pattern
- Use factories to create configured service instances
- Implement singleton pattern for expensive resources
- Support different configurations for different environments

```typescript
export class ServiceFactory {
  createAnalysisService(): AnalyzeIdeaUseCase {
    const aiService = this.createAIService();
    const repository = this.createAnalysisRepository();
    const validationService = new AnalysisValidationService();

    return new AnalyzeIdeaUseCase(aiService, repository, validationService);
  }
}
```

## Configuration Management

- Use Next.js environment variables
- Validate configuration at startup
- Support environment-specific overrides
- Centralize configuration in dedicated modules

## Import Standards

- Use TypeScript path aliases: `@/domain`, `@/application`, `@/infrastructure`
- Group imports: external libraries first, then internal modules
- Never import from infrastructure layer in domain layer
- Application layer can import from domain layer only

## Code Quality

- Use strict TypeScript configuration
- Implement comprehensive error handling
- Write descriptive variable and function names
- Keep functions small and focused
- Use meaningful commit messages following conventional commits

## Migration Guidelines

When migrating existing code to hexagonal architecture:

1. Start with domain layer (entities, value objects)
2. Create repository interfaces
3. Implement application layer (use cases, handlers)
4. Build infrastructure adapters
5. Update Next.js integration
6. Write comprehensive tests
7. Clean up legacy code

## Performance Considerations

- Optimize query handlers for read performance
- Use appropriate database indexes
- Implement caching where beneficial
- Monitor and profile critical paths
- Use React Server Components for server-side rendering optimization