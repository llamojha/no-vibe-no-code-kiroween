# Implementation Plan: Credit-Based Rate Limiting

## Phase 1: Database Schema and Migration

- [x] 1. Create database migration for credit system
  - [x] 1.1 Add `credits` column to `profiles` table with default value of 3
    - Add column: `credits INTEGER NOT NULL DEFAULT 3`
    - Create index: `idx_profiles_credits ON profiles(credits)`
    - _Requirements: 1.3, 9.1_
  - [x] 1.2 Create `credit_transactions` table for audit trail
    - Create table with columns: id, user_id, amount, type, description, metadata, timestamp, created_at
    - Add foreign key constraint to auth.users
    - Add CHECK constraint for type enum values
    - _Requirements: 1.4, 8.1_
  - [x] 1.3 Create indexes for credit transaction queries
    - Composite index: `idx_credit_transactions_user_timestamp ON credit_transactions(user_id, timestamp DESC)`
    - Index on type: `idx_credit_transactions_type ON credit_transactions(type)`
    - Index on timestamp: `idx_credit_transactions_timestamp ON credit_transactions(timestamp)`
    - _Requirements: 9.2, 9.3_
  - [x] 1.4 Backfill existing users with 3 default credits
    - Update all existing profiles to have 3 credits
    - _Requirements: 1.1_

## Phase 2: Domain Layer Implementation

- [x] 2. Implement credit-related domain entities and value objects

  - [x] 2.1 Create CreditTransactionId value object
    - Implement in `src/domain/value-objects/CreditTransactionId.ts`
    - Extend base ValueObject class with UUID generation
    - _Requirements: 1.4_
  - [x] 2.2 Create TransactionType enum
    - Define enum with values: DEDUCT, ADD, REFUND, ADMIN_ADJUSTMENT
    - Add to `src/domain/value-objects/` or appropriate types file
    - _Requirements: 1.4_
  - [x] 2.3 Create AnalysisType enum (if not exists)
    - Define enum with values: STARTUP_IDEA, HACKATHON_PROJECT
    - _Requirements: 1.1, 1.2_
  - [x] 2.4 Create CreditTransaction entity
    - Implement in `src/domain/entities/CreditTransaction.ts`
    - Include factory methods: create() and reconstruct()
    - Add getters for all properties
    - _Requirements: 1.4_
  - [x] 2.5 Enhance User entity with credit methods
    - Add private `credits` field to User entity
    - Implement `hasCredits()` method
    - Implement `deductCredit()` method with validation
    - Implement `addCredits(amount)` method with validation
    - Add `getCredits` getter
    - Update create() factory to accept credits parameter with default of 3
    - _Requirements: 2.1, 2.2, 3.1, 3.2_
  - [x] 2.6 Create InsufficientCreditsError domain error
    - Implement in `src/shared/types/errors.ts` or domain errors file
    - Include userId in error for context
    - Set error code to 'INSUFFICIENT_CREDITS'
    - _Requirements: 2.3_

- [x] 3. Implement CreditPolicy domain service
  - [x] 3.1 Create CreditPolicy service class
    - Implement in `src/domain/services/CreditPolicy.ts`
    - Define constants: DEFAULT_CREDITS = 3, ANALYSIS_COST = 1
    - _Requirements: 2.1, 2.2_
  - [x] 3.2 Implement credit policy methods
    - `getDefaultCredits()`: returns 3
    - `getAnalysisCost(analysisType)`: returns 1 for all types
    - `canPerformAnalysis(user)`: checks if user has credits
    - `shouldShowWarning(credits)`: returns true if credits <= 1
    - `calculateCreditDeduction(analysisType)`: returns cost for analysis type
    - _Requirements: 2.1, 2.2, 5.4_

## Phase 3: Repository Interfaces and Types

- [x] 4. Define repository interfaces for credit operations
  - [x] 4.1 Create ICreditTransactionRepository interface
    - Define in `src/domain/repositories/ICreditTransactionRepository.ts`
    - Methods: recordTransaction(), getTransactionHistory(), getTransactionsByType()
    - _Requirements: 1.4_
  - [x] 4.2 Enhance IUserRepository interface
    - Add method: `updateCredits(userId: UserId, credits: number): Promise<Result<void, Error>>`
    - Ensure existing methods support credit field
    - _Requirements: 2.1, 2.2_
  - [x] 4.3 Create CreditBalance interface
    - Define in repository types or shared types
    - Properties: credits (number), tier (UserTier)
    - _Requirements: 4.1, 4.2, 4.3_

