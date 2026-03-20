-- Enrich Marty's SYS initiatives with data from SCI Tracker Google Sheet
-- Adds: descriptions, phases, documents, ticket numbers, collaborators, and metrics

BEGIN;

-- ═══ UPDATE INITIATIVE DETAILS ═══

-- SYS-0001: HAPI RT O2 Skin Assessments
UPDATE initiatives SET
  description = 'streamline Epic RT skin assessment documentation to be minimal',
  phase = 'Build',
  priority = 'High'
WHERE display_id = 'SYS-0001';

-- SYS-0002: Amb Epic Gold WF Review
UPDATE initiatives SET
  description = 'Evaluating Epic Gold for Ambulatory against system standards',
  phase = 'Validate/Test',
  priority = 'Critical'
WHERE display_id = 'SYS-0002';

-- SYS-0003: PUP Health Maintenance Group
UPDATE initiatives SET
  description = 'Cerner Health Maintenance Ownership Group',
  phase = 'Steady State',
  priority = 'Low'
WHERE display_id = 'SYS-0003';

-- SYS-0004: Abuse, Neglect and Violence
UPDATE initiatives SET
  description = 'Clean up redundant EHR content to better align with SDOH standard',
  phase = 'Discovery/Define',
  priority = 'Medium'
WHERE display_id = 'SYS-0004';

-- SYS-0005: Interpreter Services Optimization
UPDATE initiatives SET
  description = 'Achieve CSH defined standard for documenting translation services in Epic Gold',
  phase = 'Discovery/Define',
  priority = 'High',
  target_date = '2026-05-01'
WHERE display_id = 'SYS-0005';

-- SYS-0006: SDOH CSH Standards
UPDATE initiatives SET
  description = 'Implement CSH Standards for SDOH across all platforms and venues',
  phase = 'Design',
  priority = 'Medium'
WHERE display_id = 'SYS-0006';

-- SYS-0007: Natera Project (CAREB Only)
UPDATE initiatives SET
  description = 'Bi-Directional orders interface between Natera and Cerner',
  phase = 'Validate/Test',
  priority = 'Medium'
WHERE display_id = 'SYS-0007';

-- SYS-0008: Abridge Ambient AI
UPDATE initiatives SET
  description = 'Ambient AI software to support improved provider documentation',
  phase = 'Post Go Live Support',
  priority = 'Medium'
WHERE display_id = 'SYS-0008';

-- SYS-0009: HRS EPIC Integration Project
UPDATE initiatives SET
  description = 'Integrate HRS enrollment and return notes to Epic Gold',
  phase = 'Build',
  priority = 'Critical',
  target_date = '2026-05-01'
WHERE display_id = 'SYS-0009';

-- SYS-0010: Depression Interpretation Optimizations
UPDATE initiatives SET
  description = 'Need to determine what is happening in Epic Gold for Depression screening interpretations',
  phase = 'Discovery/Define',
  priority = 'Medium'
WHERE display_id = 'SYS-0010';

-- SYS-0011: IRF Education Documentation Review
UPDATE initiatives SET
  description = 'Researching Status and Goals',
  phase = 'Design',
  priority = 'Medium',
  status = 'Dismissed',
  is_active = false
WHERE display_id = 'SYS-0011';

-- SYS-0012: CMU Tele-Strips Optimization Cerner
UPDATE initiatives SET
  description = 'Following the implementation of CMU Rhythm strip integration into Cerner, complaints from inpatient physicians that interfaced rhythm strips are flooding the Cardiology section of Results Review and the Diagnostics WF component, making it difficult to find actual EKGs and Echos.',
  phase = 'Discovery/Define',
  priority = 'Low'
WHERE display_id = 'SYS-0012';

-- SYS-0013: HRS Cerner Integration
UPDATE initiatives SET
  description = 'Post Go Live Expansion Consult Activities',
  phase = 'Post Go Live Support',
  priority = 'Medium'
WHERE display_id = 'SYS-0013';

-- SYS-0014: Abridge AI - Org Expansion
UPDATE initiatives SET
  description = 'Initial pilot considered successful. Completed. This work is related to ongoing expansion to ED, maybe RNs, and additional clinics.',
  phase = 'Discovery/Define',
  priority = 'Medium'
WHERE display_id = 'SYS-0014';

-- SYS-0015: Vaccine Deferral (All Platforms)
UPDATE initiatives SET
  description = 'Evaluate how the EHR handles vaccine/Immz deferrals/declines.',
  phase = 'Discovery/Define',
  priority = 'Critical'
WHERE display_id = 'SYS-0015';

-- SYS-0016: Zoom Integration Update Needs
UPDATE initiatives SET
  description = 'Decommission Axway APIM and migrate Cerner Telehealth integration APIs to Mulesoft. Legacy enhancements from 3-4 years ago were never deployed to production and must be tested before Axway retirement.',
  phase = 'Discovery/Define',
  priority = 'Critical'
WHERE display_id = 'SYS-0016';

