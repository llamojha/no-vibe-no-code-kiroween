-- Migration: Add Credit System
-- Description: Adds credit-based rate limiting system with credits column and transaction audit trail
-- Date: 2025-02-11

-- ============================================================================
-- 1. Add credits column to profiles table
-- ============================================================================

-- Add credits column with default value of 3
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 3;

-- Create index on credits column for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_credits
ON public.profiles(credits);

-- ============================================================================
-- 2. Create credit_transactions table for audit trail
-- ============================================================================

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deduct', 'add', 'refund', 'admin_adjustment')),
  description TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Create indexes for credit transaction queries
-- ============================================================================

-- Composite index for user transaction history (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_timestamp
ON public.credit_transactions(user_id, timestamp DESC);

-- Index on type for filtering by transaction type
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
ON public.credit_transactions(type);

-- Index on timestamp for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_credit_transactions_timestamp
ON public.credit_transactions(timestamp);

-- ============================================================================
-- 4. Enable Row Level Security on credit_transactions
-- ============================================================================

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own transactions
DROP POLICY IF EXISTS "credit_transactions_select_policy" ON public.credit_transactions;
CREATE POLICY "credit_transactions_select_policy"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Only the system can insert transactions (no direct user inserts)
-- This will be handled by server-side code with service role key
DROP POLICY IF EXISTS "credit_transactions_insert_policy" ON public.credit_transactions;
CREATE POLICY "credit_transactions_insert_policy"
ON public.credit_transactions
FOR INSERT
WITH CHECK (false); -- Prevent direct inserts from users

-- No updates or deletes allowed (immutable audit trail)
DROP POLICY IF EXISTS "credit_transactions_update_policy" ON public.credit_transactions;
CREATE POLICY "credit_transactions_update_policy"
ON public.credit_transactions
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "credit_transactions_delete_policy" ON public.credit_transactions;
CREATE POLICY "credit_transactions_delete_policy"
ON public.credit_transactions
FOR DELETE
USING (false);

-- ============================================================================
-- 5. Backfill existing users with 3 default credits
-- ============================================================================

-- Update all existing profiles to have 3 credits
-- This is safe to run multiple times due to the conditional check
UPDATE public.profiles
SET credits = 3
WHERE credits IS NULL OR credits = 0;

-- ============================================================================
-- 6. Update handle_new_user function to include credits
-- ============================================================================

-- Update the trigger function to ensure new users get default credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a default profile for the new auth user
  -- credits defaults to 3 via column default
  INSERT INTO public.profiles (id, credits)
  VALUES (new.id, 3)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify the migration
DO $$
DECLARE
  profiles_count INTEGER;
  transactions_table_exists BOOLEAN;
BEGIN
  -- Check that profiles have credits
  SELECT COUNT(*) INTO profiles_count
  FROM public.profiles
  WHERE credits >= 0;

  -- Check that credit_transactions table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'credit_transactions'
  ) INTO transactions_table_exists;

  -- Log results
  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '- Profiles with credits: %', profiles_count;
  RAISE NOTICE '- Credit transactions table exists: %', transactions_table_exists;

  IF NOT transactions_table_exists THEN
    RAISE EXCEPTION 'Migration failed: credit_transactions table not created';
  END IF;
END $$;
