# Infrastructure Layer

The infrastructure layer contains all external adapters and implementations that connect the application to external systems like databases, web frameworks, and third-party services.

## Architecture Principles

- **Adapter Pattern**: All external integrations use the adapter pattern
- **Interface Implementation**: Implements domain repository interfaces
- **Data Mapping**: Converts between domain entities, DTOs, and DAOs
- **Configuration Management**: Centralizes all external service configuration

## Directory Structure

```
infrastructure/
├── database/           # Database adapters and implementations
│   └── supabase/      # Supabase-specific implementations
│       ├── repositories/  # Repository implementations
│       └── mappers/      # Data mappers
├── external/          # External service adapters
│   ├── ai/           # AI service integrations
│   └── analytics/    # Analytics service integrations
├── web/              # Web framework adapters
│   ├── controllers/  # Next.js API controllers
│   ├── middleware/   # Request/response middleware
│   └── dto/         # Data Transfer Objects
├── config/           # Configuration management
├── factories/        # Service factories and builders
├── bootstrap/        # Application initialization
├── integration/      # Integration utilities
└── examples/         # Usage examples
```

## Database Layer

### Supabase Integration

The database layer uses Supabase as the primary data store with PostgreSQL.

#### Repository Implementations

Repository implementations convert between domain entities and database records:

```typescript
export class SupabaseAnalysisRepository implements IAnalysisRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly mapper: AnalysisMapper
  ) {}

  async save(analysis: Analysis): Promise<void> {
    const dao = this.mapper.toDAO(analysis);
    const { error } = await this.client
      .from('analyses')
      .insert(dao);
    
    if (error) {
      throw new DatabaseError('Failed to save analysis', error);
    }
  }

  async findById(id: AnalysisId): Promise<Analysis | null> {
    const { data, error } = await this.client
      .from('analyses')
      .select('*')
      .eq('id', id.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError('Failed to find analysis', error);
    }

    return data ? this.mapper.toDomain(data) : null;
  }
}
```

Available repository implementations:
- **SupabaseAnalysisRepository**: Analysis data operations
- **SupabaseUserRepository**: User data operations

#### Data Mappers

Mappers handle conversion between different data representations:

```typescript
export class AnalysisMapper {
  toDAO(analysis: Analysis): AnalysisDAO {
    return {
      id: analysis.id.value,
      idea: analysis.idea,
      user_id: analysis.userId.value,
      score: analysis.score.value,
      created_at: analysis.createdAt.toISOString(),
      locale: analysis.locale.value,
    };
  }

  toDomain(dao: AnalysisDAO): Analysis {
    return Analysis.reconstruct({
      id: AnalysisId.fromString(dao.id),
      idea: dao.idea,
      userId: UserId.fromString(dao.user_id),
      score: Score.fromNumber(dao.score),
      createdAt: new Date(dao.created_at),
      locale: Locale.fromString(dao.locale),
    });
  }

  toDTO(analysis: Analysis): AnalysisDTO {
    return {
      id: analysis.id.value,
      idea: analysis.idea,
      score: analysis.score.value,
      createdAt: analysis.createdAt.toISOString(),
    };
  }
}
```

### Database Schema

The application uses the following main tables:

- **analyses**: Stores analysis results and metadata
- **users**: User profiles and authentication data
- **hackathon_analyses**: Specialized hackathon project analyses

## External Services

### AI Service Adapters

#### Google AI Adapter

Integrates with Google Gemini AI for idea analysis:

```typescript
export class GoogleAIAdapter implements IAIAnalysisService {
  constructor(private readonly config: AIConfig) {}

  async analyzeIdea(idea: string, locale: Locale): Promise<AIAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(idea, locale);
    const response = await this.geminiClient.generateContent(prompt);
    
    return this.parseAnalysisResponse(response);
  }
}
```

#### Text-to-Speech Adapter

Provides audio generation capabilities:

```typescript
export class TextToSpeechAdapter {
  async generateSpeech(text: string, locale: Locale): Promise<AudioBuffer> {
    // Implementation for TTS generation
  }
}
```

#### Transcription Adapter

Handles audio-to-text conversion:

```typescript
export class TranscriptionAdapter {
  async transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
    // Implementation for audio transcription
  }
}
```

### Analytics Integration

#### PostHog Adapter

Integrates with PostHog for user analytics:

```typescript
export class PostHogAdapter {
  async trackEvent(userId: UserId, event: string, properties: Record<string, any>): Promise<void> {
    // Implementation for event tracking
  }
}
```

## Web Layer

### Next.js Controllers

Controllers handle HTTP requests and delegate to application layer handlers:

