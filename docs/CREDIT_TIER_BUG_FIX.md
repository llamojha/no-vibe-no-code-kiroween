# Credit Tier Bug Fix

## Problem

In production, users with `tier: "paid"` were seeing:

1. ❌ Tier displayed as "free" in the UI
2. ❌ Credits not being deducted after analysis

## Root Cause

Two use cases had hardcoded `getUserTier()` methods that always returned `"free"`:

1. **CheckCreditsUseCase** - Used when checking if user has credits before analysis
2. **GetCreditBalanceUseCase** - Used when fetching balance to display in UI

```typescript
// BEFORE (Bug)
private getUserTier(_credits: number): UserTier {
  // For now, all users are "free" tier
  return "free";  // ❌ Always returns "free"!
}
```

The tier exists in the `profiles` table in the database, but the `User` domain entity doesn't have a `tier` field, so these use cases couldn't access it.

## Solution

Created a utility function to fetch tier directly from the database:

### New File: `src/application/utils/getUserTier.ts`

```typescript
export async function getUserTierFromDatabase(
  userId: UserId
): Promise<UserTier> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId.value)
    .single();

  return (data?.tier as UserTier) || "free";
}
```

### Updated Files

1. **CheckCreditsUseCase.ts**

   - Added import: `import { getUserTierFromDatabase } from "../utils/getUserTier"`
   - Changed: `tier: this.getUserTier(user.credits)` → `tier: await getUserTierFromDatabase(userId)`
   - Removed: `private getUserTier()` method

2. **GetCreditBalanceUseCase.ts**
   - Added import: `import { getUserTierFromDatabase } from "../utils/getUserTier"`
   - Changed: `tier: this.getUserTier(user.credits)` → `tier: await getUserTierFromDatabase(userId)`
   - Removed: `private getUserTier()` method

## Testing

After deploying this fix:

1. ✅ Paid users should see `tier: "paid"` in the UI
2. ✅ Admin users should see `tier: "admin"` in the UI
3. ✅ Credits should deduct properly for all tiers
4. ✅ Credit transactions should be recorded in `credit_transactions` table

## Verification Steps

1. **Check tier display:**

   - Login as paid user
   - Open browser DevTools → Network tab
   - Perform an analysis
   - Check the response from `/api/v2/analyze` or `/api/analyze`
   - Should see: `"credits": { "remaining": X, "tier": "paid" }`

2. **Check credit deduction:**

   - Note current credit balance
   - Perform an analysis
   - Credit balance should decrease by 1
   - Check database: `SELECT * FROM credit_transactions WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 5;`
   - Should see new transaction with `type: "deduct"` and `amount: -1`

3. **Check profiles table:**
   - `SELECT id, tier, credits FROM profiles WHERE id = 'your-user-id';`
   - Should show correct tier and updated credits

## Future Improvements

This is a temporary fix. The proper solution is to:

1. **Add `tier` field to User domain entity** (`src/domain/entities/User.ts`)
2. **Update UserMapper** to map tier from database to domain entity
3. **Remove the utility function** and use `user.tier` directly

This would follow hexagonal architecture principles better by keeping tier in the domain model rather than fetching it directly from infrastructure.

## Related Issues

- Credits not deducting: Fixed by this change (tier was always "free" so system thought user had no credits)
- Tier showing as "free": Fixed by fetching actual tier from database
- Credit transactions not recording: Should work now that credits are being deducted

## Deployment Notes

- ✅ No database migrations needed (tier column already exists)
- ✅ No breaking changes to API
- ✅ Backward compatible (defaults to "free" on error)
- ⚠️ Requires redeployment to production
