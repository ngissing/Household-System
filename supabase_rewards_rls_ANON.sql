-- Ensure RLS is enabled for the tables
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_rewards ENABLE ROW LEVEL SECURITY;

-- Drop previous policies (targeting authenticated or potentially public)
-- Adjust names if needed based on your actual policy names
DROP POLICY IF EXISTS "Allow authenticated delete access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated insert access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated read access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated update access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow AUTHENTICATED delete access on rewards" ON public.rewards; -- Drop corrected name too
DROP POLICY IF EXISTS "Allow AUTHENTICATED insert access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow AUTHENTICATED read access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow AUTHENTICATED update access on rewards" ON public.rewards;

DROP POLICY IF EXISTS "Allow authenticated read access on assigned_rewards" ON public.assigned_rewards;
DROP POLICY IF EXISTS "Allow authenticated insert access on assigned_rewards" ON public.assigned_rewards;
DROP POLICY IF EXISTS "Allow authenticated delete access on assigned_rewards" ON public.assigned_rewards;
DROP POLICY IF EXISTS "Allow AUTHENTICATED read access on assigned_rewards" ON public.assigned_rewards;
DROP POLICY IF EXISTS "Allow AUTHENTICATED insert access on assigned_rewards" ON public.assigned_rewards;
DROP POLICY IF EXISTS "Allow AUTHENTICATED delete access on assigned_rewards" ON public.assigned_rewards;


-- Policies for 'rewards' table (Applied to ANON role)
-- Allow anonymous users to read all rewards
CREATE POLICY "Allow anonymous read access on rewards"
  ON public.rewards FOR SELECT
  USING (auth.role() = 'anon');

-- Allow anonymous users to insert new rewards
CREATE POLICY "Allow anonymous insert access on rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (auth.role() = 'anon');

-- Allow anonymous users to update any reward
CREATE POLICY "Allow anonymous update access on rewards"
  ON public.rewards FOR UPDATE
  USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

-- Allow anonymous users to delete any reward
CREATE POLICY "Allow anonymous delete access on rewards"
  ON public.rewards FOR DELETE
  USING (auth.role() = 'anon');


-- Policies for 'assigned_rewards' table (Applied to ANON role)
-- Allow anonymous users to read all assignments
CREATE POLICY "Allow anonymous read access on assigned_rewards"
  ON public.assigned_rewards FOR SELECT
  USING (auth.role() = 'anon');

-- Allow anonymous users to insert new assignments
CREATE POLICY "Allow anonymous insert access on assigned_rewards"
  ON public.assigned_rewards FOR INSERT
  WITH CHECK (auth.role() = 'anon');

-- Allow anonymous users to delete assignments
CREATE POLICY "Allow anonymous delete access on assigned_rewards"
  ON public.assigned_rewards FOR DELETE
  USING (auth.role() = 'anon');