-- SYS-0017: Testing The Initiative Dashboard
UPDATE initiatives SET
  description = 'This is a description of the work that needs to be done',
  phase = 'Discovery/Define',
  priority = 'Medium'
WHERE display_id = 'SYS-0017';

-- ═══ DOCUMENTS (from Column I workbook links and Column N drive folders) ═══

-- SYS-0001: HAPI RT O2
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'FETR0111279 Workbook', 'SCI Workbook', 'https://docs.google.com/spreadsheets/d/1ViIedhzeNyOrOKTpMj_TXzQNT97N2WoDktMmPhgLcH4/edit?gid=0#gid=0'
FROM initiatives WHERE display_id = 'SYS-0001'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0001' LIMIT 1) AND document_name = 'FETR0111279 Workbook');

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'HAPI RT O2 Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/1GlOOeTrkpQug1nMDzyUJp6mzEVvzHYKd'
FROM initiatives WHERE display_id = 'SYS-0001'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0001' LIMIT 1) AND document_name = 'HAPI RT O2 Drive Folder');

-- SYS-0002: Amb Epic Gold WF Review
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Amb Epic Gold Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/1PbRBbyNGS1EIwPtUvebG2inL3tN4JlRj'
FROM initiatives WHERE display_id = 'SYS-0002'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0002' LIMIT 1) AND document_name = 'Amb Epic Gold Drive Folder');

-- SYS-0005: Interpreter Services
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Interpreter Services Workbook', 'SCI Workbook', 'https://docs.google.com/spreadsheets/d/1fbwBgPteaPWnmdkzz1-2J4JA0878oRDj3cv_7-5XKrE/edit?gid=0#gid=0'
FROM initiatives WHERE display_id = 'SYS-0005'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0005' LIMIT 1) AND document_name = 'Interpreter Services Workbook');

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Interpreter Services Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/11poDwVlKnclZtuDdkQgPRLxxs8TMyZ4d'
FROM initiatives WHERE display_id = 'SYS-0005'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0005' LIMIT 1) AND document_name = 'Interpreter Services Drive Folder');

-- SYS-0006: SDOH CSH Standards
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'SDOH Requirements Document', 'EHR Requirements', 'https://docs.google.com/document/d/1NLW64iNDCQssY-0IKGu7vx99jFzuRLDP16wl0Y3Ab6k/edit?tab=t.0'
FROM initiatives WHERE display_id = 'SYS-0006'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0006' LIMIT 1) AND document_name = 'SDOH Requirements Document');

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'SDOH Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/1QPBjW6lAO3z6CL8eqFVeveLHcdyfFKPq'
FROM initiatives WHERE display_id = 'SYS-0006'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0006' LIMIT 1) AND document_name = 'SDOH Drive Folder');

-- SYS-0007: Natera Project
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Natera Project Document', 'Reference', 'https://docs.google.com/document/d/1VlanCu1Pw7poCZDhSiB6lTo9fGZARl4qQ2WTCAU6kJs/edit?tab=t.0'
FROM initiatives WHERE display_id = 'SYS-0007'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0007' LIMIT 1) AND document_name = 'Natera Project Document');

-- SYS-0008: Abridge Ambient AI
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Abridge Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/15vOauNUfs0P8RVd_KlkdMA3DzG5SR_mr'
FROM initiatives WHERE display_id = 'SYS-0008'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0008' LIMIT 1) AND document_name = 'Abridge Drive Folder');

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Abridge Reference Materials', 'Reference', 'https://drive.google.com/drive/folders/1bL1W29TQxvwm28mMWC1EdzkXb8eNeY_0'
FROM initiatives WHERE display_id = 'SYS-0008'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0008' LIMIT 1) AND document_name = 'Abridge Reference Materials');

-- SYS-0009: HRS EPIC Integration
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'HRS EPIC Intake Presentation', 'Other', 'https://docs.google.com/presentation/d/1uwctki9VnCScwgHTCsbs2JufbWySSLjEj9J7aNvXg-w/edit'
FROM initiatives WHERE display_id = 'SYS-0009'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0009' LIMIT 1) AND document_name = 'HRS EPIC Intake Presentation');

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'HRS EPIC Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/1pUzbvg1LmJhAO_j89a21LCHAWkAkmkxH'
FROM initiatives WHERE display_id = 'SYS-0009'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0009' LIMIT 1) AND document_name = 'HRS EPIC Drive Folder');

-- SYS-0010: Depression Interpretation
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Depression Screening Intake Slide', 'Other', 'https://docs.google.com/presentation/d/1H2ne-6bEGeWlxK4eU3yXUhRVKle03B1MlNOjJlFrGhQ/edit'
FROM initiatives WHERE display_id = 'SYS-0010'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0010' LIMIT 1) AND document_name = 'Depression Screening Intake Slide');

