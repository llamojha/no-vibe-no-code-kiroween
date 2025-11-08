# Domain Layer

The domain layer contains the core business logic and rules of the application. It follows hexagonal architecture principles with strict separation from external dependencies.

## Architecture Principles

- **Pure Business Logic**: No dependencies on frameworks, databases, or external services
- **Strongly Typed**: All entities use typed IDs as value objects
- **Immutable Value Objects**: Domain concepts are represented as immutable objects
- **Business Rule Enforcement**: Entities encapsulate and enforce business invariants

## Directory Structure

```
domain/
├── entities/           # Domain entities with business logic
│   └── shared/        # Base classes for entities and IDs
├── value-objects/     # Immutable value objects
├── repositories/      # Repository interfaces (ports)
├── services/         # Domain services for complex business logic
└── types/           # Domain-specific types and errors
```

## Value Objects

Value objects represent domain concepts that are defined by their value rather than identity. All value objects are immutable and include validation.

### AnalysisId

Strongly-typed identifier for Analysis entities with UUID validation.

```typescript
import { AnalysisId } from '@/domain/value-objects/AnalysisId';

// Create from existing UUID string (validates format)
const id = AnalysisId.fromString('123e4567-e89b-12d3-a456-426614174000');

// Generate new random ID
const newId = AnalysisId.generate();

// Reconstruct from persistence (assumes already validated)
const reconstructedId = AnalysisId.reconstruct(savedUuidString);
```

### Other Value Objects

- **UserId**: Strongly-typed user identifier
- **Score**: Numeric score with range validation (0-100)
- **Email**: Email address with format validation
- **Locale**: Supported locales ('en' | 'es')
- **Category**: Analysis categories for hackathon projects
- **Criteria**: Evaluation criteria with scoring

## Base Classes

### Entity<TId>

Base class for all domain entities. Provides:
- Strongly-typed ID encapsulation
- Equality comparison based on ID
- String representation

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

  // Factory method for creation
  static create(props: AnalysisProps): Analysis {
    // Business validation and invariant enforcement
  }

  // Business methods
  updateScore(newScore: Score): void {
    // Business logic for score updates
  }
}
```

### EntityId

Base class for all entity identifiers. Provides:
- String value encapsulation
- Equality comparison
- Validation of non-empty values

## Repository Interfaces

Repository interfaces define contracts for data access without implementation details. They use domain entities, not DTOs or DAOs.

```typescript
export interface IAnalysisRepository {
  // Command operations (write)
  save(analysis: Analysis): Promise<void>;
  update(analysis: Analysis): Promise<void>;
  delete(id: AnalysisId): Promise<void>;
  
  // Query operations (read)
  findById(id: AnalysisId): Promise<Analysis | null>;
  findByUserId(userId: UserId): Promise<Analysis[]>;
}
```

## Domain Services

Domain services contain business logic that doesn't naturally fit within a single entity. They operate on domain objects and enforce complex business rules.

## Error Handling

Domain-specific errors extend the base `DomainError` class:

```typescript
export abstract class DomainError extends Error {
  abstract readonly code: string;
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}
```

## Usage Guidelines

1. **No External Dependencies**: Domain layer must not import from infrastructure or application layers
2. **Business Logic First**: All business rules and invariants belong in the domain layer
3. **Immutability**: Value objects must be immutable
4. **Validation**: All input validation happens at domain boundaries
5. **Type Safety**: Use strongly-typed IDs and value objects throughout

## Testing

Domain layer components should be tested in isolation without mocks:

```typescript
describe('AnalysisId', () => {
  it('should validate UUID format', () => {
    expect(() => AnalysisId.fromString('invalid-uuid')).toThrow();
  });

  it('should generate valid UUIDs', () => {
    const id = AnalysisId.generate();
    expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
```

## References

- [Hexagonal Architecture Standards](../../.kiro/steering/hexagonal-architecture-standards.md)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Value Objects](https://martinfowler.com/bliki/ValueObject.html)