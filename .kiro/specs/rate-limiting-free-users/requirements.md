# Requirements Document

## Introduction

This feature implements rate limiting for free-tier users to prevent unlimited AI-powered report generation and ensure fair usage of analysis resources. The system will track usage across both startup idea analysis and hackathon project analysis, enforce configurable limits based on user tier, and provide clear visibility into usage statistics for users.

## Glossary

- **Analysis System**: The AI-powered platform that generates startup idea evaluations and hackathon project assessments
- **User**: An authenticated individual with an assigned tier (free, paid, or admin)
- **Usage Record**: A database entry tracking a single report generation event
- **Usage Limit**: The maximum number of reports a user can generate within a reset period
- **Reset Period**: The time window (daily, weekly, or monthly) after which usage counts reset to zero
- **Usage Counter**: A UI component displaying current usage and remaining credits
- **Rate Limit Enforcement**: The process of validating usage before allowing report generation

## Requirements

### Requirement 1: Usage Tracking

**User Story:** As a system administrator, I want to track all report generation events, so that I can monitor platform usage and enforce fair usage policies.

#### Acceptance Criteria

1. WHEN a User generates a startup idea analysis report, THE Analysis System SHALL create a Usage Record with user identifier, analysis type, and timestamp
2. WHEN a User generates a hackathon project analysis report, THE Analysis System SHALL create a Usage Record with user identifier, analysis type, and timestamp
3. THE Analysis System SHALL store Usage Records with indexed user identifier and timestamp fields for efficient querying
4. THE Analysis System SHALL persist Usage Records in a dedicated database table separate from analysis results
5. THE Analysis System SHALL record the Reset Period type (daily, weekly, or monthly) with each Usage Record

### Requirement 2: Rate Limit Enforcement for Free Users

**User Story:** As a platform owner, I want to limit free users to a specific number of reports per time period, so that I can control AI API costs and encourage upgrades to paid tiers.

#### Acceptance Criteria

1. WHEN a free-tier User requests report generation, THE Analysis System SHALL count existing Usage Records within the current Reset Period
2. IF the count of Usage Records equals or exceeds the Usage Limit, THEN THE Analysis System SHALL reject the request with HTTP status 429
3. WHEN a free-tier User exceeds the Usage Limit, THE Analysis System SHALL return an error message indicating the limit has been reached and the reset time
4. THE Analysis System SHALL enforce a Usage Limit of 5 reports per weekly Reset Period for free-tier Users
5. THE Analysis System SHALL apply Usage Limit enforcement to both startup idea analysis and hackathon project analysis endpoints

### Requirement 3: Unlimited Access for Paid and Admin Users

**User Story:** As a paid subscriber, I want unlimited report generation capability, so that I can analyze as many ideas as needed without restrictions.

#### Acceptance Criteria

1. WHEN a paid-tier User requests report generation, THE Analysis System SHALL allow the request without checking Usage Records
2. WHEN an admin-tier User requests report generation, THE Analysis System SHALL allow the request without checking Usage Records
3. THE Analysis System SHALL record Usage Records for paid and admin users for analytics purposes without enforcing limits
4. THE Analysis System SHALL differentiate between free, paid, and admin tiers using the existing user tier field

### Requirement 4: Usage Statistics Retrieval

**User Story:** As a user, I want to view my current usage statistics, so that I can understand how many reports I have remaining before hitting my limit.

#### Acceptance Criteria

1. WHEN a User requests their usage statistics, THE Analysis System SHALL return the count of Usage Records within the current Reset Period
2. WHEN a User requests their usage statistics, THE Analysis System SHALL return the applicable Usage Limit based on their tier
3. WHEN a User requests their usage statistics, THE Analysis System SHALL return the number of remaining reports before reaching the limit
4. WHEN a User requests their usage statistics, THE Analysis System SHALL return the timestamp when the current Reset Period ends
5. THE Analysis System SHALL calculate usage statistics with a response time under 500 milliseconds

### Requirement 5: Usage Counter Display

**User Story:** As a free-tier user, I want to see my current usage and remaining credits in the dashboard, so that I can plan my report generation activities and know when I'm approaching my limit.

