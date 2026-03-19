-- Seed documents from CSH PSG tab columns L, M, N
-- Links to pipeline_items by name match, and to initiatives if promoted
-- Column L = Policy/Guideline, Column M = Intake Slide, Column N = EHR Requirements

-- Helper: For each document, try to find the initiative (if promoted) or pipeline_item
-- We link to initiative_id when available, otherwise we store with pipeline reference

-- First, create a temp table to hold the raw data
CREATE TEMP TABLE tmp_pipeline_docs (
  initiative_name TEXT,
  doc_name TEXT,
  doc_type TEXT,
  url TEXT
);

INSERT INTO tmp_pipeline_docs VALUES
-- Row 4: C-Auris (matches EG-0003 Candida auris)
('Candida auris', 'System Initiative Candida auris', 'Intake Slide', 'https://docs.google.com/presentation/d/1EJ26ZOFTZytTWTnILjBAHj0Z9YngF4qAJu5PnmMKdUY/edit?usp=drive_link'),
('Candida auris', 'Candida auris SCI Workbook', 'EHR Requirements', 'https://docs.google.com/spreadsheets/d/1WQQFuRMFrrM0JrQtY30H2DJCwvBv0kxlGBVSJLZmYQk/edit?usp=drive_link'),

-- Row 5: Core Nursing (matches pipeline "Core Nursing - Standard of Practice")
('Core Nursing - Standard of Practice', 'CommonSpirit Core Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1u7Alvx0HCiFpWIvqbaFPysCQrQ00Bbjj/edit'),
('Core Nursing - Standard of Practice', 'Gold Build: EHR Content Review - Core Nursing SOP', 'EHR Requirements', 'https://docs.google.com/spreadsheets/d/1v1GiS8A9rd1Bn6qhk_jFNEuQDSS8BCtBWEPe4IChoNU/edit?gid=0#gid=0'),

-- Row 8: Suicide Risk Policy (matches EG-0008)
('Suicide risk policy', 'Clinical A-025 Identifying and Assessing Patients at Risk of Suicide-Self-Harm', 'Policy', 'https://docs.google.com/document/d/1gwbuF58qX4JbpwIs27MLZlFzcu8vV28wiF_ihhQV758/edit?usp=drive_link'),

-- Row 9: Emergency Services (matches pipeline)
('Emergency Services - Standard of Practice', 'CSH Emergency Department Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1fyrZ-2lTaKGS1Hhdk74vJ-WSJe6QK4EC/edit?usp=sharing'),

-- Row 10: Bladder Management (matches EG-0010)
('Bladder Management', 'Bladder Management Policy', 'Policy', 'https://drive.google.com/file/d/1juSsKNmZ5doIXnMMba7K99UeKTRFG1Bg/view?usp=sharing'),
('Bladder Management', 'Bladder Management EHR Content', 'EHR Requirements', 'https://docs.google.com/spreadsheets/d/1U6rZ3ZpHQXBBCRMnteb8toU9M7jvtX3-kBh-HdBapDo/edit?usp=sharing'),

-- Row 11: Perioperative (matches pipeline)
('Perioperative - Standard of Practice', 'Perioperative Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1rOGvDUvG8Lglk6jRh8HlZ6CJmbmQfnRg1VxSvA8vWhY/edit?tab=t.0'),

-- Row 12: ICU Liberation (matches pipeline)
('ICU Liberation', 'CSH ICU Liberation ABCDEF Bundle Clinical Guidelines', 'Policy', 'https://docs.google.com/document/d/1Vr9cq-NlaKP7GH13JF22Wv7fBLXgmNSD/edit'),
('ICU Liberation', 'Intake Slide ALM 4139', 'Intake Slide', 'https://docs.google.com/presentation/d/1b0axO1_SaJqMqOMldjEPDmM3Q0E1WSDI1S8HV0G0Duw/edit?slide=id.g2ccdbaf18e2_0_322'),

-- Row 13: Valuables and Belongings (matches EG-0017)
('Patient Personal Belongings and Valuables', 'Template On Hold for V&B', 'Policy', 'https://docs.google.com/document/d/1cIXT8O4rCkUSWTiFjNc8FwxB5HJD_Mir/edit?usp=sharing'),

-- Row 15: Perinatal (matches pipeline)
('Perinatal - Standard of Practice', 'CSH Standards of Practice Site', 'Policy', 'https://sites.google.com/commonspirit.org/nnpatientcareservices/home/professional-practice/standards-of-practice'),

-- Row 17: Vascular Access (matches pipeline)
('Vascular Access', 'Clinical A-012 Vascular Access Selection Adult Policy', 'Policy', 'https://drive.google.com/file/d/1OJooyfJ4O4nV5jeTB_2947BEDpXKHpJe/view?usp=share_link'),

-- Row 20: Pediatric (matches pipeline)
('Pediatric - Standards of Practice', 'CSH Standards of Practice Site', 'Policy', 'https://sites.google.com/commonspirit.org/nnpatientcareservices/home/professional-practice/standards-of-practice'),

