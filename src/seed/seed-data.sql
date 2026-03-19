-- =============================================================================
-- SystemIQ Seed Data
-- Real organizational data for team members, initiatives, and tasks
-- Run AFTER 001_initial_schema.sql migration
-- Idempotent: uses ON CONFLICT or NOT EXISTS checks
-- =============================================================================

-- Default org constant
-- '00000000-0000-0000-0000-000000000001'

BEGIN;

-- =============================================================================
-- 1. TEAM MEMBERS
-- =============================================================================

-- SCI Manager (insert first so we can reference as manager)
INSERT INTO team_members (organization_id, name, email, role, title, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Tiffany Shields-Tettamanti',
  'tiffany.shields-tettamanti@commonspirit.org',
  'sci_manager',
  'SCI Manager',
  true
)
ON CONFLICT DO NOTHING;

-- SCIs (role='sci')
INSERT INTO team_members (organization_id, name, email, role, manager_id, title, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Brooke Searl', 'brooke.searl@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Jason Mihos', 'jason.mihos@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Marty Koepke', 'marty.koepke@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Trudy Finch', 'trudy.finch@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Sherry Brennaman', 'sherry.brennaman@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Melissa Plummer', 'melissa.plummer@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Marisa Radick', 'marisa.radick@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Dawn Jacobson', 'dawn.jacobson@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Kim Willis', 'kim.willis@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Josh Greenwood', 'josh.greenwood@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true),
  ('00000000-0000-0000-0000-000000000001', 'Lisa Townsend', 'lisa.townsend@commonspirit.org', 'sci', (SELECT id FROM team_members WHERE name = 'Tiffany Shields-Tettamanti' LIMIT 1), 'System Clinical Informaticist', true)
ON CONFLICT DO NOTHING;

