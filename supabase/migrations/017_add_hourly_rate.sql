-- Add hourly_rate to team_members for cost analytics
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(8,2) DEFAULT 75.00;

-- Set default rate for all existing members
UPDATE team_members SET hourly_rate = 75.00 WHERE hourly_rate IS NULL;
