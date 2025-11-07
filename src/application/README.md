# Application Layer

The application layer orchestrates business operations and coordinates between the domain layer and infrastructure layer. It contains use cases, handlers, and application services that implement the business workflows.

## Architecture Principles

- **Use Case Driven**: Each business operation is implemented as a dedicated use case
- **Command Query Separation**: Separate handlers for write operations (commands) and read operations (queries)
- **Dependency Injection**: All dependencies are injected through constructors
- **Error Handling**: Comprehensive error handling with typed results

## Directory Structure

```
application/
├── use-cases/          # Business use cases and workflows
│   ├── analysis/      # Analysis-related use cases
│   ├── hackathon/     # Hackathon analysis use cases
│   └── dashboard/     # Dashboard operations
├── handlers/          # Command and query handlers
│   ├── commands/      # Write operation handlers
│   └── queries/       # Read operation handlers
├── services/          # Application services
└── types/            # Application-specific types
```

## Use Cases

Use cases represent specific business operations that the application can perform. They orchestrate domain entities and services to fulfill business requirements.

### Analysis Use Cases

#### AnalyzeIdeaUseCase

Analyzes a startup idea using AI services and saves the result.

```typescript
export class AnalyzeIdeaUseCase {
  constructor(
    private readonly aiService: IAIAnalysisService,
    private readonly analysisRepository: IAnalysisRepository,
    private readonly validationService: AnalysisValidationService
  ) {}

  async execute(command: AnalyzeIdeaCommand): Promise<AnalysisResult> {
    // 1. Validate input
    // 2. Perform AI analysis
    // 3. Create domain entity
    // 4. Save to repository
    // 5. Return result
  }
}
```

#### SaveAnalysisUseCase

Saves an analysis to the user's dashboard.

#### GetAnalysisUseCase

Retrieves a specific analysis by ID with ownership validation.

### Hackathon Use Cases

#### AnalyzeHackathonProjectUseCase

Specialized analysis for hackathon projects with category-specific evaluation.

#### SaveHackathonAnalysisUseCase

Saves hackathon analysis results with proper categorization.

### Dashboard Use Cases

#### GetUserAnalysesUseCase

Retrieves all analyses for a specific user with pagination support.

#### DeleteAnalysisUseCase

Deletes an analysis with ownership validation and business rule enforcement.

## Command and Query Handlers

### Command Handlers

Handle write operations (create, update, delete) with business validation.

```typescript
export class CreateAnalysisHandler {
  constructor(
    private readonly analyzeIdeaUseCase: AnalyzeIdeaUseCase
  ) {}

  async handle(command: CreateAnalysisCommand): Promise<CreateAnalysisResult> {
    try {
      const result = await this.analyzeIdeaUseCase.execute(command);
      return CreateAnalysisResult.success(result);
    } catch (error) {
      return CreateAnalysisResult.failure(error);
    }
  }
}
```

Available command handlers:
- **CreateAnalysisHandler**: Creates new analysis
- **UpdateAnalysisHandler**: Updates existing analysis
- **DeleteAnalysisHandler**: Deletes analysis with validation

### Query Handlers

Handle read operations optimized for data retrieval.

```typescript
export class GetAnalysisHandler {
  constructor(
    private readonly analysisRepository: IAnalysisRepository
  ) {}

  async handle(query: GetAnalysisQuery): Promise<GetAnalysisResult> {
    const analysis = await this.analysisRepository.findById(query.id);
    
    if (!analysis) {
      return GetAnalysisResult.notFound();
    }
    
    if (!analysis.isOwnedBy(query.userId)) {
      return GetAnalysisResult.forbidden();
    }
    
    return GetAnalysisResult.success(analysis);
  }
}
```

Available query handlers:
- **GetAnalysisHandler**: Retrieves single analysis
- **ListAnalysesHandler**: Lists user analyses with pagination
- **SearchAnalysesHandler**: Searches analyses with criteria

## Application Services

Application services handle cross-cutting concerns and external integrations.

### AIAnalysisService