-- SYS-0011: IRF Education
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'IRF Education Intake Presentation', 'Other', 'https://docs.google.com/presentation/u/0/d/1T1RN0hUWRB_d1A8ZhSf03k1pnkvdQwVqgVPG-vjksok/edit'
FROM initiatives WHERE display_id = 'SYS-0011'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0011' LIMIT 1) AND document_name = 'IRF Education Intake Presentation');

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'IRF Education Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/13ot_u3qss92iJBcB92EG-FTZ3eeSVgA6'
FROM initiatives WHERE display_id = 'SYS-0011'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0011' LIMIT 1) AND document_name = 'IRF Education Drive Folder');

-- SYS-0012: CMU Tele-Strips
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'CMU Tele-Strips Intake Slide', 'Other', 'https://docs.google.com/presentation/d/1MILT100wTz1CZX4Gp9L7iyz8mTzeVdTBq5H3DLtSjhI/edit'
FROM initiatives WHERE display_id = 'SYS-0012'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0012' LIMIT 1) AND document_name = 'CMU Tele-Strips Intake Slide');

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'CMU Tele-Strips Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/1TsewWXbZQbpi810rk2uolEGQtDCxbeHc'
FROM initiatives WHERE display_id = 'SYS-0012'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0012' LIMIT 1) AND document_name = 'CMU Tele-Strips Drive Folder');

-- SYS-0014: Abridge AI Org Expansion
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Abridge Expansion Drive Folder', 'Reference', 'https://drive.google.com/drive/folders/1bL1W29TQxvwm28mMWC1EdzkXb8eNeY_0'
FROM initiatives WHERE display_id = 'SYS-0014'
AND NOT EXISTS (SELECT 1 FROM documents WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0014' LIMIT 1) AND document_name = 'Abridge Expansion Drive Folder');

-- ═══ INITIATIVE METRICS (from user-provided data) ═══

-- MET-0001: SYS-0001 HAPI RT O2 - Dev Time
INSERT INTO initiative_metrics (organization_id, initiative_id, metric_name, unit, baseline_value, baseline_date, target_value, result_value, result_date, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Dev Time', 'Hours', 420, '2025-11-04', 50, 16, '2026-02-06', '2026-02-10T19:45:55.708Z', '2026-02-10T19:45:55.708Z'
FROM initiatives WHERE display_id = 'SYS-0001'
AND NOT EXISTS (SELECT 1 FROM initiative_metrics WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0001' LIMIT 1) AND metric_name = 'Dev Time');

-- MET-0002: SYS-0001 HAPI RT O2 - Dev Cost
INSERT INTO initiative_metrics (organization_id, initiative_id, metric_name, unit, baseline_value, baseline_date, target_value, result_value, result_date, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Dev Cost', '$', 27500, '2026-01-06', 5000, 890, '2026-02-04', '2026-02-10T19:46:51.277Z', '2026-02-10T19:46:51.277Z'
FROM initiatives WHERE display_id = 'SYS-0001'
AND NOT EXISTS (SELECT 1 FROM initiative_metrics WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0001' LIMIT 1) AND metric_name = 'Dev Cost');

-- MET-0003: SYS-0008 Abridge AI - Documentation Time per Note
INSERT INTO initiative_metrics (organization_id, initiative_id, metric_name, unit, baseline_value, baseline_date, target_value, result_value, result_date, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Documentation Time per Note', 'Minutes', 68.66, '2025-04-01', NULL, 58.04, '2026-01-01', '2026-02-10T19:58:55.076Z', '2026-02-10T19:58:55.076Z'
FROM initiatives WHERE display_id = 'SYS-0008'
AND NOT EXISTS (SELECT 1 FROM initiative_metrics WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0008' LIMIT 1) AND metric_name = 'Documentation Time per Note');

-- MET-0004: SYS-0008 Abridge AI - Increased RVUs
INSERT INTO initiative_metrics (organization_id, initiative_id, metric_name, unit, baseline_value, baseline_date, target_value, result_value, result_date, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Increased RVUs', '$', 27669, '2025-04-01', NULL, 9557, '2026-01-01', '2026-02-10T19:59:49.015Z', '2026-02-10T19:59:49.015Z'
FROM initiatives WHERE display_id = 'SYS-0008'
AND NOT EXISTS (SELECT 1 FROM initiative_metrics WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0008' LIMIT 1) AND metric_name = 'Increased RVUs');

-- MET-0005: SYS-0017 Testing Dashboard - Reduce Cognitive Load
INSERT INTO initiative_metrics (organization_id, initiative_id, metric_name, unit, baseline_value, baseline_date, baseline_timeframe, target_value, result_value, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000001', id, 'Reduce Cognitive Load', '%', 95, '2026-01-01', 'Nov-Dec 2025', 25, 30, '2026-02-19T23:29:22.997Z', '2026-02-19T23:29:22.997Z'
FROM initiatives WHERE display_id = 'SYS-0017'
AND NOT EXISTS (SELECT 1 FROM initiative_metrics WHERE initiative_id = (SELECT id FROM initiatives WHERE display_id = 'SYS-0017' LIMIT 1) AND metric_name = 'Reduce Cognitive Load');

COMMIT;
