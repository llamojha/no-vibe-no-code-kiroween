# Hexagonal Architecture Deployment Configuration

## Overview

This document outlines the deployment configuration for the No Vibe No Code application using hexagonal architecture.

## Architecture Layers

### Domain Layer (`src/domain/`)
- **Pure business logic** - No external dependencies
- **Entities and Value Objects** - Core business concepts
- **Repository Interfaces** - Data access contracts
- **Domain Services** - Business rule implementations

### Application Layer (`src/application/`)
- **Use Cases** - Business operations orchestration
- **Command/Query Handlers** - CQRS pattern implementation
- **Application Services** - Cross-cutting concerns
- **DTOs and Commands** - Data transfer objects

### Infrastructure Layer (`src/infrastructure/`)
- **Database Adapters** - Supabase integration
- **External Service Adapters** - AI, audio, analytics
- **Web Controllers** - Next.js API integration
- **Configuration Management** - Environment setup
- **Service Factories** - Dependency injection

### Shared Layer (`src/shared/`)
- **Common Utilities** - Shared helper functions
- **Types and Constants** - Application-wide definitions
- **Validation Schemas** - Zod schemas

## Build Configuration

### TypeScript Configuration
- **Path Aliases**: `@/domain`, `@/application`, `@/infrastructure`, `@/shared`
- **Strict Mode**: Enabled for type safety
- **Module Resolution**: Bundler mode for Next.js compatibility

### Next.js Configuration
- **Server Actions**: Enabled with 2MB body size limit
- **App Router**: Full support for new architecture
- **API Routes**: Integrated with hexagonal controllers

### Environment Variables

#### Required for Production
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Feature Flags (Server-side)
FF_ENABLE_CLASSIC_ANALYZER=true
FF_ENABLE_KIROWEEN_ANALYZER=true
# Local development mode derives from NODE_ENV; no FF_LOCAL_DEV_MODE

# Feature Flags (Client-side)
NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER=true
NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER=true
```

#### Optional Configuration
```bash
# AI Configuration
AI_TIMEOUT=30000
AI_MAX_RETRIES=3

# Audio Features
NEXT_PUBLIC_FF_ENABLE_AUDIO_FEATURES=true

# Analytics
POSTHOG_API_KEY=your_posthog_key
POSTHOG_HOST=your_posthog_host
```

## Deployment Steps

### 1. Pre-deployment Validation
```bash
npm run validate-architecture
npm run lint
npm run build
```

### 2. Environment Setup
- Configure all required environment variables
- Verify Supabase connection and permissions
- Test AI service integration

### 3. Database Migration
- Ensure Supabase schema is up to date
- Run any pending migrations
- Verify repository implementations

### 4. Build and Deploy
```bash
npm run build
npm run start
```

## Health Checks

### Application Health
- `/api/health` - Basic application health
- Database connectivity check
- AI service availability check
- Feature flag configuration validation

### Architecture Validation
- Domain layer isolation (no external dependencies)
- Proper dependency injection setup
- Repository pattern implementation
- Use case orchestration

## Monitoring and Observability

### Key Metrics
- **Response Times**: API endpoint performance
- **Error Rates**: Application and infrastructure errors
- **Feature Usage**: Feature flag adoption rates
- **Database Performance**: Query execution times

### Logging Strategy
- **Domain Events**: Business logic execution
- **Application Commands**: Use case execution
- **Infrastructure Errors**: External service failures
- **Security Events**: Authentication and authorization

## Rollback Strategy

### Quick Rollback
1. Revert to previous deployment
2. Restore environment variables
3. Verify application functionality

### Database Rollback
1. Restore database snapshot if needed
2. Run rollback migrations
3. Verify data integrity

## Performance Optimization

### Build Optimization
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Optimize bundle sizes
- **Static Generation**: Pre-render pages where possible

### Runtime Optimization
- **Caching**: Repository and service caching
- **Connection Pooling**: Database connections
- **CDN**: Static asset delivery

## Security Considerations

### Authentication
- Supabase Auth integration
- JWT token validation
- Session management

### Authorization
- Role-based access control
- Resource-level permissions
- API endpoint protection

### Data Protection
- Input validation (Zod schemas)
- SQL injection prevention
- XSS protection

## Troubleshooting

### Common Issues

#### Build Failures
- Check TypeScript path aliases
- Verify all dependencies are installed
- Validate environment variables

#### Runtime Errors
- Check Supabase connection
- Verify AI service configuration
- Review feature flag settings

#### Performance Issues
- Monitor database query performance
- Check external service response times
- Review caching configuration

### Debug Commands
```bash
# Architecture validation
npm run validate-architecture

# Type checking
npx tsc --noEmit

# Dependency analysis
npm ls

# Build analysis
npm run build -- --analyze
```

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and rotate API keys quarterly
- Monitor performance metrics weekly
- Validate architecture compliance continuously

### Upgrade Path
- Test new versions in staging environment
- Validate architecture constraints
- Update documentation
- Deploy with rollback plan

## Support

### Documentation
- Architecture design document
- API documentation
- Deployment runbooks
- Troubleshooting guides

### Contacts
- Development Team: Technical implementation
- DevOps Team: Infrastructure and deployment
- Product Team: Feature requirements and priorities
