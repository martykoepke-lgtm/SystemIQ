-- Add eg_subtype field for Epic Gold classification
-- Values: 'Standard Practice', 'Guideline', 'Policy', 'Board Goal'
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS eg_subtype TEXT;

-- Seed from PRCC workbook data (Initiatives tab)
-- EG-0002: Nursing Travel Screening Assessment → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0002';
-- EG-0003: Candida auris → Guideline
UPDATE initiatives SET eg_subtype = 'Guideline' WHERE display_id = 'EG-0003';
-- EG-0004: Nursing Head to Toe Assessment → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0004';
-- EG-0006: Nursing Fall Assessment → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0006';
-- EG-0007: Nursing Skin Assessment → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0007';
-- EG-0008: Suicide risk policy → Policy
UPDATE initiatives SET eg_subtype = 'Policy' WHERE display_id = 'EG-0008';
-- EG-0009: ED Abuse, Neglect, Violence Screening → Policy
UPDATE initiatives SET eg_subtype = 'Policy' WHERE display_id = 'EG-0009';
-- EG-0010: Bladder Management → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0010';
-- EG-0011: SDOH (Acute, ED, Amb, HOD) → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0011';
-- EG-0012: Nursing SOP – Dialysis Graft/Fistula → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0012';
-- EG-0013: Sedation Policy Narrator → Policy
UPDATE initiatives SET eg_subtype = 'Policy' WHERE display_id = 'EG-0013';
-- EG-0015: Preferred Languages → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0015';
-- EG-0016: Outpatient Infusion Assessment → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0016';
-- EG-0017: Patient Personal Belongings and Valuables → Policy
UPDATE initiatives SET eg_subtype = 'Policy' WHERE display_id = 'EG-0017';
-- EG-0018: DAST10 → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0018';
-- EG-0019: Depression Testing and Outcomes → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0019';
-- EG-0020: Restraints → Policy
UPDATE initiatives SET eg_subtype = 'Policy' WHERE display_id = 'EG-0020';
-- EG-0022: IV Starts → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0022';
-- EG-0023: Age Friendly Documentation → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0023';
-- EG-0024: Braden Scale → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0024';
-- EG-0025: Central Line Assessment → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0025';
-- EG-0026: Chest Tube Assessment → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0026';
-- EG-0027: Comprehensive Oral Care → Standard Practice
UPDATE initiatives SET eg_subtype = 'Standard Practice' WHERE display_id = 'EG-0027';
