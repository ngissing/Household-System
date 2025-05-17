-- Ensure RLS is enabled for the tables
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_rewards ENABLE ROW LEVEL SECURITY;

-- Drop potentially incorrect policies applied to 'public' role first (if they exist)
-- Adjust names if needed based on your actual policy names
DROP POLICY IF EXISTS "Allow authenticated delete access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated insert access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated read access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated update access on rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated read access on assigned_rewards" ON public.assigned_rewards;
DROP POLICY IF EXISTS "Allow authenticated insert access on assigned_rewards" ON public.assigned_rewards;
DROP POLICY IF EXISTS "Allow authenticated delete access on assigned_rewards" ON public.assigned_rewards;

-- Policies for 'rewards' table (Applied to AUTHENTICATED role)
CREATE POLICY "Allow AUTHENTICATED read access on rewards"
  ON public.rewards FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow AUTHENTICATED insert access on rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow AUTHENTICATED update access on rewards"
  ON public.rewards FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow AUTHENTICATED delete access on rewards"
  ON public.rewards FOR DELETE
  USING (auth.role() = 'authenticated');


-- Policies for 'assigned_rewards' table (Applied to AUTHENTICATED role)
CREATE POLICY "Allow AUTHENTICATED read access on assigned_rewards"
  ON public.assigned_rewards FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow AUTHENTICATED insert access on assigned_rewards"
  ON public.assigned_rewards FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow AUTHENTICATED delete access on assigned_rewards"
  ON public.assigned_rewards FOR DELETE
  USING (auth.role() = 'authenticated');