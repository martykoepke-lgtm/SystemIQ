-- SystemIQ Initial Schema
-- Run this in Supabase SQL Editor

-- ─── Organizations ───
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default organization
INSERT INTO organizations (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- ─── Team Members ───
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('sci', 'analyst', 'sci_manager', 'analyst_manager')),
  manager_id UUID REFERENCES team_members(id),
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Initiatives ───
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  display_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Not Started',
  primary_sci_id UUID REFERENCES team_members(id),
  secondary_sci_id UUID REFERENCES team_members(id),
  work_effort TEXT,
  phase TEXT,
  role TEXT,
  start_date DATE,
  target_date DATE,
  -- Epic Gold-specific
  go_live_wave TEXT,
  applications JSONB,
  venues JSONB,
  roles_impacted JSONB,
  specialty_service_line JSONB,
  system_sponsor TEXT,
  policy_link TEXT,
  ehr_requirements_link TEXT,
  specialized_workflow_needed BOOLEAN,
  -- Tracking
  completion_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_initiatives_org ON initiatives(organization_id);
CREATE INDEX idx_initiatives_type ON initiatives(type);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_primary_sci ON initiatives(primary_sci_id);

-- ─── Tasks ───
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  description TEXT NOT NULL,
  module TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Identified',
  primary_analyst_id UUID REFERENCES team_members(id),
  additional_analysts JSONB,
  education_required BOOLEAN DEFAULT false,
  build_review_status TEXT,
  build_review_date DATE,
  resolution_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_initiative ON tasks(initiative_id);
CREATE INDEX idx_tasks_analyst ON tasks(primary_analyst_id);
CREATE INDEX idx_tasks_module ON tasks(module);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ─── Notes (polymorphic: initiative or task) ───
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'General',
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (initiative_id IS NOT NULL OR task_id IS NOT NULL)
);

CREATE INDEX idx_notes_initiative ON notes(initiative_id);
CREATE INDEX idx_notes_task ON notes(task_id);

-- ─── Action Items (polymorphic: initiative or task) ───
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'Not Started',
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (initiative_id IS NOT NULL OR task_id IS NOT NULL)
);

CREATE INDEX idx_action_items_initiative ON action_items(initiative_id);
CREATE INDEX idx_action_items_task ON action_items(task_id);

-- ─── Documents (polymorphic: initiative or task) ───
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (initiative_id IS NOT NULL OR task_id IS NOT NULL)
);

-- ─── Effort Logs ───
CREATE TABLE IF NOT EXISTS effort_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  team_member_id UUID NOT NULL REFERENCES team_members(id),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  hours_spent NUMERIC(5,2) DEFAULT 0,
  effort_size TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_effort_logs_member ON effort_logs(team_member_id);
CREATE INDEX idx_effort_logs_initiative ON effort_logs(initiative_id);
CREATE INDEX idx_effort_logs_week ON effort_logs(week_start_date);

-- ─── Stakeholders ───
CREATE TABLE IF NOT EXISTS stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS initiative_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  stakeholder_id UUID REFERENCES stakeholders(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Application Config ───
CREATE TABLE IF NOT EXISTS application_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  key TEXT NOT NULL,
  value TEXT,
  UNIQUE(organization_id, key)
);

-- Seed default config
INSERT INTO application_config (organization_id, key, value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'banner_title', 'SystemIQ'),
  ('00000000-0000-0000-0000-000000000001', 'organization_name', 'CommonSpirit Health'),
  ('00000000-0000-0000-0000-000000000001', 'primary_brand_color', '#8B2B6E')
ON CONFLICT (organization_id, key) DO NOTHING;

-- ─── Field Options ───
CREATE TABLE IF NOT EXISTS field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  field_type TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Capacity Thresholds ───
CREATE TABLE IF NOT EXISTS capacity_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  min_pct NUMERIC(5,2),
  max_pct NUMERIC(5,2),
  color TEXT,
  label TEXT,
  display_order INTEGER DEFAULT 0
);

-- Seed default thresholds
INSERT INTO capacity_thresholds (organization_id, min_pct, max_pct, color, label, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 0, 45, '#22c55e', 'Well Under Capacity', 1),
  ('00000000-0000-0000-0000-000000000001', 45, 60, '#84cc16', 'Under Capacity', 2),
  ('00000000-0000-0000-0000-000000000001', 60, 75, '#eab308', 'Approaching Capacity', 3),
  ('00000000-0000-0000-0000-000000000001', 75, 85, '#f59e0b', 'Near Capacity', 4),
  ('00000000-0000-0000-0000-000000000001', 85, 95, '#dc2626', 'At Capacity', 5),
  ('00000000-0000-0000-0000-000000000001', 95, 105, '#c026d3', 'Over Capacity', 6),
  ('00000000-0000-0000-0000-000000000001', 105, 999, '#9333ea', 'Severely Over', 7);

