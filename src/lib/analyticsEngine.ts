/**
 * Analytics Engine — Core aggregation functions for SystemIQ analytics
 * All computation is local (no AI). Uses simple counting and grouping.
 */

import { supabase, DEFAULT_ORG_ID } from './supabase';
import type { Initiative, Task, TeamMember } from './supabase';

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

// ─── Statistical Analysis (ported from GovernIQ) ───

import {
  linearRegression,
  linearRegressionLine,
  sampleCorrelation,
  mean as ssMean,
  standardDeviation as ssSd,
} from 'simple-statistics';

export type ConfidenceLevel = 'strong' | 'good' | 'some' | 'insufficient';

export interface TrendResult {
  initiativeId: string;
  initiativeName: string;
  displayId: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  slopePercent: number;
  avgHours: number;
  confidence: ConfidenceLevel;
  summary: string;
  methodology: string;
  chartData: { name: string; hours: number; trend: number }[];
}

export interface ForecastResult {
  initiativeId: string;
  initiativeName: string;
  displayId: string;
  direction: string;
  currentAvg: number;
  forecastAvg: number;
  confidence: ConfidenceLevel;
  summary: string;
  methodology: string;
  chartData: { name: string; actual: number | null; forecast: number | null; trend: number }[];
}

/**
 * Analyze effort trend direction for a single initiative using linear regression.
 * Requires 4+ weeks of effort data.
 */
export async function analyzeTrendForInitiative(initiativeId: string): Promise<TrendResult | null> {
  const { data: logs } = await supabase
    .from('effort_logs')
    .select('week_start_date, hours_spent')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('initiative_id', initiativeId)
    .order('week_start_date', { ascending: true });

  if (!logs || logs.length < 4) return null;

  // Aggregate by week
  const weekMap = new Map<string, number>();
  for (const log of logs) {
    weekMap.set(log.week_start_date, (weekMap.get(log.week_start_date) || 0) + (Number(log.hours_spent) || 0));
  }

  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, hours], idx) => ({ week, hours, idx }));

  if (weeks.length < 4) return null;

  // Get initiative info
  const { data: init } = await supabase
    .from('initiatives')
    .select('name, display_id')
    .eq('id', initiativeId)
    .single();

  // Linear regression
  const pairs: [number, number][] = weeks.map(w => [w.idx, w.hours]);
  const avgHours = ssMean(weeks.map(w => w.hours));

  // Check for zero variance (constant data) — still valid, just stable
  const stdDev = weeks.length > 1 ? ssSd(weeks.map(w => w.hours)) : 0;
  const isConstant = stdDev < 0.01;

  let slope = 0;
  let rSquared = 0;
  let regLine = (_x: number) => avgHours;

  if (!isConstant) {
    try {
      const reg = linearRegression(pairs);
      regLine = linearRegressionLine(reg);
      slope = reg.m;
      const actual = weeks.map(w => w.hours);
      const predicted = weeks.map(w => regLine(w.idx));
      try {
        const r = Math.abs(sampleCorrelation(actual, predicted));
        rSquared = r * r;
      } catch { /* insufficient variation for correlation */ }
    } catch { /* regression failed — treat as stable */ }
  }

  const slopePercent = avgHours > 0 ? (slope / avgHours) * 100 : 0;

  // Direction classification (5% threshold)
  const direction: 'increasing' | 'decreasing' | 'stable' =
    slopePercent > 5 ? 'increasing' : slopePercent < -5 ? 'decreasing' : 'stable';

  // Confidence: constant data = 'good' (we know it's stable), otherwise use R²
  const confidence: ConfidenceLevel = isConstant ? 'good' :
    rSquared > 0.7 && weeks.length >= 8 ? 'strong' :
    rSquared > 0.5 && weeks.length >= 6 ? 'good' :
    rSquared > 0.3 ? 'some' : 'insufficient';

  // Chart data
  const chartData = weeks.map(w => ({
    name: formatWeekLabel(w.week),
    hours: Math.round(w.hours * 10) / 10,
    trend: Math.round(regLine(w.idx) * 10) / 10,
  }));

  const dirLabel = direction === 'increasing' ? 'upward' : direction === 'decreasing' ? 'downward' : 'relatively stable with no clear upward or downward trend';
  const confLabel = confidence === 'strong' ? 'strong evidence this is a real trend' :
    confidence === 'good' ? 'good evidence this trend is meaningful' :
    confidence === 'some' ? 'some evidence, but it is not conclusive' :
    'not enough data to determine if this difference is meaningful';

  return {
    initiativeId,
    initiativeName: init?.name || 'Unknown',
    displayId: init?.display_id || '',
    direction,
    slopePercent: Math.round(Math.abs(slopePercent) * 10) / 10,
    avgHours: Math.round(avgHours * 10) / 10,
    confidence,
    summary: `Effort is trending ${dirLabel} by about ${Math.abs(slopePercent).toFixed(1)}% per week. Over the last ${weeks.length} weeks, average weekly effort was ${avgHours.toFixed(1)} hours. There is ${confLabel}.`,
    methodology: `Linear regression was applied to ${weeks.length} weekly data points. The slope (${slope.toFixed(3)} hours/week) was compared to the mean (${avgHours.toFixed(1)} hours) to determine the percentage change rate. R² = ${rSquared.toFixed(3)} was used to assess confidence.`,
    chartData,
  };
}

