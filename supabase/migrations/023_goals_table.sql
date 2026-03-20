-- Goals table (replaces localStorage)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('organization', 'team', 'individual')),
  owner_name TEXT DEFAULT 'Unassigned',
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_org ON goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_goals_level ON goals(level);

-- Junction table: initiative ↔ goal (many-to-many)
CREATE TABLE IF NOT EXISTS initiative_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(initiative_id, goal_id)
);

CREATE INDEX IF NOT EXISTS idx_initiative_goals_init ON initiative_goals(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_goals_goal ON initiative_goals(goal_id);
