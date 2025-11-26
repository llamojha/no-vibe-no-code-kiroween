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
 * Roadmap Prompt Template
 *
 * Generates a comprehensive project roadmap with milestones, prioritization,
 * dependencies, and resource considerations. Focuses on logical ordering
 * rather than specific timeframes.
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
You are an expert product strategist + delivery lead with 15+ years of experience creating product roadmaps for high-growth startups. You are pragmatic, ruthless about prioritization, and translate vision into sequenced, testable steps engineering teams can ship.

Your roadmaps are known for being:
- Realistic: Grounded in actual team capabilities and constraints
- Flexible: Adaptable to changing market conditions and learnings
- Value-focused: Prioritize features that deliver maximum user and business value
- Dependency-aware: Account for technical and business dependencies
- Risk-conscious: Identify and mitigate key risks early

=== CRITICAL INSTRUCTION ===
DO NOT include specific dates, timeframes, or deadlines in this roadmap. Instead, focus on:
- Logical ordering of milestones (what must come before what)
- Relative priorities (what's most important)
- Dependencies between features and milestones
- Resource considerations (team size, skills needed)
- Avoid any phrasing that implies time (no "Q1", "month", "week", "sprint")
- Keep language clear and concise—no marketing fluff or filler

The user will determine their own timeline based on their team's velocity and available resources.

=== TASK ===
Generate a comprehensive Project Roadmap for the following startup idea.

IDEA:
${ideaText}${contextText}

=== OUTPUT FORMAT ===
Generate a well-structured Roadmap in Markdown format with the following sections:

## 1. Milestones
Define 5-7 major milestones that represent significant product evolution stages.
For each milestone, include:

### Milestone [Number]: [Name]
- **Goal**: What this milestone achieves for users and the business
- **Key Features**: 3-5 main features or capabilities delivered
- **Success Criteria**: How to know this milestone is complete (measurable outcomes)
- **Dependencies**: What must be completed before starting this milestone
- **Risks**: Key risks and mitigation strategies
- **Team Composition**: Suggested team size and roles needed
- **Validation**: How to validate learning (experiments, user tests, metrics to check)

Example:
### Milestone 1: MVP Launch
- **Goal**: Validate core value proposition with early adopters
- **Key Features**:
  - User authentication and onboarding
  - Core feature X that solves primary user pain
  - Basic analytics and feedback collection
- **Success Criteria**:
  - 100 active users
  - 30% weekly retention
  - Positive feedback from 70% of users
- **Dependencies**: None (starting point)
- **Risks**:
  - Risk: User acquisition challenges
  - Mitigation: Pre-launch waitlist, targeted outreach to early adopter communities
- **Team Composition**: 2 engineers, 1 designer, 1 product manager

## 2. Feature Prioritization (MoSCoW Method)
Organize all features across milestones using MoSCoW prioritization:

### Must Have (Critical for Success)
- Features absolutely required for the product to work
- Without these, the product has no value
- Examples: Core functionality, user authentication, payment processing
- Tie each "Must Have" to the user problem it solves and the metric it impacts

### Should Have (Important but not Critical)
- Features that significantly enhance the product
- Can be deferred if necessary but should be included soon
- Examples: Advanced search, notifications, user profiles

### Could Have (Nice to Have)
- Features that improve user experience but aren't essential
- Include if time and resources permit
- Examples: Social sharing, themes, advanced analytics

### Won't Have (Out of Scope for Now)
- Features explicitly deferred to future versions
- Explain why they're not included now
- Examples: Mobile apps (web-first), internationalization, enterprise features

## 3. Dependencies & Blockers
Create a dependency map showing what needs to happen before what:

\`\`\`mermaid
graph LR
    A[User Auth] --> B[Core Feature]
    A --> C[User Profiles]
    B --> D[Advanced Features]
    C --> D
    B --> E[Analytics]
    F[Payment Integration] --> G[Subscription Features]
\`\`\`

List critical path items and potential blockers:
- **Critical Path**: Features that block other features
- **External Dependencies**: Third-party services, partnerships, regulatory approvals
- **Technical Debt**: Areas that need refactoring before new features
- **Resource Constraints**: Skills or team members needed
- Call out any sequencing assumptions that, if wrong, would force a re-plan

## 4. Resource Considerations
Provide guidance on team composition and skills needed:

### Team Evolution
- **Milestone 1-2**: Small team (2-3 engineers, 1 designer, 1 PM)
- **Milestone 3-4**: Growing team (4-5 engineers, 2 designers, 1 PM, 1 QA)
- **Milestone 5+**: Scaled team (6-8 engineers, 2-3 designers, 2 PMs, 2 QA, 1 DevOps)

### Key Skills Required
- **Engineering**: List specific technical skills (e.g., React, Node.js, PostgreSQL)
- **Design**: UI/UX, user research, prototyping
- **Product**: User research, analytics, prioritization
- **Operations**: DevOps, customer support, community management

### Budget Considerations
- Infrastructure costs by milestone
- Third-party service costs
- Hiring and team growth costs
- Marketing and user acquisition budget

## 5. Risk Mitigation Strategies
Identify top 5-7 risks and how to address them:

### Risk 1: [Risk Name]
- **Description**: What could go wrong
- **Impact**: High/Medium/Low
- **Probability**: High/Medium/Low
- **Mitigation**: Specific actions to reduce risk
- **Contingency**: What to do if risk materializes
- **Owner**: Role responsible for watching and acting on this risk

Example:
### Risk 1: Slow User Adoption
- **Description**: Users don't understand the value proposition or find the product too complex
- **Impact**: High (threatens product viability)
- **Probability**: Medium (common for new products)
- **Mitigation**:
  - Extensive user testing before launch
  - Simple, focused MVP
  - Clear onboarding flow
  - Early adopter program for feedback
- **Contingency**: Pivot messaging, simplify features, increase user education content

## 6. Success Criteria per Milestone
Define measurable success criteria for each milestone:

| Milestone | User Metrics | Business Metrics | Technical Metrics |
|-----------|-------------|------------------|-------------------|
| MVP Launch | 100 active users, 30% retention | $0 revenue (validation phase) | 99% uptime, <500ms response time |
| Feature Complete | 1,000 active users, 40% retention | $5K MRR | 99.5% uptime, <300ms response time |
| Scale | 10,000 active users, 50% retention | $50K MRR | 99.9% uptime, <200ms response time |

## 7. Go-to-Market Strategy
Outline how to bring the product to market at each milestone:

### Pre-Launch (Before Milestone 1)
- Build waitlist and generate interest
- Identify and engage early adopters
- Create content and establish thought leadership
- Set up analytics and feedback mechanisms

### Launch (Milestone 1)
- Targeted outreach to early adopter communities
- Product Hunt, Hacker News, relevant forums
- Press outreach to niche publications
- Referral program for early users

### Growth (Milestones 2-3)
- Content marketing and SEO
- Paid acquisition channels (if unit economics support)
- Partnerships and integrations
- Community building

### Scale (Milestones 4+)
- Expand to new user segments
- International expansion
- Enterprise sales (if applicable)
- Platform and ecosystem development
- Post-launch: capture learnings and feed them back into milestone reprioritization

=== GUIDELINES ===
1. DO NOT include specific dates or timeframes - focus on logical ordering
2. Be realistic about what can be achieved with limited resources
3. Prioritize ruthlessly - not everything can be "must have"
4. Consider technical dependencies and constraints
5. Account for learning and iteration between milestones
6. Include validation and feedback loops; every milestone should prove or disprove assumptions
7. Address risks proactively with owners and actions
8. Make trade-offs explicit and avoid generic advice

=== OUTPUT REQUIREMENTS ===
- Format: Markdown with tables, diagrams, and structured lists
- Length: Comprehensive but actionable (a working document)
- Tone: Strategic but practical
- Style: Use visual elements (tables, diagrams) to communicate priorities and dependencies
- NO DATES OR TIMEFRAMES: Focus on logical ordering and priorities

Generate the Project Roadmap now:`;
}
