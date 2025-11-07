# Requirements Document

## Introduction

This specification defines the requirements for refactoring the No Vibe No Code application from its current feature-based architecture to a hexagonal architecture (Ports and Adapters pattern). The refactor aims to improve maintainability, testability, and separation of concerns by implementing clear boundaries between business logic, application services, and infrastructure concerns.

## Glossary

- **Hexagonal_Architecture**: An architectural pattern that isolates the core business logic from external concerns through the use of ports and adapters
- **Domain_Layer**: The innermost layer containing business entities, value objects, and domain services with pure business logic
- **Application_Layer**: The layer containing use cases, application services, and orchestration logic that coordinates domain operations
- **Infrastructure_Layer**: The outermost layer containing external adapters like databases, web frameworks, and third-party services
- **Port**: An interface that defines how the application core communicates with the outside world
- **Adapter**: A concrete implementation of a port that handles external system integration
- **Repository_Pattern**: TypeScript interfaces that abstract data access operations from domain logic
- **Command_Handler**: Functions that handle write operations (create, update, delete) with business validation
- **Query_Handler**: Functions that handle read operations optimized for data retrieval without business constraints
- **Value_Object**: An immutable object that represents a concept in the domain with no identity
- **Entity**: A domain object with a unique identity that persists over time
- **Use_Case**: A specific business operation or workflow that the application can perform
- **Entity_ID**: A strongly-typed identifier encapsulated within entities as value objects (e.g., PersonId, AnalysisId)
- **DTO**: Data Transfer Object used for input/output operations in API boundaries
- **DAO**: Data Access Object representing the database-specific structure for persistence
- **Mapper**: A component responsible for converting between domain entities, DTOs, and DAOs
- **Document_Model**: Database-specific representation for document databases (e.g., MongoDB with Mongoose schemas)
- **Supabase_Model**: Database-specific representation for Supabase/PostgreSQL using Supabase client types
- **Next_API_Route**: Next.js API route handlers that serve as web adapters in the infrastructure layer
- **Server_Action**: Next.js server actions that provide direct server-side functionality
- **React_Server_Component**: Server-side React components that can directly access application services
- **Zod_Schema**: TypeScript-first schema validation library used for runtime type checking and validation
- **Service_Composition**: Pattern of combining services through function composition and module imports instead of traditional dependency injection

## Requirements

### Requirement 1

**User Story:** As a developer, I want the application to have clear separation between business logic and external dependencies, so that I can easily test and maintain the core functionality without being coupled to specific frameworks or services.

#### Acceptance Criteria

1. THE Hexagonal_Architecture SHALL isolate all business logic in the Domain_Layer without dependencies on Next.js, React, or external frameworks
2. THE Application_Layer SHALL orchestrate business operations through well-defined Use_Case interfaces using TypeScript interfaces
3. THE Infrastructure_Layer SHALL implement all external system integrations (Supabase, Google AI, etc.) through Port interfaces
4. THE Domain_Layer SHALL contain only pure TypeScript code with strict type definitions and no framework imports
5. WHEN external dependencies change, THE Hexagonal_Architecture SHALL require modifications only in the Infrastructure_Layer adapters

### Requirement 2

**User Story:** As a developer, I want a clear directory structure that reflects the hexagonal architecture principles, so that I can quickly locate and understand the purpose of each component.

#### Acceptance Criteria

1. THE Hexagonal_Architecture SHALL organize code into distinct layers: src/app (Next.js routes), src/domain, src/infrastructure, and src/shared utilities
2. THE Domain_Layer SHALL contain models, repositories (abstracts), and domain services in separate subdirectories with TypeScript interfaces
3. THE Application_Layer SHALL contain implementation services, use cases, and application-specific logic compatible with Next.js server actions
4. THE Infrastructure_Layer SHALL contain Supabase adapters, Next_API_Route handlers, Google AI clients, and TypeScript mappers
5. THE Hexagonal_Architecture SHALL maintain Next.js app directory structure while organizing business logic in src directory

### Requirement 3

**User Story:** As a developer, I want to implement the Repository pattern with clear abstractions, so that I can easily switch between different data storage implementations and write comprehensive tests.

#### Acceptance Criteria

1. THE Repository_Pattern SHALL define abstract TypeScript interfaces for all data access operations in the Domain_Layer
2. THE Repository_Pattern SHALL implement concrete repository classes using Supabase client in the Infrastructure_Layer
3. THE Repository_Pattern SHALL support both Command_Pattern operations (create, update, delete) and Query_Pattern operations (read, search) with TypeScript generics
4. THE Repository_Pattern SHALL provide generic base interfaces for common CRUD operations using TypeScript utility types
5. THE Repository_Pattern SHALL enable dependency injection of repository implementations into Next.js server actions and API routes