-- Analysts (role='analyst')
INSERT INTO team_members (organization_id, name, email, role, title, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alex Cordell', 'alex.cordell@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Michelle Ryan', 'michelle.ryan@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Christi Allen', 'christi.allen@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Megan Rutt', 'megan.rutt@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Corrinne Welch', 'corrinne.welch@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Sara Garcia', 'sara.garcia@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Adam Henderson', 'adam.henderson@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Jennifer Brennan', 'jennifer.brennan@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Jared Boynton', 'jared.boynton@commonspirit.org', 'analyst', 'Clinical Analyst', true),
  ('00000000-0000-0000-0000-000000000001', 'Desiree Upton', 'desiree.upton@commonspirit.org', 'analyst', 'Clinical Analyst', true)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 2. EPIC GOLD INITIATIVES (23 total)
-- =============================================================================

-- EG-0002: Nursing Travel Screening Assessment
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0002',
  'Nursing Travel Screening Assessment',
  'Epic Gold',
  'High',
  'In Progress',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing"]'::jsonb,
  NULL,
  'Alison Mason',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0002');

-- EG-0003: Candida auris
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0003',
  'Candida auris',
  'Epic Gold',
  'High',
  'Ready for Discussion',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc","OPA","Bugsy"]'::jsonb,
  '["Acute Inpatient","ED"]'::jsonb,
  '["Nursing","Provider","Infection Prevention"]'::jsonb,
  NULL,
  'Becky Leach',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0003');

-- EG-0004: Nursing Head to Toe Assessment
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0004',
  'Nursing Head to Toe Assessment',
  'Epic Gold',
  'High',
  'Under Review',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  NULL,
  NULL,
  NULL,
  'Alison Mason',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0004');

-- EG-0006: Nursing Fall Assessment
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0006',
  'Nursing Fall Assessment',
  'Epic Gold',
  'High',
  'Under Review',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  NULL,
  NULL,
  NULL,
  'Alison Mason',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0006');

-- EG-0007: Nursing Skin Assessment
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0007',
  'Nursing Skin Assessment',
  'Epic Gold',
  'High',
  'Under Review',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing"]'::jsonb,
  NULL,
  'Alison Mason',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0007');

-- EG-0008: Suicide risk policy
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0008',
  'Suicide risk policy',
  'Epic Gold',
  'Medium',
  'In Progress',
  (SELECT id FROM team_members WHERE name = 'Jason Mihos' LIMIT 1),
  NULL,
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient","ED"]'::jsonb,
  NULL,
  NULL,
  NULL,
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0008');

-- EG-0009: ED Abuse, Neglect, Violence Screening
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0009',
  'ED Abuse, Neglect, Violence Screening',
  'Epic Gold',
  'High',
  'Under Review',
  (SELECT id FROM team_members WHERE name = 'Jason Mihos' LIMIT 1),
  NULL,
  '["ClinDoc","ASAP"]'::jsonb,
  '["ED"]'::jsonb,
  NULL,
  NULL,
  NULL,
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0009');

-- EG-0010: Bladder Management
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0010',
  'Bladder Management',
  'Epic Gold',
  'High',
  'In Progress',
  (SELECT id FROM team_members WHERE name = 'Trudy Finch' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Sherry Brennaman' LIMIT 1),
  '["ClinDoc","Orders"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing"]'::jsonb,
  NULL,
  NULL,
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0010');

-- EG-0011: SDOH (Acute, ED, Amb, HOD)
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0011',
  'SDOH (Acute, ED, Amb, HOD)',
  'Epic Gold',
  'High',
  'Ready for Discussion',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  '["ED","Acute Inpatient","Ambulatory"]'::jsonb,
  '["Provider","Nursing","Medical Assistants","Care Coordination","Social Work"]'::jsonb,
  NULL,
  'Ankita Sagar',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0011');

-- EG-0012: Nursing SOP - Dialysis Graft/Fistula
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0012',
  'Nursing SOP - Dialysis Graft/Fistula',
  'Epic Gold',
  'Medium',
  'Under Review',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing","Provider"]'::jsonb,
  NULL,
  'Alison Mason',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0012');

-- EG-0013: Sedation Policy Narrator
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0013',
  'Sedation Policy Narrator',
  'Epic Gold',
  'Medium',
  'Not Started',
  (SELECT id FROM team_members WHERE name = 'Sherry Brennaman' LIMIT 1),
  NULL,
  '["ClinDoc","ASAP","Rad","Lumens","Optime"]'::jsonb,
  '["Periop"]'::jsonb,
  '["Nursing"]'::jsonb,
  NULL,
  NULL,
  'New Beginnings South',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0013');

-- EG-0015: Preferred Languages
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0015',
  'Preferred Languages',
  'Epic Gold',
  'Medium',
  'Ready for Discussion',
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  NULL,
  '["Grand Central"]'::jsonb,
  '["ED","Acute Inpatient","Ambulatory","Periop","Outpatient Surgery","Acute Outpatient"]'::jsonb,
  NULL,
  NULL,
  NULL,
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0015');

-- EG-0016: ICU Liberation
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0016',
  'ICU Liberation',
  'Epic Gold',
  'Medium',
  'Completed',
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing"]'::jsonb,
  NULL,
  'Brenda Downs',
  'Wave 3',
  false
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0016');

-- EG-0017: Valubles & Belongings
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0017',
  'Valubles & Belongings',
  'Epic Gold',
  'Medium',
  'In Progress',
  (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1),
  NULL,
  '["ClinDoc","ASAP","OpTime"]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0017');

-- EG-0018: DAST10
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0018',
  'DAST10',
  'Epic Gold',
  'Medium',
  'In Progress',
  (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1),
  NULL,
  '["Stork"]'::jsonb,
  '["Acute Inpatient","ED"]'::jsonb,
  '["Nursing","Provider","Care Coordination","Social Work"]'::jsonb,
  NULL,
  NULL,
  'New Beginnings South',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0018');

-- EG-0019: Amb: Depression Screening (PHQ2/9/A)
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0019',
  'Amb: Depression Screening (PHQ2/9/A)',
  'Epic Gold',
  'High',
  'Ready for Discussion',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1),
  NULL,
  NULL,
  '["Ambulatory"]'::jsonb,
  '["Medical Assistants","Provider"]'::jsonb,
  NULL,
  'Deb Rockman',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0019');

