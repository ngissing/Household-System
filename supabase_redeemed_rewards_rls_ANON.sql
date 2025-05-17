-- Ensure RLS is enabled for redeemed_rewards table
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting older policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow authenticated insert access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow individual insert access" ON public.redeemed_rewards; -- Drop example policy if used

-- Allow anonymous users to insert into redeemed_rewards
-- IMPORTANT: This allows ANY frontend user to log a redemption for ANY member.
-- Consider adding checks (e.g., in Edge Functions) for more security later.
CREATE POLICY "Allow anonymous insert access on redeemed_rewards"
  ON public.redeemed_rewards FOR INSERT
  WITH CHECK (auth.role() = 'anon');

-- Also ensure anonymous users can READ redeemed_rewards (might be needed later)
DROP POLICY IF EXISTS "Allow anonymous read access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow authenticated read access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow individual read access" ON public.redeemed_rewards; -- Drop example policy if used

CREATE POLICY "Allow anonymous read access on redeemed_rewards"
  ON public.redeemed_rewards FOR SELECT
  USING (auth.role() = 'anon');