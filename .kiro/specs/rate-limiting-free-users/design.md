# Design Document: Credit-Based Rate Limiting

## Overview

This design implements a credit-based rate limiting system to control AI-powered analysis costs. Each user starts with 3 credits by default (both free and paid tiers). Each analysis (startup idea or hackathon project) consumes 1 credit. When credits reach zero, users cannot generate new analyses until credits are replenished.

The system stores credit balance directly in the user record, tracks credit transactions for audit purposes, and provides clear visibility into remaining credits. The design follows hexagonal architecture principles with domain-driven design, ensuring clean separation between business logic, application orchestration, and infrastructure concerns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Credit Counter│  │ Error Display│  │ API Responses│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Credit Check Middleware                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Check Credits│  │ Deduct Credit│  │ Get Balance  │     │
│  │   Use Case   │  │   Use Case   │  │  Use Case    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              User Entity (with credits)               │  │
│  │  - userId, credits, tier                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CreditTransaction Entity                      │  │
│  │  - userId, amount, type, timestamp, description      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CreditPolicy Domain Service                   │  │
│  │  - hasCredits, deductCredit, calculateCost           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        SupabaseUserRepository                         │  │
│  │  - getCredits, deductCredits, addCredits            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        SupabaseCreditTransactionRepository            │  │
│  │  - recordTransaction, getHistory                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Credit Cache (60s TTL)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Analysis Request** → Check credits → Deduct credit (atomic) → Analysis execution → Record transaction → Response with balance
2. **Dashboard Load** → Fetch cached credit balance → Display credit counter
3. **No Credits** → Return 429 error → Display upgrade/purchase prompt

## Components and Interfaces

### Domain Layer

#### User Entity (Enhanced with Credits)

```typescript
export class User extends Entity<UserId> {
  private constructor(
    id: UserId,
    private readonly email: Email,
    private readonly tier: UserTier,
    private credits: number,
    private readonly createdAt: Date,
    private lastLoginAt: Date | null
  ) {
    super(id);
  }

  static create(props: {
    email: Email;
    tier?: UserTier;
    credits?: number;
  }): User {
    return new User(
      UserId.generate(),
      props.email,
      props.tier ?? UserTier.FREE,
      props.credits ?? 3, // Default 3 credits
      new Date(),
      null
    );
  }

  hasCredits(): boolean {
    return this.credits > 0;
  }

  deductCredit(): void {
    if (this.credits <= 0) {
      throw new InsufficientCreditsError(this.id);
    }
    this.credits -= 1;
  }

  addCredits(amount: number): void {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive");
    }
    this.credits += amount;
  }

  get getCredits(): number {
    return this.credits;
  }
  get getTier(): UserTier {
    return this.tier;
  }
  get getEmail(): Email {
    return this.email;
  }
}
```

#### CreditTransaction Entity

```typescript
export class CreditTransaction extends Entity<CreditTransactionId> {
  private constructor(
    id: CreditTransactionId,
    private readonly userId: UserId,
    private readonly amount: number,
    private readonly type: TransactionType,
    private readonly description: string,
    private readonly timestamp: Date,
    private readonly metadata?: Record<string, any>
  ) {
    super(id);
  }

  static create(props: {
    userId: UserId;
    amount: number;
    type: TransactionType;
    description: string;
    metadata?: Record<string, any>;
  }): CreditTransaction {
    return new CreditTransaction(
      CreditTransactionId.generate(),
      props.userId,
      props.amount,
      props.type,
      props.description,
      new Date(),
      props.metadata
    );
  }

  get getUserId(): UserId {
    return this.userId;
  }
  get getAmount(): number {
    return this.amount;
  }
  get getType(): TransactionType {
    return this.type;
  }
  get getDescription(): string {
    return this.description;
  }
  get getTimestamp(): Date {
    return this.timestamp;
  }
  get getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }
}
```

#### Value Objects

```typescript
export class CreditTransactionId extends ValueObject<string> {
  static generate(): CreditTransactionId {
    return new CreditTransactionId(crypto.randomUUID());
  }
}

export enum TransactionType {
  DEDUCT = "deduct",
  ADD = "add",
  REFUND = "refund",
  ADMIN_ADJUSTMENT = "admin_adjustment",
}

export enum AnalysisType {
  STARTUP_IDEA = "startup_idea",
  HACKATHON_PROJECT = "hackathon_project",
}

export enum UserTier {
  FREE = "free",
  PAID = "paid",
  ADMIN = "admin",
}
```

