-- Seed pipeline items from CSH PSG Workbook tab
-- These items sit in the SystemIQ pipeline awaiting promotion to full initiatives
-- Items that already exist as EG initiatives are skipped
-- Source: CSH PSG Workbook > CSH PSG tab

INSERT INTO pipeline_items (id, organization_id, name, type, priority, sci_contact, application, specialty, details, status)
VALUES
  -- Row 2: E-Signature in Epic Templates (Owner: Ashley Hubbard)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'E-Signature in Epic Templates', NULL, 'Priority 1',
   'Ashley Hubbard', 'Orders', 'Provider/Nursing', NULL, 'submitted'),

  -- Row 3: Antimicrobial Stewardship for ARTIs (Owner: Ashley Hubbard)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Antimicrobial Stewardship for ARTIs', NULL, 'Priority 1',
   'Ashley Hubbard', 'Willow / Orders', 'Pharmacy', NULL, 'submitted'),

  -- Row 5: Core Nursing - Standard of Practice (Owner: Brooke Snow & Marisa Radick) - Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Core Nursing - Standard of Practice', NULL, 'Priority 1',
   'Brooke Snow & Marisa Radick', 'Clin Doc', 'Nursing', NULL, 'approved'),

  -- Row 6: Yale Swallow Screen (Owner: Dawn Jacobson) - Policy, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Yale Swallow Screen', 'Policy', 'Priority 1',
   'Dawn Jacobson', 'Clin Doc', 'Provider/Nursing', NULL, 'approved'),

  -- Row 9: Emergency Services - Standard of Practice (Owner: Jason & Sherry) - Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Emergency Services - Standard of Practice', 'Standards of practice', 'Priority 1',
   'Jason Mihos & Sherry Brennaman', 'ASAP', 'ED nursing', NULL, 'approved'),

  -- Row 11: Perioperative - Standard of Practice (Owner: Kim Willis)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Perioperative - Standard of Practice', NULL, 'Priority 1',
   'Kim Willis', NULL, 'Nursing', NULL, 'submitted'),

  -- Row 15: Perinatal - Standard of Practice (Owner: Melissa Plummer & Robin DeLorenzo)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Perinatal - Standard of Practice', NULL, 'Priority 1',
   'Melissa Plummer & Robin DeLorenzo', NULL, 'Nursing',
   'VMMC does not have OB dept. Primary care may offer OB/GYN services, but patients are sent to FHS or another facility for delivery.', 'submitted'),

  -- Row 16: Telemetry (Owner: Nicole Johnson) - Policy
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Telemetry', 'Policy', 'Priority 1',
   'Nicole Johnson', 'Clin Doc / Orders', 'Provider/Nursing', NULL, 'submitted'),

  -- Row 17: Vascular Access (Owner: Robin DeLorenzo) - Policy, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Vascular Access', 'Policy', 'Priority 1',
   'Robin DeLorenzo', 'Clin Doc / Orders', 'Provider/Nursing',
   'There is a DMND that is in progress to match the policy', 'approved'),

  -- Row 18: Extravasation Tx (Owner: Robin DeLorenzo) - Policy, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Extravasation Tx', 'Policy', 'Priority 1',
   'Robin DeLorenzo', 'Clin Doc / Orders', 'Provider/Nursing',
   'A DMND is in progress to update the interventions per policy', 'approved'),

  -- Row 19: AMPAC Tool (Owner: Robin DeLorenzo) - Documentation, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'AMPAC Tool', 'Documentation', 'Priority 1',
   'Robin DeLorenzo', 'Therapies OT,PT,SLP', 'Therapy',
   'A documentation tool in Flowsheets needs licensure - present in GOLD TST under therapy login', 'approved'),

  -- Row 20: Pediatric - Standards of Practice (Owner: Robin DeLorenzo & Melissa Plummer)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Pediatric - Standards of Practice', NULL, 'Priority 1',
   'Robin DeLorenzo & Melissa Plummer', NULL, 'Nursing',
   'VMMC does not currently have a PEDs dept. There are clinics but the SOP is specific to IP.', 'submitted'),

  -- Row 21: Sedation Policy (Owner: Sherry Brennaman) - Policy
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Sedation Policy', 'Policy', 'Priority 1',
   'Sherry Brennaman', 'Clin Doc',  'Provider/Nursing',
   'Will require multiple modules (ASAP, Interventional Radiology, Lumens, all Procedural areas). 5-10 hours of updates for each impacted team.', 'submitted'),

  -- Row 22: Point Click Care (EDIE WA State) (Owner: Sherry Brennaman) - Epic Best Practice, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Point Click Care (EDIE WA State)', 'Epic Best Practice', 'Priority 1',
   'Sherry Brennaman', 'Clin Doc / Orders / Willow', 'Provider/Nursing/Pharmacy',
   'Care Coordination requesting to be included in this work', 'approved'),

  -- Row 23: HAPI (Owner: Trudy Finch) - Policy, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'HAPI', 'Policy', 'Priority 1',
   'Trudy Finch', 'Clin Doc / Orders', 'Provider/Nursing', NULL, 'approved'),

  -- Row 24: Chemo Policy (Owner: Trudy Finch) - Policy, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Chemo Policy', 'Policy', 'Priority 1',
   'Trudy Finch', 'Oncology', 'Oncology', NULL, 'approved'),

  -- Row 25: Vesicants (Owner: Van Nguyen) - Policy, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Vesicants', 'Policy', 'Priority 1',
   'Van Nguyen', 'Clin Doc / Orders / Willow', 'Provider/Nursing/Pharmacy',
   'Vesicant meds identified on the MAR', 'approved'),

  -- Row 26: Oncology Flowsheet (Owner: Yvette Kirk) - CAT Decisions, Approved
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Oncology Flowsheet', 'CAT Decisions', 'Priority 1',
   'Yvette Kirk', 'Oncology', NULL,
   'Chemo Admin - Submitted via Task Force', 'approved'),

  -- Priority 2 items --

  -- Row 27: CMU Virtual Telemetry (Owner: Brooke Snow) - Project
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'CMU Virtual Telemetry - GE Carescape/Ascom', 'Project', 'Priority 2',
   'Brooke Snow', 'Clin Doc / Orders', 'Provider/Nursing',
   'Virtual Telemetry units monitored from CareBase in AZ', 'submitted'),

  -- Row 28: Virtually Integrated Care (Owner: Brooke Snow) - Best Practice
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Virtually Integrated Care', 'Best Practice', 'Priority 2',
   'Brooke Snow', 'Clin Doc / Orders', 'Provider/Nursing',
   'Security Set up to identify virtual nurses', 'submitted'),

  -- Row 30: Sepsis Protocol (Owner: Marisa Radick) - Guideline
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Sepsis Protocol', 'Guideline', 'Priority 2',
   'Marisa Radick', 'Clin Doc / Orders', 'Provider/Nursing', NULL, 'submitted'),

  -- Row 32: Critical Care - Standard of Practice (Owner: Marisa Radick & Brooke Snow)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Critical Care - Standard of Practice', NULL, 'Priority 2',
   'Marisa Radick & Brooke Snow', NULL, 'Nursing', NULL, 'submitted'),

  -- Row 33: RT Pulmonary Mechanics (Owner: Marty Koepke) - Requested by System Leader
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'RT Pulmonary Mechanics', 'Requested by System Leader', 'Priority 2',
   'Marty Koepke', 'Clin Doc', 'RT',
   'Work with Gold Analysts and System leaders for details', 'submitted'),

  -- Row 34: Drug Screen Order for OB (Owner: Melissa) - Ticket
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Drug Screen Order for OB', 'Ticket', 'Priority 2',
   'Melissa Plummer', 'Stork', 'OB',
   'Submitted via Task Force', 'submitted'),

  -- Row 35: Admit to NICU - precheck Vitamin K (Owner: Melissa) - Ticket
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Admit to NICU - precheck Vitamin K', 'Ticket', 'Priority 2',
   'Melissa Plummer', 'Stork', 'NICU',
   'From SCOPE - Talk Diedre about details', 'submitted'),

  -- Row 36: National Numbers on AVS (Owner: Melissa Plummer) - Requested by System Individual
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'National Numbers on AVS', 'Requested by System Individual', 'Priority 2',
   'Melissa Plummer', 'Clin Doc', 'Nursing',
   'List of standard national numbers needed on AVS', 'submitted'),

  -- Row 37: Outpatient in a bed (Owner: Melissa Plummer) - Requested by System VP
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Outpatient in a bed', 'Requested by System VP Care Coordination', 'Priority 2',
   'Melissa Plummer', 'Clin Doc', 'Care Coordination/Provider',
   'Single order for outpatient in a bed', 'submitted'),

  -- Row 39: Antimicrobial Prophylaxis Guidelines (Owner: Van)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Antimicrobial Prophylaxis Guidelines', 'Guidelines', 'Priority 2',
   'Van Nguyen', 'Willow / Orders', 'Pharmacy', NULL, 'submitted'),

  -- Row 40: REMS Medications and Denials (Owner: Van)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'REMS Medications and Denials', NULL, 'Priority 2',
   'Van Nguyen', 'Willow', 'Pharmacy',
   'Not approved to be built in any environment yet. DMND0007976 is assigned 4-low priority', 'submitted'),

  -- Row 41: Quality Reporting (Owner: Team)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Quality Reporting', NULL, 'Priority 2',
   'Team', NULL, 'Quality',
   'Top 25 Quality Reports - Due February 6, 2026', 'submitted'),

  -- Priority 3 items --

  -- Row 42: Epic Denial Work Queue (Owner: Marisa Radick) - Ticket
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Epic Denial Work Queue', 'Ticket', 'Priority 3',
   'Marisa Radick', 'Grand Central / Prelude', 'Rev Cycle', NULL, 'submitted'),

  -- N/A Priority items --

  -- Row 43: HAPI RT Devices (Owner: Marty Koepke) - System Request
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'HAPI RT Devices', 'System Request', NULL,
   'Marty Koepke', 'Clin Doc', 'RT',
   'Awaiting Final Design for Epic', 'submitted'),

  -- Row 44: Harm to Others Policy (Owner: N/A) - Policy
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Harm to Others Policy', 'Policy', NULL,
   NULL, 'Clin Doc', 'BHU/Nursing',
   'Awaiting Final Design - Design Not Complete', 'submitted');
