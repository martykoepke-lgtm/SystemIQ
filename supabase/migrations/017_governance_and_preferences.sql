-- ─── Governance Records ───
-- Tracks governance tickets linked to initiatives (modeled after GovernIQ)

CREATE TABLE governance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  ticket_number TEXT,
  submission_date DATE,
  review_date DATE,
  decision_date DATE,
  status TEXT DEFAULT 'Drafting' CHECK (status IN ('Drafting','Pending','In Review','Approved','Deferred','Returned','Withdrawn')),
  conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_governance_records_initiative ON governance_records(initiative_id);

-- ─── User Preferences ───
-- Stores per-user preferences like favorite/frozen person selectors

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  team_member_id UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
);

CREATE UNIQUE INDEX idx_user_preferences_unique
  ON user_preferences(organization_id, preference_key, COALESCE(team_member_id, '00000000-0000-0000-0000-000000000000'));

-- ─── ID Counter for Governance ───
INSERT INTO id_counters (organization_id, entity_type, prefix, next_value)
VALUES ('00000000-0000-0000-0000-000000000001', 'governance', 'GOV', 1);

-- ─── RLS disabled (consistent with existing migrations) ───
ALTER TABLE governance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- ─── Grant anon access (consistent with existing migrations) ───
GRANT ALL ON governance_records TO anon;
GRANT ALL ON user_preferences TO anon;
