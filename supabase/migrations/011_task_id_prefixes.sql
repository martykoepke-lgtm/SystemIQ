-- Task ID prefix system: STSK (System Task) vs ETSK (Epic Gold Task)
-- When an initiative is promoted from SYS→EG, its tasks update from STSK→ETSK

-- Add new counters for task prefixes
INSERT INTO id_counters (organization_id, entity_type, prefix, next_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'task_stsk', 'STSK', 1),
  ('00000000-0000-0000-0000-000000000001', 'task_etsk', 'ETSK', 1)
ON CONFLICT (organization_id, entity_type) DO NOTHING;

-- Rename existing TSK-* tasks on EG-approved initiatives to ETSK-*
-- First, find the max number used and set counter
DO $$
DECLARE
  max_num INTEGER;
  task_rec RECORD;
  counter INTEGER := 1;
BEGIN
  -- Update all tasks on EG-approved initiatives
  FOR task_rec IN
    SELECT t.id, t.display_id
    FROM tasks t
    JOIN initiatives i ON t.initiative_id = i.id
    WHERE i.eg_approved = true
      AND t.display_id LIKE 'TSK-%'
    ORDER BY t.display_id
  LOOP
    UPDATE tasks SET display_id = 'ETSK-' || LPAD(counter::TEXT, 4, '0') WHERE id = task_rec.id;
    counter := counter + 1;
  END LOOP;

  -- Update ETSK counter
  UPDATE id_counters SET next_value = counter WHERE entity_type = 'task_etsk' AND organization_id = '00000000-0000-0000-0000-000000000001';

  -- Update all tasks on non-EG initiatives
  counter := 1;
  FOR task_rec IN
    SELECT t.id, t.display_id
    FROM tasks t
    JOIN initiatives i ON t.initiative_id = i.id
    WHERE (i.eg_approved = false OR i.eg_approved IS NULL)
      AND t.display_id LIKE 'TSK-%'
    ORDER BY t.display_id
  LOOP
    UPDATE tasks SET display_id = 'STSK-' || LPAD(counter::TEXT, 4, '0') WHERE id = task_rec.id;
    counter := counter + 1;
  END LOOP;

  -- Update STSK counter
  UPDATE id_counters SET next_value = counter WHERE entity_type = 'task_stsk' AND organization_id = '00000000-0000-0000-0000-000000000001';
END $$;
