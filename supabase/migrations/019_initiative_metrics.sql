-- Initiative Outcome Metrics (Pre/Post tracking)
-- Tracks baseline, target, and result values per initiative metric

CREATE TABLE IF NOT EXISTS initiative_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'count',
  baseline_value NUMERIC,
  baseline_date DATE,
  baseline_timeframe TEXT,
  target_value NUMERIC,
  result_value NUMERIC,
  result_date DATE,
  result_timeframe TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_initiative_metrics_initiative ON initiative_metrics(initiative_id);