#### Acceptance Criteria

1. WHEN a free-tier User views the dashboard, THE Analysis System SHALL display a Usage Counter showing current usage count
2. WHEN a free-tier User views the dashboard, THE Analysis System SHALL display the total Usage Limit in the Usage Counter
3. WHEN a free-tier User views the dashboard, THE Analysis System SHALL display the Reset Period end date in the Usage Counter
4. WHEN a free-tier User has used 80 percent or more of their Usage Limit, THE Analysis System SHALL display a warning indicator in the Usage Counter
5. WHEN a free-tier User views the analyzer page, THE Analysis System SHALL display the Usage Counter before the analysis form

### Requirement 6: Usage Counter Display for Paid Users

**User Story:** As a paid user, I want to see that I have unlimited access, so that I understand the value of my subscription.

#### Acceptance Criteria

1. WHEN a paid-tier User views the dashboard, THE Analysis System SHALL display a Usage Counter indicating unlimited access
2. WHEN an admin-tier User views the dashboard, THE Analysis System SHALL display a Usage Counter indicating unlimited access
3. THE Analysis System SHALL not display usage warnings or limits for paid and admin users

### Requirement 7: Clear Error Messaging with Upgrade Path

**User Story:** As a free-tier user who has reached my limit, I want to receive a clear error message with information about upgrading, so that I understand my options for continued access.

#### Acceptance Criteria

1. WHEN a free-tier User exceeds the Usage Limit, THE Analysis System SHALL return an error message stating the limit has been reached
2. WHEN a free-tier User exceeds the Usage Limit, THE Analysis System SHALL include the Reset Period end timestamp in the error message
3. WHEN a free-tier User exceeds the Usage Limit, THE Analysis System SHALL include information about upgrading to a paid tier in the error message
4. THE Analysis System SHALL display the rate limit error message in the UI with prominent styling
5. THE Analysis System SHALL include a call-to-action button or link to the upgrade page in the error message

### Requirement 8: Reset Period Management

**User Story:** As a system administrator, I want usage counts to automatically reset at the end of each period, so that users regain access without manual intervention.

#### Acceptance Criteria

1. THE Analysis System SHALL use a weekly Reset Period starting on Monday at 00:00 UTC
2. WHEN calculating usage statistics, THE Analysis System SHALL only count Usage Records with timestamps within the current Reset Period
3. WHEN a new Reset Period begins, THE Analysis System SHALL allow free-tier Users to generate reports up to the Usage Limit again
4. THE Analysis System SHALL determine the current Reset Period based on the current timestamp without requiring scheduled jobs
5. THE Analysis System SHALL calculate the next Reset Period end timestamp as the following Monday at 00:00 UTC

### Requirement 9: Performance Optimization

**User Story:** As a developer, I want usage queries to be performant, so that rate limit checks do not slow down report generation.

#### Acceptance Criteria

1. THE Analysis System SHALL create a database index on the user identifier field in the Usage Records table
2. THE Analysis System SHALL create a database index on the timestamp field in the Usage Records table
3. WHEN checking usage limits, THE Analysis System SHALL execute database queries in under 100 milliseconds
4. THE Analysis System SHALL use a composite index on user identifier and timestamp for optimal query performance
5. THE Analysis System SHALL cache usage statistics for 60 seconds to reduce database load

### Requirement 10: API Response Enhancement

**User Story:** As a frontend developer, I want analysis API responses to include usage information, so that I can display real-time usage statistics without additional API calls.

#### Acceptance Criteria

1. WHEN a User successfully generates a report, THE Analysis System SHALL include current usage count in the API response
2. WHEN a User successfully generates a report, THE Analysis System SHALL include the Usage Limit in the API response
3. WHEN a User successfully generates a report, THE Analysis System SHALL include remaining credits in the API response
4. WHEN a User successfully generates a report, THE Analysis System SHALL include the Reset Period end timestamp in the API response
5. THE Analysis System SHALL include usage information in responses for both startup analysis and hackathon analysis endpoints