```typescript
export class AnalysisController {
  constructor(
    private readonly createAnalysisHandler: CreateAnalysisHandler,
    private readonly getAnalysisHandler: GetAnalysisHandler
  ) {}

  async createAnalysis(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Validate and parse request
      const dto = await this.parseAndValidateRequest(request);
      
      // 2. Convert DTO to command
      const command = CreateAnalysisCommand.fromDTO(dto);
      
      // 3. Execute command
      const result = await this.createAnalysisHandler.handle(command);
      
      // 4. Return response
      if (result.isSuccess) {
        return NextResponse.json(result.data, { status: 201 });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

Available controllers:
- **AnalysisController**: Analysis operations
- **HackathonController**: Hackathon analysis operations
- **DashboardController**: Dashboard operations

### Middleware

#### Authentication Middleware

Handles user authentication using Supabase Auth:

```typescript
export class AuthMiddleware {
  async authenticate(request: NextRequest): Promise<User | null> {
    const token = this.extractToken(request);
    if (!token) return null;
    
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    return error ? null : user;
  }
}
```

#### Validation Middleware

Validates requests using Zod schemas:

```typescript
export class ValidationMiddleware {
  static validate<T>(schema: ZodSchema<T>) {
    return async (request: NextRequest): Promise<T> => {
      const body = await request.json();
      return schema.parse(body);
    };
  }
}
```

### Data Transfer Objects (DTOs)

DTOs define the structure for API requests and responses:

```typescript
// Request DTOs
export interface CreateAnalysisDTO {
  idea: string;
  locale: string;
}

// Response DTOs
export interface AnalysisResponseDTO {
  id: string;
  idea: string;
  score: number;
  detailedSummary: string;
  createdAt: string;
}

// Validation Schemas
export const CreateAnalysisSchema = z.object({
  idea: z.string().min(10).max(5000),
  locale: z.enum(['en', 'es'])
});
```

## Configuration Management

### Environment Configuration

Centralized configuration using Next.js environment variables:

```typescript
export interface AppConfig {
  database: DatabaseConfig;
  ai: AIConfig;
  features: FeatureConfig;
}

export function getAppConfig(): AppConfig {
  return {
    database: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ai: {
      geminiApiKey: process.env.GEMINI_API_KEY!,
      timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
    },
    features: {
      enableHackathonAnalyzer: process.env.NEXT_PUBLIC_FF_HACKATHON_ANALYZER === 'true',
      enableAudioFeatures: process.env.NEXT_PUBLIC_FF_AUDIO_FEATURES === 'true',
    }
  };
}
```

## Service Composition

### Factory Pattern

Service factories create and configure service instances:

```typescript
export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();
  
  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }
  
  createAnalysisService(): AnalyzeIdeaUseCase {
    if (!this.services.has('analysisService')) {
      const aiService = this.createAIService();
      const repository = this.createAnalysisRepository();
      const validationService = new AnalysisValidationService();
      
      this.services.set('analysisService', 
        new AnalyzeIdeaUseCase(aiService, repository, validationService)
      );
    }
    return this.services.get('analysisService');
  }
}
```

### Repository Factory

Creates configured repository instances:

```typescript
export class RepositoryFactory {
  static createAnalysisRepository(): IAnalysisRepository {
    const client = createSupabaseClient();
    const mapper = new AnalysisMapper();
    return new SupabaseAnalysisRepository(client, mapper);
  }
}
```

## Error Handling

### Infrastructure Errors

Infrastructure-specific error types:

```typescript
export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly originalError: any
  ) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}
```

### Error Handling in Next.js

Consistent error handling across API routes:

```typescript
export function handleApiError(error: Error): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: error.validationErrors 
      },
      { status: 400 }
    );
  }
  
  if (error instanceof DatabaseError) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  
  // Default error handling
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Testing

Infrastructure layer testing focuses on integration with external systems:

```typescript
describe('SupabaseAnalysisRepository', () => {
  let repository: SupabaseAnalysisRepository;
  let testClient: SupabaseClient;
  
  beforeEach(() => {
    testClient = createTestSupabaseClient();
    repository = new SupabaseAnalysisRepository(testClient, new AnalysisMapper());
  });
  
  it('should save analysis to database', async () => {
    const analysis = createTestAnalysis();
    
    await repository.save(analysis);
    
    const saved = await repository.findById(analysis.id);
    expect(saved).toEqual(analysis);
  });
});
```

## Usage Guidelines

1. **Adapter Pattern**: All external integrations must use the adapter pattern
2. **Error Handling**: Convert external errors to domain-appropriate errors
3. **Configuration**: Use environment variables for all external service configuration
4. **Data Mapping**: Always use mappers to convert between data representations
5. **Testing**: Test with real external services where possible, mock when necessary

## References

- [Domain Layer Documentation](../domain/README.md)
- [Application Layer Documentation](../application/README.md)
- [API Documentation](../../docs/API.md)
- [Hexagonal Architecture Standards](../../.kiro/steering/hexagonal-architecture-standards.md)