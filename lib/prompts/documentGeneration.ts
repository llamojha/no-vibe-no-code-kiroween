/**
 * AI Prompt Templates for Document Generation
 *
 * This module contains prompt templates for geneing various project documents
 * (PRD, Technical Design, Architecture, Roadmap) using AI assistance.
 *
 * Each template includes:
 * - Clear role context for the AI
 * - Structured sections to generate
 * - Placeholders for contextual information
 * - Output format specifications
 */

/**ontext interface for document generation
 * Contains all information needed to generate contextually relevant documents
 */
export interface DocumentGenerationContext {
  ideaText: string;
  analysisScores?: Record<string, number>;
  analysisFeedback?: string;
  existingPRD?: string;
  existingTechnicalDesign?: string;
  existingArchitecture?: string;
}

/**
 * PRD (Product Requirements Document) Prompt Template
 *
 * Generates a comprehensive PRD that defines what to build and why.
 * Includes problem statement, target users, features, success metrics, and scope.
 *
 * @param context - Document generation context with idea and analysis data
 * @returns Formatted prompt for AI generation
 */
export function generatePRDPrompt(context: DocumentGenerationContext): string {
  const { ideaText, analysisScores, analysisFeedback } = context;

  const scoresText = analysisScores
    ? `\n\nANALYSIS SCORES:\n${JSON.stringify(analysisScores, null, 2)}`
    : "";

  const feedbackText = analysisFeedback
    ? `\n\nANALYSIS FEEDBACK:\n${analysisFeedback}`
    : "";

  return `=== ROLE CONTEXT ===
You are an expert product manager with 15+ years of experience writing Product Requirements Documents (PRDs) for successful startups and tech companies. You excel at translating raw ideas into clear, actionable product specifications that align stakeholders and guide development teams.

Your PRDs are known for being:
- Clear and concise: Easy to understand for both technical and non-technical audiences
- Comprehensive: Cover all essential aspects without unnecessary detail
- Actionable: Provide concrete guidance for implementation
- User-focused: Always grounded in user needs and problems
- Realistic: Balance ambition with practical constraints

=== TASK ===
Generate a comprehensive Product Requirements Document (PRD) for the following startup idea.

IDEA:
${ideaText}${scoresText}${feedbackText}

=== OUTPUT FORMAT ===
Generate a well-structured PRD in Markdown format with the following sections:

## 1. Problem Statement
- Clearly articulate the core problem being solved
- Explain why this problem matters (impact, frequency, urgency)
- Describe the current state and pain points
- Define success: what does "solved" look like?

## 2. Target Users & Personas
- Identify 2-3 primary user personas
- For each persona, include:
  - Demographics and role
  - Goals and motivations
  - Pain points and frustrations
  - Current solutions they use
  - Why they would switch to this product

## 3. User Stories
- Write 8-12 user stories in the format: "As a [persona], I want to [action], so that [benefit]"
- Prioritize stories using MoSCoW method (Must have, Should have, Could have, Won't have)
- Focus on core value proposition in "Must have" stories
- Include edge cases and advanced features in "Could have"

## 4. Features & Requirements
- List key features organized by priority (P0, P1, P2)
- For each feature, include:
  - Feature name and brief description
  - User value: why this matters to users
  - Acceptance criteria: how to know it's done
  - Dependencies: what needs to exist first
- P0 (Critical): Features required for MVP launch
- P1 (Important): Features for competitive parity
- P2 (Nice to have): Features for differentiation

## 5. Success Metrics
- Define 3-5 key metrics to measure product success
- Include both leading indicators (usage, engagement) and lagging indicators (retention, revenue)
- Specify target values where possible (e.g., "30% monthly active user retention")
- Explain how each metric ties to business goals

## 6. Out of Scope
- Explicitly list what will NOT be included in this version
- Explain why these items are deferred (complexity, priority, resources)
- Provide context for future consideration

## 7. Assumptions & Dependencies
- List key assumptions about users, market, technology
- Identify external dependencies (APIs, services, partnerships)
- Note risks if assumptions prove incorrect
- Specify what needs validation before proceeding

=== GUIDELINES ===
1. Be specific and concrete - avoid vague language
2. Ground everything in the user problem and value proposition
3. Use the analysis scores and feedback to inform priorities
4. Balance ambition with realistic scope for an MVP
5. Write for a technical audience but keep it accessible
6. Use clear, professional language
7. Include enough detail for developers to estimate effort
8. Highlight trade-offs and decisions made

=== OUTPUT REQUIREMENTS ===
- Format: Markdown with proper headings and structure
- Length: Comprehensive but focused (aim for clarity over length)
- Tone: Professional, clear, actionable
- Style: Use bullet points, tables, and formatting for readability

Generate the PRD now:`;
}

