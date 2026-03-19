/**
 * Analytics Engine — Core aggregation functions for SystemIQ analytics
 * All computation is local (no AI). Uses simple counting and grouping.
 */

import { supabase, DEFAULT_ORG_ID } from './supabase';
import type { Initiative, Task, TeamMember, EffortLog } from './supabase';

// ─── Types ───

export interface WeeklyEffort {
  week: string; // ISO date
  weekLabel: string; // "Mar 10" format
  totalHours: number;
  initiativeCount: number;
}

export interface GroupCount {
  name: string;
  count: number;
  color?: string;
}

export interface EffortByType {
  type: string;
  hours: number;
  count: number;
  color?: string;
}

export interface MemberEffortWeek {
  week: string;
  weekLabel: string;
  hours: number;
  byType: Record<string, number>;
}

// ─── Effort Aggregation ───

export async function fetchEffortByWeek(weeks: number = 16, teamMemberId?: string): Promise<WeeklyEffort[]> {
  let query = supabase
    .from('effort_logs')
    .select('week_start_date, hours_spent, initiative_id')
    .eq('organization_id', DEFAULT_ORG_ID)
    .order('week_start_date', { ascending: true });

  if (teamMemberId) {
    query = query.eq('team_member_id', teamMemberId);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.warn('fetchEffortByWeek error:', error);
    return [];
  }

  // Group by week
  const weekMap = new Map<string, { hours: number; initiatives: Set<string> }>();
  for (const row of data) {
    const week = row.week_start_date;
    if (!weekMap.has(week)) weekMap.set(week, { hours: 0, initiatives: new Set() });
    const entry = weekMap.get(week)!;
    entry.hours += Number(row.hours_spent) || 0;
    entry.initiatives.add(row.initiative_id);
  }

  // Sort and take last N weeks
  const sorted = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-weeks);

  return sorted.map(([week, data]) => ({
    week,
    weekLabel: formatWeekLabel(week),
    totalHours: Math.round(data.hours * 10) / 10,
    initiativeCount: data.initiatives.size,
  }));
}

export async function fetchEffortByWorkType(teamMemberId?: string): Promise<EffortByType[]> {
  // Need to join effort_logs with initiatives for type
  let query = supabase
    .from('effort_logs')
    .select('hours_spent, initiative_id')
    .eq('organization_id', DEFAULT_ORG_ID);

  if (teamMemberId) {
    query = query.eq('team_member_id', teamMemberId);
  }

  const { data: logs, error } = await query;
  if (error || !logs) return [];

  // Fetch initiatives for type mapping
  const initIds = [...new Set(logs.map(l => l.initiative_id))];
  if (initIds.length === 0) return [];

  const { data: inits } = await supabase
    .from('initiatives')
    .select('id, type')
    .in('id', initIds);

  const typeMap = new Map<string, string>();
  for (const init of inits || []) {
    typeMap.set(init.id, init.type);
  }

  // Aggregate hours by type
  const byType = new Map<string, { hours: number; count: Set<string> }>();
  for (const log of logs) {
    const type = typeMap.get(log.initiative_id) || 'Unknown';
    if (!byType.has(type)) byType.set(type, { hours: 0, count: new Set() });
    const entry = byType.get(type)!;
    entry.hours += Number(log.hours_spent) || 0;
    entry.count.add(log.initiative_id);
  }

  return Array.from(byType.entries())
    .map(([type, data]) => ({
      type,
      hours: Math.round(data.hours * 10) / 10,
      count: data.count.size,
    }))
    .sort((a, b) => b.hours - a.hours);
}

export async function fetchEffortByPhase(teamMemberId?: string): Promise<EffortByType[]> {
  let query = supabase
    .from('effort_logs')
    .select('hours_spent, initiative_id')
    .eq('organization_id', DEFAULT_ORG_ID);

  if (teamMemberId) {
    query = query.eq('team_member_id', teamMemberId);
  }

  const { data: logs, error } = await query;
  if (error || !logs) return [];

  const initIds = [...new Set(logs.map(l => l.initiative_id))];
  if (initIds.length === 0) return [];

  const { data: inits } = await supabase
    .from('initiatives')
    .select('id, phase')
    .in('id', initIds);

  const phaseMap = new Map<string, string>();
  for (const init of inits || []) {
    phaseMap.set(init.id, init.phase || 'Unspecified');
  }

  const byPhase = new Map<string, { hours: number; count: Set<string> }>();
  for (const log of logs) {
    const phase = phaseMap.get(log.initiative_id) || 'Unspecified';
    if (!byPhase.has(phase)) byPhase.set(phase, { hours: 0, count: new Set() });
    const entry = byPhase.get(phase)!;
    entry.hours += Number(log.hours_spent) || 0;
    entry.count.add(log.initiative_id);
  }

  return Array.from(byPhase.entries())
    .map(([phase, data]) => ({
      type: phase,
      hours: Math.round(data.hours * 10) / 10,
      count: data.count.size,
    }))
    .sort((a, b) => b.hours - a.hours);
}

