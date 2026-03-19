import { useState, useEffect, useMemo } from 'react';
import { Loader2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase, DEFAULT_ORG_ID } from '../../lib/supabase';
import { fetchInitiatives, fetchTeamMembers } from '../../lib/queries';
import type { Initiative, TeamMember } from '../../lib/supabase';
import { TYPE_COLORS } from '../../lib/constants';

const DEFAULT_HOURLY_RATE = 75; // Default rate until hourly_rate is added to team_members

interface CostEntry {
  initiativeId: string;
  memberId: string;
  hours: number;
  cost: number;
  week: string;
}

type DateRange = 'ytd' | '30d' | '90d' | '12w' | 'all';

function getDateRangeStart(range: DateRange): string {
  const now = new Date();
  switch (range) {
    case 'ytd': return `${now.getFullYear()}-01-01`;
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; }
    case '90d': { const d = new Date(now); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0]; }
    case '12w': { const d = new Date(now); d.setDate(d.getDate() - 84); return d.toISOString().split('T')[0]; }
    case 'all': return '2020-01-01';
  }
}

export default function CostAnalytics() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('ytd');
  const [staffFilter, setStaffFilter] = useState('');
  const [expandedInits, setExpandedInits] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([fetchInitiatives(), fetchTeamMembers()]).then(([i, m]) => {
      setInitiatives(i);
      setMembers(m);
    });
  }, []);

  useEffect(() => {
    loadCosts();
  }, [dateRange, staffFilter]);

  async function loadCosts() {
    setLoading(true);
    let query = supabase
      .from('effort_logs')
      .select('initiative_id, team_member_id, hours_spent, week_start_date')
      .eq('organization_id', DEFAULT_ORG_ID)
      .gte('week_start_date', getDateRangeStart(dateRange));

    if (staffFilter) query = query.eq('team_member_id', staffFilter);

    const { data } = await query;
    const entries: CostEntry[] = (data || []).map(d => ({
      initiativeId: d.initiative_id,
      memberId: d.team_member_id,
      hours: Number(d.hours_spent) || 0,
      cost: (Number(d.hours_spent) || 0) * DEFAULT_HOURLY_RATE,
      week: d.week_start_date,
    }));
    setCostEntries(entries);
    setLoading(false);
  }

  const memberMap = useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const mem of members) m.set(mem.id, mem);
    return m;
  }, [members]);

  const initMap = useMemo(() => {
    const m = new Map<string, Initiative>();
    for (const i of initiatives) m.set(i.id, i);
    return m;
  }, [initiatives]);

  // Aggregations
  const totalHours = costEntries.reduce((s, e) => s + e.hours, 0);
  const totalCost = costEntries.reduce((s, e) => s + e.cost, 0);
  const uniqueInits = new Set(costEntries.map(e => e.initiativeId)).size;
  const avgCostPerInit = uniqueInits > 0 ? totalCost / uniqueInits : 0;

  // By work type
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of costEntries) {
      const init = initMap.get(e.initiativeId);
      const type = init?.type || 'Unknown';
      map.set(type, (map.get(type) || 0) + e.cost);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [costEntries, initMap]);

  // By phase
  const byPhase = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of costEntries) {
      const init = initMap.get(e.initiativeId);
      const phase = init?.phase || 'Unspecified';
      map.set(phase, (map.get(phase) || 0) + e.cost);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [costEntries, initMap]);

  // Weekly trend
  const weeklyTrend = useMemo(() => {
    const map = new Map<string, { cost: number; hours: number }>();
    for (const e of costEntries) {
      if (!map.has(e.week)) map.set(e.week, { cost: 0, hours: 0 });
      const entry = map.get(e.week)!;
      entry.cost += e.cost;
      entry.hours += e.hours;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week: new Date(week + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost: Math.round(data.cost),
        hours: Math.round(data.hours * 10) / 10,
      }));
  }, [costEntries]);

  // Per-initiative breakdown
  const initBreakdown = useMemo(() => {
    const map = new Map<string, { hours: number; cost: number; contributors: Map<string, { hours: number; cost: number }> }>();
    for (const e of costEntries) {
      if (!map.has(e.initiativeId)) map.set(e.initiativeId, { hours: 0, cost: 0, contributors: new Map() });
      const entry = map.get(e.initiativeId)!;
      entry.hours += e.hours;
      entry.cost += e.cost;
      if (!entry.contributors.has(e.memberId)) entry.contributors.set(e.memberId, { hours: 0, cost: 0 });
      const contrib = entry.contributors.get(e.memberId)!;
      contrib.hours += e.hours;
      contrib.cost += e.cost;
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, init: initMap.get(id), ...data }))
      .sort((a, b) => b.cost - a.cost);
  }, [costEntries, initMap]);

  const toggleInit = (id: string) => setExpandedInits(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const tooltipStyle = { contentStyle: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 } };
  const scis = members.filter(m => m.role === 'sci' || m.role === 'mi').sort((a, b) => a.name.localeCompare(b.name));

  if (loading && costEntries.length === 0) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Range</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)} className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            <option value="ytd">Year to Date</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="12w">Last 12 Weeks</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Staff</label>
          <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            <option value="">All Members</option>
            {scis.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Info size={12} />
          Using ${DEFAULT_HOURLY_RATE}/hr default rate
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Total Labor Investment" value={`$${Math.round(totalCost).toLocaleString()}`} color="var(--primary-brand-color)" />
        <SummaryCard label="Total Hours" value={`${Math.round(totalHours * 10) / 10}h`} color="var(--color-info)" />
        <SummaryCard label="Avg Cost / Initiative" value={`$${Math.round(avgCostPerInit).toLocaleString()}`} color="var(--color-warning)" />
        <SummaryCard label="Initiatives Tracked" value={String(uniqueInits)} color="var(--color-success)" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Cost by Type */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Cost by Work Type</div>
          {byType.length === 0 ? <EmptyMsg /> : (
            <div className="flex">
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={25}>
                      {byType.map(d => <Cell key={d.name} fill={TYPE_COLORS[d.name] || '#6b7280'} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number) => `$${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 ml-2 space-y-1 overflow-y-auto" style={{ maxHeight: 120 }}>
                {byType.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[d.name] || '#6b7280' }} />
                    <span className="flex-1 truncate" style={{ color: 'var(--text-body)' }}>{d.name}</span>
                    <span className="font-mono" style={{ color: 'var(--text-muted)' }}>${d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cost by Phase */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Cost by Phase</div>
          {byPhase.length === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={Math.max(100, byPhase.length * 26)}>
              <BarChart data={byPhase} layout="vertical" margin={{ left: 5, right: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: 'var(--text-body)' }} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="var(--primary-brand-color)" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly Trend */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Weekly Cost Trend</div>
          {weeklyTrend.length === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="cost" fill="var(--primary-brand-color)" fillOpacity={0.15} stroke="var(--primary-brand-color)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Initiative Breakdown Table */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Initiative Cost Breakdown</div>
        {initBreakdown.length === 0 ? (
          <div className="px-4 py-8 text-xs text-center" style={{ color: 'var(--text-muted)' }}>No cost data for selected filters</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase w-8" style={{ color: 'var(--text-muted)' }}></th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Initiative</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Type</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Hours</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {initBreakdown.map(({ id, init, hours, cost, contributors }) => {
                const expanded = expandedInits.has(id);
                return (
                  <React.Fragment key={id}>
                    <tr
                      className="border-t cursor-pointer"
                      style={{ borderColor: 'var(--border-default)' }}
                      onClick={() => toggleInit(id)}
                    >
                      <td className="px-3 py-2">
                        {expanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs mr-2" style={{ color: 'var(--text-muted)' }}>{init?.display_id}</span>
                        <span style={{ color: 'var(--text-heading)' }}>{init?.name || 'Unknown'}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${TYPE_COLORS[init?.type || ''] || '#6b7280'}20`, color: TYPE_COLORS[init?.type || ''] || '#6b7280' }}>
                          {init?.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--text-body)' }}>{Math.round(hours * 10) / 10}h</td>
                      <td className="px-3 py-2 text-right font-mono font-medium" style={{ color: 'var(--text-heading)' }}>${Math.round(cost).toLocaleString()}</td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={5} className="px-8 py-3" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Contributors</div>
                          <div className="space-y-1">
                            {Array.from(contributors.entries()).map(([memId, data]) => {
                              const mem = memberMap.get(memId);
                              return (
                                <div key={memId} className="flex items-center gap-4 text-xs">
                                  <span className="w-40" style={{ color: 'var(--text-body)' }}>{mem?.name || 'Unknown'}</span>
                                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{Math.round(data.hours * 10) / 10}h</span>
                                  <span className="font-mono font-medium" style={{ color: 'var(--text-heading)' }}>${Math.round(data.cost).toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React from 'react';

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderLeft: `4px solid ${color}` }}>
      <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs font-medium uppercase mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function EmptyMsg() {
  return <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No data for selected filters</div>;
}
