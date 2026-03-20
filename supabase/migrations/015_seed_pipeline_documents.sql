-- Seed documents from CSH PSG tab columns L, M, N
-- Column L = Policy/Guideline, Column M = Intake Slide, Column N = EHR Requirements

CREATE TEMP TABLE IF NOT EXISTS tmp_pipeline_docs (
  initiative_name TEXT,
  doc_name TEXT,
  doc_type TEXT,
  url TEXT
);

INSERT INTO tmp_pipeline_docs (initiative_name, doc_name, doc_type, url) VALUES
('Candida auris', 'System Initiative Candida auris', 'Intake Slide', 'https://docs.google.com/presentation/d/1EJ26ZOFTZytTWTnILjBAHj0Z9YngF4qAJu5PnmMKdUY/edit?usp=drive_link'),
('Candida auris', 'Candida auris SCI Workbook', 'EHR Requirements', 'https://docs.google.com/spreadsheets/d/1WQQFuRMFrrM0JrQtY30H2DJCwvBv0kxlGBVSJLZmYQk/edit?usp=drive_link'),
('Core Nursing - Standard of Practice', 'CommonSpirit Core Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1u7Alvx0HCiFpWIvqbaFPysCQrQ00Bbjj/edit'),
('Core Nursing - Standard of Practice', 'Gold Build: EHR Content Review - Core Nursing SOP', 'EHR Requirements', 'https://docs.google.com/spreadsheets/d/1v1GiS8A9rd1Bn6qhk_jFNEuQDSS8BCtBWEPe4IChoNU/edit?gid=0#gid=0'),
('Suicide risk policy', 'Clinical A-025 Identifying and Assessing Patients at Risk of Suicide-Self-Harm', 'Policy', 'https://docs.google.com/document/d/1gwbuF58qX4JbpwIs27MLZlFzcu8vV28wiF_ihhQV758/edit?usp=drive_link'),
('Emergency Services - Standard of Practice', 'CSH Emergency Department Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1fyrZ-2lTaKGS1Hhdk74vJ-WSJe6QK4EC/edit?usp=sharing'),
('Bladder Management', 'Bladder Management Policy', 'Policy', 'https://drive.google.com/file/d/1juSsKNmZ5doIXnMMba7K99UeKTRFG1Bg/view?usp=sharing'),
('Bladder Management', 'Bladder Management EHR Content', 'EHR Requirements', 'https://docs.google.com/spreadsheets/d/1U6rZ3ZpHQXBBCRMnteb8toU9M7jvtX3-kBh-HdBapDo/edit?usp=sharing'),
('Perioperative - Standard of Practice', 'Perioperative Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1rOGvDUvG8Lglk6jRh8HlZ6CJmbmQfnRg1VxSvA8vWhY/edit?tab=t.0'),
('ICU Liberation', 'CSH ICU Liberation ABCDEF Bundle Clinical Guidelines', 'Policy', 'https://docs.google.com/document/d/1Vr9cq-NlaKP7GH13JF22Wv7fBLXgmNSD/edit'),
('ICU Liberation', 'Intake Slide ALM 4139', 'Intake Slide', 'https://docs.google.com/presentation/d/1b0axO1_SaJqMqOMldjEPDmM3Q0E1WSDI1S8HV0G0Duw/edit?slide=id.g2ccdbaf18e2_0_322'),
('Patient Personal Belongings and Valuables', 'Template On Hold for V&B', 'Policy', 'https://docs.google.com/document/d/1cIXT8O4rCkUSWTiFjNc8FwxB5HJD_Mir/edit?usp=sharing'),
('Perinatal - Standard of Practice', 'CSH Standards of Practice Site', 'Policy', 'https://sites.google.com/commonspirit.org/nnpatientcareservices/home/professional-practice/standards-of-practice'),
('Vascular Access', 'Clinical A-012 Vascular Access Selection Adult Policy', 'Policy', 'https://drive.google.com/file/d/1OJooyfJ4O4nV5jeTB_2947BEDpXKHpJe/view?usp=share_link'),
('Pediatric - Standards of Practice', 'CSH Standards of Practice Site', 'Policy', 'https://sites.google.com/commonspirit.org/nnpatientcareservices/home/professional-practice/standards-of-practice'),
('Sedation Policy Narrator', 'Moderate and Deep Sedation SCI Workbook', 'Policy', 'https://docs.google.com/spreadsheets/d/1q_AvZVrJOqRRbUQTco-mziox3bV3rS5p5WuYuamvgqI/edit?gid=1066389553'),
('HAPI', 'Facility Template Policy - Hospital Acquired Pressure Injury', 'Policy', 'https://drive.google.com/file/d/1EyNc_asM6E9bFiAqqujXgEAzhh_BBCXv/view?usp=sharing'),
('HAPI', 'HAPI EHR Requirements Drive', 'EHR Requirements', 'https://drive.google.com/drive/folders/1JlJahX8YcyVko8eoEKoS0iyyDbiPq_g3?usp=drive_link'),
('Chemo Policy', 'Antineoplastic Chemotherapy Policy Clinical A-027', 'Policy', 'https://drive.google.com/file/d/16kzTU2RSuaYBlM48B6lR8fsdgrIbY1lT/view?usp=drive_link'),
('Chemo Policy', 'Antineoplastic Chemotherapy Procedure Clinical A-027P', 'Intake Slide', 'https://drive.google.com/file/d/1LLFc1sI7iH8wPNGbL8SzRw-I26Wn0RcM/view?usp=drive_link'),
('Vesicants', 'Vesicant List Extravasation Management and Treatment Guidance', 'Policy', 'https://docs.google.com/document/d/1pByOAWqIgjOeiMWwi-cDk0Cy1hPYhFfX/edit'),
('Sepsis Protocol', 'Sepsis Protocol PolicyStat', 'Policy', 'https://commonspirit-national.policystat.com/policy/18612396/latest'),
('Critical Care - Standard of Practice', 'CommonSpirit Critical Care Nursing Standards of Practice', 'Policy', 'https://docs.google.com/document/d/1cZUMk8P5yzsMSKC5OBmyWTAjz8ZFQn37/edit'),
('Admit to NICU- precheck Vitamin K', 'Mountain Admit to Neonatal ICU Order Set Updates', 'Intake Slide', 'https://docs.google.com/presentation/d/1Am8YqbfcV1B41MvqxNd3hLqrDeZQsaln16qkXhh0Fz8/edit?slide=id.g2e656a61bcb_0_0'),
('National Numbers on AVS', 'National Hotline Numbers - Epic Gold', 'Policy', 'https://docs.google.com/document/d/1_HlGoZBQ1VwMnanBycFhudLTYTe6G59s8zy_sULK07E/edit?tab=t.0'),
('Outpatient in a bed', 'OIB Guidance Final', 'Policy', 'https://docs.google.com/document/d/14TbwBohAvLm0SG3wr3IrEJfzQdxmteXX/edit'),
('Comprehensive Oral Care', 'Comprehensive Oral Care SCI Workbook', 'Policy', 'https://docs.google.com/spreadsheets/d/1fBjf0Q1OqcnqmP_kdRMr2ksbff6blrmtALLpQkBLhFk/edit?gid=1066389553'),
('Quality Reporting', 'Quality Priority Reporting Build Review - Epic Gold', 'Policy', 'https://docs.google.com/spreadsheets/d/1x7Kur2oYXrQt0xid1YAHbv2T0S1Xe69nEdDXU3J0adM/edit?usp=sharing'),
('Epic Denial Work Queue', 'Epic Denial Work Queue Intake Slides', 'Intake Slide', 'https://docs.google.com/presentation/d/1afVsU5Q_r8IEAoBSQ-etqy4VN-hkCCZ0XLJCXpGFxwU/edit?slide=id.g2ccdbaf18e2_0_322');

-- Insert into documents table, matching to initiatives by name
INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url)
SELECT
  '00000000-0000-0000-0000-000000000001',
  i.id,
  d.doc_name,
  d.doc_type,
  d.url
FROM tmp_pipeline_docs d
JOIN initiatives i ON (
  i.name = d.initiative_name
  OR i.name ILIKE '%' || d.initiative_name || '%'
  OR d.initiative_name ILIKE '%' || i.name || '%'
)
WHERE i.organization_id = '00000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM documents doc
    WHERE doc.initiative_id = i.id
      AND doc.document_name = d.doc_name
  );

DROP TABLE IF EXISTS tmp_pipeline_docs;
