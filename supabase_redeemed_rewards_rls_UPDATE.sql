-- Ensure RLS is enabled for redeemed_rewards table
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting older update policies if they exist
DROP POLICY IF EXISTS "Allow anonymous update access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow authenticated update access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "DEBUG Allow anon to update any redeemed_reward" ON public.redeemed_rewards; -- Drop the temporary DEBUG policy
DROP POLICY IF EXISTS "Allow anonymous clear access on redeemed_rewards" ON public.redeemed_rewards; -- Ensure the standard one is dropped before re-creation

-- Grant UPDATE permission to the anon role on the redeemed_rewards table (should still be here)
-- GRANT UPDATE ON public.redeemed_rewards TO anon; (This was added previously and should persist, but no harm in ensuring it's noted)

-- Re-create the intended policy for anonymous users to update is_cleared status
-- This policy allows an anonymous user to update any row. The specific row
-- to be updated is determined by the `eq("id", redeemedRewardId)` clause in the client query.
-- The `is_cleared` field is the only one being modified by the client logic.
CREATE POLICY "Allow anonymous clear access on redeemed_rewards"
  ON public.redeemed_rewards FOR UPDATE
  USING (auth.role() = 'anon') -- The user initiating the update must be anonymous.
  WITH CHECK (auth.role() = 'anon'); -- The row, after update, must still satisfy this condition.

-- Ensure read/insert policies from supabase_redeemed_rewards_rls_ANON.sql still exist or re-add them if needed:
-- Make sure these policies are present in your Supabase dashboard:
-- CREATE POLICY "Allow anonymous read access on redeemed_rewards" ON public.redeemed_rewards FOR SELECT USING (auth.role() = 'anon');
-- CREATE POLICY "Allow anonymous insert access on redeemed_rewards" ON public.redeemed_rewards FOR INSERT WITH CHECK (auth.role() = 'anon');