-- EG-0020: Amb: BP - 2nd Reading for 140/90
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0020',
  'Amb: BP - 2nd Reading for 140/90',
  'Epic Gold',
  'High',
  'Ready for Discussion',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1),
  NULL,
  '["Ambulatory"]'::jsonb,
  '["Ambulatory"]'::jsonb,
  '["Provider","Medical Assistants"]'::jsonb,
  NULL,
  'Deb Rockman',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0020');

-- EG-0022: Amb: Medicare Annual Wellness
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0022',
  'Amb: Medicare Annual Wellness',
  'Epic Gold',
  'High',
  'Ready for Discussion',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1),
  NULL,
  '["Ambulatory"]'::jsonb,
  '["Ambulatory"]'::jsonb,
  '["Medical Assistants","Provider"]'::jsonb,
  NULL,
  'Deb Rockman',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0022');

-- EG-0023: Age Friendly Documentation
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0023',
  'Age Friendly Documentation',
  'Epic Gold',
  'High',
  'Under Review',
  (SELECT id FROM team_members WHERE name = 'Dawn Jacobson' LIMIT 1),
  NULL,
  '["ClinDoc"]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'New Beginnings South',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0023');

-- EG-0024: Restraints
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0024',
  'Restraints',
  'Epic Gold',
  'High',
  'Under Review',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing"]'::jsonb,
  NULL,
  'Kerri Culver',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0024');

-- EG-0025: Extravasation FLT Documentation
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0025',
  'Extravasation FLT Documentation',
  'Epic Gold',
  'Medium',
  'In Progress',
  (SELECT id FROM team_members WHERE name = 'Brooke Searl' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Marisa Radick' LIMIT 1),
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing"]'::jsonb,
  NULL,
  'Lauren Bulin',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0025');

-- EG-0026: Interpreter Service Documentation
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0026',
  'Interpreter Service Documentation',
  'Epic Gold',
  'High',
  'Ready for Discussion',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1),
  (SELECT id FROM team_members WHERE name = 'Melissa Plummer' LIMIT 1),
  NULL,
  '["ED","Acute Inpatient","Ambulatory","Periop","Acute Outpatient","Outpatient Surgery"]'::jsonb,
  '["Registration/Front Office","Nursing","Medical Assistants"]'::jsonb,
  NULL,
  'Connie Clemmons Brown/ Lisa Macri',
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0026');

-- EG-0027: OralKleen (Comprehensive Oral Care)
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, secondary_sci_id, applications, venues, roles_impacted, specialty_service_line, system_sponsor, go_live_wave, is_active)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'EG-0027',
  'OralKleen (Comprehensive Oral Care)',
  'Epic Gold',
  'Medium',
  'In Progress',
  (SELECT id FROM team_members WHERE name = 'Sherry Brennaman' LIMIT 1),
  NULL,
  '["ClinDoc"]'::jsonb,
  '["Acute Inpatient"]'::jsonb,
  '["Nursing","Respiratory/Rehab","Infection Prevention"]'::jsonb,
  NULL,
  NULL,
  'Wave 3',
  true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'EG-0027');


-- =============================================================================
-- 3. SCI INITIATIVES (17 total) - Marty Koepke's personal portfolio
-- =============================================================================

-- SYS-0001: HAPI RT O2 Skin Assessments
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, work_effort, specialty_service_line, applications, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0001', 'HAPI RT O2 Skin Assessments', 'System Initiative', 'High', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), 'S', '["Ancillary"]'::jsonb, '["Epic"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0001');

-- SYS-0002: Amb Epic Gold WF Review
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, work_effort, specialty_service_line, applications, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0002', 'Amb Epic Gold WF Review', 'Epic Gold', 'Critical', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), 'L', '["Ambulatory"]'::jsonb, '["Epic"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0002');

-- SYS-0003: PUP Health Maintenance Group
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0003', 'PUP Health Maintenance Group', 'Consultation', 'Low', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0003');

-- SYS-0004: Abuse, Neglect and Violence
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0004', 'Abuse, Neglect and Violence', 'System Initiative', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0004');

-- SYS-0005: Interpreter Services Optimization
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0005', 'Interpreter Services Optimization', 'Epic Gold', 'High', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0005');

