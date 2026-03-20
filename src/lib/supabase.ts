import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Check .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ─── Default organization ID (single-tenant for now) ───
export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

// ─── Type Definitions ───

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  role: 'sci' | 'mi' | 'analyst' | 'sci_manager' | 'sci_director' | 'mi_manager' | 'mi_director' | 'analyst_manager' | 'analyst_director';
  manager_id: string | null;
  title: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithDetails extends TeamMember {
  manager?: TeamMember | null;
  direct_reports?: TeamMember[];
  initiative_count?: number;
  task_count?: number;
}

export interface Initiative {
  id: string;
  organization_id: string;
  display_id: string;
  name: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  primary_sci_id: string | null;
  secondary_sci_id: string | null;
  work_effort: string | null;
  phase: string | null;
  role: string | null;
  start_date: string | null;
  target_date: string | null;
  // Epic Gold-specific
  go_live_wave: string | null;
  applications: string[] | null;
  venues: string[] | null;
  roles_impacted: string[] | null;
  specialty_service_line: string[] | null;
  system_sponsor: string | null;
  policy_link: string | null;
  ehr_requirements_link: string | null;
  specialized_workflow_needed: boolean | null;
  // Epic Gold classification
  eg_approved: boolean;
  eg_subtype: string | null; // 'Standard Practice', 'Guideline', 'Policy', 'Board Goal'
  // Tracking
  completion_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StakeholderWithRole extends Stakeholder {
  pivot_id: string;
  role: string | null;
}

export interface InitiativeWithDetails extends Initiative {
  primary_sci?: TeamMember | null;
  secondary_sci?: TeamMember | null;
  tasks?: Task[];
  task_count?: number;
  open_task_count?: number;
  notes?: Note[];
  action_items?: ActionItem[];
  documents?: Document[];
  metrics?: InitiativeMetric[];
  stakeholders?: StakeholderWithRole[];
}

export interface Task {
  id: string;
  organization_id: string;
  initiative_id: string;
  display_id: string;
  description: string;
  module: string | null;
  priority: string;
  status: string;
  primary_analyst_id: string | null;
  additional_analysts: string[] | null;
  education_required: boolean;
  build_review_status: string | null;
  build_review_date: string | null;
  resolution_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDetails extends Task {
  initiative?: Initiative;
  primary_analyst?: TeamMember | null;
  notes?: Note[];
  action_items?: ActionItem[];
  documents?: Document[];
}

export interface Note {
  id: string;
  organization_id: string;
  initiative_id: string | null;
  task_id: string | null;
  note_text: string;
  note_type: string;
  author: string | null;
  created_at: string;
}

export interface ActionItem {
  id: string;
  organization_id: string;
  initiative_id: string | null;
  task_id: string | null;
  description: string;
  owner: string | null;
  due_date: string | null;
  status: string;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  organization_id: string;
  initiative_id: string | null;
  task_id: string | null;
  document_name: string;
  document_type: string | null;
  url: string | null;
  created_at: string;
}

export interface EffortLog {
  id: string;
  organization_id: string;
  team_member_id: string;
  initiative_id: string;
  week_start_date: string;
  hours_spent: number;
  effort_size: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stakeholder {
  id: string;
  organization_id: string;
  name: string;
  title: string | null;
  email: string | null;
  department: string | null;
  created_at: string;
}

export interface InitiativeStakeholder {
  id: string;
  initiative_id: string;
  stakeholder_id: string;
  role: string | null;
  created_at: string;
}

export interface FieldOption {
  id: string;
  organization_id: string;
  field_type: string;
  key: string;
  label: string;
  description: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CapacityThreshold {
  id: string;
  organization_id: string;
  min_pct: number;
  max_pct: number;
  color: string;
  label: string;
  display_order: number;
}

export interface WorkloadCalculatorConfig {
  id: string;
  organization_id: string;
  category: string;
  key: string;
  value: number;
}

export interface PipelineItem {
  id: string;
  organization_id: string;
  name: string;
  type: string | null;
  priority: string | null;
  sci_contact: string | null;
  analyst: string | null;
  application: string | null;
  specialty: string | null;
  details: string | null;
  policy_link: string | null;
  ehr_link: string | null;
  system_sponsor: string | null;
  status: string;
  promoted_initiative_id: string | null;
  created_at: string;
}

export interface IdCounter {
  id: string;
  organization_id: string;
  entity_type: string;
  prefix: string;
  next_value: number;
}

export interface ApplicationConfig {
  id: string;
  organization_id: string;
  key: string;
  value: string | null;
}

export interface GovernanceRecord {
  id: string;
  organization_id: string;
  initiative_id: string;
  display_id: string;
  ticket_number: string | null;
  submission_date: string | null;
  review_date: string | null;
  decision_date: string | null;
  status: string;
  conditions: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreference {
  id: string;
  organization_id: string;
  preference_key: string;
  preference_value: string;
  team_member_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InitiativeMetric {
  id: string;
  organization_id: string;
  initiative_id: string;
  metric_name: string;
  unit: string;
  baseline_value: number | null;
  baseline_date: string | null;
  baseline_timeframe: string | null;
  target_value: number | null;
  result_value: number | null;
  result_date: string | null;
  result_timeframe: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  level: 'organization' | 'team' | 'individual';
  owner_name: string;
  team_member_id: string | null;
  target_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface InitiativeGoal {
  id: string;
  initiative_id: string;
  goal_id: string;
  created_at: string;
}
