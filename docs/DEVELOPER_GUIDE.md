# Developer Guide

This guide provides step-by-step instructions for adding new features to the No Vibe No Code application using hexagonal architecture principles.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Adding a New Feature](#adding-a-new-feature)
4. [Testing Guidelines](#testing-guidelines)
5. [Code Style and Standards](#code-style-and-standards)
6. [Deployment](#deployment)

## Architecture Overview

The application follows hexagonal architecture with three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Web API   │  │  Database   │  │  External Services  │  │
│  │ (Next.js)   │  │ (Supabase)  │  │   (Google AI)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Use Cases  │  │  Handlers   │  │  Application        │  │
│  │             │  │ (Cmd/Query) │  │    Services         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Entities   │  │    Value    │  │   Repository        │  │
│  │             │  │   Objects   │  │   Interfaces        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Supabase account (for database)
- Google AI API key (for AI features)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd no-vibe-no-code
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Feature Flags
NEXT_PUBLIC_FF_HACKATHON_ANALYZER=true
# Local dev mode derives from NODE_ENV; no FF_LOCAL_DEV_MODE needed
```

4. Start the development server:
```bash
npm run dev
```

## Adding a New Feature

Follow these steps to add a new feature using hexagonal architecture:

### Step 1: Define Domain Models

Start with the domain layer by defining entities and value objects.

#### 1.1 Create Value Objects

```typescript
// src/domain/value-objects/ProjectId.ts
import { EntityId } from '../entities/shared/EntityId';
import { ValidationUtils } from '@/shared/utils/validation';

export class ProjectId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static fromString(value: string): ProjectId {
    if (!ValidationUtils.isValidUUID(value)) {
      throw new Error(`Invalid ProjectId format: ${value}`);
    }
    return new ProjectId(value);
  }

  static generate(): ProjectId {
    return new ProjectId(ValidationUtils.generateUUID());
  }

  static reconstruct(value: string): ProjectId {
    return new ProjectId(value);
  }
}
```

#### 1.2 Create Domain Entities

```typescript
// src/domain/entities/project/Project.ts
import { Entity } from '../shared/Entity';
import { ProjectId } from '../../value-objects/ProjectId';
import { UserId } from '../../value-objects/UserId';

export interface ProjectProps {
  id?: ProjectId;
  name: string;
  description: string;
  userId: UserId;
  createdAt?: Date;
}

export class Project extends Entity<ProjectId> {
  private constructor(
    id: ProjectId,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _userId: UserId,
    private readonly _createdAt: Date
  ) {
    super(id);
  }

  static create(props: ProjectProps): Project {
    // Validation
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Project name is required');
    }

    if (props.name.length > 100) {
      throw new Error('Project name must be 100 characters or less');
    }

    return new Project(
      props.id || ProjectId.generate(),
      props.name.trim(),
      props.description,
      props.userId,
      props.createdAt || new Date()
    );
  }

  static reconstruct(props: Required<ProjectProps>): Project {
    return new Project(
      props.id,
      props.name,
      props.description,
      props.userId,
      props.createdAt
    );
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get userId(): UserId { return this._userId; }
  get createdAt(): Date { return this._createdAt; }

  // Business methods
  isOwnedBy(userId: UserId): boolean {
    return this._userId.equals(userId);
  }
}
```

#### 1.3 Define Repository Interface

```typescript
// src/domain/repositories/IProjectRepository.ts
import { Project } from '../entities/project/Project';
import { ProjectId } from '../value-objects/ProjectId';
import { UserId } from '../value-objects/UserId';

export interface IProjectRepository {
  // Command operations
  save(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
  delete(id: ProjectId): Promise<void>;
  
  // Query operations
  findById(id: ProjectId): Promise<Project | null>;
  findByUserId(userId: UserId): Promise<Project[]>;
  findByUserIdPaginated(
    userId: UserId, 
    page: number, 
    limit: number
  ): Promise<{
    projects: Project[];
    total: number;
  }>;
}
```

### Step 2: Implement Application Layer

#### 2.1 Create Use Cases

```typescript
// src/application/use-cases/project/CreateProjectUseCase.ts
import { Project } from '@/domain/entities/project/Project';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { UserId } from '@/domain/value-objects/UserId';

export interface CreateProjectCommand {
  name: string;
  description: string;
  userId: UserId;
}

export interface CreateProjectResult {
  project: Project;
}

export class CreateProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(command: CreateProjectCommand): Promise<CreateProjectResult> {
    // 1. Create domain entity
    const project = Project.create({
      name: command.name,
      description: command.description,
      userId: command.userId
    });

    // 2. Save to repository
    await this.projectRepository.save(project);

    // 3. Return result
    return { project };
  }
}
```

#### 2.2 Create Command Handlers

```typescript
// src/application/handlers/commands/CreateProjectHandler.ts
import { CreateProjectUseCase, CreateProjectCommand } from '../../use-cases/project/CreateProjectUseCase';

export class CreateProjectResult {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly data?: any,
    public readonly error?: Error
  ) {}

  static success(data: any): CreateProjectResult {
    return new CreateProjectResult(true, data);
  }

  static failure(error: Error): CreateProjectResult {
    return new CreateProjectResult(false, undefined, error);
  }
}

export class CreateProjectHandler {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase
  ) {}

  async handle(command: CreateProjectCommand): Promise<CreateProjectResult> {
    try {
      const result = await this.createProjectUseCase.execute(command);
      return CreateProjectResult.success(result);
    } catch (error) {
      return CreateProjectResult.failure(error as Error);
    }
  }
}
```

### Step 3: Implement Infrastructure Layer

#### 3.1 Create Repository Implementation

```typescript
// src/infrastructure/database/supabase/repositories/SupabaseProjectRepository.ts
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/project/Project';
import { ProjectId } from '@/domain/value-objects/ProjectId';
import { UserId } from '@/domain/value-objects/UserId';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProjectMapper } from '../mappers/ProjectMapper';
import { DatabaseError } from '../../types/errors';

