-- Create the 'rewards' table
CREATE TABLE public.rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  icon text NULL, -- For storing emoji or icon name
  CONSTRAINT rewards_pkey PRIMARY KEY (id)
);

-- Optional: Enable Row Level Security (RLS) for rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Optional: Example RLS policy (adjust as needed)
-- Allow authenticated users to read all rewards
-- CREATE POLICY "Allow authenticated read access" ON public.rewards
-- FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service_role to manage rewards (needed for adding/deleting via backend/settings)
-- CREATE POLICY "Allow service_role management" ON public.rewards
-- FOR ALL USING (auth.role() = 'service_role');


-- Create the 'redeemed_rewards' table
CREATE TABLE public.redeemed_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reward_id uuid NULL, -- Nullable in case reward is deleted
  member_id uuid NOT NULL,
  points_spent integer NOT NULL,
  CONSTRAINT redeemed_rewards_pkey PRIMARY KEY (id),
  CONSTRAINT redeemed_rewards_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.family_members(id) ON DELETE CASCADE,
  CONSTRAINT redeemed_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE SET NULL
);

-- Optional: Enable Row Level Security (RLS) for redeemed_rewards
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Optional: Example RLS policies (adjust as needed)
-- Allow users to see their own redeemed rewards
-- CREATE POLICY "Allow individual read access" ON public.redeemed_rewards
-- FOR SELECT USING (auth.uid() = member_id); -- Assumes member_id corresponds to auth.uid() if using Supabase Auth

-- Allow users to insert their own redeemed rewards
-- CREATE POLICY "Allow individual insert access" ON public.redeemed_rewards
-- FOR INSERT WITH CHECK (auth.uid() = member_id); -- Assumes member_id corresponds to auth.uid()

-- Allow service_role full access
-- CREATE POLICY "Allow service_role full access" ON public.redeemed_rewards
-- FOR ALL USING (auth.role() = 'service_role');

-- Add comment on table for clarity
COMMENT ON TABLE public.rewards IS 'Stores available rewards that can be redeemed with points.';
COMMENT ON TABLE public.redeemed_rewards IS 'Tracks when a family member redeems a reward.';