## Phase 4: Application Layer - Use Cases

- [x] 5. Implement credit management use cases

  - [x] 5.1 Create CheckCreditsUseCase
    - Implement in `src/application/use-cases/CheckCreditsUseCase.ts`
    - Constructor dependencies: userRepository, creditPolicy, cache
    - Execute method returns CreditCheckResult with allowed, credits, tier
    - Implement 60-second caching with cache key pattern `credits:{userId}`
    - _Requirements: 2.1, 2.2, 4.5, 9.5_
  - [x] 5.2 Create DeductCreditUseCase
    - Implement in `src/application/use-cases/DeductCreditUseCase.ts`
    - Constructor dependencies: userRepository, transactionRepository, creditPolicy, cache
    - Execute method: check credits, deduct, save user, record transaction, invalidate cache
    - Throw InsufficientCreditsError if no credits available
    - _Requirements: 2.1, 2.2, 2.3, 1.4_
  - [x] 5.3 Create GetCreditBalanceUseCase
    - Implement in `src/application/use-cases/GetCreditBalanceUseCase.ts`
    - Constructor dependencies: userRepository, cache
    - Execute method returns CreditBalance with 60-second caching
    - _Requirements: 4.1, 4.2, 4.3, 9.5_
  - [x] 5.4 Create AddCreditsUseCase
    - Implement in `src/application/use-cases/AddCreditsUseCase.ts`
    - Constructor dependencies: userRepository, transactionRepository, cache
    - Execute method: add credits to user, record transaction, invalidate cache
    - Support different transaction types (ADD, REFUND, ADMIN_ADJUSTMENT)
    - _Requirements: 1.4_

- [x] 6. Create command and result types
  - [x] 6.1 Define DeductCreditCommand
    - Properties: userId, analysisType, analysisId
    - Add to `src/application/types/commands.ts`
    - _Requirements: 2.1, 2.2_
  - [x] 6.2 Define AddCreditsCommand
    - Properties: userId, amount, type, description, metadata
    - Add to `src/application/types/commands.ts`
    - _Requirements: 1.4_
  - [x] 6.3 Define CreditCheckResult interface
    - Properties: allowed (boolean), credits (number), tier (UserTier)
    - Add to application types
    - _Requirements: 2.1, 2.2_

## Phase 5: Infrastructure Layer - Database Implementation

- [x] 7. Update database types for credit system

  - [x] 7.1 Update Database type definition
    - Add credits field to profiles table type in `src/infrastructure/database/types/database.ts`
    - Create credit_transactions table type definition
    - Export CreditTransactionRow, CreditTransactionInsert, CreditTransactionUpdate types
    - _Requirements: 1.3, 1.4_
  - [x] 7.2 Create CreditTransactionDAO interface
    - Define in `src/infrastructure/database/types/dao.ts`
    - Match database schema structure
    - _Requirements: 1.4_

- [x] 8. Implement repository adapters

  - [x] 8.1 Update UserMapper to handle credits field
    - Modify `toDAO()` to include credits
    - Modify `toDomain()` to reconstruct User with credits
    - Update in `src/infrastructure/database/supabase/mappers/UserMapper.ts`
    - _Requirements: 2.1, 2.2_
  - [x] 8.2 Create CreditTransactionMapper
    - Implement in `src/infrastructure/database/supabase/mappers/CreditTransactionMapper.ts`
    - Methods: toDAO(), toDomain()
    - Handle metadata JSON serialization
    - _Requirements: 1.4_
  - [x] 8.3 Update SupabaseUserRepository for credit operations
    - Modify save() and update() to handle credits field
    - Implement updateCredits() method
    - Ensure findById() returns user with credits
    - Update in `src/infrastructure/database/supabase/repositories/SupabaseUserRepository.ts`
    - _Requirements: 2.1, 2.2_
  - [x] 8.4 Create SupabaseCreditTransactionRepository
    - Implement in `src/infrastructure/database/supabase/repositories/SupabaseCreditTransactionRepository.ts`
    - Implement ICreditTransactionRepository interface
    - Methods: recordTransaction(), getTransactionHistory(), getTransactionsByType()
    - Use CreditTransactionMapper for conversions
    - _Requirements: 1.4_

