# Credit Transactions Flow

## Overview

Credit transactions are recorded in the `credit_transactions` table to provide an audit trail of all credit operations. This document explains when and how transactions are triggered.

## When Credit Transactions Are Recorded

### 1. **DEDUCT Transactions** ✅ (Currently Implemented)

**Triggered when:** A user successfully completes an analysis

**Flow:**

1. User initiates analysis (Startup Idea, Hackathon Project, or Doctor Frankenstein)
2. System checks if user has credits (`CheckCreditsUseCase`)
3. Analysis is performed (AI processing)
4. **After successful analysis**, `DeductCreditUseCase.execute()` is called:
   - Deducts credits from user balance
   - Creates transaction record with:
     - `type: TransactionType.DEDUCT`
     - `amount: -1` (negative number)
     - `description: "Analysis: {analysisType}"`
     - `metadata: { analysisType, analysisId }`
   - Records transaction to database
   - Invalidates cache

**Locations:**

- `AnalysisController.createAnalysis()` - Line 134
- `HackathonController.recordCreditUsage()` - Line 241
- `app/api/doctor-frankenstein/generate/route.ts` - Line 114

**Example Transaction:**

```json
{
  "id": "ctx_abc123",
  "user_id": "user_xyz",
  "amount": -1,
  "type": "deduct",
  "description": "Analysis: startup_idea",
  "metadata": {
    "analysisType": "startup_idea",
    "analysisId": "analysis_123"
  },
  "timestamp": "2024-11-12T10:30:00Z"
}
```

---

### 2. **ADD Transactions** ⚠️ (Not Yet Implemented)

**Should be triggered when:**

- User purchases credit pack
- User receives promotional credits
- Monthly credit refill for paid users
- Welcome bonus for new users

**Implementation needed:**

```typescript
// Example: User purchases 10 credits
await addCreditsUseCase.execute({
  userId: UserId.fromString(userId),
  amount: 10,
  type: TransactionType.ADD,
  description: "Credit pack purchase - 10 credits",
  metadata: {
    paymentId: "pay_123",
    packageType: "starter_pack",
  },
});
```

**Example Transaction:**

```json
{
  "id": "ctx_def456",
  "user_id": "user_xyz",
  "amount": 10,
  "type": "add",
  "description": "Credit pack purchase - 10 credits",
  "metadata": {
    "paymentId": "pay_123",
    "packageType": "starter_pack"
  },
  "timestamp": "2024-11-12T09:00:00Z"
}
```

---

### 3. **REFUND Transactions** ⚠️ (Not Yet Implemented)

**Should be triggered when:**

- Analysis fails after credit deduction
- User reports issue with analysis quality
- System error causes incomplete analysis
- User cancels long-running analysis

**Implementation needed:**

```typescript
// Example: Refund for failed analysis
await addCreditsUseCase.execute({
  userId: UserId.fromString(userId),
  amount: 1,
  type: TransactionType.REFUND,
  description: "Refund for failed analysis",
  metadata: {
    originalAnalysisId: "analysis_123",
    reason: "ai_service_error",
  },
});
```

**Example Transaction:**

```json
{
  "id": "ctx_ghi789",
  "user_id": "user_xyz",
  "amount": 1,
  "type": "refund",
  "description": "Refund for failed analysis",
  "metadata": {
    "originalAnalysisId": "analysis_123",
    "reason": "ai_service_error"
  },
  "timestamp": "2024-11-12T10:35:00Z"
}
```

---

### 4. **ADMIN_ADJUSTMENT Transactions** ⚠️ (Not Yet Implemented)

**Should be triggered when:**

- Admin manually adds credits to user account
- Admin manually removes credits (e.g., abuse prevention)
- System correction for billing errors
- Compensation for service issues

**Implementation needed:**

```typescript
// Example: Admin adds credits for compensation
await addCreditsUseCase.execute({
  userId: UserId.fromString(userId),
  amount: 5,
  type: TransactionType.ADMIN_ADJUSTMENT,
  description: "Compensation for service downtime",
  metadata: {
    adminId: "admin_123",
    reason: "service_downtime",
    ticketId: "support_456",
  },
});

// Example: Admin removes credits
await addCreditsUseCase.execute({
  userId: UserId.fromString(userId),
  amount: -10,
  type: TransactionType.ADMIN_ADJUSTMENT,
  description: "Credit removal - abuse detected",
  metadata: {
    adminId: "admin_123",
    reason: "abuse_prevention",
    details: "Multiple fake accounts detected",
  },
});
```

