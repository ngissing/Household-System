-- Ensure RLS is enabled for the tables (should be if you followed previous scripts)
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing default policies if they exist (optional, but cleaner)
-- You might need to adjust policy names if you created custom ones
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.rewards;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.assigned_rewards;
-- Add policies for other operations if they exist from defaults

-- Policies for 'rewards' table
-- Allow authenticated users to read all rewards
CREATE POLICY "Allow authenticated read access on rewards"
  ON public.rewards FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert new rewards
CREATE POLICY "Allow authenticated insert access on rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update any reward
CREATE POLICY "Allow authenticated update access on rewards"
  ON public.rewards FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete any reward (except maybe the default one handled in code)
CREATE POLICY "Allow authenticated delete access on rewards"
  ON public.rewards FOR DELETE
  USING (auth.role() = 'authenticated');


-- Policies for 'assigned_rewards' table
-- Allow authenticated users to read all assignments (needed for dashboard filtering)
CREATE POLICY "Allow authenticated read access on assigned_rewards"
  ON public.assigned_rewards FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert new assignments (when saving rewards)
CREATE POLICY "Allow authenticated insert access on assigned_rewards"
  ON public.assigned_rewards FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete assignments (when saving rewards)
CREATE POLICY "Allow authenticated delete access on assigned_rewards"
  ON public.assigned_rewards FOR DELETE
  USING (auth.role() = 'authenticated');