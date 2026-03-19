-- Fix SCI assignments on Epic Gold initiatives
-- The seed may have skipped these due to WHERE NOT EXISTS conflicts

UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0002';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0003';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0004';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0006';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0007';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Jason Mihos' LIMIT 1) WHERE display_id = 'EG-0008';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Jason Mihos' LIMIT 1) WHERE display_id = 'EG-0009';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Trudy Finch' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Sherry Brennaman' LIMIT 1) WHERE display_id = 'EG-0010';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1) WHERE display_id = 'EG-0011';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0012';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Sherry Brennaman' LIMIT 1) WHERE display_id = 'EG-0013';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0015';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1) WHERE display_id = 'EG-0016';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1) WHERE display_id = 'EG-0017';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1) WHERE display_id = 'EG-0018';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1) WHERE display_id = 'EG-0019';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1) WHERE display_id = 'EG-0020';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1) WHERE display_id = 'EG-0022';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Dawn Jacobson' LIMIT 1) WHERE display_id = 'EG-0023';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0024';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1) WHERE display_id = 'EG-0025';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), secondary_sci_id = (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1) WHERE display_id = 'EG-0026';
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Sherry Brennaman' LIMIT 1) WHERE display_id = 'EG-0027';

-- Also fix SCI initiatives (SYS-*) — all assigned to Marty Koepke
UPDATE initiatives SET primary_sci_id = (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1) WHERE display_id LIKE 'SYS-%' AND primary_sci_id IS NULL;