-- ─── Workload Calculator Config ───
CREATE TABLE IF NOT EXISTS workload_calculator_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value NUMERIC(5,2) NOT NULL,
  UNIQUE(organization_id, category, key)
);

-- Seed default weights
INSERT INTO workload_calculator_config (organization_id, category, key, value) VALUES
  -- Effort sizes (base hours)
  ('00000000-0000-0000-0000-000000000001', 'effort_size', 'XS', 0.5),
  ('00000000-0000-0000-0000-000000000001', 'effort_size', 'S', 1.5),
  ('00000000-0000-0000-0000-000000000001', 'effort_size', 'M', 3.5),
  ('00000000-0000-0000-0000-000000000001', 'effort_size', 'L', 7.5),
  ('00000000-0000-0000-0000-000000000001', 'effort_size', 'XL', 15),
  -- Role weights
  ('00000000-0000-0000-0000-000000000001', 'role_weight', 'Owner', 1.0),
  ('00000000-0000-0000-0000-000000000001', 'role_weight', 'Co-Owner', 0.75),
  ('00000000-0000-0000-0000-000000000001', 'role_weight', 'Secondary', 0.5),
  ('00000000-0000-0000-0000-000000000001', 'role_weight', 'Support', 0.25),
  -- Type weights
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'Epic Gold', 1.0),
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'System Initiative', 1.0),
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'System Project', 0.9),
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'Governance', 0.8),
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'Ticket', 0.7),
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'General Support', 0.6),
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'Policy/Guidelines', 0.8),
  ('00000000-0000-0000-0000-000000000001', 'type_weight', 'Market Project', 0.9),
  -- Phase weights
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Discovery/Define', 0.8),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Design', 1.0),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Build', 1.2),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Validate/Test', 1.0),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Deploy', 1.1),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Post Go Live Support', 0.7),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Steady State', 0.5),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'In Progress', 1.0),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'Maintenance', 0.5),
  ('00000000-0000-0000-0000-000000000001', 'phase_weight', 'N/A', 1.0)
ON CONFLICT (organization_id, category, key) DO NOTHING;

-- ─── ID Counters ───
CREATE TABLE IF NOT EXISTS id_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  entity_type TEXT NOT NULL,
  prefix TEXT NOT NULL,
  next_value INTEGER DEFAULT 1,
  UNIQUE(organization_id, entity_type)
);

-- Seed counters (starting after existing PRCC data)
INSERT INTO id_counters (organization_id, entity_type, prefix, next_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'initiative_eg', 'EG', 28),
  ('00000000-0000-0000-0000-000000000001', 'initiative_sys', 'SYS', 1),
  ('00000000-0000-0000-0000-000000000001', 'task', 'TSK', 64),
  ('00000000-0000-0000-0000-000000000001', 'note', 'NTE', 100),
  ('00000000-0000-0000-0000-000000000001', 'action_item', 'TAI', 100),
  ('00000000-0000-0000-0000-000000000001', 'document', 'DOC', 100)
ON CONFLICT (organization_id, entity_type) DO NOTHING;

-- ─── Pipeline Items ───
CREATE TABLE IF NOT EXISTS pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  type TEXT,
  priority TEXT,
  sci_contact TEXT,
  analyst TEXT,
  application TEXT,
  specialty TEXT,
  details TEXT,
  policy_link TEXT,
  ehr_link TEXT,
  system_sponsor TEXT,
  status TEXT DEFAULT 'pending',
  promoted_initiative_id UUID REFERENCES initiatives(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Helper function: get next display ID ───
CREATE OR REPLACE FUNCTION get_next_display_id(
  p_org_id UUID,
  p_entity_type TEXT
) RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next INTEGER;
  v_display_id TEXT;
BEGIN
  SELECT prefix, next_value INTO v_prefix, v_next
  FROM id_counters
  WHERE organization_id = p_org_id AND entity_type = p_entity_type
  FOR UPDATE;

  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'No counter found for entity_type %', p_entity_type;
  END IF;

  v_display_id := v_prefix || '-' || LPAD(v_next::TEXT, 4, '0');

  UPDATE id_counters
  SET next_value = next_value + 1
  WHERE organization_id = p_org_id AND entity_type = p_entity_type;

  RETURN v_display_id;
END;
$$ LANGUAGE plpgsql;
