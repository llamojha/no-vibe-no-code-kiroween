# Requirements Document

## Introduction

This document specifies the requirements for implementing an Open Source Mode in "No Vibe No Code" that enables a fully functional local-only mode requiring no database setup. The Open Source Mode allows users to spin up their own instance with just a Gemini API key, using browser localStorage for all data persistence and simple username/password authentication. This feature reduces friction for open source contributors, hackathon demos, and self-hosted deployments.

## Glossary

- **Open Source Mode**: A configuration mode that enables the application to run without Supabase, using localStorage for persistence and simple credentials for authentication
- **LOCAL_STORAGE_MODE**: The feature flag that enables Open Source Mode when set to true
- **localStorage**: Browser-based key-value storage used for persisting data in Open Source Mode
- **Local Auth**: Simple username/password authentication system used in Open Source Mode (default credentials: kiro/kiro)
- **LocalUser**: A user entity generated from local authentication with deterministic ID and admin tier
- **Repository**: An interface defining data access operations following hexagonal architecture patterns
- **RepositoryFactory**: A factory class that creates appropriate repository implementations based on configuration

## Requirements

### Requirement 1

**User Story:** As an open source contributor, I want to run the application with minimal setup, so that I can quickly test and contribute without configuring a database.

#### Acceptance Criteria

1. WHEN the LOCAL_STORAGE_MODE feature flag is set to true THEN the Application SHALL start without requiring Supabase environment variables
2. WHEN LOCAL_STORAGE_MODE is enabled and GEMINI_API_KEY is not provided THEN the Application SHALL display a clear error message indicating the missing API key
3. WHEN LOCAL_STORAGE_MODE is enabled THEN the Application SHALL use localStorage for all data persistence operations
4. WHEN LOCAL_STORAGE_MODE is disabled THEN the Application SHALL require and use Supabase for authentication and data persistence

### Requirement 2

**User Story:** As a user in Open Source Mode, I want to authenticate with simple credentials, so that I can access the application without setting up external authentication providers.

#### Acceptance Criteria

1. WHEN LOCAL_STORAGE_MODE is enabled and a user visits the login page THEN the Application SHALL display a username/password login form instead of the magic link form
2. WHEN a user submits valid credentials (matching LOCAL_AUTH_USERNAME and LOCAL_AUTH_PASSWORD environment variables or defaults kiro/kiro) THEN the Application SHALL authenticate the user and redirect to the dashboard
3. WHEN a user submits invalid credentials THEN the Application SHALL display an error message and maintain the current login state
4. WHEN a user is authenticated in local mode THEN the Application SHALL generate a deterministic user ID from the username
5. WHEN a user is authenticated in local mode THEN the Application SHALL assign the admin tier to the local user
6. WHEN a user signs out in local mode THEN the Application SHALL clear the local authentication state and redirect to the login page

### Requirement 3

**User Story:** As a user in Open Source Mode, I want my data to persist across browser sessions, so that I do not lose my analyses and ideas when I close the browser.

#### Acceptance Criteria

1. WHEN LOCAL_STORAGE_MODE is enabled and a user creates an analysis THEN the Application SHALL store the analysis in localStorage with the key prefix nvnc-local-
2. WHEN LOCAL_STORAGE_MODE is enabled and a user creates an idea THEN the Application SHALL store the idea in localStorage
3. WHEN LOCAL_STORAGE_MODE is enabled and a user generates a document THEN the Application SHALL store the document in localStorage
4. WHEN a user refreshes the page or reopens the browser THEN the Application SHALL retrieve and display previously stored data from localStorage
5. WHEN localStorage operations fail due to quota exceeded THEN the Application SHALL display a clear error message to the user
6. WHEN serializing data to localStorage THEN the Application SHALL use JSON encoding
7. WHEN deserializing data from localStorage THEN the Application SHALL parse JSON and reconstruct domain entities correctly

### Requirement 4

**User Story:** As a user in Open Source Mode, I want to use all core features without credit restrictions, so that I can fully evaluate the application capabilities.

#### Acceptance Criteria

1. WHEN LOCAL_STORAGE_MODE is enabled and a user checks their credit balance THEN the Application SHALL return a high balance value (9999)
2. WHEN LOCAL_STORAGE_MODE is enabled and a user performs a credit-consuming operation THEN the Application SHALL record the transaction in localStorage but allow the operation to proceed
3. WHEN LOCAL_STORAGE_MODE is enabled THEN the Application SHALL bypass credit enforcement for all operations
4. WHEN LOCAL_STORAGE_MODE is disabled THEN the Application SHALL enforce normal credit system rules

### Requirement 5

**User Story:** As a developer, I want the localStorage repositories to follow the same interface as Supabase repositories, so that the application code remains consistent regardless of storage backend.

#### Acceptance Criteria

1. WHEN LOCAL_STORAGE_MODE is enabled THEN the RepositoryFactory SHALL return localStorage repository implementations
2. WHEN LOCAL_STORAGE_MODE is disabled THEN the RepositoryFactory SHALL return Supabase repository implementations
3. THE LocalStorageAnalysisRepository SHALL implement the IAnalysisRepository interface completely
4. THE LocalStorageUserRepository SHALL implement the IUserRepository interface completely
5. THE LocalStorageIdeaRepository SHALL implement the IIdeaRepository interface completely
6. THE LocalStorageDocumentRepository SHALL implement the IDocumentRepository interface completely
7. THE LocalStorageCreditTransactionRepository SHALL implement the ICreditTransactionRepository interface completely

### Requirement 6

**User Story:** As a new user, I want clear documentation on how to set up Open Source Mode, so that I can get started quickly.

#### Acceptance Criteria

1. THE README.md SHALL include a quick start section for Open Source Mode with step-by-step instructions
2. THE .env.example file SHALL include Open Source Mode configuration with clear comments
3. WHEN a user follows the quick start instructions THEN the user SHALL be able to run the application within 2 minutes
4. THE documentation SHALL clearly state the limitations of Open Source Mode (single user, no sync, development only)
