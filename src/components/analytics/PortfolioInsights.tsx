import { useState, useEffect, useMemo } from 'react';
import { Loader2, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { fetchInitiatives, fetchTeamMembers, fetchAllTasks } from '../../lib/queries';
import { fetchEffortByWeek, fetchEffortByWorkType, analyzeAllTrends, analyzeAllForecasts, type TrendResult, type ForecastResult, type ConfidenceLevel } from '../../lib/analyticsEngine';
import { supabase, DEFAULT_ORG_ID } from '../../lib/supabase';
import type { Initiative, TeamMember, Task } from '../../lib/supabase';
import { TYPE_COLORS, ACTIVE_INITIATIVE_STATUSES, OPEN_TASK_STATUSES } from '../../lib/constants';

export default function PortfolioInsights() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [weeklyEffort, setWeeklyEffort] = useState<{ weekLabel: string; totalHours: number; initiativeCount: number }[]>([]);
  const [byType, setByType] = useState<{ type: string; hours: number; count: number }[]>([]);
  const [effortByInit, setEffortByInit] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('');
  const [_expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [trendResults, setTrendResults] = useState<TrendResult[]>([]);
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);
  const [showAllTrends, setShowAllTrends] = useState(false);
  const [showAllForecasts, setShowAllForecasts] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchInitiatives(),
      fetchAllTasks(),
      fetchTeamMembers(),
      fetchEffortByWeek(16),
      fetchEffortByWorkType(),
      loadEffortByInitiative(),
      analyzeAllTrends(50),
      analyzeAllForecasts(30),
    ]).then(([i, t, m, w, bt, ebi, trends, forecasts]) => {
      setInitiatives(i);
      setTasks(t);
      setMembers(m);
      setWeeklyEffort(w);
      setByType(bt);
      setEffortByInit(ebi);
      setTrendResults(trends);
      setForecastResults(forecasts);
      const types = [...new Set(i.map(x => x.type))].slice(0, 2);
      setExpandedTypes(new Set(types));
    }).finally(() => setLoading(false));
  }, []);

  async function loadEffortByInitiative(): Promise<Map<string, number>> {
    const { data } = await supabase
      .from('effort_logs')
      .select('initiative_id, hours_spent')
      .eq('organization_id', DEFAULT_ORG_ID);
    const map = new Map<string, number>();
    for (const d of data || []) {
      map.set(d.initiative_id, (map.get(d.initiative_id) || 0) + (Number(d.hours_spent) || 0));
    }
    return map;
  }

  const taskCountMap = useMemo(() => {
    const m = new Map<string, { total: number; open: number }>();
    for (const t of tasks) {
      if (!m.has(t.initiative_id)) m.set(t.initiative_id, { total: 0, open: 0 });
      const entry = m.get(t.initiative_id)!;
      entry.total++;
      if (OPEN_TASK_STATUSES.has(t.status)) entry.open++;
    }
    return m;
  }, [tasks]);

  // Filter
  const filtered = useMemo(() => {
    let items = initiatives;
    if (typeFilter !== 'All') items = items.filter(i => i.type === typeFilter);
    if (memberFilter) items = items.filter(i => i.primary_sci_id === memberFilter);
    return items;
  }, [initiatives, typeFilter, memberFilter]);

  // Filter-aware data: trends, forecasts, and effort by type
  const filteredIds = useMemo(() => new Set(filtered.map(i => i.id)), [filtered]);

  const filteredTrends = useMemo(() => {
    if (!memberFilter && typeFilter === 'All') return trendResults;
    return trendResults.filter(t => filteredIds.has(t.initiativeId));
  }, [trendResults, filteredIds, memberFilter, typeFilter]);

  const filteredForecasts = useMemo(() => {
    if (!memberFilter && typeFilter === 'All') return forecastResults;
    return forecastResults.filter(f => filteredIds.has(f.initiativeId));
  }, [forecastResults, filteredIds, memberFilter, typeFilter]);

  const filteredByType = useMemo(() => {
    if (!memberFilter && typeFilter === 'All') return byType;
    // Recompute hours by type from filtered initiatives
    const map = new Map<string, { hours: number; count: number }>();
    for (const init of filtered) {
      const hours = effortByInit.get(init.id) || 0;
      if (!map.has(init.type)) map.set(init.type, { hours: 0, count: 0 });
      const entry = map.get(init.type)!;
      entry.hours += hours;
      entry.count++;
    }
    return Array.from(map.entries()).map(([type, d]) => ({ type, hours: Math.round(d.hours * 10) / 10, count: d.count })).sort((a, b) => b.hours - a.hours);
  }, [filtered, byType, effortByInit, memberFilter, typeFilter]);

  // Summary stats
  const activeCount = filtered.filter(i => ACTIVE_INITIATIVE_STATUSES.has(i.status)).length;
  const withEffort = filtered.filter(i => effortByInit.has(i.id)).length;
  const totalHours = filtered.reduce((s, i) => s + (effortByInit.get(i.id) || 0), 0);
  const totalTasks = filtered.reduce((s, i) => s + (taskCountMap.get(i.id)?.total || 0), 0);

  // Group by type (for collapsible sections)
  const groupedByType = useMemo(() => {
    const map = new Map<string, Initiative[]>();
    for (const init of filtered) {
      if (!map.has(init.type)) map.set(init.type, []);
      map.get(init.type)!.push(init);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const types = useMemo(() => ['All', ...new Set(initiatives.map(i => i.type))], [initiatives]);
  const scis = members.filter(m => m.role === 'sci' || m.role === 'mi').sort((a, b) => a.name.localeCompare(b.name));

  const tooltipStyle = { contentStyle: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 } };

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Member</label>
          <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            <option value="">All Members</option>
            {scis.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={() => setExpandedTypes(new Set(groupedByType.map(([t]) => t)))} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--primary-brand-color)' }}>
          Expand All
        </button>
        <button onClick={() => setExpandedTypes(new Set())} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }}>
          Collapse All
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Initiatives" value={activeCount} color="var(--color-info)" />
        <StatCard label="With Effort Data" value={withEffort} color="var(--color-success)" />
        <StatCard label="Total Hours Logged" value={`${Math.round(totalHours)}h`} color="var(--primary-brand-color)" />
        <StatCard label="Total Tasks" value={totalTasks} color="var(--color-warning)" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Portfolio Effort Trend */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <TrendingUp size={16} />
            Portfolio Effort Trend
          </div>
          {weeklyEffort.length === 0 ? (
            <div className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>No effort data — log effort in Staff View</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyEffort}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="totalHours" stroke="var(--primary-brand-color)" strokeWidth={2} dot={false} name="Hours" />
                <Line type="monotone" dataKey="initiativeCount" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Initiatives" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hours by Work Type */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <BarChart3 size={16} />
            Hours by Work Type
          </div>
          {filteredByType.length === 0 ? (
            <div className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>No effort data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={filteredByType} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="type" width={120} tick={{ fontSize: 10, fill: 'var(--text-body)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {filteredByType.map(d => <Cell key={d.type} fill={TYPE_COLORS[d.type] || 'var(--primary-brand-color)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Initiative Effort Trends (3-column mini-chart grid) ─── */}
      {filteredTrends.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} style={{ color: 'var(--text-heading)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Initiative Effort Trends</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({filteredTrends.length} with sufficient data)</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(showAllTrends ? filteredTrends : filteredTrends.slice(0, 6)).map(trend => (
              <div key={trend.initiativeId} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-heading)' }}>
                    {trend.initiativeName}
                  </span>
                  <ConfBadge level={trend.confidence} />
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={trend.chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 11 }} />
                    <Line type="monotone" dataKey="hours" stroke={trend.direction === 'increasing' ? '#ef4444' : trend.direction === 'decreasing' ? '#22c55e' : '#6b7280'} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="trend" stroke={trend.direction === 'increasing' ? '#ef4444' : trend.direction === 'decreasing' ? '#22c55e' : '#6b7280'} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{trend.summary}</p>
              </div>
            ))}
          </div>
          {filteredTrends.length > 6 && (
            <button onClick={() => setShowAllTrends(!showAllTrends)} className="text-xs font-medium" style={{ color: 'var(--primary-brand-color)' }}>
              {showAllTrends ? 'Show Less' : `Show All ${filteredTrends.length} Trends`}
            </button>
          )}
        </div>
      )}

      {/* ─── Effort Forecasts (2-column chart grid) ─── */}
      {filteredForecasts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={18} style={{ color: 'var(--text-heading)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Effort Forecasts</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(showAllForecasts ? filteredForecasts : filteredForecasts.slice(0, 4)).map(fc => (
              <div key={fc.initiativeId} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-heading)' }}>
                    {fc.initiativeName}
                  </span>
                  <ConfBadge level={fc.confidence} />
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={fc.chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 11 }} />
                    <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} name="Actual" />
                    <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} connectNulls={false} name="Forecast" />
                    <Line type="monotone" dataKey="trend" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Trend" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{fc.summary}</p>
              </div>
            ))}
          </div>
          {filteredForecasts.length > 4 && (
            <button onClick={() => setShowAllForecasts(!showAllForecasts)} className="text-xs font-medium" style={{ color: 'var(--primary-brand-color)' }}>
              {showAllForecasts ? 'Show Less' : `Show All ${filteredForecasts.length} Forecasts`}
            </button>
          )}
        </div>
      )}

      {/* Data quality note */}
      <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
        Trends require 4+ weeks of logged effort data. Forecasts use linear regression projected 4 weeks ahead. Confidence levels reflect statistical significance (R² correlation).
      </div>
    </div>
  );
}

function ConfBadge({ level }: { level: ConfidenceLevel }) {
  const colors: Record<string, { bg: string; text: string }> = {
    strong: { bg: '#22c55e20', text: '#22c55e' },
    good: { bg: '#3b82f620', text: '#3b82f6' },
    some: { bg: '#f59e0b20', text: '#f59e0b' },
    insufficient: { bg: '#6b728020', text: '#6b7280' },
  };
  const c = colors[level] || colors.insufficient;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0" style={{ backgroundColor: c.bg, color: c.text }}>
      {level}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderLeft: `4px solid ${color}` }}>
      <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs font-medium uppercase mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