-- SYS-0006: SDOH CSH Standards
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0006', 'SDOH CSH Standards', 'System Initiative', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0006');

-- SYS-0007: Natera Project (CAREB Only)
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0007', 'Natera Project (CAREB Only)', 'Consultation', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0007');

-- SYS-0008: Abridge Ambient AI
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0008', 'Abridge Ambient AI', 'System Project', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0008');

-- SYS-0009: HRS EPIC Integration Project PRJ0012291
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0009', 'HRS EPIC Integration Project PRJ0012291', 'Epic Gold', 'Critical', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0009');

-- SYS-0010: Depression Interpretation Optimizations
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0010', 'Depression Interpretation Optimizations', 'Consultation', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0010');

-- SYS-0011: IRF Education Documentation Review
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0011', 'IRF Education Documentation Review', 'Consultation', 'Medium', 'Dismissed',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), false
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0011');

-- SYS-0012: CMU Tele-Strips Optimization Cerner
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0012', 'CMU Tele-Strips Optimization Cerner', 'Market Initiative', 'Low', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0012');

-- SYS-0013: HRS Cerner Integration
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0013', 'HRS Cerner Integration', 'Consultation', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0013');

-- SYS-0014: Abridge AI - Org Expansion
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0014', 'Abridge AI - Org Expansion', 'System Initiative', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0014');

-- SYS-0015: Vaccine Deferral (All Platforms)
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0015', 'Vaccine Deferral (All Platforms)', 'SCI Team', 'Critical', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0015');

-- SYS-0016: Zoom Integration Update Needs
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0016', 'Zoom Integration Update Needs', 'Consultation', 'Critical', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0016');

-- SYS-0017: Testing The Initiative Dashboard
INSERT INTO initiatives (organization_id, display_id, name, type, priority, status, primary_sci_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'SYS-0017', 'Testing The Initiative Dashboard', 'Consultation', 'Medium', 'In Progress',
  (SELECT id FROM team_members WHERE name = 'Marty Koepke' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM initiatives WHERE display_id = 'SYS-0017');


-- =============================================================================
-- 4. TASKS (52 total, linked to Epic Gold initiatives)
-- Distributed across initiatives with realistic task descriptions
-- Display IDs: TSK-0005 through TSK-0063 (gaps at TSK-0014, TSK-0021, TSK-0028, TSK-0035, TSK-0042, TSK-0049, TSK-0056)
-- =============================================================================

-- --- EG-0002: Nursing Travel Screening Assessment (3 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0002' LIMIT 1),
  'TSK-0005', 'Review current travel screening flowsheet', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0005');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0002' LIMIT 1),
  'TSK-0006', 'Build updated screening navigator', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0006');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0002' LIMIT 1),
  'TSK-0007', 'Validate travel screening logic with nursing leadership', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0007');

-- --- EG-0003: Candida auris (3 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0003' LIMIT 1),
  'TSK-0008', 'Build Candida auris isolation precautions alert', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0008');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0003' LIMIT 1),
  'TSK-0009', 'Update OPA order sets for C. auris treatment', 'OPA', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0009');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0003' LIMIT 1),
  'TSK-0010', 'Configure Bugsy infection control reporting', 'Bugsy', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0010');

-- --- EG-0004: Nursing Head to Toe Assessment (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0004' LIMIT 1),
  'TSK-0011', 'Map current head-to-toe assessment workflow', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0011');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0004' LIMIT 1),
  'TSK-0012', 'Redesign assessment flowsheet for Epic Gold standard', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0012');

-- --- EG-0006: Nursing Fall Assessment (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0006' LIMIT 1),
  'TSK-0013', 'Review Morse Fall Scale documentation requirements', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0013');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0006' LIMIT 1),
  'TSK-0015', 'Build fall risk intervention care plan', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0015');

-- --- EG-0007: Nursing Skin Assessment (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0007' LIMIT 1),
  'TSK-0016', 'Standardize Braden Scale documentation across facilities', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0016');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0007' LIMIT 1),
  'TSK-0017', 'Build wound documentation flowsheet', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0017');

