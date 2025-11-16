# Credit System Enhancement Plan

## 🎯 Overview

Comprehensive plan to enhance the credit system with focus on data integrity, security, and reliability. This document outlines critical improvements needed to ensure the credit system is production-ready and scalable.

---

## Critical Priority

### Race Condition Prevention

**Problem:** Current implementation has a race condition between checking credits and deducting them. Multiple concurrent requests could pass the check before any deduction occurs.

**Tasks:**

- [ ] Implement atomic check-and-deduct with database transactions (Supabase RPC function)
- [ ] Add row-level locking for balance checks using `SELECT FOR UPDATE`
- [ ] Test concurrent credit deduction scenarios with load testing
- [ ] Add integration tests for race conditions

**Implementation Notes:**

```sql
-- Example Supabase RPC function
CREATE OR REPLACE FUNCTION deduct_credits_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_metadata JSONB
) RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock the row and get current balance
  SELECT credits INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if sufficient credits
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS'
    );
  END IF;

  -- Deduct credits
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id;

  -- Create transaction record
  INSERT INTO credit_transactions (user_id, amount, type, description, metadata)
  VALUES (p_user_id, -p_amount, 'DEDUCT', p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_current_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql;
```

---

### Idempotency

**Problem:** Without idempotency, network retries or duplicate requests could result in double-charging users.

**Tasks:**

- [ ] Add `idempotency_key` column to `credit_transactions` table
- [ ] Add unique constraint on `idempotency_key`
- [ ] Implement idempotency key generation in use cases (e.g., `analysis-${analysisId}`)
- [ ] Handle duplicate transaction attempts gracefully (return existing transaction)
- [ ] Update `DeductCreditUseCase` and `AddCreditsUseCase` to use idempotency keys

**Database Migration:**

```sql
-- Add idempotency_key column
ALTER TABLE credit_transactions
ADD COLUMN idempotency_key TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX idx_credit_transactions_idempotency_key
ON credit_transactions(idempotency_key)
WHERE idempotency_key IS NOT NULL;
```

**Use Case Pattern:**

```typescript
// Generate idempotency key
const idempotencyKey = `analysis-${analysisId}-${userId}`;

// Check for existing transaction
const existing = await repository.findByIdempotencyKey(idempotencyKey);
if (existing) {
  return existing; // Return existing transaction
}

// Proceed with new transaction
```

---

## High Priority

### Database Constraints

**Problem:** Database-level constraints provide last line of defense against data integrity issues.

**Tasks:**

- [ ] Create Supabase RPC function for atomic check-and-deduct operation
- [ ] Add check constraint on `profiles.credits` to prevent negative values: `CHECK (credits >= 0)`
- [ ] Add trigger to log attempts to set negative balances
- [ ] Verify existing indexes are optimal for query patterns

**Database Constraints:**

```sql
-- Add check constraint
ALTER TABLE profiles
ADD CONSTRAINT check_credits_non_negative
CHECK (credits >= 0);

-- Add trigger for logging
CREATE OR REPLACE FUNCTION log_negative_balance_attempt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credits < 0 THEN
    INSERT INTO system_logs (level, message, metadata)
    VALUES (
      'ERROR',
      'Attempt to set negative balance',
      jsonb_build_object(
        'user_id', NEW.id,
        'attempted_balance', NEW.credits,
        'previous_balance', OLD.credits
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_negative_balance
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_negative_balance_attempt();
```

---

### Transaction Types Implementation

**Status:** Only DEDUCT is currently implemented. Other transaction types are defined but not used.

#### ADD Transactions (Credit Purchases)

- [ ] Create payment integration endpoint
- [ ] Implement webhook handler for payment provider
- [ ] Call `AddCreditsUseCase` after successful payment

#### REFUND Transactions (Failed Analyses)

- [ ] Add error handling in analysis controllers
- [ ] Detect AI service failures
- [ ] Automatically refund credits on failure

#### ADMIN_ADJUSTMENT Transactions

- [ ] Create admin API endpoint with proper authorization
- [ ] Build admin UI for credit management
- [ ] Add audit logging for admin actions

**Implementation Pattern:**

```typescript
// src/application/use-cases/credits/AddCreditsUseCase.ts
export class AddCreditsUseCase {
  async execute(params: {
    userId: UserId;
    amount: number;
    type: "ADD" | "REFUND" | "ADMIN_ADJUSTMENT";
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreditTransaction> {
    // Implementation
  }
}
```

---

## Medium Priority

### Error Handling

**Completed:**

- [x] Implement proper error types (InsufficientCreditsError implemented)
- [x] Ensure credits deducted AFTER successful analysis (implemented)

**Remaining:**

- [ ] Add compensating transactions for failed operations
- [ ] Add retry logic with exponential backoff for transient failures
- [ ] Implement circuit breaker pattern for external service calls

**Circuit Breaker Pattern:**

```typescript
// src/infrastructure/external/CircuitBreaker.ts
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

---

### Data Integrity

**Completed:**

- [x] Use integers for credit amounts (implemented)
- [x] Ensure all timestamps use UTC TIMESTAMPTZ (implemented)
- [x] Implement immutable transactions (delete/update blocked in repository)

**Remaining:**

- [ ] Add metadata validation for transaction records using Zod schemas

**Validation Schema:**

```typescript
// src/domain/value-objects/CreditTransactionMetadata.ts
import { z } from "zod";

