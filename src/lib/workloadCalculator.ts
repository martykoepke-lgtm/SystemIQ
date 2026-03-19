/**
 * Workload Calculator — Adapted from GovernIQ
 *
 * Planned Hours = baseHours × typeWeight × phaseWeight
 * (No role weight since SystemIQ uses primary/secondary SCI assignment instead)
 *
 * Actual Hours = SUM(effort_logs.hours_spent) for most recent entry per initiative
 */

import { supabase, DEFAULT_ORG_ID } from './supabase';
import type { Initiative, EffortLog, TeamMember } from './supabase';
import { EFFORT_SIZE_HOURS, ACTIVE_INITIATIVE_STATUSES, DEFAULT_CAPACITY_THRESHOLDS } from './constants';

export interface CapacityConfig {
  effortSizes: Record<string, number>;
  typeWeights: Record<string, number>;
  phaseWeights: Record<string, number>;
}

export interface MemberCapacity {
  member: TeamMember;
  initiatives: Initiative[];
  plannedHours: number;
  actualHours: number;
  plannedPct: number;
  actualPct: number;
  variance: number;
  initiativeCount: number;
  capacityColor: string;
  capacityLabel: string;
}

const WEEKLY_CAPACITY = 40;

// ─── Config Loading (cached) ───

let cachedConfig: CapacityConfig | null = null;
let configLoadedAt = 0;
const CACHE_TTL = 60000;

export async function loadCapacityConfig(): Promise<CapacityConfig> {
  if (cachedConfig && Date.now() - configLoadedAt < CACHE_TTL) return cachedConfig;

  const { data } = await supabase
    .from('workload_calculator_config')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID);

  const config: CapacityConfig = {
    effortSizes: { ...EFFORT_SIZE_HOURS },
    typeWeights: {},
    phaseWeights: {},
  };

  for (const row of data || []) {
    const val = Number(row.value) || 1;
    if (row.category === 'effort_size') config.effortSizes[row.key] = val;
    else if (row.category === 'type_weight') config.typeWeights[row.key] = val;
    else if (row.category === 'phase_weight') config.phaseWeights[row.key] = val;
  }

  cachedConfig = config;
  configLoadedAt = Date.now();
  return config;
}

// ─── Planned Hours Calculation ───

export function calculatePlannedHours(initiative: Initiative, config: CapacityConfig): number {
  if (!ACTIVE_INITIATIVE_STATUSES.has(initiative.status)) return 0;
  if (!initiative.work_effort) return 0;

  const baseHours = config.effortSizes[initiative.work_effort] || 0;
  const typeWeight = config.typeWeights[initiative.type] || 1;
  const phaseWeight = config.phaseWeights[initiative.phase || 'N/A'] || 1;

  return baseHours * typeWeight * phaseWeight;
}

// ─── Capacity Color/Label ───

export function getCapacityThreshold(pct: number): { color: string; label: string } {
  for (const t of DEFAULT_CAPACITY_THRESHOLDS) {
    if (pct >= t.min_pct && pct < t.max_pct) return { color: t.color, label: t.label };
  }
  return { color: '#9333ea', label: 'Severely Over' };
}

// ─── Full Capacity Calculation for a Team Member ───

export async function calculateMemberCapacity(
  member: TeamMember,
  allInitiatives: Initiative[],
  allEffortLogs: EffortLog[],
  config: CapacityConfig
): Promise<MemberCapacity> {
  // Get initiatives where this member is primary or secondary SCI
  const memberInitiatives = allInitiatives.filter(
    (i) => i.primary_sci_id === member.id || i.secondary_sci_id === member.id
  );

  // Calculate planned hours
  let plannedHours = 0;
  for (const init of memberInitiatives) {
    plannedHours += calculatePlannedHours(init, config);
  }

  // Calculate actual hours from effort logs (most recent per initiative)
  let actualHours = 0;
  const memberLogs = allEffortLogs.filter((l) => l.team_member_id === member.id);
  const latestByInitiative: Record<string, number> = {};
  for (const log of memberLogs) {
    const existing = latestByInitiative[log.initiative_id];
    if (existing === undefined || log.hours_spent > existing) {
      latestByInitiative[log.initiative_id] = log.hours_spent;
    }
  }
  actualHours = Object.values(latestByInitiative).reduce((sum, h) => sum + h, 0);

  const plannedPct = (plannedHours / WEEKLY_CAPACITY) * 100;
  const actualPct = (actualHours / WEEKLY_CAPACITY) * 100;
  const variance = actualHours - plannedHours;
  const threshold = getCapacityThreshold(plannedPct);

  return {
    member,
    initiatives: memberInitiatives,
    plannedHours,
    actualHours,
    plannedPct,
    actualPct,
    variance,
    initiativeCount: memberInitiatives.filter((i) => ACTIVE_INITIATIVE_STATUSES.has(i.status)).length,
    capacityColor: threshold.color,
    capacityLabel: threshold.label,
  };
}

// ─── Batch Capacity for All Members ───

export async function calculateTeamCapacity(
  members: TeamMember[],
  role?: string
): Promise<MemberCapacity[]> {
  const config = await loadCapacityConfig();

  // Fetch all active initiatives
  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('is_active', true);

  // Fetch all effort logs
  const { data: effortLogs } = await supabase
    .from('effort_logs')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID);

  const filteredMembers = role ? members.filter((m) => m.role === role) : members;

  const results: MemberCapacity[] = [];
  for (const member of filteredMembers) {
    const capacity = await calculateMemberCapacity(
      member,
      initiatives || [],
      effortLogs || [],
      config
    );
    results.push(capacity);
  }

  return results;
}