export async function fetchMemberWeeklyEffort(teamMemberId: string, weeks: number = 8): Promise<MemberEffortWeek[]> {
  const { data: logs, error } = await supabase
    .from('effort_logs')
    .select('week_start_date, hours_spent, initiative_id')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('team_member_id', teamMemberId)
    .order('week_start_date', { ascending: true });

  if (error || !logs) return [];

  // Get initiative types
  const initIds = [...new Set(logs.map(l => l.initiative_id))];
  const { data: inits } = await supabase
    .from('initiatives')
    .select('id, type')
    .in('id', initIds.length > 0 ? initIds : ['__none__']);

  const typeMap = new Map<string, string>();
  for (const init of inits || []) {
    typeMap.set(init.id, init.type);
  }

  const weekMap = new Map<string, MemberEffortWeek>();
  for (const log of logs) {
    const w = log.week_start_date;
    if (!weekMap.has(w)) weekMap.set(w, { week: w, weekLabel: formatWeekLabel(w), hours: 0, byType: {} });
    const entry = weekMap.get(w)!;
    const hrs = Number(log.hours_spent) || 0;
    entry.hours += hrs;
    const type = typeMap.get(log.initiative_id) || 'Unknown';
    entry.byType[type] = (entry.byType[type] || 0) + hrs;
  }

  return Array.from(weekMap.values())
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-weeks);
}

// ─── Task Aggregation ───

export function countTasksByField(tasks: Task[], field: 'status' | 'module' | 'priority'): GroupCount[] {
  const map = new Map<string, number>();
  for (const t of tasks) {
    const val = (t[field] as string) || 'Unassigned';
    map.set(val, (map.get(val) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function countTasksByAnalyst(tasks: Task[], members: TeamMember[]): GroupCount[] {
  const nameMap = new Map<string, string>();
  for (const m of members) nameMap.set(m.id, m.name);

  const map = new Map<string, number>();
  for (const t of tasks) {
    const name = t.primary_analyst_id ? (nameMap.get(t.primary_analyst_id) || 'Unknown') : 'Unassigned';
    map.set(name, (map.get(name) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function countBuildReviewStatus(tasks: Task[]): GroupCount[] {
  const map = new Map<string, number>();
  for (const t of tasks) {
    const val = t.build_review_status || 'Not Set';
    map.set(val, (map.get(val) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Initiative Aggregation ───

export function countByField(items: Initiative[], field: 'status' | 'type' | 'priority'): GroupCount[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const val = (item[field] as string) || 'Unknown';
    map.set(val, (map.get(val) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Top Effort Initiatives ───

export async function fetchTopEffortInitiatives(limit: number = 10): Promise<{ initiative: Initiative; totalHours: number }[]> {
  const { data: logs } = await supabase
    .from('effort_logs')
    .select('initiative_id, hours_spent')
    .eq('organization_id', DEFAULT_ORG_ID);

  if (!logs) return [];

  const hoursByInit = new Map<string, number>();
  for (const log of logs) {
    hoursByInit.set(log.initiative_id, (hoursByInit.get(log.initiative_id) || 0) + (Number(log.hours_spent) || 0));
  }

  const sorted = Array.from(hoursByInit.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  const ids = sorted.map(([id]) => id);
  if (ids.length === 0) return [];

  const { data: inits } = await supabase
    .from('initiatives')
    .select('*')
    .in('id', ids);

  const initMap = new Map<string, Initiative>();
  for (const init of inits || []) initMap.set(init.id, init);

  return sorted
    .filter(([id]) => initMap.has(id))
    .map(([id, hours]) => ({
      initiative: initMap.get(id)!,
      totalHours: Math.round(hours * 10) / 10,
    }));
}

// ─── Helpers ───

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