export class SupabaseProjectRepository implements IProjectRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly mapper: ProjectMapper
  ) {}

  async save(project: Project): Promise<void> {
    const dao = this.mapper.toDAO(project);
    const { error } = await this.client
      .from('projects')
      .insert(dao);
    
    if (error) {
      throw new DatabaseError('Failed to save project', error);
    }
  }

  async findById(id: ProjectId): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError('Failed to find project', error);
    }

    return data ? this.mapper.toDomain(data) : null;
  }

  async findByUserId(userId: UserId): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find projects', error);
    }

    return data.map(dao => this.mapper.toDomain(dao));
  }

  // ... other methods
}
```

#### 3.2 Create Data Mapper

```typescript
// src/infrastructure/database/supabase/mappers/ProjectMapper.ts
import { Project } from '@/domain/entities/project/Project';
import { ProjectId } from '@/domain/value-objects/ProjectId';
import { UserId } from '@/domain/value-objects/UserId';

export interface ProjectDAO {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export class ProjectMapper {
  toDAO(project: Project): ProjectDAO {
    return {
      id: project.id.value,
      name: project.name,
      description: project.description,
      user_id: project.userId.value,
      created_at: project.createdAt.toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  toDomain(dao: ProjectDAO): Project {
    return Project.reconstruct({
      id: ProjectId.fromString(dao.id),
      name: dao.name,
      description: dao.description,
      userId: UserId.fromString(dao.user_id),
      createdAt: new Date(dao.created_at)
    });
  }

  toDTO(project: Project): ProjectDTO {
    return {
      id: project.id.value,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString()
    };
  }
}
```

#### 3.3 Create Web Controller

```typescript
// src/infrastructure/web/controllers/ProjectController.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreateProjectHandler } from '@/application/handlers/commands/CreateProjectHandler';
import { CreateProjectCommand } from '@/application/use-cases/project/CreateProjectUseCase';
import { z } from 'zod';
import { UserId } from '@/domain/value-objects/UserId';

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000)
});

export class ProjectController {
  constructor(
    private readonly createProjectHandler: CreateProjectHandler
  ) {}

  async createProject(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parse and validate request
      const body = await request.json();
      const validatedData = CreateProjectSchema.parse(body);
      
      // 2. Get user from auth (implement based on your auth system)
      const userId = await this.getUserFromRequest(request);
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 3. Create command
      const command: CreateProjectCommand = {
        name: validatedData.name,
        description: validatedData.description,
        userId: UserId.fromString(userId)
      };

      // 4. Execute command
      const result = await this.createProjectHandler.handle(command);

      // 5. Return response
      if (result.isSuccess) {
        return NextResponse.json(result.data, { status: 201 });
      } else {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Project creation error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  private async getUserFromRequest(request: NextRequest): Promise<string | null> {
    // Implement based on your authentication system
    // This is just an example
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    
    // Extract and validate JWT token
    // Return user ID if valid, null otherwise
    return 'user-id-from-token';
  }
}
```

### Step 4: Create Next.js API Route

```typescript
// app/api/projects/route.ts
import { NextRequest } from 'next/server';
import { ServiceFactory } from '@/infrastructure/factories/ServiceFactory';

export async function POST(request: NextRequest) {
  const factory = ServiceFactory.getInstance();
  const controller = factory.createProjectController();
  
  return controller.createProject(request);
}
```

### Step 5: Update Service Factory

```typescript
// src/infrastructure/factories/ServiceFactory.ts
export class ServiceFactory {
  // ... existing methods

  createProjectController(): ProjectController {
    if (!this.services.has('projectController')) {
      const handler = this.createCreateProjectHandler();
      this.services.set('projectController', new ProjectController(handler));
    }
    return this.services.get('projectController');
  }

  private createCreateProjectHandler(): CreateProjectHandler {
    const useCase = this.createCreateProjectUseCase();
    return new CreateProjectHandler(useCase);
  }

  private createCreateProjectUseCase(): CreateProjectUseCase {
    const repository = this.createProjectRepository();
    return new CreateProjectUseCase(repository);
  }

  private createProjectRepository(): IProjectRepository {
    const client = createSupabaseClient();
    const mapper = new ProjectMapper();
    return new SupabaseProjectRepository(client, mapper);
  }
}
```

## Testing Guidelines

### Domain Layer Testing

Test entities and value objects in isolation:

```typescript
// src/domain/entities/__tests__/Project.test.ts
import { Project } from '../project/Project';
import { UserId } from '../../value-objects/UserId';

describe('Project Entity', () => {
  const userId = UserId.generate();

  it('should create project with valid data', () => {
    const project = Project.create({
      name: 'Test Project',
      description: 'A test project',
      userId
    });

    expect(project.name).toBe('Test Project');
    expect(project.description).toBe('A test project');
    expect(project.userId).toBe(userId);
  });

  it('should throw error for empty name', () => {
    expect(() => {
      Project.create({
        name: '',
        description: 'A test project',
        userId
      });
    }).toThrow('Project name is required');
  });
});
```

### Application Layer Testing

Test use cases with mocked dependencies:

```typescript
// src/application/use-cases/__tests__/CreateProjectUseCase.test.ts
import { CreateProjectUseCase } from '../project/CreateProjectUseCase';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { UserId } from '@/domain/value-objects/UserId';

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
  let mockRepository: jest.Mocked<IProjectRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdPaginated: jest.fn()
    };
    
