-- Ensure RLS is enabled for redeemed_rewards table
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting older update policies if they exist
DROP POLICY IF EXISTS "Allow anonymous update access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow authenticated update access on redeemed_rewards" ON public.redeemed_rewards;

-- Allow anonymous users to update the is_cleared status
-- IMPORTANT: This allows ANY frontend user to clear ANY redemption.
-- Consider adding checks (e.g., in Edge Functions) for more security later.
CREATE POLICY "Allow anonymous clear access on redeemed_rewards"
  ON public.redeemed_rewards FOR UPDATE
  USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

-- Ensure read/insert policies from supabase_redeemed_rewards_rls_ANON.sql still exist or re-add them if needed:
-- Make sure these policies are present in your Supabase dashboard:
-- CREATE POLICY "Allow anonymous read access on redeemed_rewards" ON public.redeemed_rewards FOR SELECT USING (auth.role() = 'anon');
-- CREATE POLICY "Allow anonymous insert access on redeemed_rewards" ON public.redeemed_rewards FOR INSERT WITH CHECK (auth.role() = 'anon');