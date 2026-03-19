// ─── Initiative Statuses ───
export const INITIATIVE_STATUSES = [
  'Not Started',
  'Define',
  'Ready for Discussion',
  'In Progress',
  'Under Review',
  'Completed',
  'On Hold',
  'Deferred',
  'Dismissed',
] as const;

export const ACTIVE_INITIATIVE_STATUSES = new Set([
  'Not Started',
  'Define',
  'Ready for Discussion',
  'In Progress',
  'Under Review',
]);

// ─── Task Statuses ───
export const TASK_STATUSES = [
  'Identified',
  'Needs Analyst - Discussion',
  'Needs Analyst - Build',
  'Build Analyst Assigned',
  'Build In Progress',
  'Non Prod Testing',
  'On Hold',
  'Closed - Completed',
  'Closed - Deferred',
  'Dismissed',
] as const;

export const OPEN_TASK_STATUSES = new Set([
  'Identified',
  'Needs Analyst - Discussion',
  'Needs Analyst - Build',
  'Build Analyst Assigned',
  'Build In Progress',
  'Non Prod Testing',
  'On Hold',
]);

// ─── Priorities ───
export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High: '#f59e0b',
  Medium: '#3b82f6',
  Low: '#6b7280',
};

// ─── Epic Gold Sub-Types ───
export const EG_SUBTYPES = [
  'Standard Practice',
  'Guideline',
  'Policy',
  'Board Goal',
] as const;

export const EG_SUBTYPE_COLORS: Record<string, string> = {
  'Standard Practice': '#0ea5e9',
  Guideline: '#8b5cf6',
  Policy: '#f59e0b',
  'Board Goal': '#ef4444',
};

// ─── Initiative Types ───
export const INITIATIVE_TYPES = [
  'Epic Gold',
  'System Project',
  'System Initiative',
  'Market Project',
  'Governance',
  'Consultation',
  'Team Assignment',
  'Ticket',
  'General Support',
  'Policy/Guidelines',
] as const;

export const TYPE_COLORS: Record<string, string> = {
  'Epic Gold': '#f59e0b',
  'System Project': '#8b5cf6',
  'System Initiative': '#0ea5e9',
  'Market Project': '#ec4899',
  Governance: '#6366f1',
  Consultation: '#14b8a6',
  'Team Assignment': '#a855f7',
  Ticket: '#f97316',
  'General Support': '#6b7280',
  'Policy/Guidelines': '#10b981',
};

// ─── Epic Gold Specific ───
export const EPIC_MODULES = [
  'Ambulatory',
  'ASAP',
  'Beacon',
  'Beaker',
  'Bones',
  'Bugsy',
  'Caboodle',
  'Cadence',
  'ClinDoc',
  'Cogito',
  'Cupid',
  'Grand Central',
  'Haiku',
  'Lumens',
  'MyChart',
  'OPA',
  'OpTime',
  'Orders',
  'Prelude',
  'Radiant',
  'Resolute',
  'Rover',
  'Stork',
  'Willow',
] as const;

export const GO_LIVE_WAVES = [
  'Wave 3',
  'Wave 4',
  'Wave 4.5',
  'Wave 5',
  'New Beginnings South',
] as const;

export const VENUES = [
  'ED',
  'Acute Inpatient',
  'Ambulatory',
  'Periop',
  'Outpatient Surgery',
  'Acute Outpatient',
] as const;

export const ROLES_IMPACTED = [
  'Provider',
  'APP',
  'Nursing',
  'Pharmacy',
  'Lab',
  'Imaging',
  'Quality',
  'Therapy',
  'Care Coordination',
  'Social Work',
  'Respiratory Therapy',
  'BHU',
  'Administration',
  'Revenue Cycle',
  'Registration',
  'HIM',
] as const;

export const SPECIALTIES = [
  'Cardiology',
  'Oncology',
  'Pediatrics',
  'ED',
  'ICU',
  'Critical Care',
  'OB/GYN',
  'NICU',
  'Perioperative',
  'Radiology',
  'Laboratory',
  'Pharmacy',
  'BHU',
  'Rehabilitation',
  'Neurology',
  'Orthopedics',
  'General Medicine',
  'General Surgery',
  'Primary Care',
  'Ambulatory',
] as const;

// ─── Phases ───
export const PHASES = [
  'Discovery/Define',
  'Design',
  'Build',
  'Validate/Test',
  'Deploy',
  'Post Go Live Support',
  'Steady State',
  'In Progress',
  'Maintenance',
  'N/A',
] as const;

// ─── Work Effort ───
export const WORK_EFFORT_OPTIONS = [
  { key: 'XS', label: 'XS - Less than 1 hr/wk', hours: 0.5 },
  { key: 'S', label: 'S - 1-2 hrs/wk', hours: 1.5 },
  { key: 'M', label: 'M - 2-5 hrs/wk', hours: 3.5 },
  { key: 'L', label: 'L - 5-10 hrs/wk', hours: 7.5 },
  { key: 'XL', label: 'XL - More than 10 hrs/wk', hours: 15 },
] as const;