/**
 * Technical Design Document Prompt Template
 *
 * Generates a comprehensive technical design that defines how to build the product.
 * Includes architecture, tech stack, data models, APIs, security, and deployment.
 *
 * @param context - Document generation context with idea and existing PRD
 * @returns Formatted prompt for AI generation
 */
export function generateTechnicalDesignPrompt(
  context: DocumentGenerationContext
): string {
  const { ideaText, existingPRD } = context;

  const prdContext = existingPRD
    ? `\n\nEXISTING PRD:\n${existingPRD}\n\nUse the PRD above to inform your technical design decisions. Ensure the architecture supports all P0 and P1 features defined in the PRD.`
    : "\n\nNote: No PRD is available yet. Base your technical design on the idea description and make reasonable assumptions about requirements.";

  return `=== ROLE CONTEXT ===
You are an expert software architect with 15+ years of experience designing scalable, maintainable systems for startups and tech companies. You excel at translating product requirements into robust technical architectures that balance immediate needs with future growth.

Your technical designs are known for being:
- Pragmatic: Choose appropriate technology for the problem and stage
- Scalable: Design for growth without over-engineering
- Maintainable: Prioritize code quality and developer experience
- Secure: Build security in from the start
- Cost-effective: Optimize for startup constraints

=== TASK ===
Generate a comprehensive Technical Design Document for the following startup idea.

IDEA:
${ideaText}${prdContext}

=== OUTPUT FORMAT ===
Generate a well-structured Technical Design Document in Markdown format with the following sections:

## 1. Architecture Overview
- Provide a high-level system architecture description
- Explain the overall approach (monolith, microservices, serverless, etc.) and why
- Include a Mermaid diagram showing major components and their interactions
- Highlight key architectural decisions and trade-offs

Example Mermaid diagram:
\`\`\`mermaid
graph TB
    Client[Web/Mobile Client]
    API[API Gateway]
    Auth[Auth Service]
    Core[Core Application]
    DB[(Database)]
    Cache[(Cache)]
    Queue[Message Queue]

    Client --> API
    API --> Auth
    API --> Core
    Core --> DB
    Core --> Cache
    Core --> Queue
\`\`\`

## 2. Technology Stack Recommendations
- Frontend: Framework, libraries, tooling (e.g., React, Next.js, TypeScript)
- Backend: Language, framework, runtime (e.g., Node.js, Python, Go)
- Database: Primary database and rationale (e.g., PostgreSQL, MongoDB)
- Caching: Strategy and technology (e.g., Redis, in-memory)
- Infrastructure: Hosting, deployment, CI/CD (e.g., Vercel, AWS, Docker)
- Third-party services: Authentication, payments, analytics, etc.
- For each choice, explain: why this technology, alternatives considered, trade-offs

## 3. Data Models & Database Schema
- Define core entities and their relationships
- Provide schema definitions for key tables/collections
- Include field types, constraints, indexes
- Explain data modeling decisions (normalization, denormalization)
- Consider data growth and query patterns

Example:
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
\`\`\`

## 4. API Specifications
- Define key API endpoints (RESTful or GraphQL)
- For each endpoint, specify:
  - HTTP method and path
  - Request parameters and body
  - Response format and status codes
  - Authentication requirements
  - Rate limiting considerations
- Use OpenAPI/Swagger style documentation

Example:
\`\`\`
POST /api/v1/users
Request: { email: string, password: string }
Response: { id: string, email: string, token: string }
Status: 201 Created, 400 Bad Request, 409 Conflict
Auth: None (public endpoint)
\`\`\`

## 5. Security Considerations
- Authentication: Strategy and implementation (JWT, OAuth, sessions)
- Authorization: Access control model (RBAC, ABAC)
- Data protection: Encryption at rest and in transit
- Input validation: Sanitization and validation strategies
- API security: Rate limiting, CORS, CSRF protection
- Secrets management: How to handle API keys and credentials
- Compliance: GDPR, CCPA, or other relevant regulations

## 6. Scalability & Performance
- Identify potential bottlenecks and mitigation strategies
- Caching strategy: What to cache, when to invalidate
- Database optimization: Indexing, query optimization, connection pooling
- Horizontal vs vertical scaling approach
- Load balancing and traffic distribution
- Performance targets: Response times, throughput, concurrent users

## 7. Deployment Strategy
- Environment setup: Development, staging, production
- CI/CD pipeline: Build, test, deploy automation
- Infrastructure as Code: Terraform, CloudFormation, or similar
- Monitoring and logging: Tools and strategies
- Backup and disaster recovery: RTO and RPO targets
- Rollback strategy: How to handle failed deployments

## 8. Third-party Integrations
- List required external services and APIs
- For each integration:
  - Purpose and functionality
  - API documentation and SDKs
  - Authentication method
  - Rate limits and quotas
  - Fallback strategy if service is unavailable
  - Cost considerations

=== GUIDELINES ===
1. Be specific about technology choices and justify them
2. Consider the startup stage - avoid over-engineering
3. Prioritize developer experience and velocity
4. Design for testability and maintainability
5. Include diagrams where they add clarity (use Mermaid)
6. Address security from the start, not as an afterthought
7. Consider operational costs and complexity
8. Make trade-offs explicit and documented

=== OUTPUT REQUIREMENTS ===
- Format: Markdown with proper headings, code blocks, and Mermaid diagrams
- Length: Comprehensive but focused (enough detail for implementation)
- Tone: Technical but accessible to developers of varying experience
- Style: Use code examples, diagrams, and tables for clarity

Generate the Technical Design Document now:`;
}