-- Row 21: Moderate and Deep Sedation (matches EG-0013 Sedation Policy Narrator)
('Sedation Policy Narrator', 'Moderate and Deep Sedation SCI Workbook', 'Policy', 'https://docs.google.com/spreadsheets/d/1q_AvZVrJOqRRbUQTco-mziox3bV3rS5p5WuYuamvgqI/edit?gid=1066389553'),

-- Row 23: HAPI (matches pipeline)
('HAPI', 'Facility Template Policy - Hospital Acquired Pressure Injury', 'Policy', 'https://drive.google.com/file/d/1EyNc_asM6E9bFiAqqujXgEAzhh_BBCXv/view?usp=sharing'),
('HAPI', 'HAPI EHR Requirements Drive', 'EHR Requirements', 'https://drive.google.com/drive/folders/1JlJahX8YcyVko8eoEKoS0iyyDbiPq_g3?usp=drive_link'),

-- Row 24: Chemo Policy (matches pipeline)
('Chemo Policy', 'Antineoplastic Chemotherapy Policy Clinical A-027', 'Policy', 'https://drive.google.com/file/d/16kzTU2RSuaYBlM48B6lR8fsdgrIbY1lT/view?usp=drive_link'),
('Chemo Policy', 'Antineoplastic Chemotherapy Procedure Clinical A-027P', 'Intake Slide', 'https://drive.google.com/file/d/1LLFc1sI7iH8wPNGbL8SzRw-I26Wn0RcM/view?usp=drive_link'),

-- Row 25: Vesicants (matches pipeline)
('Vesicants', 'Vesicant List Extravasation Management and Treatment Guidance', 'Policy', 'https://docs.google.com/document/d/1pByOAWqIgjOeiMWwi-cDk0Cy1hPYhFfX/edit'),

-- Row 30: Sepsis Protocol (matches pipeline)
('Sepsis Protocol', 'Sepsis Protocol PolicyStat', 'Policy', 'https://commonspirit-national.policystat.com/policy/18612396/latest'),

-- Row 32: Critical Care (matches pipeline)
('Critical Care - Standard of Practice', 'CommonSpirit Critical Care Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1cZUMk8P5yzsMSKC5OBmyWTAjz8ZFQn37/edit'),

-- Row 35: Admit to NICU (matches pipeline)
('Admit to NICU- precheck Vitamin K', 'Mountain Admit to Neonatal ICU Order Set Updates', 'Intake Slide', 'https://docs.google.com/presentation/d/1Am8YqbfcV1B41MvqxNd3hLqrDeZQsaln16qkXhh0Fz8/edit?slide=id.g2e656a61bcb_0_0'),

-- Row 36: National Numbers on AVS (matches pipeline)
('National Numbers on AVS', 'National Hotline Numbers - Epic Gold', 'Policy', 'https://docs.google.com/document/d/1_HlGoZBQ1VwMnanBycFhudLTYTe6G59s8zy_sULK07E/edit?tab=t.0'),

-- Row 37: Outpatient in a bed (matches pipeline)
('Outpatient in a bed', 'OIB Guidance Final', 'Policy', 'https://docs.google.com/document/d/14TbwBohAvLm0SG3wr3IrEJfzQdxmteXX/edit'),

-- Row 38: OralKleen / Comprehensive Oral Care (matches EG-0027)
('Comprehensive Oral Care', 'Comprehensive Oral Care SCI Workbook', 'Policy', 'https://docs.google.com/spreadsheets/d/1fBjf0Q1OqcnqmP_kdRMr2ksbff6blrmtALLpQkBLhFk/edit?gid=1066389553'),

-- Row 41: Quality Reporting (matches pipeline)
('Quality Reporting', 'Quality Priority Reporting Build Review - Epic Gold', 'Policy', 'https://docs.google.com/spreadsheets/d/1x7Kur2oYXrQt0xid1YAHbv2T0S1Xe69nEdDXU3J0adM/edit?usp=sharing'),

-- Row 42: Epic Denial Work Queue (matches pipeline)
('Epic Denial Work Queue', 'Epic Denial Work Queue Intake Slides', 'Intake Slide', 'https://docs.google.com/presentation/d/1afVsU5Q_r8IEAoBSQ-etqy4VN-hkCCZ0XLJCXpGFxwU/edit?slide=id.g2ccdbaf18e2_0_322');

-- Now insert into documents table
-- Try to match to initiatives first (for promoted items), then fall back to pipeline_items
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT
  '00000000-0000-0000-0000-000000000001',
  i.id,
  d.doc_name,
  d.doc_type,
  d.url
FROM tmp_pipeline_docs d
JOIN initiatives i ON (
  -- Match by exact name
  i.name = d.initiative_name
  -- Or partial match for common variations
  OR i.name ILIKE '%' || d.initiative_name || '%'
  OR d.initiative_name ILIKE '%' || i.name || '%'
)
WHERE i.organization_id = '00000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM documents doc
    WHERE doc.initiative_id = i.id
      AND doc.document_name = d.doc_name
  );

-- For pipeline items that DON'T have a matching initiative yet,
-- we store the documents with a NULL initiative_id but track them
-- They'll get linked when the pipeline item is promoted

-- Clean up temp table
DROP TABLE tmp_pipeline_docs;
