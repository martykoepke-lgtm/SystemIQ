-- Seed EG initiative documents from PRCC data
-- Links documents to initiatives by display_id lookup

INSERT INTO documents (organization_id, initiative_id, document_name, document_type, url, created_at)
SELECT '00000000-0000-0000-0000-000000000001', i.id, d.doc_name, d.doc_type, d.url, d.date_added::timestamptz
FROM (VALUES
  ('EG-0003', 'Candida auris Design Sheet for Legacy Epic Sites', 'Design Spec', 'https://docs.google.com/spreadsheets/d/1_51LtrQZBNRNAXjOkPEUAFo_XOEnJiE1bBY7RP6Mu2I/edit?gid=756037640#gid=756037640', '2026-03-12T13:43:12.939Z'),
  ('EG-0003', 'Candida auris Testing Script', 'Test Plan', 'https://docs.google.com/spreadsheets/d/11xeOnI4MvqZWBeyHwUHPO0V6PJW1OAH0epxw5sF7T8I/edit?gid=1512032825#gid=1512032825', '2026-03-12T13:43:45.661Z'),
  ('EG-0017', 'Patient Personal Belongings and Valuables', 'Policy', 'https://docs.google.com/document/d/1cIXT8O4rCkUSWTiFjNc8FwxB5HJD_Mir/edit', '2026-03-12T15:59:16.122Z'),
  ('EG-0010', 'Bladder Management Protocol', 'Policy', 'https://drive.google.com/file/d/1_TUHzUthrujj4k4Z_F39AHOBU7vbRsSL/view?usp=sharing', '2026-03-16T18:40:52.052Z'),
  ('EG-0002', 'Missing Components for Nursing SOP', 'Requirements', 'https://docs.google.com/spreadsheets/d/1v1GiS8A9rd1Bn6qhk_jFNEuQDSS8BCtBWEPe4IChoNU/edit?gid=0#gid=0', '2026-03-16T19:29:49.047Z'),
  ('EG-0004', 'Nursing SOP Missing Components', 'Requirements', 'https://docs.google.com/spreadsheets/d/1v1GiS8A9rd1Bn6qhk_jFNEuQDSS8BCtBWEPe4IChoNU/edit?gid=0#gid=0', '2026-03-16T19:30:37.467Z'),
  ('EG-0006', 'Nursing SOP Missing Components', 'Requirements', 'https://docs.google.com/spreadsheets/d/1v1GiS8A9rd1Bn6qhk_jFNEuQDSS8BCtBWEPe4IChoNU/edit?gid=0#gid=0', '2026-03-16T19:31:06.453Z'),
  ('EG-0007', 'Nursing SOP Missing Components', 'Requirements', 'https://docs.google.com/spreadsheets/d/1v1GiS8A9rd1Bn6qhk_jFNEuQDSS8BCtBWEPe4IChoNU/edit?gid=0#gid=0', '2026-03-16T19:31:35.739Z'),
  ('EG-0012', 'Nursing SOP Missing Components', 'Requirements', 'https://docs.google.com/spreadsheets/d/1v1GiS8A9rd1Bn6qhk_jFNEuQDSS8BCtBWEPe4IChoNU/edit?gid=0#gid=0', '2026-03-16T19:32:32.014Z'),
  ('EG-0010', 'TSK-0039 Order Changes', 'Build Guide', 'https://docs.google.com/document/d/1f7s_a6KhZWEx07rXdxm5YLC0l9YMGHwm-KeqG34ZNjQ/edit?tab=t.0', '2026-03-16T19:58:22.685Z'),
  ('EG-0026', 'Design Updates For Gold', 'Build Guide', 'https://docs.google.com/spreadsheets/d/1fbwBgPteaPWnmdkzz1-2J4JA0878oRDj3cv_7-5XKrE/edit?gid=0#gid=0', '2026-03-16T20:41:54.902Z'),
  ('EG-0011', 'SDOH Review in Gold', 'Other', 'https://docs.google.com/spreadsheets/d/1xlCAceRaIOrdlvS8BXvgpbTdxiNPqhFD3UyFN5A0cV8/edit?gid=58930183#gid=58930183', '2026-03-17T16:14:10.385Z'),
  ('EG-0019', 'Depression Testing and Outcomes', 'Other', 'https://docs.google.com/document/d/19hOO9rOmzFjQs6ZVSfKglJFpMM6BXQ00r86oSnNKCkI/edit?usp=sharing', '2026-03-17T16:16:26.532Z'),
  ('EG-0011', 'CSH National SDOH Define Standards', 'Requirements', 'https://docs.google.com/presentation/d/1_JlJ5zEueI2YDZOuxt2yNFqyCgO4_w5zKN4MITRfbfc/edit?slide=id.geaa92738cc_0_0#slide=id.geaa92738cc_0_0', '2026-03-17T16:44:59.727Z'),
  ('EG-0017', 'Gold Build Review Check Off - Valuables and Belongings', 'Other', 'https://docs.google.com/spreadsheets/d/1rq45ZkY7pWVoRcEFE0vR8oMQjAMAdJp-CIVyNCIIvNk/edit?gid=130875306#gid=130875306', '2026-03-17T17:03:47.625Z'),
  ('EG-0027', 'Comprehensive Oral Care SCI Workbook', 'Policy', NULL, '2026-03-17T19:22:21.808Z')
) AS d(display_id, doc_name, doc_type, url, date_added)
JOIN initiatives i ON i.display_id = d.display_id
WHERE NOT EXISTS (
  SELECT 1 FROM documents doc
  WHERE doc.initiative_id = i.id AND doc.document_name = d.doc_name
);

-- Update document ID counter
UPDATE id_counters SET next_value = 17
WHERE organization_id = '00000000-0000-0000-0000-000000000001' AND entity_type = 'document';