- [x] 9. Implement caching layer
  - [x] 9.1 Create ICache interface
    - Define in `src/infrastructure/cache/ICache.ts` or appropriate location
    - Methods: get<T>(key), set<T>(key, value, ttlSeconds), delete(key)
    - _Requirements: 9.5_
  - [x] 9.2 Create InMemoryCache implementation
    - Implement in `src/infrastructure/cache/InMemoryCache.ts`
    - Use Map with expiration tracking
    - Implement automatic cleanup of expired entries
    - _Requirements: 9.5_

## Phase 6: API Integration and Middleware

- [x] 10. Create credit check middleware

  - [x] 10.1 Implement withCreditCheck middleware function
    - Create in `src/infrastructure/web/middleware/CreditCheckMiddleware.ts`
    - Accept userId and CheckCreditsUseCase as parameters
    - Throw InsufficientCreditsError if credits insufficient
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 10.2 Integrate middleware into analysis endpoints
    - Add credit check before analysis execution in AnalysisController
    - Apply to both startup idea and hackathon analysis flows
    - _Requirements: 2.5_

- [x] 11. Enhance API responses with credit information

  - [x] 11.1 Create AnalysisResponseDTO with credit metadata
    - Define in `src/infrastructure/web/dto/AnalysisDTO.ts`
    - Include credits object with remaining and tier properties
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 11.2 Update AnalysisController to include credit balance in responses
    - After successful analysis, fetch current credit balance
    - Include in response DTO
    - Apply to createAnalysis() method
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 11.3 Integrate DeductCreditUseCase after successful analysis
    - Call DeductCreditUseCase after AI analysis completes
    - Pass analysisType and analysisId for transaction record
    - Handle errors and rollback if needed
    - _Requirements: 2.1, 2.2, 1.4_

- [x] 12. Implement error handling for credit errors
  - [x] 12.1 Add InsufficientCreditsError handler to ErrorMiddleware
    - Map to HTTP 429 (Too Many Requests)
    - Include current credit balance in error response
    - Format: { error: { code, message, details: { credits, tier } } }
    - Update in `src/infrastructure/web/middleware/ErrorMiddleware.ts`
    - _Requirements: 2.3, 7.1, 7.2, 7.3_
  - [x] 12.2 Create error response format for credit errors
    - Include upgrade/purchase information in error details
    - Add helpful message about getting more credits
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

## Phase 7: Service Factory Integration

- [x] 13. Update factories for dependency injection
  - [x] 13.1 Update RepositoryFactory
    - Add method to create CreditTransactionRepository
    - Ensure UserRepository includes credit operations
    - Update in `src/infrastructure/factories/RepositoryFactory.ts`
    - _Requirements: All repository requirements_
  - [x] 13.2 Create cache instance in ServiceFactory
    - Instantiate InMemoryCache as singleton
    - Make available to use cases
    - Update in `src/infrastructure/factories/ServiceFactory.ts`
    - _Requirements: 9.5_
  - [x] 13.3 Update UseCaseFactory with credit use cases
    - Add methods: createCheckCreditsUseCase(), createDeductCreditUseCase(), createGetCreditBalanceUseCase(), createAddCreditsUseCase()
    - Inject proper dependencies including cache
    - Update in `src/infrastructure/factories/UseCaseFactory.ts`
    - _Requirements: All use case requirements_
  - [x] 13.4 Update ServiceFactory to inject credit use cases into controllers
    - Pass CheckCreditsUseCase and DeductCreditUseCase to AnalysisController
    - Ensure proper dependency wiring
    - _Requirements: 2.1, 2.2_

## Phase 8: UI Components

- [x] 14. Create credit counter component

  - [x] 14.1 Implement CreditCounter component
    - Create in `features/shared/components/CreditCounter.tsx`
    - Props: credits (number), tier (UserTier)
    - Display credit icon, amount, and label
    - Show warning styling when credits <= 1
    - Show "out of credits" message when credits === 0
    - For admin tier: display "∞" (infinity symbol) instead of credit count
    - For free and paid tiers: display numeric credit count
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

