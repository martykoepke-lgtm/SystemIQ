-- Migration: Seed stakeholders and initiative-stakeholder relationships
-- Source: ICC Initiative Command workbook (Google Sheets)
-- Date: 2026-03-20

-- ─── Insert all stakeholders ───
INSERT INTO stakeholders (organization_id, name, title, email, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Kevin Ochs', 'Mgr Rehab Services', 'kevin.ochs@commonspirit.org', 'CSH Rehab Services'),
  ('00000000-0000-0000-0000-000000000001', 'Megan Savage', 'Mgr Rehab Services', 'Megan.Savage900@commonspirit.org', 'CSH Rehab Services'),
  ('00000000-0000-0000-0000-000000000001', 'Michael Simpson', 'Director Acute Rehab Services', 'michael.simpson2@commonspirit.org', 'CSH Inpatient Rehab'),
  ('00000000-0000-0000-0000-000000000001', 'Dr. Monique Diaz', 'CMIO', 'monique.diaz@commonspirit.org', 'Physician Enterprise - California'),
  ('00000000-0000-0000-0000-000000000001', 'Dr. Umar Iqbal', 'CMIO', 'umar.iqbal@commonspirit.org', 'Physician Enterprises - Southwest'),
  ('00000000-0000-0000-0000-000000000001', 'Dr. John Chelico', 'CMIO', 'john.chelico@commonspirit.org', 'CSH Physician Enterprise'),
  ('00000000-0000-0000-0000-000000000001', 'Tracy Sklar', 'Sys SVP Quality', 'tracy.sklar@commonspirit.org', 'CSH Care Management'),
  ('00000000-0000-0000-0000-000000000001', 'Holly Gibbs', 'Sys Director Violence Human Trafficking Response', 'holly.gibbs@commonspirit.org', 'CSH SDOH/Health Equity'),
  ('00000000-0000-0000-0000-000000000001', 'Deb Rockman', 'Sys VP Ambulatory Quality', 'debra.rockman@commonspirit.org', 'CSH Ambulatory Quality'),
  ('00000000-0000-0000-0000-000000000001', 'Chris March', 'Director Cardiopulmonary Services', 'chris.march@commonspirit.org', 'CSH RT Council'),
  ('00000000-0000-0000-0000-000000000001', 'Marlene McKinley', 'Mgr, Respiratory Care', 'marlene.mckinley@commonspirit.org', 'CSH RT Council'),
  ('00000000-0000-0000-0000-000000000001', 'Lisa Macri', 'Sys Director Clinical Tech Practice Integration', 'lisa.macri@commonspirit.org', 'CSH Language/Interpretation'),
  ('00000000-0000-0000-0000-000000000001', 'Connie Clemmons-Brown', 'Sys SVP Patient Care Professional Practice', 'connie.clemmonsbrown@commonspirit.org', 'CSH NPPC Leader'),
  ('00000000-0000-0000-0000-000000000001', 'SCI Leadership', 'SCI Leadership', NULL, 'System Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Heather Miller', 'Sys Director Physician Engagement and Health Equity Rpting', 'heather.miller@commonspirit.org', 'CSH SDOH/Health Equity'),
  ('00000000-0000-0000-0000-000000000001', 'Jessica Merritt', 'PES', 'jessica.merritt2@commonspirit.org', 'DH - Sacramento'),
  ('00000000-0000-0000-0000-000000000001', 'Tammie Trefz', 'Sys Clinical Informatics', 'tammie.trefz@commonspirit.org', 'Quality'),
  ('00000000-0000-0000-0000-000000000001', 'Dr. Ankita Sagar', 'Sys VP Clinical Transformation and Well Being', 'ankita.sagar@commonspirit.org', 'CSH Clinical Transformation'),
  ('00000000-0000-0000-0000-000000000001', 'Cyndi Melden', 'System CI Director', 'cyndi.melden@commonspirit.org', 'CSH System Clinical Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Jacy Rogel', 'IT Product Owner', 'jacy.rogel@commonspirit.org', 'CSH Engagement & Automation'),
  ('00000000-0000-0000-0000-000000000001', 'Desiree Smith', 'IT Project Manager', 'desiree.smith036@commonspirit.org', 'IT Software Architecture'),
  ('00000000-0000-0000-0000-000000000001', 'Patricia Harrison', 'IT Sr. Project Manager', 'patricia.harrison@commonspirit.org', 'DHT Shared Services'),
  ('00000000-0000-0000-0000-000000000001', 'Erica Shimkus', 'Care Base Advanced Practice Provider', 'erica.shimkus@commonspirit.org', 'Virtual Care'),
  ('00000000-0000-0000-0000-000000000001', 'Brenda Miner', 'Sys Manager Virtual Nursing Continuum of Care', 'brenda.miner501@commonspirit.org', 'CSH Centralized Care'),
  ('00000000-0000-0000-0000-000000000001', 'Mike Dillard', 'Reg CI Manager', 'michael.dillard@dignityhealth.org', 'AZ CI Manager'),
  ('00000000-0000-0000-0000-000000000001', 'Seshat McDaniel', 'IT Project Manager', 'seshat.mcdaniel@commonspirit.org', 'CSH IT'),
  ('00000000-0000-0000-0000-000000000001', 'Norah Loker', 'PES', 'norah.loker@commonspirit.org', 'NV Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Ashley Crouse', 'PES', 'ashley.crouse@commonspirit.org', 'AZ Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Demetrio Pulanco', 'Clinical Informaticist', 'demetrio.pulanco@commonspirit.org', 'MET Clinical Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Jacob Scheuerman', 'Clinical Informaticist', 'jacob.scheuerman901@commonspirit.org', 'SAC Clinical Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Michelle Darcy', 'Sys Manager Care Base Virtual Health', 'michelle.darcy@commonspirit.org', 'Virtual Care'),
  ('00000000-0000-0000-0000-000000000001', 'Darci Crowley', 'Program Mgr, Bariatric Services', 'darci.crowley@commonspirit.org', 'Nursing Administration'),
  ('00000000-0000-0000-0000-000000000001', 'Jay Young', 'IT Sr Software Engineer', 'jay.young@commonspirit.org', 'EAI-ENTERPRISE APP INTEGRATION'),
  ('00000000-0000-0000-0000-000000000001', 'Bernard Beecher', 'NSP Systems Analyst II', 'bernard.beecher900@commonspirit.org', 'Epic HOS'),
  ('00000000-0000-0000-0000-000000000001', 'Nicole Johnson', 'Medical Informatics Program Manager', 'nicole.johnson@commonspirit.org', 'MEDICAL INFORMATICS LEADERSHIP'),
  ('00000000-0000-0000-0000-000000000001', 'Marty Koepke', 'System Clinical Informaticist', 'marty.koepke@commonspirit.org', 'System Clinical Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Robin Roberts Drane', 'Sys Manager IT Applications', 'robin.roberts-drane@commonspirit.org', 'Learning-Strategy-Development / EPIC HOS'),
  ('00000000-0000-0000-0000-000000000001', 'Karen Sykes', 'IT EPIC Sr Application Analyst', 'karen.sykes@commonspirit.org', 'EPIC HOS'),
  ('00000000-0000-0000-0000-000000000001', 'Shawn Powell', 'IT Software Engineer', 'shawn.powell@commonspirit.org', 'Care Pack - Epic'),
  ('00000000-0000-0000-0000-000000000001', 'Corrinne Welch', 'NSP Systems Analyst II', 'corrinne.welch@commonspirit.org', 'EPIC HOS'),
  ('00000000-0000-0000-0000-000000000001', 'Tiffany Shields-Tettamanti', 'System CI Manager', 'tiffany.shieldstettamanti@commonspirit.org', 'CSH System Clinical Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Carrie Rodriguez', 'SCI Manager', 'carrie.rodriguez900@commonspirit.org', 'CSH System Clinical Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Diedre Mackey', 'System CI Director', 'diedrey.mackey@commonspirit.org', 'CSH System Clinical Informatics'),
  ('00000000-0000-0000-0000-000000000001', 'Joe Robertson', 'Department Head', NULL, 'The whole deal')
ON CONFLICT DO NOTHING;

-- ─── Link stakeholders to initiatives ───
-- Maps ICC INI-* identifiers to SystemIQ initiative names:
--   INI-0001 = HAPI RT O2 Skin Assessments
--   INI-0002 = Amb Epic Gold WF Review
--   INI-0003 = PUP Health Maintenance Group (not in SystemIQ — skipped)
--   INI-0004 = Abuse, Neglect and Violence
--   INI-0005 = Interpreter Services Optimization (not in SystemIQ — skipped)
--   INI-0006 = SDOH CSH Standards (not in SystemIQ — skipped)
--   INI-0007 = Natera Project (CAREB Only) (not in SystemIQ — skipped)
--   INI-0008 = Abridge Ambient AI
--   INI-0009 = HRS EPIC Integration Project PRJ0012291 (not in SystemIQ — skipped)
--   INI-0010 = Depression Interpretation Optimizations
--   INI-0011 = IRF Education Documentation Review (not in SystemIQ — skipped)
--   INI-0012 = CMU Tele-Strips Optimization Cerner
--   INI-0013 = HRS Cerner Integration (not in SystemIQ — skipped)
--   INI-0014 = Abridge AI - Org Expansion
--   INI-0015 = Vaccine Deferral (not in SystemIQ — skipped)
--   INI-0016 = Zoom Integration Update (not in SystemIQ — skipped)
--   INI-0017 = Testing The Initiative Dashboard (not in SystemIQ — skipped)

-- Helper: insert initiative_stakeholders by matching initiative name and stakeholder email
-- This approach is safe — if the initiative or stakeholder doesn't exist, the row is simply not inserted.

-- INI-0001: HAPI RT O2 Skin Assessments
INSERT INTO initiative_stakeholders (initiative_id, stakeholder_id, role)
SELECT i.id, s.id, role_val
FROM (VALUES
  ('chris.march@commonspirit.org', 'Sponsor'),
  ('marlene.mckinley@commonspirit.org', 'Sponsor'),
  ('shawn.powell@commonspirit.org', 'Analyst'),
  ('karen.sykes@commonspirit.org', 'Analyst')
) AS v(email_val, role_val)
JOIN initiatives i ON i.name = 'HAPI RT O2 Skin Assessments' AND i.is_active = true
JOIN stakeholders s ON s.email = v.email_val
ON CONFLICT DO NOTHING;

-- INI-0002: Amb Epic Gold WF Review
INSERT INTO initiative_stakeholders (initiative_id, stakeholder_id, role)
SELECT i.id, s.id, role_val
FROM (VALUES
  ('jessica.merritt2@commonspirit.org', 'Contributor'),
  ('ashley.crouse@commonspirit.org', 'Contributor'),
  ('norah.loker@commonspirit.org', 'Contributor'),
  ('cyndi.melden@commonspirit.org', 'Sponsor'),
  ('marty.koepke@commonspirit.org', 'Technical Lead'),
  ('robin.roberts-drane@commonspirit.org', 'Technical Lead')
) AS v(email_val, role_val)
JOIN initiatives i ON i.name = 'Amb Epic Gold WF Review' AND i.is_active = true
JOIN stakeholders s ON s.email = v.email_val
ON CONFLICT DO NOTHING;

-- INI-0004: Abuse, Neglect and Violence
INSERT INTO initiative_stakeholders (initiative_id, stakeholder_id, role)
SELECT i.id, s.id, role_val
FROM (VALUES
  ('holly.gibbs@commonspirit.org', 'Sponsor')
) AS v(email_val, role_val)
JOIN initiatives i ON i.name = 'Abuse, Neglect and Violence' AND i.is_active = true
JOIN stakeholders s ON s.email = v.email_val
ON CONFLICT DO NOTHING;

-- INI-0008: Abridge Ambient AI
INSERT INTO initiative_stakeholders (initiative_id, stakeholder_id, role)
SELECT i.id, s.id, role_val
FROM (VALUES
  ('john.chelico@commonspirit.org', 'Sponsor'),
  ('jacy.rogel@commonspirit.org', 'Lead'),
  ('desiree.smith036@commonspirit.org', 'Lead')
) AS v(email_val, role_val)
JOIN initiatives i ON i.name = 'Abridge Ambient AI' AND i.is_active = true
JOIN stakeholders s ON s.email = v.email_val
ON CONFLICT DO NOTHING;

-- INI-0010: Depression Interpretation Optimizations
INSERT INTO initiative_stakeholders (initiative_id, stakeholder_id, role)
SELECT i.id, s.id, role_val
FROM (VALUES
  ('debra.rockman@commonspirit.org', 'Sponsor'),
  ('tammie.trefz@commonspirit.org', 'Contributor'),
  ('jessica.merritt2@commonspirit.org', 'Contributor'),
  ('cyndi.melden@commonspirit.org', 'Lead'),
  ('nicole.johnson@commonspirit.org', 'Informaticist')
) AS v(email_val, role_val)
JOIN initiatives i ON i.name = 'Depression Interpretation Optimizations' AND i.is_active = true
JOIN stakeholders s ON s.email = v.email_val
ON CONFLICT DO NOTHING;

-- INI-0012: CMU Tele-Strips Optimization Cerner
INSERT INTO initiative_stakeholders (initiative_id, stakeholder_id, role)
SELECT i.id, s.id, role_val
FROM (VALUES
  ('seshat.mcdaniel@commonspirit.org', 'Lead'),
  ('michael.dillard@dignityhealth.org', 'Lead')
) AS v(email_val, role_val)
JOIN initiatives i ON i.name LIKE 'CMU Tele-Strips%' AND i.is_active = true
JOIN stakeholders s ON s.email = v.email_val
ON CONFLICT DO NOTHING;

-- INI-0014: Abridge AI - Org Expansion
INSERT INTO initiative_stakeholders (initiative_id, stakeholder_id, role)
SELECT i.id, s.id, role_val
FROM (VALUES
  ('john.chelico@commonspirit.org', 'Sponsor'),
  ('jacy.rogel@commonspirit.org', 'Technical Lead'),
  ('desiree.smith036@commonspirit.org', 'Contributor')
) AS v(email_val, role_val)
JOIN initiatives i ON i.name = 'Abridge AI - Org Expansion' AND i.is_active = true
JOIN stakeholders s ON s.email = v.email_val
ON CONFLICT DO NOTHING;
