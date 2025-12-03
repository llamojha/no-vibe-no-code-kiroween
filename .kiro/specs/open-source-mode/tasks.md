# Implementation Plan

- [ ] 1. Set up feature flag and configuration

  - [ ] 1.1 Add LOCAL_STORAGE_MODE feature flag to lib/featureFlags.config.ts
    - Add flag with default false, exposeToClient true
    - Add LOCAL_AUTH_USERNAME and LOCAL_AUTH_PASSWORD env var support
    - _Requirements: 1.1, 1.2_
  - [ ] 1.2 Update environment configuration to conditionally require Supabase
    - Modify src/infrastructure/config/environment.ts to skip Supabase validation when LOCAL_STORAGE_MODE is true
    - Add validation for GEMINI_API_KEY requirement in local mode
    - _Requirements: 1.1, 1.2_
  - [ ] 1.3 Update .env.example with Open Source Mode configuration
    - Add LOCAL_STORAGE_MODE, LOCAL_AUTH_USERNAME, LOCAL_AUTH_PASSWORD examples
    - Add clear comments explaining the two modes
    - _Requirements: 6.2_

- [ ] 2. Implement local authentication service

  - [ ] 2.1 Create LocalAuth service at lib/auth/localAuth.ts
    - Implement validateCredentials function
    - Implement generateUserId with deterministic hash
    - Implement createLocalUser function
    - Implement auth state management (get/set/clear)
    - Implement createMockSession for Supabase Session compatibility
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - [ ] 2.2 Write property test for user ID determinism
    - **Property 2: Local authentication determinism**
    - **Validates: Requirements 2.4**
  - [ ] 2.3 Write property test for tier assignment
    - **Property 3: Local authentication tier assignment**
    - **Validates: Requirements 2.5**
  - [ ] 2.4 Write property tests for authentication success/failure
    - **Property 4: Valid credentials authentication success**
    - **Property 5: Invalid credentials authentication failure**
    - **Validates: Requirements 2.2, 2.3**

- [ ] 3. Create LocalLoginForm component

  - [ ] 3.1 Create LocalLoginForm component at features/auth/components/LocalLoginForm.tsx
    - Implement username and password input fields
    - Implement form validation and error handling
    - Style to match existing UI theme
    - Implement success redirect to dashboard
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ] 3.2 Update LoginForm to conditionally render LocalLoginForm
    - Check LOCAL_STORAGE_MODE flag
    - Render LocalLoginForm when enabled, existing form when disabled
    - _Requirements: 2.1_
  - [ ] 3.3 Update AuthContext to support local authentication
    - Check LOCAL_STORAGE_MODE on initialization
    - Use LocalAuth service when enabled
    - Generate consistent mock session for downstream compatibility
    - Implement signOut for local mode
    - _Requirements: 2.2, 2.5, 2.6_

- [ ] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement localStorage adapter and repositories

  - [ ] 5.1 Create LocalStorageAdapter at src/infrastructure/database/localStorage/LocalStorageAdapter.ts
    - Implement generic CRUD operations with type safety
    - Implement namespace prefixing (nvnc-local-)
    - Implement error handling for quota and corruption
    - _Requirements: 3.1, 3.5, 3.6_
  - [ ] 5.2 Create LocalStorageAnalysisRepository
    - Implement IAnalysisRepository interface
    - Implement entity mapping to/from JSON
    - _Requirements: 3.1, 5.3_
  - [ ] 5.3 Create LocalStorageUserRepository
    - Implement IUserRepository interface
    - Implement single-user storage for local auth
    - _Requirements: 5.4_
  - [ ] 5.4 Create LocalStorageIdeaRepository
    - Implement IIdeaRepository interface
    - Implement entity mapping to/from JSON
    - _Requirements: 3.2, 5.5_
  - [ ] 5.5 Create LocalStorageDocumentRepository
    - Implement IDocumentRepository interface
    - Implement entity mapping to/from JSON
    - _Requirements: 3.3, 5.6_
  - [ ] 5.6 Create LocalStorageCreditTransactionRepository
    - Implement ICreditTransactionRepository interface
    - Store transactions for audit trail
    - _Requirements: 4.2, 5.7_
  - [ ] 5.7 Create index.ts to export all localStorage repositories
    - Export all repository classes
    - Export LocalStorageAdapter
    - _Requirements: 5.1_
  - [ ] 5.8 Write property test for entity serialization round-trip
    - **Property 6: Entity serialization round-trip**
    - **Validates: Requirements 3.6, 3.7**
  - [ ] 5.9 Write property test for data persistence round-trip
    - **Property 7: Data persistence round-trip**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ] 6. Update RepositoryFactory

  - [ ] 6.1 Update RepositoryFactory to return localStorage repositories when LOCAL_STORAGE_MODE is enabled
    - Check LOCAL_STORAGE_MODE flag in each create method
    - Return localStorage implementation when enabled
    - Maintain existing Supabase implementations as default
    - _Requirements: 5.1, 5.2_
  - [ ] 6.2 Write property test for repository type selection
    - **Property 1: Repository type matches LOCAL_STORAGE_MODE configuration**
    - **Validates: Requirements 1.3, 1.4, 5.1, 5.2**

- [ ] 7. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement credit system bypass

  - [ ] 8.1 Update CheckCreditsUseCase to bypass in local mode
    - Check LOCAL_STORAGE_MODE flag
    - Return true (sufficient credits) when enabled
    - _Requirements: 4.3_
  - [ ] 8.2 Update DeductCreditUseCase to bypass enforcement in local mode
    - Check LOCAL_STORAGE_MODE flag
    - Record transaction but always succeed when enabled
    - _Requirements: 4.2, 4.3_
  - [ ] 8.3 Update GetCreditBalanceUseCase to return high balance in local mode
    - Check LOCAL_STORAGE_MODE flag
    - Return { credits: 9999, tier: "admin" } when enabled
    - _Requirements: 4.1_
  - [ ] 8.4 Write property tests for credit bypass behavior
    - **Property 8: Credit bypass in local mode**
    - **Property 9: Credit balance in local mode**
    - **Property 10: Credit enforcement in normal mode**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 9. Update documentation

  - [ ] 9.1 Update README.md with quick start for Open Source Mode
    - Add quick start section with step-by-step instructions
    - Include clone, configure, install, run steps
    - Document default credentials (kiro/kiro)
    - _Requirements: 6.1, 6.3_
  - [ ] 9.2 Create docs/SELF_HOSTED.md with detailed setup instructions
    - Document full setup process
    - Document limitations of local mode
    - Add troubleshooting section
    - _Requirements: 6.4_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
