-- Add team_member_id to goals table for individual goal ownership
ALTER TABLE goals ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES team_members(id);
CREATE INDEX IF NOT EXISTS idx_goals_member ON goals(team_member_id);