/**
 * Architecture Document Prompt Template
 *
 * Generates a comprehensive architecture document focusing on system design,
 * components, data flow, integrations, and scalability considerations.
 *
 * @param context - Document generation context with idea and existing technical design
 * @returns Formatted prompt for AI generation
 */
export function generateArchitecturePrompt(
  context: DocumentGenerationContext
): string {
  const { ideaText, existingTechnicalDesign } = context;

  const techDesignContext = existingTechnicalDesign
    ? `\n\nEXISTING TECHNICAL DESIGN:\n${existingTechnicalDesign}\n\nUse the Technical Design above as the foundation. Expand on the architecture with deeper detail on system components, data flow, and operational considerations.`
    : "\n\nNote: No Technical Design is available yet. Create a comprehensive architecture based on the idea description and industry best practices.";

  return `=== ROLE CONTEXT ===
You are an expert system architect with 15+ years of experience designing large-scale, distributed systems for high-growth startups and enterprises. You excel at creating architectures that are resilient, scalable, and maintainable while balancing complexity with practical constraints.

Your architecture documents are known for being:
- Comprehensive: Cover all critical system aspects
- Visual: Use diagrams to communicate complex concepts
- Practical: Focus on real-world implementation concerns
- Forward-thinking: Design for evolution and growth
- Operational: Consider monitoring, debugging, and maintenance

=== TASK ===
Generate a comprehensive Architecture Document for the following startup idea.

IDEA:
${ideaText}${techDesignContext}

=== OUTPUT FORMAT ===
Generate a well-structured Architecture Document in Markdown format with the following sections:

## 1. System Architecture Diagram
- Create a detailed Mermaid diagram showing all major components
- Include: frontend, backend services, databases, caches, queues, external services
- Show data flow and communication patterns
- Indicate synchronous vs asynchronous interactions
- Highlight critical paths and dependencies

Example:
\`\`\`mermaid
graph TB
    subgraph "Client Layer"
        Web[Web App]
        Mobile[Mobile App]
    end

    subgraph "API Layer"
        Gateway[API Gateway]
        Auth[Auth Service]
        GraphQL[GraphQL API]
    end

    subgraph "Application Layer"
        UserService[User Service]
        CoreService[Core Service]
        NotificationService[Notification Service]
    end

    subgraph "Data Layer"
        PrimaryDB[(Primary DB)]
        ReadReplica[(Read Replica)]
        Cache[(Redis Cache)]
        Queue[Message Queue]
    end

    subgraph "External Services"
        Email[Email Service]
        Payment[Payment Gateway]
        Analytics[Analytics]
    end

    Web --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Gateway --> GraphQL
    GraphQL --> UserService
    GraphQL --> CoreService
    CoreService --> PrimaryDB
    CoreService --> Cache
    CoreService --> Queue
    Queue --> NotificationService
    NotificationService --> Email
\`\`\`

## 2. Component Breakdown
- List all major system components
- For each component, describe:
  - Purpose and responsibilities
  - Key interfaces and APIs
  - Dependencies on other components
  - Technology stack
  - Scaling characteristics
  - Failure modes and recovery

Example:
### User Service
- **Purpose**: Manages user accounts, authentication, and profiles
- **Responsibilities**: Registration, login, profile updates, password reset
- **Interfaces**: REST API, GraphQL resolvers
- **Dependencies**: Primary DB, Cache, Auth Service
- **Technology**: Node.js, Express, JWT
- **Scaling**: Stateless, horizontal scaling behind load balancer
- **Failure Mode**: Graceful degradation - cached data served if DB unavailable

## 3. Data Flow
- Describe how data moves through the system for key operations
- Include sequence diagrams for critical flows (use Mermaid)
- Explain data transformations and validations
- Highlight caching strategies and cache invalidation
- Document data consistency guarantees

Example flow:
\`\`\`mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Cache
    participant DB

    Client->>API: POST /api/resource
    API->>Service: Create Resource
    Service->>DB: Insert Record
    DB-->>Service: Success
    Service->>Cache: Invalidate Related Cache
    Service-->>API: Resource Created
    API-->>Client: 201 Created
\`\`\`

## 4. Integration Points
- Document all external system integrations
- For each integration:
  - Purpose and data exchanged
  - Communication protocol (REST, GraphQL, webhooks, etc.)
  - Authentication and authorization
  - Error handling and retry logic
  - Circuit breaker patterns
  - Monitoring and alerting
  - Fallback strategies

## 5. Infrastructure Requirements
- Compute: Server specifications, container requirements
- Storage: Database sizing, file storage needs
- Network: Bandwidth, latency requirements, CDN usage
- Security: Firewalls, VPCs, security groups
- Compliance: Data residency, encryption requirements
- Cost estimates: Monthly infrastructure costs by component

## 6. Scalability Considerations
- Horizontal scaling strategy: Which components scale horizontally
- Vertical scaling limits: When to scale up vs out
- Database scaling: Read replicas, sharding, partitioning
- Caching strategy: Multi-level caching, cache warming
- Load balancing: Algorithm, health checks, session affinity
- Auto-scaling: Triggers and thresholds
- Performance targets: Requests per second, concurrent users, response times

## 7. Disaster Recovery & Backup
- Backup strategy: What, when, where, retention
- Recovery Time Objective (RTO): How quickly to recover
- Recovery Point Objective (RPO): How much data loss is acceptable
- Failover procedures: Automated vs manual
- Data replication: Cross-region, cross-AZ
- Testing: How often to test recovery procedures

## 8. Monitoring & Observability
- Metrics: What to measure (latency, throughput, errors, saturation)
- Logging: Structured logging, log aggregation, retention
- Tracing: Distributed tracing for request flows
- Alerting: Critical alerts, escalation procedures
- Dashboards: Key metrics for different audiences (ops, dev, business)
- Tools: Recommended monitoring and observability stack

=== GUIDELINES ===
1. Use diagrams extensively - architecture is visual
2. Be specific about technology choices and configurations
3. Consider failure scenarios and recovery strategies
4. Design for observability from the start
5. Balance detail with readability
6. Address operational concerns, not just development
7. Consider cost implications of architectural decisions
8. Make scalability paths explicit

=== OUTPUT REQUIREMENTS ===
- Format: Markdown with extensive use of Mermaid diagrams
- Length: Comprehensive and detailed (this is a reference document)
- Tone: Technical and precise
- Style: Heavy use of diagrams, tables, and structured lists

Generate the Architecture Document now:`;
}

