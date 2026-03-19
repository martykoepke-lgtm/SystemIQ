import { useState, useEffect, useMemo } from 'react';
import { Loader2, ChevronDown, ChevronRight, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { fetchInitiatives, fetchTeamMembers, fetchAllTasks } from '../../lib/queries';
import { fetchEffortByWeek, fetchEffortByWorkType } from '../../lib/analyticsEngine';
import { supabase, DEFAULT_ORG_ID } from '../../lib/supabase';
import type { Initiative, TeamMember, Task } from '../../lib/supabase';
import { TYPE_COLORS, STATUS_COLORS, ACTIVE_INITIATIVE_STATUSES, OPEN_TASK_STATUSES } from '../../lib/constants';

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
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetchInitiatives(),
      fetchAllTasks(),
      fetchTeamMembers(),
      fetchEffortByWeek(16),
      fetchEffortByWorkType(),
      loadEffortByInitiative(),
    ]).then(([i, t, m, w, bt, ebi]) => {
      setInitiatives(i);
      setTasks(t);
      setMembers(m);
      setWeeklyEffort(w);
      setByType(bt);
      setEffortByInit(ebi);
      // Auto-expand first 2 types
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

  const memberMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, mem.name);
    return m;
  }, [members]);

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

  const toggleType = (type: string) => setExpandedTypes(prev => {
    const next = new Set(prev);
    if (next.has(type)) next.delete(type); else next.add(type);
    return next;
  });

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
          {byType.length === 0 ? (
            <div className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>No effort data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="type" width={120} tick={{ fontSize: 10, fill: 'var(--text-body)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {byType.map(d => <Cell key={d.type} fill={TYPE_COLORS[d.type] || 'var(--primary-brand-color)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Collapsible Initiative Sections by Type */}
      <div className="space-y-3">
        <div className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Initiatives by Type</div>
        {groupedByType.map(([type, items]) => {
          const expanded = expandedTypes.has(type);
          const typeColor = TYPE_COLORS[type] || '#6b7280';
          const typeHours = items.reduce((s, i) => s + (effortByInit.get(i.id) || 0), 0);
          return (
            <div key={type} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                {expanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColor }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{type}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{items.length} initiatives</span>
                {typeHours > 0 && <span className="text-xs font-mono" style={{ color: typeColor }}>{Math.round(typeHours)}h logged</span>}
              </button>
              {expanded && (
                <div className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                        <th className="px-3 py-1.5 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>ID</th>
                        <th className="px-3 py-1.5 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                        <th className="px-3 py-1.5 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                        <th className="px-3 py-1.5 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>SCI</th>
                        <th className="px-3 py-1.5 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Hours</th>
                        <th className="px-3 py-1.5 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items
                        .sort((a, b) => (effortByInit.get(b.id) || 0) - (effortByInit.get(a.id) || 0))
                        .map(init => {
                          const tc = taskCountMap.get(init.id);
                          const hrs = effortByInit.get(init.id) || 0;
                          return (
                            <tr key={init.id} className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                              <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{init.display_id}</td>
                              <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-heading)' }}>{init.name}</td>
                              <td className="px-3 py-2">
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[init.status] || '#6b7280'}20`, color: STATUS_COLORS[init.status] || '#6b7280' }}>
                                  {init.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                {memberMap.get(init.primary_sci_id || '') || '—'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs" style={{ color: hrs > 0 ? 'var(--text-heading)' : 'var(--text-muted)' }}>
                                {hrs > 0 ? `${Math.round(hrs * 10) / 10}h` : '—'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                                {tc ? `${tc.open}/${tc.total}` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
