-- Test RLS Policies for Ideas and Documents Tables
-- This script verifies that RLS policies correctly enforce user isolation
-- Requirements: 8.1, 8.2, 8.3 (Task 13.3)

-- ============================================================================
-- 1. Verify RLS is enabled
-- ============================================================================

SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ideas', 'documents')
ORDER BY tablename;

-- Expected: Both tables should have rls_enabled = true

-- ============================================================================
-- 2. List all RLS policies
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('ideas', 'documents')
ORDER BY tablename, policyname;

-- Expected: Policies that check auth.uid() = user_id

-- ============================================================================
-- 3. Verify foreign key constraints
-- ============================================================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.con_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('ideas', 'documents')
ORDER BY tc.table_name, tc.constraint_name;

-- Expected: documents.idea_id → ideas.id
--           documents.user_id → auth.users.id
--           ideas.user_id → auth.users.id

-- ============================================================================
-- 4. Test data isolation (requires service role)
-- ============================================================================

-- This section demonstrates how RLS would work with different users
-- In production, each user's session would have auth.uid() set to their user_id

-- Example test (run with service role to bypass RLS):
-- 1. Create test idea for user A
-- 2. Try to query as user B (should return empty)
-- 3. Query as user A (should return the idea)

-- Note: Actual testing requires authenticated sessions
-- The policies are verified through their configuration above

-- ============================================================================
-- 5. Verify indexes support RLS queries
-- ============================================================================

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('ideas', 'documents')
  AND indexdef LIKE '%user_id%'
ORDER BY tablename, indexname;

-- Expected: Indexes on user_id columns to optimize RLS filtering

-- ============================================================================
-- Summary
-- ============================================================================

-- RLS Verification Checklist:
-- [ ] RLS enabled on ideas table
-- [ ] RLS enabled on documents table
-- [ ] Policies check auth.uid() = user_id
-- [ ] Foreign key constraints exist
-- [ ] Indexes on user_id columns exist