### Requirement 4

**User Story:** As a developer, I want to separate command and query operations, so that I can optimize read and write operations independently and maintain clear separation of concerns.

#### Acceptance Criteria

1. THE Command_Handler functions SHALL handle all write operations through dedicated TypeScript functions compatible with Next.js server actions
2. THE Query_Handler functions SHALL handle all read operations through dedicated TypeScript functions optimized for React Server Components
3. THE Application_Layer SHALL provide separate TypeScript interfaces for command and query operations
4. THE Command_Handler functions SHALL validate business rules using TypeScript type guards and Zod schemas before executing operations
5. THE Query_Handler functions SHALL optimize Supabase data retrieval without business logic constraints for fast server-side rendering

### Requirement 5

**User Story:** As a developer, I want proper domain modeling with entities and value objects, so that I can represent business concepts accurately and enforce business invariants.

#### Acceptance Criteria

1. THE Domain_Layer SHALL define Entity classes with strongly-typed Entity_ID value objects encapsulated as identifiers
2. THE Domain_Layer SHALL define Value_Object classes for immutable domain concepts with validation and comparison methods
3. THE Entity classes SHALL encapsulate business rules and invariants within their methods
4. THE Entity_ID SHALL be implemented as type-safe value objects (e.g., PersonId containing DNI as string)
5. THE Domain_Layer SHALL use TypeScript types to enforce compile-time domain constraints

### Requirement 8

**User Story:** As a developer, I want clear separation between data transfer objects and domain entities, so that I can maintain clean API boundaries and protect domain integrity.

#### Acceptance Criteria

1. THE Infrastructure_Layer SHALL define TypeScript DTO interfaces for all Next.js API input and output operations
2. THE Infrastructure_Layer SHALL define DAO interfaces for Supabase-specific data structures and table schemas
3. THE Infrastructure_Layer SHALL provide TypeScript Mapper functions to convert between Entity, DTO, and DAO objects
4. THE DAO interfaces SHALL support Supabase_Model for PostgreSQL operations and potential future database implementations
5. THE DTO interfaces SHALL be used only for Next.js API boundaries and server action parameters, never containing business logic

### Requirement 9

**User Story:** As a developer, I want strict separation between command and query operations at the data access level, so that I can optimize read and write operations independently and maintain data integrity.

#### Acceptance Criteria

1. THE Command_Handler operations (create, update, delete) SHALL use TypeScript DTO interfaces and Zod schemas for input validation and transformation in Next.js server actions
2. THE Query_Handler operations (read, search) SHALL return domain entities directly for React Server Components without requiring DTO transformation
3. THE Repository_Pattern SHALL provide separate TypeScript interfaces for command operations and query operations
4. THE Command_Handler operations SHALL enforce business rules using TypeScript type guards and Zod validation before Supabase persistence
5. THE Query_Handler operations SHALL optimize Supabase queries for read performance without business logic constraints

### Requirement 6

**User Story:** As a developer, I want to maintain compatibility with Next.js App Router and existing features, so that the refactor doesn't break current functionality while improving the architecture.

#### Acceptance Criteria

1. THE Hexagonal_Architecture SHALL preserve all existing Next.js API routes (/api/*) and their functionality
2. THE Infrastructure_Layer SHALL integrate seamlessly with Next.js App Router, server actions, and React Server Components
3. THE Hexagonal_Architecture SHALL maintain compatibility with existing Supabase authentication and database systems
4. THE Application_Layer SHALL preserve all current business features (Google AI analysis, hackathon analysis, dashboard) as use cases
5. THE Hexagonal_Architecture SHALL support the existing TypeScript feature flag system and Next.js internationalization

### Requirement 7

**User Story:** As a developer, I want comprehensive dependency injection and configuration management, so that I can easily manage service dependencies and application configuration.

#### Acceptance Criteria

1. THE Hexagonal_Architecture SHALL implement service composition using TypeScript factory functions and module imports compatible with Next.js server-side execution
2. THE Application_Layer SHALL receive all dependencies through function parameters and module composition using TypeScript interfaces
3. THE Infrastructure_Layer SHALL provide factory functions and service builders for creating configured service instances with proper TypeScript typing
4. THE Hexagonal_Architecture SHALL centralize configuration management using Next.js environment variables and TypeScript configuration objects
5. THE Hexagonal_Architecture SHALL support environment-specific configuration overrides using Next.js environment patterns (.env.local, .env.production)