/**
 * Forecast future effort for an initiative using linear regression projected 4 weeks ahead.
 * Requires 4+ weeks of effort data.
 */
export async function forecastForInitiative(initiativeId: string): Promise<ForecastResult | null> {
  const { data: logs } = await supabase
    .from('effort_logs')
    .select('week_start_date, hours_spent')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('initiative_id', initiativeId)
    .order('week_start_date', { ascending: true });

  if (!logs || logs.length < 4) return null;

  const weekMap = new Map<string, number>();
  for (const log of logs) {
    weekMap.set(log.week_start_date, (weekMap.get(log.week_start_date) || 0) + (Number(log.hours_spent) || 0));
  }

  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, hours], idx) => ({ week, hours, idx }));

  if (weeks.length < 4) return null;

  const { data: init } = await supabase
    .from('initiatives')
    .select('name, display_id')
    .eq('id', initiativeId)
    .single();

  const pairs: [number, number][] = weeks.map(w => [w.idx, w.hours]);
  const avgHours = ssMean(weeks.map(w => w.hours));
  const stdDev = weeks.length > 1 ? ssSd(weeks.map(w => w.hours)) : 0;
  const isConstant = stdDev < 0.01;

  const forecastWeeks = 4;
  const lastIdx = weeks.length - 1;

  let regLine = (_x: number) => avgHours;
  let rSquared = 0;

  if (!isConstant) {
    try {
      const reg = linearRegression(pairs);
      regLine = linearRegressionLine(reg);
      try {
        const actual = weeks.map(w => w.hours);
        const predicted = weeks.map(w => regLine(w.idx));
        const r = Math.abs(sampleCorrelation(actual, predicted));
        rSquared = r * r;
      } catch { /* */ }
    } catch { /* regression failed — treat as stable */ }
  }

  // Historical chart data
  const chartData: ForecastResult['chartData'] = weeks.map(w => ({
    name: formatWeekLabel(w.week),
    actual: Math.round(w.hours * 10) / 10,
    forecast: null,
    trend: Math.round(regLine(w.idx) * 10) / 10,
  }));

  // Forecast data
  for (let i = 1; i <= forecastWeeks; i++) {
    const idx = lastIdx + i;
    const forecastVal = Math.max(0, regLine(idx));
    chartData.push({
      name: `+${i}w`,
      actual: null,
      forecast: Math.round(forecastVal * 10) / 10,
      trend: Math.round(regLine(idx) * 10) / 10,
    });
  }

  // Direction assessment
  const last4 = weeks.slice(-4);
  const currentAvg = ssMean(last4.map(w => w.hours));
  const forecastVals = [];
  for (let i = 1; i <= forecastWeeks; i++) {
    forecastVals.push(Math.max(0, regLine(lastIdx + i)));
  }
  const forecastAvg = ssMean(forecastVals);

  const direction = forecastAvg > currentAvg * 1.05 ? 'increase' :
    forecastAvg < currentAvg * 0.95 ? 'decrease' : 'remain stable';

  const confidence: ConfidenceLevel = isConstant ? 'good' :
    rSquared > 0.6 ? 'good' : rSquared > 0.3 ? 'some' : 'insufficient';

  return {
    initiativeId,
    initiativeName: init?.name || 'Unknown',
    displayId: init?.display_id || '',
    direction,
    currentAvg: Math.round(currentAvg * 10) / 10,
    forecastAvg: Math.round(forecastAvg * 10) / 10,
    confidence,
    summary: `Based on ${weeks.length} weeks of data, effort is projected to ${direction} over the next 4 weeks. Current average: ${currentAvg.toFixed(1)} hrs/week. Forecasted average: ${forecastAvg.toFixed(1)} hrs/week.`,
    methodology: `Linear regression was applied to ${weeks.length} weekly data points and projected 4 weeks forward. R² = ${rSquared.toFixed(3)}. Forecasted values are floored at 0 hours.`,
    chartData,
  };
}