- [x] 15. Create insufficient credits error display

  - [x] 15.1 Implement InsufficientCreditsError component
    - Create in `features/shared/components/InsufficientCreditsError.tsx`
    - Display error message with current credit count
    - Use prominent error styling
    - Show helpful message about credit system
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 16. Integrate credit counter into application pages

  - [x] 16.1 Add CreditCounter to analyzer page
    - Display before analysis form
    - Fetch credit balance on page load
    - Update after analysis completion
    - Update in `features/analyzer/components/AnalyzerView.tsx`
    - _Requirements: 5.5_
  - [x] 16.2 Add CreditCounter to hackathon analyzer page
    - Display before project submission form
    - Fetch credit balance on page load
    - Update after analysis completion
    - Update in `features/kiroween-analyzer/components/KiroweenAnalyzerView.tsx`
    - _Requirements: 5.5_
  - [x] 16.3 Add CreditCounter to dashboard
    - Display in dashboard header or sidebar
    - Show current credit balance
    - Update in `features/dashboard/components/UserDashboard.tsx`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 16.4 Add CreditCounter to Dr. Frankenstein page
    - Display before idea generation form
    - Fetch credit balance on page load
    - Update after idea generation completion
    - Update in `features/doctor-frankenstein/components/DoctorFrankensteinView.tsx`
    - _Requirements: 5.5_

- [x] 17. Create client-side API functions for credit operations
  - [x] 17.1 Create getCreditBalance API function
    - Implement in `features/shared/api/getCreditBalance.ts`
    - Fetch from `/api/v2/credits/balance` endpoint
    - Return CreditBalance type
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 17.2 Update analysis API functions to handle credit errors
    - Catch 429 errors and display InsufficientCreditsError component
    - Update credit counter after successful analysis
    - Update in `features/analyzer/api/analyzeIdea.ts` and hackathon equivalent
    - _Requirements: 2.3, 7.1, 7.4_

## Phase 9: API Endpoints

- [x] 18. Create credit balance API endpoint ⚠️ **CRITICAL - BLOCKING FEATURE**
  - [x] 18.1 Create GET /api/v2/credits/balance endpoint ⚠️ **REQUIRED FOR END-TO-END FUNCTIONALITY**
    - Create directory `app/api/v2/credits/balance/`
    - Create `route.ts` file with GET handler
    - Authenticate user using authenticateRequest middleware
    - Call GetCreditBalanceUseCase to fetch balance
    - Return CreditBalance in response format
    - Handle errors using handleApiError
    - _Requirements: 4.1, 4.2, 4.3, 10.1, 10.2, 10.3_
    - **NOTE**: Client-side code in `features/shared/api/getCreditBalance.ts` already calls this endpoint

## Phase 10: Configuration and Feature Flags

- [x] 19. Add credit system configuration
  - [x] 19.1 Add environment variables
    - DEFAULT_USER_CREDITS=3
    - ANALYSIS_CREDIT_COST=1
    - FF_CREDIT_SYSTEM=true
    - Document in `.env.example`
    - _Requirements: All requirements_
  - [x] 19.2 Create credit configuration module
    - Read environment variables
    - Provide typed configuration object
    - Create in `src/infrastructure/config/credits.ts`
    - _Requirements: All requirements_
  - [x] 19.3 Add feature flag for credit system
    - Add CREDIT_SYSTEM flag to feature flags config
    - Use to conditionally enable credit checks
    - Update in `lib/featureFlags.config.ts`
    - _Requirements: All requirements_

## Phase 11: Testing

- [x] 20. Write domain layer tests

  - [x]\* 20.1 Test User entity credit methods
    - Test hasCredits(), deductCredit(), addCredits()
    - Test default credit initialization
    - Test InsufficientCreditsError throwing
    - Create in `src/domain/entities/__tests__/User.test.ts`
    - _Requirements: 2.1, 2.2_
  - [x]\* 20.2 Test CreditPolicy domain service
    - Test all policy methods with various scenarios
    - Test credit cost calculations
    - Create in `src/domain/services/__tests__/CreditPolicy.test.ts`
    - _Requirements: 2.1, 2.2_
  - [x]\* 20.3 Test CreditTransaction entity
    - Test entity creation and reconstruction
    - Test getters and validation
    - Create in `src/domain/entities/__tests__/CreditTransaction.test.ts`
    - _Requirements: 1.4_

