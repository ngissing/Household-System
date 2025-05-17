-- Create the 'assigned_rewards' table
CREATE TABLE public.assigned_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reward_id uuid NOT NULL,
  member_id uuid NOT NULL,
  CONSTRAINT assigned_rewards_pkey PRIMARY KEY (id),
  -- Foreign Key to rewards table (CASCADE delete means if reward is deleted, assignment is deleted)
  CONSTRAINT assigned_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE,
  -- Foreign Key to family_members table (CASCADE delete means if member is deleted, assignment is deleted)
  CONSTRAINT assigned_rewards_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.family_members(id) ON DELETE CASCADE,
  -- Ensure a reward can only be assigned once per member
  CONSTRAINT assigned_rewards_reward_id_member_id_key UNIQUE (reward_id, member_id)
);

-- Optional: Enable Row Level Security (RLS)
ALTER TABLE public.assigned_rewards ENABLE ROW LEVEL SECURITY;

-- Optional: Example RLS Policies (Adjust as needed)
-- Allow authenticated users to read all assignments (needed for dashboard)
-- CREATE POLICY "Allow authenticated read access" ON public.assigned_rewards
-- FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service_role to manage assignments (needed for settings page)
-- CREATE POLICY "Allow service_role management" ON public.assigned_rewards
-- FOR ALL USING (auth.role() = 'service_role');

-- Add comment for clarity
COMMENT ON TABLE public.assigned_rewards IS 'Links rewards to the specific family members they are assigned to.';