/**
 * Roadmap Prompt Template (MVP Development-Focused)
 *
 * Generates a development-focused MVP roadmap with spec-ready features,
 * clear dependencies, and implementation details. Optimized for export
 * to Kiro workspace setups where features become implementable specs.
 *
 * @param context - Document generation context with idea, PRD, and technical design
 * @returns Formatted prompt for AI generation
 */
export function generateRoadmapPrompt(
  context: DocumentGenerationContext
): string {
  const { ideaText, existingPRD, existingTechnicalDesign } = context;

  let contextText = "";
  if (existingPRD) {
    contextText += `\n\nEXISTING PRD:\n${existingPRD}`;
  }
  if (existingTechnicalDesign) {
    contextText += `\n\nEXISTING TECHNICAL DESIGN:\n${existingTechnicalDesign}`;
  }
  if (contextText) {
    contextText +=
      "\n\nUse the documents above to inform your roadmap. Ensure milestones align with PRD priorities and technical design constraints.";
  } else {
    contextText =
      "\n\nNote: No PRD or Technical Design available yet. Create a roadmap based on the idea description and typical product development best practices.";
  }

  return `=== ROLE CONTEXT ===
You are an expert technical product manager who specializes in breaking down product ideas into implementable features for development teams. You excel at creating MVP roadmaps that translate directly into development specs.

Your roadmaps are known for being:
- Implementation-ready: Each feature can become a development spec
- Dependency-aware: Clear build order based on technical dependencies
- Scope-controlled: Features sized for 1-5 day implementation cycles
- Testable: Every feature has clear acceptance criteria

=== CRITICAL INSTRUCTION ===
This roadmap will be used to generate development specs. Each feature must be:
- Self-contained enough to be a single spec
- Have clear user story and acceptance criteria
- Include technical implementation hints
- Specify dependencies on other features

DO NOT include: dates, timeframes, team sizing, budget, go-to-market strategy, or business metrics.
FOCUS ON: What to build, in what order, and how to know it's done.

=== TASK ===
Generate a development-focused MVP Roadmap for the following startup idea.

IDEA:
${ideaText}${contextText}

=== OUTPUT FORMAT ===
Generate a well-structured Project Roadmap in Markdown format with the following sections:

## 1. MVP Overview
Brief summary (2-3 sentences) of what the MVP delivers and the core user problem it solves.

## 2. Build Phases
Organize milestones and features into 3-4 build phases (MoSCoW-based prioritization). Each phase should be shippable and include:
- Milestones
- Feature Prioritization (MoSCoW)
- Dependencies & Blockers
- Resource Considerations
- Risk Mitigation Strategies
- Success Criteria per Milestone
- Go-to-Market Strategy

### Phase 1: Foundation (Must ship first)
Core infrastructure and authentication that everything else depends on.

### Phase 2: Core MVP
The minimum features needed to deliver the core value proposition.

### Phase 3: MVP Complete
Features that round out the MVP experience.

### Phase 4: Post-MVP Enhancements (Optional)
Nice-to-have features for after MVP validation.

## 3. Feature Specifications
For EACH feature, provide a spec-ready breakdown:

### Feature: [Feature Name]
- **Phase**: [1/2/3/4]
- **User Story**: As a [user type], I want to [action], so that [benefit]
- **Acceptance Criteria**:
  - [ ] Criterion 1 (specific, testable)
  - [ ] Criterion 2
  - [ ] Criterion 3
- **Technical Notes**: Brief implementation guidance (e.g., "Use Supabase Auth with JWT", "Implement as React Server Component")
- **Dependencies**: [List feature names this depends on, or "None"]
- **Scope**: [Small: <1 day | Medium: 1-3 days | Large: 3-5 days]

Example:
### Feature: User Authentication
- **Phase**: 1
- **User Story**: As a new user, I want to create an account and log in, so that I can access my personal data securely.
- **Acceptance Criteria**:
  - [ ] User can sign up with email and password
  - [ ] User can log in with existing credentials
  - [ ] User can log out from any page
  - [ ] User sees appropriate error messages for invalid credentials
  - [ ] Session persists across browser refreshes
- **Technical Notes**: Use Supabase Auth. Implement auth context provider. Store session in cookies for SSR compatibility.
- **Dependencies**: None (foundation)
- **Scope**: Medium

## 4. Dependency Graph
Show the build order as a dependency graph:

\`\`\`mermaid
graph TD
    A[User Authentication] --> B[User Profile]
    A --> C[Core Feature X]
    B --> D[Settings Page]
    C --> E[Feature Y]
    C --> F[Feature Z]
    E --> G[Advanced Feature]
    F --> G
\`\`\`

## 5. Critical Path
List features in recommended build order (respecting dependencies):

1. **[Feature Name]** - [One-line description] - Phase [X]
2. **[Feature Name]** - [One-line description] - Phase [X]
3. ...

## 6. Out of Scope (Explicitly Deferred)
List features that are NOT in this MVP and why:
- **[Feature]**: [Why deferred - e.g., "Adds complexity without validating core hypothesis"]
- **[Feature]**: [Why deferred]

## 7. Technical Risks
Brief list of technical risks that could affect implementation:
- **[Risk]**: [Mitigation approach]
- **[Risk]**: [Mitigation approach]

=== FEATURE GUIDELINES ===
1. Each feature should be implementable as a single development spec
2. Acceptance criteria must be specific and testable (not vague)
3. Technical notes should reference the tech stack from the Technical Design
4. Dependencies must reference other features by exact name
5. Scope estimates assume a single developer
6. Phase 1 features should have NO dependencies (they are the foundation)
7. Aim for 8-15 total features for an MVP (not too granular, not too broad)

=== GUIDELINES ===
1. DO NOT include specific dates or calendars; the user will determine their own timeline based on their team's velocity.
2. Absolutely NO DATES OR TIMEFRAMES; focus on logical ordering and dependencies.
3. Keep milestones tightly scoped and implementation-ready.
4. Call out dependencies and blockers explicitly.
5. Include resource considerations and risk mitigation strategies per milestone.

=== OUTPUT REQUIREMENTS ===
- Format: Markdown with Mermaid dependency graph
- Tone: Technical and actionable
- Length: Comprehensive but focused on implementation details
- Every feature must follow the spec-ready format exactly
- NO dates, timelines, team sizes, or business strategy

Generate the MVP Roadmap now:`;
}
