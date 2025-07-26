CREATE TABLE deleted_recurring_chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  deleted_for_date DATE NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (original_chore_id, deleted_for_date)
);

ALTER TABLE deleted_recurring_chores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous delete access"
ON deleted_recurring_chores
FOR DELETE USING (auth.role() = 'anon');

CREATE POLICY "Allow anonymous insert access"
ON deleted_recurring_chores
FOR INSERT WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow anonymous select access"
ON deleted_recurring_chores
FOR SELECT USING (auth.role() = 'anon');