-- --- EG-0008: Suicide risk policy (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0008' LIMIT 1),
  'TSK-0018', 'Update Columbia Suicide Severity Rating Scale (C-SSRS) in ClinDoc', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0018');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0008' LIMIT 1),
  'TSK-0019', 'Configure safety precautions BPA for positive screens', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0019');

-- --- EG-0009: ED Abuse, Neglect, Violence Screening (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0009' LIMIT 1),
  'TSK-0020', 'Design abuse/neglect screening navigator in ASAP', 'ASAP', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0020');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0009' LIMIT 1),
  'TSK-0022', 'Build mandatory reporting documentation workflow', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0022');

-- --- EG-0010: Bladder Management (3 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0010' LIMIT 1),
  'TSK-0023', 'Build catheter care documentation flowsheet', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0023');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0010' LIMIT 1),
  'TSK-0024', 'Create bladder management order set', 'Orders', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0024');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0010' LIMIT 1),
  'TSK-0025', 'Validate CAUTI prevention BPA logic', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0025');

-- --- EG-0011: SDOH (4 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0011' LIMIT 1),
  'TSK-0026', 'Build SDOH screening questionnaire in ClinDoc', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0026');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0011' LIMIT 1),
  'TSK-0027', 'Configure SDOH referral workflow for social work', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0027');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0011' LIMIT 1),
  'TSK-0029', 'Map SDOH screening to ambulatory Best Practice Alerts', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0029');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0011' LIMIT 1),
  'TSK-0030', 'Test ED SDOH screening integration with care coordination', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0030');

-- --- EG-0012: Nursing SOP - Dialysis Graft/Fistula (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0012' LIMIT 1),
  'TSK-0031', 'Build dialysis access assessment flowsheet', 'ClinDoc', 'Medium', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0031');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0012' LIMIT 1),
  'TSK-0032', 'Create graft/fistula nursing documentation standard', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0032');

-- --- EG-0013: Sedation Policy Narrator (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0013' LIMIT 1),
  'TSK-0033', 'Map sedation policy requirements across ClinDoc, ASAP, Rad, Lumens, Optime', 'ClinDoc', 'Medium', 'Not Started'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0033');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0013' LIMIT 1),
  'TSK-0034', 'Build sedation scoring navigator for periop', 'Optime', 'Medium', 'Not Started'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0034');

-- --- EG-0015: Preferred Languages (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0015' LIMIT 1),
  'TSK-0036', 'Review Grand Central preferred language configuration', 'Grand Central', 'Medium', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0036');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0015' LIMIT 1),
  'TSK-0037', 'Validate language propagation across all venues', 'Grand Central', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0037');

-- --- EG-0017: Valubles & Belongings (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0017' LIMIT 1),
  'TSK-0038', 'Build valuables inventory documentation in ClinDoc', 'ClinDoc', 'Medium', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0038');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0017' LIMIT 1),
  'TSK-0039', 'Configure belongings tracking in ASAP and OpTime', 'ASAP', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0039');

-- --- EG-0018: DAST10 (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0018' LIMIT 1),
  'TSK-0040', 'Build DAST-10 substance abuse screening in Stork', 'Stork', 'Medium', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0040');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0018' LIMIT 1),
  'TSK-0041', 'Configure positive screen referral to social work', 'Stork', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0041');

-- --- EG-0019: Depression Screening PHQ2/9/A (3 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0019' LIMIT 1),
  'TSK-0043', 'Build PHQ-2 initial screening questionnaire for ambulatory', 'Ambulatory', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0043');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0019' LIMIT 1),
  'TSK-0044', 'Configure PHQ-9 follow-up scoring logic', 'Ambulatory', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0044');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0019' LIMIT 1),
  'TSK-0045', 'Build PHQ-A adolescent variant for pediatric encounters', 'Ambulatory', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0045');

-- --- EG-0020: BP 2nd Reading (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0020' LIMIT 1),
  'TSK-0046', 'Build BPA for 2nd BP reading when initial >= 140/90', 'Ambulatory', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0046');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0020' LIMIT 1),
  'TSK-0047', 'Configure MA workflow for repeat blood pressure measurement', 'Ambulatory', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0047');

