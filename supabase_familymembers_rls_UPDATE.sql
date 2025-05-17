-- Ensure RLS is enabled for family_members table
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting older policies if they exist
DROP POLICY IF EXISTS "Allow anonymous update access on family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow authenticated update access on family_members" ON public.family_members;
-- Add others if you created custom ones

-- Allow anonymous users to update specific columns: name, avatar, color, points
-- Note: Removed level/progress as they seem deprecated based on FamilyProgress.tsx
-- IMPORTANT: This allows ANY frontend user to update ANY member's details listed below.
-- Consider adding checks (e.g., using auth.uid() if users were authenticated, or Edge Functions) for more security later.
CREATE POLICY "Allow anonymous member details update on family_members"
  ON public.family_members FOR UPDATE
  USING (auth.role() = 'anon') -- Allows update if the user is anonymous
  WITH CHECK (auth.role() = 'anon') -- Ensures the check applies to anonymous users
  -- Explicitly list the columns that can be updated by this policy:
  USING (true) -- Base condition for USING clause
  WITH CHECK (true) -- Base condition for WITH CHECK clause
  -- Specify allowed columns for the UPDATE operation:
  COLUMNS (name, avatar, color, points);

-- Also ensure anonymous users can READ family members (needed to check points before update)
DROP POLICY IF EXISTS "Allow anonymous read access on family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow authenticated read access on family_members" ON public.family_members;

CREATE POLICY "Allow anonymous read access on family_members"
  ON public.family_members FOR SELECT
  USING (auth.role() = 'anon');