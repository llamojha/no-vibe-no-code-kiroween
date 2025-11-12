# Requirements Document

## Introduction

This specification defines the implementation of comprehensive PostHog analytics tracking across the No Vibe No Code application. The system will track user interactions, feature usage, and conversion events to provide insights into user behavior and product engagement. The implementation will follow PostHog's Next.js integration best practices with both client-side and server-side tracking capabilities.

## Glossary

- **PostHog**: An open-source product analytics platform that provides event tracking, session recording, and feature flags
- **Analytics System**: The PostHog integration layer that captures and transmits user interaction events
- **Event Capture**: The process of recording user actions and sending them to PostHog
- **Client Component**: React components that run in the browser and can capture user interactions
- **Server Component**: React components that run on the server and can track server-side events
- **Reverse Proxy**: A server configuration that routes PostHog requests through the application domain to improve reliability
- **Instrumentation Client**: Next.js 15.3+ feature for initializing client-side libraries at application startup
- **Report Generation**: The process of creating analysis reports for startup ideas or hackathon projects
- **Dr. Frankenstein**: Feature that generates mashup ideas by combining AWS services or tech companies
- **Slot Machine**: UI component in Dr. Frankenstein that allows users to select 3 or 4 combination slots

## Requirements

### Requirement 1

**User Story:** As a product manager, I want to track all report generation events, so that I can measure feature adoption and usage patterns

#### Acceptance Criteria

1. WHEN a user generates a startup idea analysis report, THE Analytics System SHALL capture an event with idea content metadata
2. WHEN a user generates a hackathon project analysis report, THE Analytics System SHALL capture an event with project details metadata
3. WHEN a user generates a Dr. Frankenstein mashup idea, THE Analytics System SHALL capture an event with selected components metadata
4. THE Analytics System SHALL include user identification in all report generation events
5. THE Analytics System SHALL include timestamp and session information in all captured events

### Requirement 2

**User Story:** As a product manager, I want to track Dr. Frankenstein feature interactions, so that I can understand how users engage with the mashup generator

#### Acceptance Criteria

1. WHEN a user clicks the slot machine roll button, THE Analytics System SHALL capture a roll event with roll count metadata
2. WHEN a user selects AWS services mode, THE Analytics System SHALL capture a mode selection event with value "aws"
3. WHEN a user selects tech companies mode, THE Analytics System SHALL capture a mode selection event with value "tech_companies"
4. WHEN a user selects 3 slots configuration, THE Analytics System SHALL capture a slot configuration event with value 3
5. WHEN a user selects 4 slots configuration, THE Analytics System SHALL capture a slot configuration event with value 4

### Requirement 3

**User Story:** As a product manager, I want to track homepage interactions, so that I can measure engagement with visual features

#### Acceptance Criteria

1. WHEN a user toggles the background animation on, THE Analytics System SHALL capture an animation toggle event with state "enabled"
2. WHEN a user toggles the background animation off, THE Analytics System SHALL capture an animation toggle event with state "disabled"
3. THE Analytics System SHALL capture the initial animation preference state on page load
4. THE Analytics System SHALL include device type metadata in homepage interaction events

### Requirement 4

**User Story:** As a product manager, I want to track idea enhancement interactions, so that I can measure how users refine their analyses

#### Acceptance Criteria

1. WHEN a user adds a suggestion to an idea, THE Analytics System SHALL capture an enhancement event with suggestion content length
2. WHEN a user modifies an existing idea, THE Analytics System SHALL capture a modification event with change type metadata
3. THE Analytics System SHALL track the number of suggestions added per analysis session
4. THE Analytics System SHALL include the analysis type (startup/hackathon) in enhancement events

### Requirement 5

**User Story:** As a product manager, I want to track report export actions, so that I can understand which formats users prefer and measure conversion

#### Acceptance Criteria

1. WHEN a user exports a report in PDF format, THE Analytics System SHALL capture an export event with format "pdf"
2. WHEN a user exports a report in Markdown format, THE Analytics System SHALL capture an export event with format "markdown"
3. WHEN a user exports a report in JSON format, THE Analytics System SHALL capture an export event with format "json"
4. THE Analytics System SHALL include the report type (startup/hackathon/frankenstein) in export events
5. THE Analytics System SHALL track export success or failure status

### Requirement 6

**User Story:** As a developer, I want PostHog initialized using Next.js instrumentation client, so that tracking is available throughout the application lifecycle

#### Acceptance Criteria

1. THE Analytics System SHALL initialize PostHog in the instrumentation-client.ts file
2. THE Analytics System SHALL load PostHog configuration from environment variables
3. THE Analytics System SHALL use the 2025-05-24 defaults for automatic pageview tracking
4. THE Analytics System SHALL be accessible via import in any client component
5. THE Analytics System SHALL handle initialization errors gracefully without breaking the application

### Requirement 7

**User Story:** As a developer, I want typed event tracking utility functions, so that analytics events are consistent and maintainable across the application

#### Acceptance Criteria

1. THE Analytics System SHALL provide a centralized analytics utility module with typed tracking functions
2. THE Analytics System SHALL validate event properties using TypeScript interfaces
3. THE Analytics System SHALL provide functions for each tracked event category (reports, frankenstein, exports, homepage)
4. THE Analytics System SHALL include JSDoc comments for all tracking functions
5. THE Analytics System SHALL handle PostHog unavailability gracefully without throwing errors

### Requirement 8

**User Story:** As a developer, I want server-side PostHog tracking, so that I can capture events from server actions and API routes

#### Acceptance Criteria

1. THE Analytics System SHALL provide a PostHogClient function for server-side event capture
2. THE Analytics System SHALL configure flushAt to 1 and flushInterval to 0 for immediate event sending
3. THE Analytics System SHALL call shutdown after server-side event capture
4. THE Analytics System SHALL be importable in server components and API routes
5. THE Analytics System SHALL handle server-side errors without affecting request processing

### Requirement 9

**User Story:** As a security-conscious developer, I want PostHog requests routed through a reverse proxy, so that tracking is more reliable and less likely to be blocked

#### Acceptance Criteria

1. THE Analytics System SHALL configure Next.js rewrites to proxy PostHog requests
2. THE Analytics System SHALL route requests to /ingest/ through the reverse proxy
3. THE Analytics System SHALL maintain the original PostHog API contract
4. THE Analytics System SHALL handle proxy errors gracefully
5. THE Analytics System SHALL document the reverse proxy configuration for deployment

### Requirement 10

**User Story:** As a developer, I want environment configuration for PostHog, so that the system works across development, staging, and production environments

#### Acceptance Criteria

1. THE Analytics System SHALL read PostHog API key from NEXT_PUBLIC_POSTHOG_KEY environment variable
2. THE Analytics System SHALL read PostHog host from NEXT_PUBLIC_POSTHOG_HOST environment variable
3. THE Analytics System SHALL disable tracking when environment variables are missing in development
4. THE Analytics System SHALL log warnings when PostHog is not configured
5. THE Analytics System SHALL document required environment variables in .env.example