#### CreditPolicy Domain Service

```typescript
export class CreditPolicy {
  private readonly DEFAULT_CREDITS = 3;
  private readonly ANALYSIS_COST = 1;

  getDefaultCredits(): number {
    return this.DEFAULT_CREDITS;
  }

  getAnalysisCost(analysisType: AnalysisType): number {
    // All analysis types cost 1 credit
    return this.ANALYSIS_COST;
  }

  canPerformAnalysis(user: User): boolean {
    return user.hasCredits();
  }

  shouldShowWarning(credits: number): boolean {
    return credits <= 1;
  }

  calculateCreditDeduction(analysisType: AnalysisType): number {
    return this.getAnalysisCost(analysisType);
  }
}
```

#### Repository Interfaces

```typescript
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  updateCredits(userId: UserId, credits: number): Promise<void>;
}

export interface ICreditTransactionRepository {
  recordTransaction(transaction: CreditTransaction): Promise<void>;
  getTransactionHistory(
    userId: UserId,
    limit?: number
  ): Promise<CreditTransaction[]>;
  getTransactionsByType(
    userId: UserId,
    type: TransactionType
  ): Promise<CreditTransaction[]>;
}

export interface CreditBalance {
  credits: number;
  tier: UserTier;
}
```

### Application Layer

#### Use Cases

```typescript
export class CheckCreditsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly creditPolicy: CreditPolicy,
    private readonly cache: ICache
  ) {}

  async execute(userId: UserId): Promise<CreditCheckResult> {
    // Check cache first
    const cacheKey = `credits:${userId.value}`;
    const cached = await this.cache.get<CreditCheckResult>(cacheKey);
    if (cached) return cached;

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const hasCredits = user.hasCredits();
    const result = {
      allowed: hasCredits,
      credits: user.getCredits,
      tier: user.getTier,
    };

    await this.cache.set(cacheKey, result, 60);
    return result;
  }
}
```

```typescript
export class DeductCreditUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly transactionRepository: ICreditTransactionRepository,
    private readonly creditPolicy: CreditPolicy,
    private readonly cache: ICache
  ) {}

  async execute(command: DeductCreditCommand): Promise<void> {
    // Get user
    const user = await this.userRepository.findById(command.userId);
    if (!user) throw new UserNotFoundError(command.userId);

    // Check if user has credits
    if (!user.hasCredits()) {
      throw new InsufficientCreditsError(command.userId);
    }

    // Deduct credit (domain logic)
    user.deductCredit();

    // Save user with new credit balance
    await this.userRepository.save(user);

    // Record transaction for audit
    const transaction = CreditTransaction.create({
      userId: command.userId,
      amount: -1,
      type: TransactionType.DEDUCT,
      description: `Analysis: ${command.analysisType}`,
      metadata: {
        analysisType: command.analysisType,
        analysisId: command.analysisId,
      },
    });

    await this.transactionRepository.recordTransaction(transaction);

    // Invalidate cache
    const cacheKey = `credits:${command.userId.value}`;
    await this.cache.delete(cacheKey);
  }
}

export class GetCreditBalanceUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cache: ICache
  ) {}

  async execute(userId: UserId): Promise<CreditBalance> {
    const cacheKey = `credit_balance:${userId.value}`;
    const cached = await this.cache.get<CreditBalance>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const balance = {
      credits: user.getCredits,
      tier: user.getTier,
    };

    await this.cache.set(cacheKey, balance, 60);
    return balance;
  }
}

export class AddCreditsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly transactionRepository: ICreditTransactionRepository,
    private readonly cache: ICache
  ) {}

  async execute(command: AddCreditsCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) throw new UserNotFoundError(command.userId);

    user.addCredits(command.amount);
    await this.userRepository.save(user);

    // Record transaction
    const transaction = CreditTransaction.create({
      userId: command.userId,
      amount: command.amount,
      type: command.type,
      description: command.description,
      metadata: command.metadata,
    });

    await this.transactionRepository.recordTransaction(transaction);

    // Invalidate cache
    const cacheKey = `credits:${command.userId.value}`;
    await this.cache.delete(cacheKey);
  }
}
```