Interface for AI-powered analysis services.

```typescript
export interface IAIAnalysisService {
  analyzeIdea(idea: string, locale: Locale): Promise<AIAnalysisResult>;
  analyzeHackathonProject(project: HackathonProject, locale: Locale): Promise<HackathonAnalysisResult>;
}
```

### AudioProcessingService

Handles text-to-speech and transcription features.

### NotificationService

Manages user notifications and analytics events.

## Types and Commands

### Commands

Commands represent write operations with all necessary data and validation.

```typescript
export interface CreateAnalysisCommand {
  idea: string;
  userId: UserId;
  locale: Locale;
}

export interface UpdateAnalysisCommand {
  id: AnalysisId;
  userId: UserId;
  updates: Partial<AnalysisUpdates>;
}
```

### Queries

Queries represent read operations with filtering and pagination.

```typescript
export interface GetAnalysisQuery {
  id: AnalysisId;
  userId: UserId;
}

export interface ListAnalysesQuery {
  userId: UserId;
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'score';
  sortOrder?: 'asc' | 'desc';
}
```

### Results

Results provide typed responses with success/failure patterns.

```typescript
export class CreateAnalysisResult {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly data?: AnalysisResult,
    public readonly error?: Error
  ) {}

  static success(data: AnalysisResult): CreateAnalysisResult {
    return new CreateAnalysisResult(true, data);
  }

  static failure(error: Error): CreateAnalysisResult {
    return new CreateAnalysisResult(false, undefined, error);
  }
}
```

## Error Handling

Application layer errors extend base application error types:

```typescript
export abstract class ApplicationError extends Error {
  abstract readonly code: string;
}

export class UseCaseError extends ApplicationError {
  readonly code = 'USE_CASE_ERROR';
}

export class ValidationError extends ApplicationError {
  readonly code = 'VALIDATION_ERROR';
}
```

## Integration with Next.js

### Server Actions

Use cases can be directly called from Next.js server actions:

```typescript
// app/actions/analysis.ts
export async function analyzeIdea(formData: FormData) {
  const factory = ServiceFactory.getInstance();
  const useCase = factory.createAnalyzeIdeaUseCase();
  
  const command = CreateAnalysisCommand.fromFormData(formData);
  const result = await useCase.execute(command);
  
  if (result.isSuccess) {
    redirect(`/analysis/${result.data.id}`);
  } else {
    throw new Error(result.error.message);
  }
}
```

### API Routes

Handlers integrate with Next.js API routes through controllers:

```typescript
// Infrastructure layer controller
export class AnalysisController {
  async createAnalysis(request: NextRequest): Promise<NextResponse> {
    const command = await this.parseRequest(request);
    const result = await this.createAnalysisHandler.handle(command);
    
    return this.formatResponse(result);
  }
}
```

## Testing

Application layer components should be tested with mocked dependencies:

```typescript
describe('AnalyzeIdeaUseCase', () => {
  let useCase: AnalyzeIdeaUseCase;
  let mockAIService: jest.Mocked<IAIAnalysisService>;
  let mockRepository: jest.Mocked<IAnalysisRepository>;
  
  beforeEach(() => {
    mockAIService = createMockAIService();
    mockRepository = createMockRepository();
    useCase = new AnalyzeIdeaUseCase(mockAIService, mockRepository, validationService);
  });
  
  it('should analyze idea and save result', async () => {
    // Test implementation
  });
});
```

## Usage Guidelines

1. **Single Responsibility**: Each use case should handle one business operation
2. **Dependency Injection**: All dependencies must be injected through constructors
3. **Error Handling**: Always handle errors gracefully with typed results
4. **Validation**: Validate all inputs using domain services or Zod schemas
5. **Testing**: Mock all external dependencies for unit testing

## References

- [Domain Layer Documentation](../domain/README.md)
- [Infrastructure Layer Documentation](../infrastructure/README.md)
- [Hexagonal Architecture Standards](../../.kiro/steering/hexagonal-architecture-standards.md)