/**
 * Bulk-load effort data and initiative info in 2 queries, then run analysis in-memory.
 */
async function loadBulkEffortData() {
  const [{ data: allLogs }, { data: allInits }] = await Promise.all([
    supabase.from('effort_logs').select('initiative_id, week_start_date, hours_spent').eq('organization_id', DEFAULT_ORG_ID),
    supabase.from('initiatives').select('id, name, display_id').eq('organization_id', DEFAULT_ORG_ID),
  ]);
  if (!allLogs || !allInits) return null;

  const initMap = new Map(allInits.map(i => [i.id, i]));
  const logsByInit = new Map<string, Map<string, number>>();
  for (const log of allLogs) {
    if (!logsByInit.has(log.initiative_id)) logsByInit.set(log.initiative_id, new Map());
    const weekMap = logsByInit.get(log.initiative_id)!;
    weekMap.set(log.week_start_date, (weekMap.get(log.week_start_date) || 0) + (Number(log.hours_spent) || 0));
  }
  return { initMap, logsByInit };
}

/**
 * Run trend analysis across all initiatives with sufficient effort data.
 * Uses bulk loading (2 queries total) for fast performance.
 */
export async function analyzeAllTrends(limit: number = 50): Promise<TrendResult[]> {
  const bulk = await loadBulkEffortData();
  if (!bulk) return [];
  const { initMap, logsByInit } = bulk;

  const results: TrendResult[] = [];
  for (const [initId, weekMap] of logsByInit) {
    const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([week, hours], idx) => ({ week, hours, idx }));
    if (weeks.length < 4) continue;

    const init = initMap.get(initId);
    const avgHours = ssMean(weeks.map(w => w.hours));
    const stdDev = ssSd(weeks.map(w => w.hours));
    const isConstant = stdDev < 0.01;

    let slope = 0, rSquared = 0;
    let regLine = (_x: number) => avgHours;
    if (!isConstant) {
      try {
        const reg = linearRegression(weeks.map(w => [w.idx, w.hours] as [number, number]));
        regLine = linearRegressionLine(reg);
        slope = reg.m;
        try { rSquared = Math.pow(Math.abs(sampleCorrelation(weeks.map(w => w.hours), weeks.map(w => regLine(w.idx)))), 2); } catch {}
      } catch {}
    }

    const slopePercent = avgHours > 0 ? (slope / avgHours) * 100 : 0;
    const direction: 'increasing' | 'decreasing' | 'stable' = slopePercent > 5 ? 'increasing' : slopePercent < -5 ? 'decreasing' : 'stable';
    const confidence: ConfidenceLevel = isConstant ? 'good' : rSquared > 0.7 && weeks.length >= 8 ? 'strong' : rSquared > 0.5 ? 'good' : rSquared > 0.3 ? 'some' : 'insufficient';
    const chartData = weeks.map(w => ({ name: formatWeekLabel(w.week), hours: Math.round(w.hours * 10) / 10, trend: Math.round(regLine(w.idx) * 10) / 10 }));

    results.push({
      initiativeId: initId, initiativeName: init?.name || 'Unknown', displayId: init?.display_id || '',
      direction, slopePercent: Math.round(Math.abs(slopePercent) * 10) / 10, avgHours: Math.round(avgHours * 10) / 10, confidence,
      summary: `Effort is ${direction === 'stable' ? 'stable' : `trending ${direction === 'increasing' ? 'up' : 'down'} ${Math.abs(slopePercent).toFixed(1)}%/wk`}. Avg: ${avgHours.toFixed(1)} hrs/wk over ${weeks.length} weeks.`,
      methodology: `Linear regression on ${weeks.length} weeks. R²=${rSquared.toFixed(3)}.`,
      chartData,
    });
  }
  return results.sort((a, b) => b.avgHours - a.avgHours).slice(0, limit);
}