#### Commands

```typescript
export interface DeductCreditCommand {
  userId: UserId;
  analysisType: AnalysisType;
  analysisId: string;
}

export interface AddCreditsCommand {
  userId: UserId;
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: Record<string, any>;
}

export interface CreditCheckResult {
  allowed: boolean;
  credits: number;
  tier: UserTier;
}
```

#### Domain Errors

```typescript
export class InsufficientCreditsError extends DomainError {
  readonly code = "INSUFFICIENT_CREDITS";

  constructor(public readonly userId: UserId) {
    super(
      `User ${userId.value} has insufficient credits to perform this action.`
    );
  }
}

export class UserNotFoundError extends DomainError {
  readonly code = "USER_NOT_FOUND";

  constructor(public readonly userId: UserId) {
    super(`User ${userId.value} not found.`);
  }
}
```

### Infrastructure Layer

#### Database Schema

```sql
-- Add credits column to users table
ALTER TABLE users
ADD COLUMN credits INTEGER NOT NULL DEFAULT 3;

-- Create index for credit queries
CREATE INDEX idx_users_credits ON users(credits);

-- Create credit transactions table for audit trail
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deduct', 'add', 'refund', 'admin_adjustment')),
  description TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for efficient queries
CREATE INDEX idx_credit_transactions_user_timestamp
ON credit_transactions(user_id, timestamp DESC);

-- Index for type-based queries
CREATE INDEX idx_credit_transactions_type
ON credit_transactions(type);

-- Index for timestamp-based cleanup
CREATE INDEX idx_credit_transactions_timestamp
ON credit_transactions(timestamp);
```

#### Repository Implementation

```typescript
export class SupabaseUserRepository implements IUserRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly mapper: UserMapper
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id.value)
      .single();

    if (error || !data) return null;
    return this.mapper.toDomain(data);
  }

  async save(user: User): Promise<void> {
    const dao = this.mapper.toDAO(user);
    const { error } = await this.client.from("users").upsert(dao);

    if (error) {
      throw new DatabaseError("Failed to save user", error);
    }
  }

  async updateCredits(userId: UserId, credits: number): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({ credits })
      .eq("id", userId.value);

    if (error) {
      throw new DatabaseError("Failed to update credits", error);
    }
  }
}

export class SupabaseCreditTransactionRepository
  implements ICreditTransactionRepository
{
  constructor(
    private readonly client: SupabaseClient,
    private readonly mapper: CreditTransactionMapper
  ) {}

  async recordTransaction(transaction: CreditTransaction): Promise<void> {
    const dao = this.mapper.toDAO(transaction);
    const { error } = await this.client.from("credit_transactions").insert(dao);

    if (error) {
      throw new DatabaseError("Failed to record transaction", error);
    }
  }

  async getTransactionHistory(
    userId: UserId,
    limit: number = 50
  ): Promise<CreditTransaction[]> {
    const { data, error } = await this.client
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId.value)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError("Failed to fetch transaction history", error);
    }

    return data.map((dao) => this.mapper.toDomain(dao));
  }

  async getTransactionsByType(
    userId: UserId,
    type: TransactionType
  ): Promise<CreditTransaction[]> {
    const { data, error } = await this.client
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId.value)
      .eq("type", type)
      .order("timestamp", { ascending: false });

    if (error) {
      throw new DatabaseError("Failed to fetch transactions by type", error);
    }

    return data.map((dao) => this.mapper.toDomain(dao));
  }
}
```

#### Cache Implementation

```typescript
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class InMemoryCache implements ICache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
```

#### API Integration

```typescript
// Middleware for credit check enforcement
export async function withCreditCheck(
  userId: UserId,
  checkCreditsUseCase: CheckCreditsUseCase
): Promise<void> {
  const result = await checkCreditsUseCase.execute(userId);

  if (!result.allowed) {
    throw new InsufficientCreditsError(userId);
  }
}

// Enhanced API response
export interface AnalysisResponseDTO {
  analysis: AnalysisDTO;
  credits: {
    remaining: number;
    tier: UserTier;
  };
}
```

### Presentation Layer