- [ ]\* 21. Write application layer tests

  - [ ]\* 21.1 Test CheckCreditsUseCase
    - Test with sufficient credits
    - Test with insufficient credits
    - Test caching behavior
    - Create in `src/application/use-cases/__tests__/CheckCreditsUseCase.test.ts`
    - _Requirements: 2.1, 2.2, 9.5_
  - [ ]\* 21.2 Test DeductCreditUseCase
    - Test successful credit deduction
    - Test InsufficientCreditsError throwing
    - Test transaction recording
    - Test cache invalidation
    - Create in `src/application/use-cases/__tests__/DeductCreditUseCase.test.ts`
    - _Requirements: 2.1, 2.2, 2.3, 1.4_
  - [ ]\* 21.3 Test GetCreditBalanceUseCase
    - Test balance retrieval
    - Test caching behavior
    - Create in `src/application/use-cases/__tests__/GetCreditBalanceUseCase.test.ts`
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]\* 21.4 Test AddCreditsUseCase
    - Test credit addition
    - Test transaction recording
    - Test cache invalidation
    - Create in `src/application/use-cases/__tests__/AddCreditsUseCase.test.ts`
    - _Requirements: 1.4_

- [ ]\* 22. Write infrastructure layer tests

  - [ ]\* 22.1 Test SupabaseUserRepository credit operations
    - Test save/update with credits field
    - Test updateCredits method
    - Test findById returns credits
    - Create in `src/infrastructure/database/supabase/repositories/__tests__/SupabaseUserRepository.test.ts`
    - _Requirements: 2.1, 2.2_
  - [ ]\* 22.2 Test SupabaseCreditTransactionRepository
    - Test recordTransaction
    - Test getTransactionHistory
    - Test getTransactionsByType
    - Create in `src/infrastructure/database/supabase/repositories/__tests__/SupabaseCreditTransactionRepository.test.ts`
    - _Requirements: 1.4_
  - [ ]\* 22.3 Test InMemoryCache
    - Test get/set/delete operations
    - Test TTL expiration
    - Test automatic cleanup
    - Create in `src/infrastructure/cache/__tests__/InMemoryCache.test.ts`
    - _Requirements: 9.5_
  - [ ]\* 22.4 Test mappers with credit fields
    - Test UserMapper with credits
    - Test CreditTransactionMapper
    - Create in `src/infrastructure/database/supabase/mappers/__tests__/`
    - _Requirements: 2.1, 2.2, 1.4_

- [ ]\* 23. Write integration tests
  - [ ]\* 23.1 Test credit enforcement on analysis endpoints
    - Test 429 error when credits exhausted
    - Test successful analysis with credit deduction
    - Test credit balance in response
    - Create in `tests/integration/credit-system.test.ts`
    - _Requirements: 2.1, 2.2, 2.3, 10.1, 10.2, 10.3_
  - [ ]\* 23.2 Test end-to-end credit flow
    - Test user with 3 credits performing 3 analyses
    - Test 4th analysis being rejected
    - Test credit transaction audit trail
    - Create in `tests/integration/credit-flow.test.ts`
    - _Requirements: All requirements_

## Phase 12: Documentation and Deployment

- [ ]\* 24. Update documentation
  - [ ]\* 24.1 Document credit system in README
    - Explain credit-based rate limiting
    - Document default credits and costs
    - Explain how to purchase/add credits
    - _Requirements: All requirements_
  - [ ]\* 24.2 Create API documentation for credit endpoints
    - Document credit balance endpoint
    - Document error responses
    - Document credit metadata in analysis responses
    - _Requirements: 4.1, 4.2, 4.3, 10.1, 10.2, 10.3_
  - [ ]\* 24.3 Document database schema changes
    - Document new columns and tables
    - Document indexes
    - Document migration process
    - _Requirements: 1.3, 1.4, 9.1, 9.2_

## Notes

- All tasks build incrementally on previous tasks
- Each task references specific requirements from the requirements document
- Optional tasks (marked with \*) focus on testing and documentation
- Core implementation tasks are not marked as optional and must be completed
- The implementation follows hexagonal architecture principles with clear layer separation
- Database changes are applied first to support domain and application layer development
- UI components are implemented last after all backend logic is in place