export const CreditTransactionMetadataSchema = z.object({
  analysisId: z.string().uuid().optional(),
  analysisType: z.enum(["idea", "kiroween", "frankenstein"]).optional(),
  paymentId: z.string().optional(),
  refundReason: z.string().optional(),
  adminUserId: z.string().uuid().optional(),
  adminReason: z.string().optional(),
});

export type CreditTransactionMetadata = z.infer<
  typeof CreditTransactionMetadataSchema
>;
```

---

## Low Priority

### Monitoring & Observability

**Completed:**

- [x] Add logging for all credit transactions (implemented with logger)

**Remaining:**

- [ ] Create alerts for negative balances (requires monitoring setup)
- [ ] Track transaction failure rates in analytics
- [ ] Build dashboard for credit usage analytics
- [ ] Add metrics for credit system health

**Metrics to Track:**

- Total credits in system
- Credits deducted per day/week/month
- Average credits per user
- Transaction failure rate
- Refund rate
- Time to process transactions

---

### Reconciliation & Auditing

**Tasks:**

- [ ] Create daily reconciliation job
  - [ ] Compare `profiles.credits` vs sum of `credit_transactions`
  - [ ] Auto-correct small drifts (< 5 credits)
  - [ ] Alert on large discrepancies (>= 5 credits)
- [ ] Generate audit reports for financial compliance
- [ ] Add transaction history endpoint with pagination
- [ ] Build user-facing transaction history UI

**Reconciliation Job:**

```typescript
// src/infrastructure/jobs/CreditReconciliationJob.ts
export class CreditReconciliationJob {
  async execute(): Promise<ReconciliationReport> {
    const users = await this.getAllUsers();
    const discrepancies: Discrepancy[] = [];

    for (const user of users) {
      const profileBalance = user.credits;
      const transactionSum = await this.sumTransactions(user.id);
      const initialBalance = await this.getInitialBalance(user.id);
      const expectedBalance = initialBalance + transactionSum;

      const drift = profileBalance - expectedBalance;

      if (Math.abs(drift) >= 5) {
        // Alert on large discrepancy
        await this.alertLargeDiscrepancy(user.id, drift);
        discrepancies.push({ userId: user.id, drift });
      } else if (drift !== 0) {
        // Auto-correct small drift
        await this.correctDrift(user.id, drift);
      }
    }

    return { discrepancies, timestamp: new Date() };
  }
}
```

---

## Testing Requirements

**Completed:**

- [x] Unit tests for CreditTransaction entity (implemented)
- [x] Unit tests for DeductCreditUseCase (implemented)

**Remaining:**

- [ ] Unit tests for AddCreditsUseCase
- [ ] Integration tests for concurrent operations
- [ ] Load tests for high-frequency credit checks
- [ ] Integration tests for race conditions
- [ ] Test idempotency with duplicate requests
- [ ] Test refund scenarios

**Test Scenarios:**

```typescript
// tests/integration/credits/race-condition.test.ts
describe("Credit System Race Conditions", () => {
  it("should handle concurrent deductions correctly", async () => {
    const userId = "test-user-id";
    const initialBalance = 100;

    // Simulate 10 concurrent requests
    const promises = Array(10)
      .fill(null)
      .map(() => deductCredits(userId, 10));

    const results = await Promise.allSettled(promises);

    // Only 10 should succeed (100 credits / 10 per request)
    const successful = results.filter((r) => r.status === "fulfilled");
    expect(successful).toHaveLength(10);

    // Final balance should be 0
    const finalBalance = await getBalance(userId);
    expect(finalBalance).toBe(0);
  });
});
```

---

## Future Enhancements

### Credit Types

- [ ] Support different credit types (promotional, purchased, etc.)
- [ ] Implement credit expiration logic
- [ ] Add credit gifting between users
- [ ] Implement subscription plans with recurring credits
- [ ] Add credit reservation system for long-running operations
- [ ] Implement credit marketplace/trading (if applicable)

### Advanced Features

- [ ] Credit packages with discounts
- [ ] Referral credit bonuses
- [ ] Usage-based credit recommendations
- [ ] Credit rollover policies
- [ ] Enterprise credit pools

---

## Implementation Priority

1. **Critical**: Race condition prevention + Idempotency
2. **High**: Database constraints + Transaction types
3. **Medium**: Error handling + Data integrity validation
4. **Low**: Monitoring + Reconciliation
5. **Future**: Advanced credit features

---

## Success Metrics

- **Zero** negative balance incidents
- **Zero** double-charging incidents
- **< 1%** transaction failure rate
- **< 100ms** average transaction processing time
- **100%** reconciliation accuracy
- **< 1 hour** time to detect and alert on discrepancies

---

## Notes

- All database changes require migration scripts
- Test in staging environment before production deployment
- Monitor credit system metrics closely after each deployment
- Maintain backward compatibility during migrations
- Document all RPC functions and triggers
- Keep audit trail for all credit-related operations
