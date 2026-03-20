-- Seed realistic start_date and target_date for all initiatives
-- Also seed sample effort_logs for SCIs to populate Resource and Trends views

-- ═══ INITIATIVE DATES ═══

-- EG initiatives: started Jan-Feb 2026, targets May-Aug 2026
UPDATE initiatives SET start_date = '2026-01-06', target_date = '2026-06-30' WHERE display_id = 'EG-0002';
UPDATE initiatives SET start_date = '2026-01-13', target_date = '2026-05-30' WHERE display_id = 'EG-0003';
UPDATE initiatives SET start_date = '2026-01-20', target_date = '2026-06-15' WHERE display_id = 'EG-0004';
UPDATE initiatives SET start_date = '2026-01-27', target_date = '2026-05-15' WHERE display_id = 'EG-0006';
UPDATE initiatives SET start_date = '2026-02-03', target_date = '2026-06-30' WHERE display_id = 'EG-0007';
UPDATE initiatives SET start_date = '2026-01-06', target_date = '2026-07-31' WHERE display_id = 'EG-0008';
UPDATE initiatives SET start_date = '2026-02-10', target_date = '2026-06-15' WHERE display_id = 'EG-0009';
UPDATE initiatives SET start_date = '2026-01-13', target_date = '2026-08-15' WHERE display_id = 'EG-0010';
UPDATE initiatives SET start_date = '2026-02-17', target_date = '2026-07-31' WHERE display_id = 'EG-0011';
UPDATE initiatives SET start_date = '2026-01-20', target_date = '2026-06-30' WHERE display_id = 'EG-0012';
UPDATE initiatives SET start_date = '2026-02-24', target_date = '2026-08-31' WHERE display_id = 'EG-0013';
UPDATE initiatives SET start_date = '2026-01-27', target_date = '2026-05-30' WHERE display_id = 'EG-0015';
UPDATE initiatives SET start_date = '2026-02-03', target_date = '2026-07-15' WHERE display_id = 'EG-0016';
UPDATE initiatives SET start_date = '2026-02-10', target_date = '2026-06-30' WHERE display_id = 'EG-0017';
UPDATE initiatives SET start_date = '2026-01-06', target_date = '2026-05-31' WHERE display_id = 'EG-0018';
UPDATE initiatives SET start_date = '2026-02-17', target_date = '2026-08-15' WHERE display_id = 'EG-0019';
UPDATE initiatives SET start_date = '2026-01-13', target_date = '2026-07-31' WHERE display_id = 'EG-0020';
UPDATE initiatives SET start_date = '2026-02-24', target_date = '2026-06-15' WHERE display_id = 'EG-0022';
UPDATE initiatives SET start_date = '2026-01-20', target_date = '2026-08-31' WHERE display_id = 'EG-0023';
UPDATE initiatives SET start_date = '2026-02-03', target_date = '2026-06-30' WHERE display_id = 'EG-0024';
UPDATE initiatives SET start_date = '2026-02-10', target_date = '2026-07-15' WHERE display_id = 'EG-0025';
UPDATE initiatives SET start_date = '2026-01-27', target_date = '2026-08-31' WHERE display_id = 'EG-0026';
UPDATE initiatives SET start_date = '2026-02-17', target_date = '2026-06-30' WHERE display_id = 'EG-0027';

-- SYS initiatives: various start dates in 2025-2026
UPDATE initiatives SET start_date = '2025-09-15', target_date = '2026-03-31' WHERE display_id = 'SYS-0001';
UPDATE initiatives SET start_date = '2025-10-01', target_date = '2026-04-30' WHERE display_id = 'SYS-0002';
UPDATE initiatives SET start_date = '2025-11-01', target_date = '2026-06-30' WHERE display_id = 'SYS-0003';
UPDATE initiatives SET start_date = '2025-08-15', target_date = '2026-02-28' WHERE display_id = 'SYS-0004';
UPDATE initiatives SET start_date = '2025-12-01', target_date = '2026-05-31' WHERE display_id = 'SYS-0005';
UPDATE initiatives SET start_date = '2026-01-15', target_date = '2026-07-31' WHERE display_id = 'SYS-0006';
UPDATE initiatives SET start_date = '2025-10-15', target_date = '2026-04-15' WHERE display_id = 'SYS-0007';
UPDATE initiatives SET start_date = '2025-09-01', target_date = '2026-03-15' WHERE display_id = 'SYS-0008';
UPDATE initiatives SET start_date = '2025-11-15', target_date = '2026-06-15' WHERE display_id = 'SYS-0009';
UPDATE initiatives SET start_date = '2026-01-06', target_date = '2026-04-30' WHERE display_id = 'SYS-0010';
UPDATE initiatives SET start_date = '2025-07-01', target_date = '2026-01-31' WHERE display_id = 'SYS-0011';
UPDATE initiatives SET start_date = '2025-12-15', target_date = '2026-05-15' WHERE display_id = 'SYS-0012';
UPDATE initiatives SET start_date = '2026-02-01', target_date = '2026-08-31' WHERE display_id = 'SYS-0013';
UPDATE initiatives SET start_date = '2025-10-01', target_date = '2026-03-31' WHERE display_id = 'SYS-0014';
UPDATE initiatives SET start_date = '2025-11-01', target_date = '2026-04-30' WHERE display_id = 'SYS-0015';
UPDATE initiatives SET start_date = '2026-01-15', target_date = '2026-06-30' WHERE display_id = 'SYS-0016';
UPDATE initiatives SET start_date = '2025-08-01', target_date = '2026-02-15' WHERE display_id = 'SYS-0017';

