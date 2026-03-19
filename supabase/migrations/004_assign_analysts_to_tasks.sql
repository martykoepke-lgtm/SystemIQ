-- Assign analysts to tasks based on real PRCC data
-- Maps analyst names to their team_member UUIDs

-- TSK-0005: Alex Cordell (EG-0002, Build In Progress)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Alex Cordell' LIMIT 1),
  status = 'Build In Progress', education_required = false, build_review_status = 'in_progress', build_review_date = '2026-02-11'
WHERE display_id = 'TSK-0005';

-- TSK-0006: Michelle Ryan (EG-0003, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Michelle Ryan' LIMIT 1),
  education_required = false, build_review_status = 'in_progress', build_review_date = '2026-03-18'
WHERE display_id = 'TSK-0006';

-- TSK-0007: Alex Cordell (EG-0004, Analyst Assigned)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Alex Cordell' LIMIT 1),
  status = 'Analyst Assigned', education_required = false, build_review_status = 'approved', build_review_date = '2026-02-11'
WHERE display_id = 'TSK-0007';

-- TSK-0009: Alex Cordell (EG-0006, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Alex Cordell' LIMIT 1),
  education_required = false, build_review_status = 'approved', build_review_date = '2026-02-11'
WHERE display_id = 'TSK-0009';

-- TSK-0012: Megan Rutt (EG-0009, Analyst Assigned)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Megan Rutt' LIMIT 1),
  status = 'Analyst Assigned', education_required = false, build_review_status = 'in_progress', build_review_date = '2026-03-17'
WHERE display_id = 'TSK-0012';

-- TSK-0013: Christi Allen (EG-0010, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Christi Allen' LIMIT 1),
  education_required = false, build_review_status = 'in_progress', build_review_date = '2026-03-17'
WHERE display_id = 'TSK-0013';

-- TSK-0018: Corrinne Welch (EG-0012, Build Analyst Assigned)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Corrinne Welch' LIMIT 1),
  status = 'Build Analyst Assigned', education_required = false, build_review_status = 'in_progress', build_review_date = '2026-02-11'
WHERE display_id = 'TSK-0018';

-- TSK-0019: Adam Henderson (EG-0013, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Adam Henderson' LIMIT 1),
  education_required = true, build_review_status = 'not_met'
WHERE display_id = 'TSK-0019';

-- TSK-0021: Desiree Upton (EG-0015, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Desiree Upton' LIMIT 1),
  education_required = false, build_review_status = 'in_progress'
WHERE display_id = 'TSK-0021';

-- TSK-0022: Sara Garcia (EG-0016, Closed - Completed)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Sara Garcia' LIMIT 1),
  status = 'Closed - Completed', education_required = false, build_review_status = 'approved', build_review_date = '2026-02-11', resolution_date = '2026-03-12'
WHERE display_id = 'TSK-0022';

-- TSK-0023: Alex Cordell (EG-0017, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Alex Cordell' LIMIT 1),
  education_required = false, build_review_status = 'not_met'
WHERE display_id = 'TSK-0023';

-- TSK-0028: Alex Cordell (EG-0004, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Alex Cordell' LIMIT 1),
  education_required = false, build_review_status = 'approved', build_review_date = '2026-02-11'
WHERE display_id = 'TSK-0028';

-- TSK-0029: (EG-0012, Build Analyst Assigned) — no analyst in PRCC data, leave null
UPDATE tasks SET status = 'Build Analyst Assigned', build_review_status = 'in_progress', build_review_date = '2026-02-11'
WHERE display_id = 'TSK-0029';

-- TSK-0030: Michelle Ryan (EG-0003, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Michelle Ryan' LIMIT 1),
  education_required = false, build_review_status = 'in_progress', build_review_date = '2026-03-18'
WHERE display_id = 'TSK-0030';

-- TSK-0036: Jennifer Brennan (EG-0003, Build Analyst Assigned)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Jennifer Brennan' LIMIT 1),
  status = 'Build Analyst Assigned', education_required = false, build_review_status = 'in_progress', build_review_date = '2026-03-18'
WHERE display_id = 'TSK-0036';

-- TSK-0038: Christi Allen (EG-0010, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Christi Allen' LIMIT 1),
  education_required = false, build_review_status = 'not_met'
WHERE display_id = 'TSK-0038';

-- TSK-0039: Jared Boynton (EG-0010, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Jared Boynton' LIMIT 1),
  education_required = false, build_review_status = 'in_progress', build_review_date = '2026-03-17'
WHERE display_id = 'TSK-0039';

-- TSK-0060: Adam Henderson (EG-0013, Identified)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Adam Henderson' LIMIT 1),
  education_required = true
WHERE display_id = 'TSK-0060';

-- TSK-0063: Alex Cordell (EG-0027, Build In Progress)
UPDATE tasks SET primary_analyst_id = (SELECT id FROM team_members WHERE name = 'Alex Cordell' LIMIT 1),
  status = 'Build In Progress', education_required = false
WHERE display_id = 'TSK-0063';

-- Also update education_required on tasks that need it per PRCC data
UPDATE tasks SET education_required = true WHERE display_id IN ('TSK-0015', 'TSK-0016', 'TSK-0017', 'TSK-0025', 'TSK-0026', 'TSK-0044', 'TSK-0051', 'TSK-0058');
