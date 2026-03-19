-- Seed missing analysts from PRCC person dropdowns
-- These are people who appear in the PRCC app but weren't in the initial seed

-- First, check which names are already in the database to avoid duplicates
-- Then insert only the missing ones as analysts

INSERT INTO team_members (organization_id, name, role, is_active)
SELECT '00000000-0000-0000-0000-000000000001', name, 'analyst', true
FROM (VALUES
  ('Amanda Davidson'),
  ('Christi Elsmore'),
  ('Gary Hudson'),
  ('Karan Patel'),
  ('Karen Sykes'),
  ('Kate Glass'),
  ('Kim Willis'),
  ('Maria Delacruz'),
  ('Mary Eckert'),
  ('Matthew Walsh'),
  ('Myra Ventrcek'),
  ('Pam Shadle'),
  ('Patrick McGovern'),
  ('Racquel Calhoun'),
  ('Ryan Carr'),
  ('Sheron Johnson'),
  ('Van Nguyen'),
  ('Yvette Kirk'),
  ('Nicole Johnson'),
  ('Ashley Hubbard'),
  ('Robin DeLorenzo')
) AS new_people(name)
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm
  WHERE tm.name = new_people.name
    AND tm.organization_id = '00000000-0000-0000-0000-000000000001'
);