-- ═══ EFFORT LOGS (sample data for Marty Koepke) ═══
-- 8 weeks of effort for SYS initiatives to populate trends/forecasts/resource view

-- Get Marty's team_member_id
DO $$
DECLARE
  marty_id UUID;
  init_id UUID;
  wk TEXT;
BEGIN
  SELECT id INTO marty_id FROM team_members
    WHERE name = 'Marty Koepke' AND organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;

  IF marty_id IS NULL THEN RETURN; END IF;

  -- SYS-0001: Abridge AI - 8 weeks of effort
  SELECT id INTO init_id FROM initiatives WHERE display_id = 'SYS-0001' LIMIT 1;
  IF init_id IS NOT NULL THEN
    INSERT INTO effort_logs (organization_id, team_member_id, initiative_id, week_start_date, hours_spent) VALUES
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-01-26', 3.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-02', 4.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-09', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-16', 5.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-23', 4.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-02', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-09', 2.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-16', 3.5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- SYS-0003: Vaccine Deferral - trending down
  SELECT id INTO init_id FROM initiatives WHERE display_id = 'SYS-0003' LIMIT 1;
  IF init_id IS NOT NULL THEN
    INSERT INTO effort_logs (organization_id, team_member_id, initiative_id, week_start_date, hours_spent) VALUES
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-01-26', 5.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-02', 4.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-09', 4.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-16', 3.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-23', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-02', 2.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-09', 1.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-16', 1.0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- SYS-0005: Interpreter Services - stable
  SELECT id INTO init_id FROM initiatives WHERE display_id = 'SYS-0005' LIMIT 1;
  IF init_id IS NOT NULL THEN
    INSERT INTO effort_logs (organization_id, team_member_id, initiative_id, week_start_date, hours_spent) VALUES
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-01-26', 2.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-02', 2.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-09', 2.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-16', 1.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-23', 2.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-02', 2.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-09', 2.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-16', 2.0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- SYS-0009: HRS EPIC - trending up
  SELECT id INTO init_id FROM initiatives WHERE display_id = 'SYS-0009' LIMIT 1;
  IF init_id IS NOT NULL THEN
    INSERT INTO effort_logs (organization_id, team_member_id, initiative_id, week_start_date, hours_spent) VALUES
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-01-26', 1.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-02', 1.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-09', 2.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-16', 2.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-23', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-02', 3.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-09', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-16', 4.0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- SYS-0006: CMU Tele-Strips - sporadic
  SELECT id INTO init_id FROM initiatives WHERE display_id = 'SYS-0006' LIMIT 1;
  IF init_id IS NOT NULL THEN
    INSERT INTO effort_logs (organization_id, team_member_id, initiative_id, week_start_date, hours_spent) VALUES
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-02', 1.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-09', 0.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-16', 1.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-23', 0.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-02', 1.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-09', 0.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-16', 0.0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- EG-0011: SDOH - stable effort as SCI
  SELECT id INTO init_id FROM initiatives WHERE display_id = 'EG-0011' LIMIT 1;
  IF init_id IS NOT NULL THEN
    INSERT INTO effort_logs (organization_id, team_member_id, initiative_id, week_start_date, hours_spent) VALUES
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-01-26', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-02', 3.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-09', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-16', 4.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-02-23', 3.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-02', 3.0),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-09', 3.5),
      ('00000000-0000-0000-0000-000000000001', marty_id, init_id, '2026-03-16', 3.0)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