**Example Transaction:**

```json
{
  "id": "ctx_jkl012",
  "user_id": "user_xyz",
  "amount": 5,
  "type": "admin_adjustment",
  "description": "Compensation for service downtime",
  "metadata": {
    "adminId": "admin_123",
    "reason": "service_downtime",
    "ticketId": "support_456"
  },
  "timestamp": "2024-11-12T11:00:00Z"
}
```

---

## Transaction Recording Flow

### Current Implementation (DEDUCT only)

```
User Request
    ↓
Check Credits (withCreditCheck)
    ↓
Perform Analysis
    ↓
Analysis Success?
    ↓ YES
DeductCreditUseCase.execute()
    ↓
1. Get user from repository
2. Validate sufficient credits
3. Call user.deductCredit() (domain logic)
4. Update user credits in database
5. Create CreditTransaction entity
6. Record transaction to database ← TRANSACTION RECORDED HERE
7. Invalidate cache
    ↓
Return success response
```

### Error Handling

**Important:** If transaction recording fails, the operation continues:

```typescript
if (!transactionResult.success) {
  // Log error but don't fail the operation since credit was already deducted
  console.error(
    "Failed to record credit transaction:",
    transactionResult.error
  );
}
```

This is intentional because:

- User already consumed the service (analysis completed)
- Credit already deducted from balance
- Transaction recording is for audit purposes
- Better to have missing audit record than double-charge user

---

## Database Schema

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deduct', 'add', 'refund', 'admin_adjustment')),
  description TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_timestamp ON credit_transactions(timestamp);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
```

---

## What's Missing (TODO)

### High Priority

1. **Implement ADD transactions for credit purchases**

   - Create payment integration endpoint
   - Call `AddCreditsUseCase` after successful payment
   - Add webhook handler for payment provider

2. **Implement REFUND transactions for failed analyses**

   - Add error handling in analysis controllers
   - Detect AI service failures
   - Automatically refund credits on failure

3. **Add idempotency to prevent duplicate transactions**
   - Add `idempotency_key` column to table
   - Add unique constraint
   - Check for existing transaction before creating

### Medium Priority

4. **Implement ADMIN_ADJUSTMENT transactions**

   - Create admin API endpoint
   - Add authentication/authorization checks
   - Build admin UI for credit management

5. **Add transaction history endpoint**

   - Create `GetUserTransactionsUseCase`
   - Add pagination support
   - Build UI to display transaction history

6. **Implement reconciliation job**
   - Daily job to verify balance = sum(transactions)
   - Alert on discrepancies
   - Auto-correct small drifts

### Low Priority

7. **Add transaction analytics**

   - Track credit consumption patterns
   - Generate usage reports
   - Identify abuse patterns

8. **Implement credit expiration**
   - Add `expires_at` field to transactions
   - Create job to expire old promotional credits
   - Update balance calculation to exclude expired credits

---

## Testing Transactions

### Current Tests

- ✅ `DeductCreditUseCase.test.ts` - Tests deduction and transaction recording
- ✅ `CreditTransaction.test.ts` - Tests entity creation and validation

### Missing Tests

- ⚠️ `AddCreditsUseCase.test.ts` - Not yet implemented
- ⚠️ Integration tests for transaction recording
- ⚠️ Concurrency tests for race conditions
- ⚠️ Idempotency tests

---

## Key Takeaways

1. **Currently only DEDUCT transactions are implemented** - triggered after successful analysis
2. **ADD, REFUND, and ADMIN_ADJUSTMENT are defined but not used** - need implementation
3. **Transactions are recorded AFTER the operation succeeds** - not before
4. **Transaction recording failures don't fail the operation** - audit trail is secondary to user experience
5. **All tiers (free, paid, admin) have transactions recorded equally** - no tier-based bypass

---

## Next Steps

See `TODO.md` for detailed implementation tasks for:

- Idempotency implementation
- Race condition prevention
- Balance reconciliation
- Transaction history API
- Admin credit management tools