#### Credit Counter Component

```typescript
export interface CreditCounterProps {
  credits: number;
  tier: UserTier;
}

export function CreditCounter({ credits, tier }: CreditCounterProps) {
  const showWarning = credits <= 1;

  return (
    <div className={`credit-counter ${showWarning ? "warning" : ""}`}>
      <div className="credit-display">
        <span className="credit-icon">⚡</span>
        <span className="credit-amount">{credits}</span>
        <span className="credit-label">credits remaining</span>
      </div>
      {showWarning && credits > 0 && (
        <div className="credit-warning">You're running low on credits!</div>
      )}
      {credits === 0 && (
        <div className="credit-empty">
          <p>You're out of credits</p>
          <button onClick={() => navigateToPurchase()}>Get More Credits</button>
        </div>
      )}
    </div>
  );
}
```

#### Error Display Component

```typescript
export function InsufficientCreditsError({ credits }: { credits: number }) {
  return (
    <div className="insufficient-credits-error">
      <h3>Out of Credits</h3>
      <p>
        You need credits to generate analyses. You currently have {credits}{" "}
        credits.
      </p>
      <div className="credit-cta">
        <p>Get more credits to continue</p>
        <button onClick={() => navigateToPurchase()}>Purchase Credits</button>
      </div>
    </div>
  );
}
```

## Data Models

### Database Tables

#### users (modified)

| Column        | Type        | Constraints         | Description                 |
| ------------- | ----------- | ------------------- | --------------------------- |
| id            | UUID        | PRIMARY KEY         | Unique identifier           |
| email         | TEXT        | NOT NULL, UNIQUE    | User email                  |
| tier          | TEXT        | NOT NULL            | User tier (free/paid/admin) |
| credits       | INTEGER     | NOT NULL, DEFAULT 3 | Credit balance              |
| created_at    | TIMESTAMPTZ | NOT NULL            | Account creation time       |
| last_login_at | TIMESTAMPTZ | NULL                | Last login timestamp        |

#### credit_transactions

| Column      | Type        | Constraints     | Description                          |
| ----------- | ----------- | --------------- | ------------------------------------ |
| id          | UUID        | PRIMARY KEY     | Unique identifier                    |
| user_id     | UUID        | NOT NULL, FK    | Reference to user                    |
| amount      | INTEGER     | NOT NULL        | Credit amount (positive or negative) |
| type        | TEXT        | NOT NULL, CHECK | Transaction type                     |
| description | TEXT        | NOT NULL        | Human-readable description           |
| metadata    | JSONB       | NULL            | Additional transaction data          |
| timestamp   | TIMESTAMPTZ | NOT NULL        | Transaction timestamp                |
| created_at  | TIMESTAMPTZ | NOT NULL        | Record creation time                 |

### Indexes

- `idx_users_credits`: Index on credits column for efficient queries
- `idx_credit_transactions_user_timestamp`: Composite index on (user_id, timestamp DESC) for transaction history
- `idx_credit_transactions_type`: Index on type for filtering by transaction type
- `idx_credit_transactions_timestamp`: Index on timestamp for cleanup operations

## Error Handling

### Error Types

1. **InsufficientCreditsError** (HTTP 429)

   - Returned when user has no credits
   - Triggers purchase/upgrade prompt in UI
   - Includes current credit balance

2. **UserNotFoundError** (HTTP 404)

   - User doesn't exist in system
   - Should not occur for authenticated requests

3. **DatabaseError** (HTTP 500)
   - Database operation failed
   - Logged for monitoring
   - Generic message returned to client

### Error Response Format

```typescript
{
  error: {
    code: 'INSUFFICIENT_CREDITS',
    message: 'User has insufficient credits to perform this action.',
    details: {
      credits: 0,
      tier: 'free'
    }
  }
}
```

## Testing Strategy

### Domain Layer Tests

