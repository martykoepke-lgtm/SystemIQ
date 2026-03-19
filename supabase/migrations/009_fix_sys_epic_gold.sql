-- Fix SYS initiatives that were incorrectly typed as 'Epic Gold'
-- These are from the SCI Initiative Tracking workbook and should NOT appear in EG Command Center

-- SYS-0002: "Amb Epic Gold WF Review" — This is a System Initiative about reviewing Epic Gold, not an EG item itself
UPDATE initiatives SET type = 'System Initiative' WHERE display_id = 'SYS-0002';

-- SYS-0005: "Interpreter Services Optimization" — This is a System Initiative
UPDATE initiatives SET type = 'System Initiative' WHERE display_id = 'SYS-0005';

-- SYS-0009: "HRS EPIC Integration Project PRJ0012291" — This is a System Project
UPDATE initiatives SET type = 'System Project' WHERE display_id = 'SYS-0009';

-- Verify: no SYS-* items should have type = 'Epic Gold'
-- SELECT display_id, name, type FROM initiatives WHERE display_id LIKE 'SYS-%' AND type = 'Epic Gold';