/**
 * Run forecasts across all initiatives with sufficient effort data.
 * Uses bulk loading (2 queries total) for fast performance.
 */
export async function analyzeAllForecasts(limit: number = 30): Promise<ForecastResult[]> {
  const bulk = await loadBulkEffortData();
  if (!bulk) return [];
  const { initMap, logsByInit } = bulk;

  const results: ForecastResult[] = [];
  for (const [initId, weekMap] of logsByInit) {
    const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([week, hours], idx) => ({ week, hours, idx }));
    if (weeks.length < 4) continue;

    const init = initMap.get(initId);
    const avgHours = ssMean(weeks.map(w => w.hours));
    const stdDev = ssSd(weeks.map(w => w.hours));
    const isConstant = stdDev < 0.01;
    const lastIdx = weeks.length - 1;

    let regLine = (_x: number) => avgHours;
    let rSquared = 0;
    if (!isConstant) {
      try {
        const reg = linearRegression(weeks.map(w => [w.idx, w.hours] as [number, number]));
        regLine = linearRegressionLine(reg);
        try { rSquared = Math.pow(Math.abs(sampleCorrelation(weeks.map(w => w.hours), weeks.map(w => regLine(w.idx)))), 2); } catch {}
      } catch {}
    }

    const chartData: ForecastResult['chartData'] = weeks.map(w => ({ name: formatWeekLabel(w.week), actual: Math.round(w.hours * 10) / 10, forecast: null, trend: Math.round(regLine(w.idx) * 10) / 10 }));
    for (let i = 1; i <= 4; i++) {
      const idx = lastIdx + i;
      chartData.push({ name: `+${i}w`, actual: null, forecast: Math.round(Math.max(0, regLine(idx)) * 10) / 10, trend: Math.round(regLine(idx) * 10) / 10 });
    }

    const currentAvg = ssMean(weeks.slice(-4).map(w => w.hours));
    const forecastAvg = ssMean([1, 2, 3, 4].map(i => Math.max(0, regLine(lastIdx + i))));
    const direction = forecastAvg > currentAvg * 1.05 ? 'increase' : forecastAvg < currentAvg * 0.95 ? 'decrease' : 'remain stable';
    const confidence: ConfidenceLevel = isConstant ? 'good' : rSquared > 0.6 ? 'good' : rSquared > 0.3 ? 'some' : 'insufficient';

    results.push({
      initiativeId: initId, initiativeName: init?.name || 'Unknown', displayId: init?.display_id || '',
      direction, currentAvg: Math.round(currentAvg * 10) / 10, forecastAvg: Math.round(forecastAvg * 10) / 10, confidence,
      summary: `Effort projected to ${direction}. Current: ${currentAvg.toFixed(1)} hrs/wk → Forecast: ${forecastAvg.toFixed(1)} hrs/wk.`,
      methodology: `Linear regression on ${weeks.length} weeks, projected 4 weeks. R²=${rSquared.toFixed(3)}.`,
      chartData,
    });
  }
  return results.sort((a, b) => b.currentAvg - a.currentAvg).slice(0, limit);
}

// ─── Helpers ───

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