```typescript
describe("CreditPolicy", () => {
  describe("getDefaultCredits", () => {
    it("should return 3 as default credits", () => {
      const policy = new CreditPolicy();
      expect(policy.getDefaultCredits()).toBe(3);
    });
  });

  describe("getAnalysisCost", () => {
    it("should return 1 credit for startup idea analysis", () => {
      const policy = new CreditPolicy();
      expect(policy.getAnalysisCost(AnalysisType.STARTUP_IDEA)).toBe(1);
    });

    it("should return 1 credit for hackathon project analysis", () => {
      const policy = new CreditPolicy();
      expect(policy.getAnalysisCost(AnalysisType.HACKATHON_PROJECT)).toBe(1);
    });
  });
});

describe("User", () => {
  it("should create user with 3 default credits", () => {
    const user = User.create({ email: Email.create("[email]") });
    expect(user.getCredits).toBe(3);
  });

  it("should deduct credit successfully", () => {
    const user = User.create({ email: Email.create("[email]"), credits: 2 });
    user.deductCredit();
    expect(user.getCredits).toBe(1);
  });

  it("should throw error when deducting with zero credits", () => {
    const user = User.create({ email: Email.create("[email]"), credits: 0 });
    expect(() => user.deductCredit()).toThrow(InsufficientCreditsError);
  });

  it("should add credits successfully", () => {
    const user = User.create({ email: Email.create("[email]"), credits: 1 });
    user.addCredits(5);
    expect(user.getCredits).toBe(6);
  });
});
```

### Application Layer Tests

```typescript
describe("CheckCreditsUseCase", () => {
  it("should allow request when user has credits", async () => {
    const mockUser = User.create({
      email: Email.create("[email]"),
      credits: 3,
    });
    const mockRepo = { findById: vi.fn().mockResolvedValue(mockUser) };
    const useCase = new CheckCreditsUseCase(
      mockRepo,
      new CreditPolicy(),
      mockCache
    );

    const result = await useCase.execute(mockUser.id);

    expect(result.allowed).toBe(true);
    expect(result.credits).toBe(3);
  });

  it("should deny request when user has no credits", async () => {
    const mockUser = User.create({
      email: Email.create("[email]"),
      credits: 0,
    });
    const mockRepo = { findById: vi.fn().mockResolvedValue(mockUser) };
    const useCase = new CheckCreditsUseCase(
      mockRepo,
      new CreditPolicy(),
      mockCache
    );

    const result = await useCase.execute(mockUser.id);

    expect(result.allowed).toBe(false);
    expect(result.credits).toBe(0);
  });

  it("should use cached result when available", async () => {
    const cachedResult = { allowed: true, credits: 2, tier: UserTier.FREE };
    const mockCache = { get: vi.fn().mockResolvedValue(cachedResult) };
    const mockRepo = { findById: vi.fn() };
    const useCase = new CheckCreditsUseCase(
      mockRepo,
      new CreditPolicy(),
      mockCache
    );

    const result = await useCase.execute(UserId.generate());

    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(result).toEqual(cachedResult);
  });
});

describe("DeductCreditUseCase", () => {
  it("should deduct credit and record transaction", async () => {
    const mockUser = User.create({
      email: Email.create("[email]"),
      credits: 3,
    });
    const mockUserRepo = {
      findById: vi.fn().mockResolvedValue(mockUser),
      save: vi.fn(),
    };
    const mockTransactionRepo = { recordTransaction: vi.fn() };
    const useCase = new DeductCreditUseCase(
      mockUserRepo,
      mockTransactionRepo,
      new CreditPolicy(),
      mockCache
    );

    await useCase.execute({
      userId: mockUser.id,
      analysisType: AnalysisType.STARTUP_IDEA,
      analysisId: "test-id",
    });

    expect(mockUser.getCredits).toBe(2);
    expect(mockUserRepo.save).toHaveBeenCalledWith(mockUser);
    expect(mockTransactionRepo.recordTransaction).toHaveBeenCalled();
  });

  it("should throw error when user has no credits", async () => {
    const mockUser = User.create({
      email: Email.create("[email]"),
      credits: 0,
    });
    const mockUserRepo = { findById: vi.fn().mockResolvedValue(mockUser) };
    const useCase = new DeductCreditUseCase(
      mockUserRepo,
      mockTransactionRepo,
      new CreditPolicy(),
      mockCache
    );

    await expect(
      useCase.execute({
        userId: mockUser.id,
        analysisType: AnalysisType.STARTUP_IDEA,
        analysisId: "test-id",
      })
    ).rejects.toThrow(InsufficientCreditsError);
  });
});
```

### Infrastructure Layer Tests

