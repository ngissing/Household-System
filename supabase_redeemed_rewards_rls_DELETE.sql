-- Ensure RLS is enabled for redeemed_rewards table
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting older policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow authenticated insert access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow individual insert access" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow anonymous read access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow authenticated read access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow individual read access" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow anonymous update access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow authenticated update access on redeemed_rewards" ON public.redeemed_rewards;
DROP POLICY IF EXISTS "Allow anonymous clear access on redeemed_rewards" ON public.redeemed_rewards; -- Drop previous update policy
DROP POLICY IF EXISTS "Allow anonymous delete access on redeemed_rewards" ON public.redeemed_rewards; -- Drop potential old delete policy


-- Allow anonymous users to READ redeemed_rewards
CREATE POLICY "Allow anonymous read access on redeemed_rewards"
  ON public.redeemed_rewards FOR SELECT
  USING (auth.role() = 'anon');

-- Allow anonymous users to INSERT into redeemed_rewards
CREATE POLICY "Allow anonymous insert access on redeemed_rewards"
  ON public.redeemed_rewards FOR INSERT
  WITH CHECK (auth.role() = 'anon');

-- Allow anonymous users to DELETE redeemed_rewards (to clear them)
-- IMPORTANT: This allows ANY frontend user to delete ANY redemption record.
CREATE POLICY "Allow anonymous delete access on redeemed_rewards"
  ON public.redeemed_rewards FOR DELETE
  USING (auth.role() = 'anon');