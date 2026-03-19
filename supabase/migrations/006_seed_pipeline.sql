-- 006_seed_pipeline.sql
-- Seed 43 CSH PSG pipeline items into pipeline_items table
-- Idempotent: uses WHERE NOT EXISTS on name to avoid duplicates

INSERT INTO pipeline_items (name, type, priority, sci_contact, analyst, application, specialty, details, policy_link, ehr_link, system_sponsor, status, promoted_initiative_id)
SELECT v.name, v.type, v.priority, v.sci_contact, v.analyst, v.application, v.specialty, v.details, v.policy_link, v.ehr_link, v.system_sponsor, v.status,
  CASE
    WHEN v.promoted_display_id IS NOT NULL THEN (SELECT id FROM initiatives WHERE display_id = v.promoted_display_id LIMIT 1)
    ELSE NULL
  END AS promoted_initiative_id
FROM (VALUES
  -- Row 1
  ('E-Signature in Epic Templates', NULL, 'High', 'Ashley Hubbard', NULL, 'Orders', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 2
  ('Antimicrobial Stewardship for ARTIs', NULL, 'High', 'Ashley Hubbard', NULL, 'Willow/Orders', 'Pharmacy', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 3 — promoted: EG-0003
  ('C-Auris', 'Guideline', 'High', 'Brooke Snow', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, 'Candida auris_SCI Workbook', 'Becky Leach', 'promoted', 'EG-0003'),
  -- Row 4
  ('Core Nursing - Standard of Practice', NULL, 'High', 'Brooke Snow & Marisa Radick', NULL, 'ClinDoc', 'Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 5
  ('Yale Swallow Screen', 'Policy', 'High', 'Dawn Jacobson', NULL, 'ClinDoc', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 6 — promoted: EG-0023
  ('Age Friendly Documentation', 'Board Goal', 'High', 'Dawn Jacobson', NULL, 'ClinDoc', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'promoted', 'EG-0023'),
  -- Row 7 — promoted: EG-0008
  ('Suicide Risk Policy', 'Policy', 'High', 'Jason & Sherry', NULL, 'ClinDoc', 'BHU/Nursing', 'See details...', NULL, NULL, 'Paul Rains', 'promoted', 'EG-0008'),
  -- Row 8
  ('Emergency Services - Standard of Practice', 'Standards of practice', 'High', 'Jason Mihos & Sherry Brennaman', NULL, 'ASAP', 'ED nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 9 — promoted: EG-0010
  ('Bladder Management', 'Policy', 'High', 'Trudy Finch', NULL, 'ClinDoc/Orders', 'Provider/Nursing', 'Ensuring the Indications from policy are in Gold', NULL, NULL, 'Rebecca Leach', 'promoted', 'EG-0010'),
  -- Row 10
  ('Perioperative - Standard of Practice', NULL, 'High', 'Kim Wilis', NULL, NULL, 'Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 11 — promoted: EG-0016
  ('ICU Liberation', 'Guideline', 'High', 'Marisa Radick', NULL, 'ClinDoc/Orders', 'Critical Care', 'Ensuring elements of the A-F bundle are built in Gold', NULL, NULL, 'Brenda Downs', 'promoted', 'EG-0016'),
  -- Row 12 — promoted: EG-0017
  ('Valuables and Belongings', 'Policy', 'High', 'Melissa Plummer', NULL, 'ClinDoc', 'Nursing', NULL, NULL, NULL, NULL, 'promoted', 'EG-0017'),
  -- Row 13 — promoted: EG-0018
  ('DAST-10 tool', NULL, 'High', 'Melissa Plummer', NULL, 'ClinDoc', 'BHU/Nursing/Stork', NULL, NULL, NULL, NULL, 'promoted', 'EG-0018'),
  -- Row 14
  ('Perinatal - Standard of Practice', NULL, 'High', 'Melissa Plummer & Robin DeLorenzo', NULL, NULL, 'Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 15
  ('Telemetry', 'Policy', 'High', 'Nicole Johnson', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 16
  ('Vascular Access', 'Policy', 'High', 'Robin DeLorenzo', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 17 — promoted: EG-0025
  ('Extravasavation Tx', 'Policy', 'High', 'Robin DeLorenzo', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'promoted', 'EG-0025'),
  -- Row 18
  ('AMPAC Tool', 'Documentation', 'High', 'Robin DeLorenzo', NULL, 'Therapies OT,PT,SLP', 'Therapy', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 19
  ('Pediatric - Standards of Practice', NULL, 'High', 'Robin DeLorenzo & Melissa Plummer', NULL, NULL, 'Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 20
  ('Sedation details', 'Policy', 'High', 'Sherry Brennaman', NULL, 'ClinDoc', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 21
  ('Point Click Care (EDIE for WA State)', 'Epic Best Practice', 'High', 'Sherry Brennaman', NULL, 'ClinDoc/Orders/Willow', 'Provider/Nursing/Pharmacy', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 22 — HAPI relates to separate initiative, status pending
  ('HAPI', 'Policy', 'High', 'Trudy Finch', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 23
  ('Chemo Policy', 'Policy', 'High', 'Trudy Finch', NULL, 'Oncology', 'Oncology', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 24
  ('Vesicants', 'Policy', 'High', 'Van Nguyen', NULL, 'ClinDoc/Orders/Willow', 'Provider/Nursing/Pharmacy', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 25
  ('Oncology Flowsheet', 'CAT Decisions', 'High', 'Yvette Kirk', NULL, 'Oncology', NULL, NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 26
  ('CMU Virtual Telemetry', 'Project', 'Medium', 'Brooke Snow', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 27
  ('Virtually Integrated Care', 'Best Practice', 'Medium', 'Brooke Snow', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 28 — promoted: EG-0011
  ('SDOH', 'Guidelines', 'Medium', 'Marty Koepke', NULL, 'ClinDoc', 'Patient Care Services', NULL, NULL, NULL, NULL, 'promoted', 'EG-0011'),
  -- Row 29
  ('Sepsis Protocol', 'Guideline', 'Medium', 'Marisa Radick', NULL, 'ClinDoc/Orders', 'Provider/Nursing', NULL, NULL, NULL, 'Brenda Downs', 'pending', NULL),
  -- Row 30 — promoted: EG-0015
  ('Preferred Language', 'Policy', 'Medium', 'Marisa Radick', NULL, 'Nursing', 'Patient Care Services', NULL, NULL, NULL, 'Lisa Macri', 'promoted', 'EG-0015'),
  -- Row 31
  ('Critical Care - Standard of Practice', NULL, 'Medium', 'Marisa Radick & Brooke Snow', NULL, NULL, 'Nursing', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 32
  ('RT Pulmonary Mechanics', 'Requested by System Leader', 'Medium', 'Marty Koepke', NULL, 'ClinDoc', 'RT', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 33
  ('Drug Screen Order for OB', 'Ticket', 'Medium', 'Melissa', NULL, 'Stork', 'OB', NULL, NULL, NULL, 'Mindy Foster', 'pending', NULL),
  -- Row 34
  ('Admit to NICU', 'Ticket', 'Medium', 'Melissa', NULL, 'Stork', 'NICU', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 35
  ('National Numbers on AVS', 'Requested by System Individual', 'Medium', 'Melissa Plummer', NULL, 'ClinDoc', 'Nursing', NULL, NULL, NULL, 'Holly Gibbs/Connie', 'pending', NULL),
  -- Row 36
  ('Outpatient in a bed', 'Requested by System VP', 'Medium', 'Melissa Plummer', NULL, 'ClinDoc', 'Care Coordination/Provider', NULL, NULL, NULL, 'Gail Moxley', 'pending', NULL),
  -- Row 37 — promoted: EG-0027
  ('OralKleen (Comprehensive Oral Care)', 'Policy', 'Medium', 'Sherry Brennaman', NULL, 'ClinDoc', 'Nursing', NULL, NULL, NULL, NULL, 'promoted', 'EG-0027'),
  -- Row 38
  ('Antimicrobial Prophylaxis Guidelines', 'Guidelines', 'Medium', 'Van', NULL, 'Willow/Orders', 'Pharmacy', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 39
  ('REMS Medications and Denials', NULL, 'Medium', 'Van', NULL, 'Willow', 'Pharmacy', NULL, NULL, NULL, NULL, 'pending', NULL),
  -- Row 40
  ('Quality Reporting', NULL, 'Medium', 'Team', NULL, NULL, 'Quality', 'Top 25 Quality Reports', NULL, NULL, 'Tracy Sklarr', 'pending', NULL),
  -- Row 41
  ('Epic Denial Work Queue', 'Ticket', 'Low', 'Marisa Radick', NULL, 'Grand Central/Prelude', 'Rev Cycle', NULL, NULL, NULL, 'Diane Pirak', 'pending', NULL),
  -- Row 42
  ('HAPI RT Devices', 'System Request', NULL, 'Marty Koepke', NULL, 'ClinDoc', 'RT', 'Awaiting Final Design for Epic', NULL, NULL, NULL, 'pending', NULL),
  -- Row 43
  ('Harm to Others Policy', 'Policy', NULL, NULL, NULL, 'ClinDoc', 'BHU/Nursing', 'Awaiting Final Design', NULL, NULL, 'Paul Rains', 'pending', NULL)
) AS v(name, type, priority, sci_contact, analyst, application, specialty, details, policy_link, ehr_link, system_sponsor, status, promoted_display_id)
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_items p WHERE p.name = v.name
);