```typescript
describe("SupabaseUserRepository", () => {
  it("should save user with updated credits", async () => {
    const user = User.create({ email: Email.create("[email]"), credits: 2 });
    const mockClient = createMockSupabaseClient();
    const repo = new SupabaseUserRepository(mockClient, new UserMapper());

    await repo.save(user);

    expect(mockClient.from).toHaveBeenCalledWith("users");
    expect(mockClient.upsert).toHaveBeenCalled();
  });

  it("should update credits directly", async () => {
    const userId = UserId.generate();
    const mockClient = createMockSupabaseClient();
    const repo = new SupabaseUserRepository(mockClient, new UserMapper());

    await repo.updateCredits(userId, 5);

    expect(mockClient.update).toHaveBeenCalledWith({ credits: 5 });
  });
});

describe("SupabaseCreditTransactionRepository", () => {
  it("should record transaction successfully", async () => {
    const transaction = CreditTransaction.create({
      userId: UserId.generate(),
      amount: -1,
      type: TransactionType.DEDUCT,
      description: "Test deduction",
    });
    const mockClient = createMockSupabaseClient();
    const repo = new SupabaseCreditTransactionRepository(
      mockClient,
      new CreditTransactionMapper()
    );

    await repo.recordTransaction(transaction);

    expect(mockClient.from).toHaveBeenCalledWith("credit_transactions");
    expect(mockClient.insert).toHaveBeenCalled();
  });

  it("should fetch transaction history with limit", async () => {
    const userId = UserId.generate();
    const mockClient = createMockSupabaseClient();
    const repo = new SupabaseCreditTransactionRepository(
      mockClient,
      new CreditTransactionMapper()
    );

    await repo.getTransactionHistory(userId, 10);

    expect(mockClient.limit).toHaveBeenCalledWith(10);
    expect(mockClient.order).toHaveBeenCalledWith("timestamp", {
      ascending: false,
    });
  });
});
```

### Integration Tests

```typescript
describe("Credit System Integration", () => {
  it("should enforce credit check on analysis endpoint", async () => {
    const user = await createTestUser({ credits: 0 });
    const response = await request(app)
      .post("/api/v2/analyze")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ idea: "Test idea" });

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("INSUFFICIENT_CREDITS");
  });

  it("should deduct credit after successful analysis", async () => {
    const user = await createTestUser({ credits: 3 });
    const response = await request(app)
      .post("/api/v2/analyze")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ idea: "Test idea" });

    expect(response.status).toBe(200);
    expect(response.body.credits.remaining).toBe(2);

    const updatedUser = await getUserById(user.id);
    expect(updatedUser.credits).toBe(2);
  });

  it("should include credit balance in response", async () => {
    const user = await createTestUser({ credits: 2 });
    const response = await request(app)
      .post("/api/v2/analyze")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ idea: "Test idea" });

    expect(response.body.credits).toEqual({
      remaining: 1,
      tier: "free",
    });
  });
});
```

## Performance Optimization

### Caching Strategy

- **Cache Key**: `credits:{userId}`
- **TTL**: 60 seconds
- **Invalidation**: On credit deduction or addition
- **Benefits**: Reduces database queries by ~90% for repeated checks

### Database Optimization

1. **Index on credits column**: Enables efficient filtering by credit balance
2. **Composite Index**: `(user_id, timestamp DESC)` for transaction history queries
3. **Query Performance**: Target <50ms for credit check queries
4. **Connection Pooling**: Reuse database connections
5. **Atomic Updates**: Use database transactions for credit deduction

### Monitoring

- Track cache hit rate (target >85%)
- Monitor query execution time
- Alert on high error rates
- Track credit depletion patterns
- Monitor transaction volume

## Configuration

### Environment Variables

```bash
# Credit configuration
DEFAULT_USER_CREDITS=3
ANALYSIS_CREDIT_COST=1

# Feature flag
FF_CREDIT_SYSTEM=true
```

### Feature Flag

```typescript
export const FEATURE_FLAGS = {
  CREDIT_SYSTEM: process.env.FF_CREDIT_SYSTEM === "true",
};
```

## Migration Strategy

### Phase 1: Database Setup

