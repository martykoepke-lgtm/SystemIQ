-- Expand team member roles to include MI (Medical Informaticist) category
-- and Director-level roles

-- Drop the old constraint and add the expanded one
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN (
    'sci',              -- System Clinical Informaticist
    'mi',               -- Medical Informaticist
    'analyst',          -- Application Analyst
    'sci_manager',      -- SCI Manager
    'sci_director',     -- SCI Director
    'mi_manager',       -- MI Manager
    'mi_director',      -- MI Director
    'analyst_manager',  -- Analyst Manager
    'analyst_director'  -- Analyst Director
  ));
