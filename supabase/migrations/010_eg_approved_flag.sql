-- Add eg_approved flag to initiatives
-- This controls what appears on the EG Command Center vs Pipeline

ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS eg_approved BOOLEAN DEFAULT false;

-- All existing EG-* initiatives are already approved (they're on the board)
UPDATE initiatives SET eg_approved = true WHERE display_id LIKE 'EG-%';

-- All SYS-* initiatives with type='Epic Gold' are NOT approved yet (they're in pipeline staging)
UPDATE initiatives SET eg_approved = false WHERE display_id LIKE 'SYS-%' AND type = 'Epic Gold';

-- All non-Epic-Gold initiatives don't need this flag
UPDATE initiatives SET eg_approved = false WHERE type != 'Epic Gold';