1. Add `credits` column to `users` table with default value of 3
2. Create `credit_transactions` table
3. Add indexes
4. Verify schema with test data
5. Backfill existing users with 3 credits

### Phase 2: Domain & Application Layer

1. Implement User entity with credit methods
2. Create CreditTransaction entity
3. Implement CreditPolicy domain service
4. Create use cases (CheckCredits, DeductCredit, GetBalance, AddCredits)
5. Write comprehensive tests

### Phase 3: Infrastructure Layer

1. Enhance UserRepository with credit operations
2. Implement CreditTransactionRepository
3. Add caching layer
4. Integration testing

### Phase 4: API Integration

1. Add credit check middleware to analysis endpoints
2. Integrate DeductCreditUseCase after successful analysis
3. Enhance response format to include credit balance
4. Error handling for insufficient credits

### Phase 5: UI Components

1. Create credit counter component
2. Add error display for insufficient credits
3. Integrate with dashboard and analyzer pages
4. Add purchase/upgrade CTAs

### Phase 6: Monitoring & Rollout

1. Add logging and metrics
2. Gradual rollout with feature flag
3. Monitor performance and errors
4. Adjust cache TTL based on usage patterns

## Design Decisions

### Credit-Based vs Time-Based Limiting

**Decision**: Use credit-based system instead of time-based (weekly/monthly) limits

**Rationale**:

- Simpler mental model for users (concrete number vs abstract period)
- No complex period calculations or reset logic
- Easier to implement purchase/top-up functionality
- More flexible for future pricing tiers
- Clearer value proposition (pay for what you use)
- No edge cases around period boundaries

### 3 Credits as Default

**Decision**: Start all users (free and paid) with 3 credits

**Rationale**:

- Allows meaningful product evaluation
- Low enough to control costs
- High enough to test multiple ideas
- Same starting point creates fair experience
- Paid users can purchase more credits as needed

### 1 Credit per Analysis

**Decision**: All analysis types cost 1 credit

**Rationale**:

- Simple pricing model
- Easy to understand and communicate
- Consistent cost regardless of analysis complexity
- Can adjust per-type pricing later if needed

### Store Credits in User Table

**Decision**: Store credit balance directly in users table, not separate table

**Rationale**:

- Faster queries (no joins required)
- Simpler data model
- Credit balance is core user attribute
- Separate transactions table provides audit trail
- Easier to cache

### Atomic Credit Deduction

**Decision**: Deduct credit in same transaction as user save

**Rationale**:

- Prevents race conditions
- Ensures consistency
- No risk of double-charging
- Simpler error handling

### 60-Second Cache TTL

**Decision**: Cache credit balance for 60 seconds

**Rationale**:

- Reduces database load significantly
- Acceptable staleness for rate limiting
- Balances performance with accuracy
- Invalidated on credit changes for consistency

### Transaction Audit Trail

**Decision**: Record all credit transactions in separate table

**Rationale**:

- Enables debugging and support
- Provides user transaction history
- Supports refunds and adjustments
- Helps identify usage patterns
- Required for financial compliance

### In-Memory Cache

**Decision**: Use in-memory cache instead of Redis initially

**Rationale**:

- Simpler implementation for MVP
- No additional infrastructure required
- Sufficient for single-instance deployment
- Can migrate to Redis if needed for scaling

## Security Considerations

1. **User ID Validation**: Always verify authenticated user matches request
2. **SQL Injection**: Use parameterized queries exclusively
3. **Cache Poisoning**: Validate cached data structure
4. **Credit Manipulation**: All credit operations server-side only
5. **Transaction Integrity**: Use database transactions for atomic operations
6. **Audit Trail**: Log all credit changes for security review

## Future Enhancements

1. **Credit Packages**: Allow users to purchase credit bundles
2. **Credit Expiration**: Optional expiration dates for promotional credits
3. **Credit Gifting**: Allow users to transfer credits
4. **Subscription Plans**: Monthly credit allowances for paid tiers
5. **Credit Refunds**: Refund credits for failed analyses
6. **Usage Analytics**: Dashboard showing credit usage over time
7. **Credit Notifications**: Email alerts when credits run low
8. **Redis Cache**: Distributed caching for multi-instance deployment
9. **Credit History UI**: User-facing transaction history page
10. **Variable Pricing**: Different credit costs for different analysis types