    useCase = new CreateProjectUseCase(mockRepository);
  });

  it('should create and save project', async () => {
    const command = {
      name: 'Test Project',
      description: 'A test project',
      userId: UserId.generate()
    };

    const result = await useCase.execute(command);

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Project',
        description: 'A test project'
      })
    );
    expect(result.project).toBeDefined();
  });
});
```

### Integration Testing

Test API endpoints end-to-end:

```typescript
// src/__tests__/integration/projects.test.ts
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/projects/route';

describe('Projects API', () => {
  it('should create project', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token'
      },
      body: JSON.stringify({
        name: 'Test Project',
        description: 'A test project'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.project.name).toBe('Test Project');
  });
});
```

## Code Style and Standards

### TypeScript Configuration

Use strict TypeScript settings:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Naming Conventions

- **Classes**: PascalCase (`ProjectService`)
- **Interfaces**: PascalCase with `I` prefix (`IProjectRepository`)
- **Variables/Functions**: camelCase (`createProject`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PROJECT_NAME_LENGTH`)
- **Files**: PascalCase for classes, camelCase for utilities

### Import Organization

```typescript
// External libraries
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Domain layer
import { Project } from '@/domain/entities/project/Project';
import { ProjectId } from '@/domain/value-objects/ProjectId';

// Application layer
import { CreateProjectUseCase } from '@/application/use-cases/project/CreateProjectUseCase';

// Infrastructure layer
import { SupabaseClient } from '@/infrastructure/database/supabase/SupabaseClient';

// Shared utilities
import { ValidationUtils } from '@/shared/utils/validation';
```

### Error Handling

Always use typed errors and proper error boundaries:

```typescript
try {
  const result = await useCase.execute(command);
  return Result.success(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return Result.failure(error);
  }
  
  console.error('Unexpected error:', error);
  return Result.failure(new InternalError('Operation failed'));
}
```

## Deployment

### Environment Variables

Set up environment variables for different environments:

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-supabase-key
GEMINI_API_KEY=your-prod-gemini-key
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Database Migrations

Create and run database migrations:

```sql
-- migrations/001_create_projects_table.sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
```

## Best Practices

1. **Start with Domain**: Always begin with domain modeling
2. **Test-Driven Development**: Write tests before implementation
3. **Single Responsibility**: Each class should have one reason to change
4. **Dependency Injection**: Inject all dependencies through constructors
5. **Error Handling**: Use typed errors and proper error boundaries
6. **Documentation**: Document complex business logic and API endpoints
7. **Code Reviews**: All code should be reviewed before merging
8. **Continuous Integration**: Run tests and linting on every commit

## Common Pitfalls

1. **Mixing Layers**: Don't import infrastructure code in domain layer
2. **Anemic Domain Model**: Put business logic in entities, not services
3. **God Objects**: Keep classes focused and small
4. **Missing Validation**: Always validate at domain boundaries
5. **Poor Error Handling**: Don't swallow exceptions or return null
6. **Tight Coupling**: Use interfaces and dependency injection
7. **Missing Tests**: Test all business logic and critical paths

## Resources

- [Hexagonal Architecture Standards](../.kiro/steering/hexagonal-architecture-standards.md)
- [Domain Layer Documentation](../src/domain/README.md)
- [Application Layer Documentation](../src/application/README.md)
- [Infrastructure Layer Documentation](../src/infrastructure/README.md)
- [API Documentation](./API.md)