export const EFFORT_SIZE_HOURS: Record<string, number> = {
  XS: 0.5,
  S: 1.5,
  M: 3.5,
  L: 7.5,
  XL: 15,
};

// ─── Roles ───
export const ROLES = ['Owner', 'Co-Owner', 'Secondary', 'Support'] as const;

// ─── Team Member Roles ───
export const TEAM_MEMBER_ROLES = [
  // Individual contributors
  { key: 'sci', label: 'SCI (System Clinical Informaticist)', category: 'sci' },
  { key: 'mi', label: 'MI (Medical Informaticist)', category: 'mi' },
  { key: 'analyst', label: 'Application Analyst', category: 'analyst' },
  // Leadership
  { key: 'sci_manager', label: 'SCI Manager', category: 'sci' },
  { key: 'sci_director', label: 'SCI Director', category: 'sci' },
  { key: 'mi_manager', label: 'MI Manager', category: 'mi' },
  { key: 'mi_director', label: 'MI Director', category: 'mi' },
  { key: 'analyst_manager', label: 'Analyst Manager', category: 'analyst' },
  { key: 'analyst_director', label: 'Analyst Director', category: 'analyst' },
] as const;

// ─── Role filter groups ───
export const LEADER_ROLES = new Set([
  'sci_manager', 'sci_director', 'mi_manager', 'mi_director', 'analyst_manager', 'analyst_director',
]);
export const SCI_ROLES = new Set(['sci', 'sci_manager', 'sci_director']);
export const MI_ROLES = new Set(['mi', 'mi_manager', 'mi_director']);
export const ANALYST_ROLES = new Set(['analyst', 'analyst_manager', 'analyst_director']);

// ─── Note Types ───
export const NOTE_TYPES = [
  'General',
  'Decision',
  'Blocker',
  'Status Update',
  'Meeting Notes',
] as const;

// ─── Document Types ───
export const DOCUMENT_TYPES = [
  'Policy',
  'Guideline',
  'EHR Requirements',
  'Intake Slide',
  'SCI Workbook',
  'Reference',
  'Other',
] as const;

// ─── Build Review ───
export const BUILD_REVIEW_OPTIONS = [
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'approved', label: 'Yes - Build can be complete' },
  { key: 'not_met', label: 'No - Did not meet with analyst' },
] as const;

// ─── Governance Statuses ───
export const GOVERNANCE_STATUSES = [
  'Drafting',
  'Pending',
  'In Review',
  'Approved',
  'Deferred',
  'Returned',
  'Withdrawn',
] as const;

export const GOVERNANCE_STATUS_COLORS: Record<string, string> = {
  Drafting: '#6b7280',
  Pending: '#f59e0b',
  'In Review': '#3b82f6',
  Approved: '#22c55e',
  Deferred: '#a855f7',
  Returned: '#f97316',
  Withdrawn: '#9ca3af',
};

// ─── Action Item Statuses ───
export const ACTION_ITEM_STATUSES = [
  'Not Started',
  'In Progress',
  'Complete',
  'Deferred',
] as const;

// ─── Capacity Thresholds ───
export const DEFAULT_CAPACITY_THRESHOLDS = [
  { min_pct: 0, max_pct: 45, color: '#22c55e', label: 'Well Under Capacity' },
  { min_pct: 45, max_pct: 60, color: '#84cc16', label: 'Under Capacity' },
  { min_pct: 60, max_pct: 75, color: '#eab308', label: 'Approaching Capacity' },
  { min_pct: 75, max_pct: 85, color: '#f59e0b', label: 'Near Capacity' },
  { min_pct: 85, max_pct: 95, color: '#dc2626', label: 'At Capacity' },
  { min_pct: 95, max_pct: 105, color: '#c026d3', label: 'Over Capacity' },
  { min_pct: 105, max_pct: 999, color: '#9333ea', label: 'Severely Over' },
];

export function getCapacityColor(pct: number): string {
  for (const t of DEFAULT_CAPACITY_THRESHOLDS) {
    if (pct >= t.min_pct && pct < t.max_pct) return t.color;
  }
  return '#9333ea';
}

export function getCapacityLabel(pct: number): string {
  for (const t of DEFAULT_CAPACITY_THRESHOLDS) {
    if (pct >= t.min_pct && pct < t.max_pct) return t.label;
  }
  return 'Severely Over';
}

// ─── Status Colors ───
export const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#6b7280',
  Define: '#8b5cf6',
  'Ready for Discussion': '#f59e0b',
  'In Progress': '#3b82f6',
  'Under Review': '#6366f1',
  Completed: '#22c55e',
  'On Hold': '#f97316',
  Deferred: '#a855f7',
  Dismissed: '#9ca3af',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  Identified: '#6b7280',
  'Needs Analyst - Discussion': '#f59e0b',
  'Needs Analyst - Build': '#f97316',
  'Build Analyst Assigned': '#3b82f6',
  'Build In Progress': '#0ea5e9',
  'Non Prod Testing': '#8b5cf6',
  'On Hold': '#f97316',
  'Closed - Completed': '#22c55e',
  'Closed - Deferred': '#a855f7',
  Dismissed: '#9ca3af',
};