-- --- EG-0022: Medicare Annual Wellness (3 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0022' LIMIT 1),
  'TSK-0048', 'Build Annual Wellness Visit smartset and navigator', 'Ambulatory', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0048');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0022' LIMIT 1),
  'TSK-0050', 'Configure HRA questionnaire for Medicare wellness visits', 'Ambulatory', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0050');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0022' LIMIT 1),
  'TSK-0051', 'Map preventive care reminders to AWV encounter', 'Ambulatory', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0051');

-- --- EG-0023: Age Friendly Documentation (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0023' LIMIT 1),
  'TSK-0052', 'Build Age Friendly 4Ms documentation framework', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0052');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0023' LIMIT 1),
  'TSK-0053', 'Configure What Matters documentation section', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0053');

-- --- EG-0024: Restraints (3 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0024' LIMIT 1),
  'TSK-0054', 'Review restraint order set and renewal intervals', 'ClinDoc', 'High', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0054');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0024' LIMIT 1),
  'TSK-0055', 'Build restraint assessment and monitoring flowsheet', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0055');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0024' LIMIT 1),
  'TSK-0057', 'Configure de-escalation documentation and care plan', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0057');

-- --- EG-0025: Extravasation FLT Documentation (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0025' LIMIT 1),
  'TSK-0058', 'Build extravasation event documentation flowsheet', 'ClinDoc', 'Medium', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0058');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0025' LIMIT 1),
  'TSK-0059', 'Configure IV site assessment documentation', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0059');

-- --- EG-0026: Interpreter Service Documentation (3 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0026' LIMIT 1),
  'TSK-0060', 'Build interpreter request documentation workflow', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0060');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0026' LIMIT 1),
  'TSK-0061', 'Configure language service documentation across all venues', 'ClinDoc', 'High', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0061');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0026' LIMIT 1),
  'TSK-0062', 'Map registration language capture to clinical documentation', 'Grand Central', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0062');

-- --- EG-0027: OralKleen (2 tasks) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0027' LIMIT 1),
  'TSK-0063', 'Build comprehensive oral care assessment flowsheet', 'ClinDoc', 'Medium', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0063');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0027' LIMIT 1),
  'TSK-0064', 'Configure oral care frequency and intervention documentation', 'ClinDoc', 'Medium', 'Identified'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0064');

-- --- EG-0016: ICU Liberation (2 tasks - completed) ---
INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0016' LIMIT 1),
  'TSK-0065', 'Build ABCDEF bundle documentation', 'ClinDoc', 'Medium', 'Completed'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0065');

INSERT INTO tasks (organization_id, initiative_id, display_id, description, module, priority, status)
SELECT '00000000-0000-0000-0000-000000000001', (SELECT id FROM initiatives WHERE display_id = 'EG-0016' LIMIT 1),
  'TSK-0066', 'Configure ICU delirium screening (CAM-ICU)', 'ClinDoc', 'Medium', 'Completed'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE display_id = 'TSK-0066');


-- =============================================================================
-- 5. UPDATE ID COUNTERS to reflect seeded data
-- =============================================================================

UPDATE id_counters SET next_value = 28
WHERE organization_id = '00000000-0000-0000-0000-000000000001' AND entity_type = 'initiative_eg';

UPDATE id_counters SET next_value = 18
WHERE organization_id = '00000000-0000-0000-0000-000000000001' AND entity_type = 'initiative_sys';

UPDATE id_counters SET next_value = 67
WHERE organization_id = '00000000-0000-0000-0000-000000000001' AND entity_type = 'task';


COMMIT;

-- =============================================================================
-- SUMMARY:
-- Team Members: 22 total (1 SCI manager + 11 SCIs + 10 analysts)
-- Epic Gold Initiatives: 23 (EG-0002 through EG-0027, skipping EG-0001/0005/0014/0021)
-- SCI Initiatives: 17 (SYS-0001 through SYS-0017)
-- Tasks: 52 (TSK-0005 through TSK-0066, distributed across Epic Gold initiatives)
-- =============================================================================
