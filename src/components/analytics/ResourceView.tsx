import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchSCIs, fetchInitiativesForMember, fetchAllTasks } from '../../lib/queries';
import { fetchMemberWeeklyEffort } from '../../lib/analyticsEngine';
import { calculateMemberCapacity, type MemberCapacity } from '../../lib/workloadCalculator';
import type { TeamMember, Initiative, Task } from '../../lib/supabase';
import { TYPE_COLORS, OPEN_TASK_STATUSES, getCapacityColor, getCapacityLabel } from '../../lib/constants';

export default function ResourceView() {
  const [scis, setSCIs] = useState<TeamMember[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [capacity, setCapacity] = useState<MemberCapacity | null>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [weeklyEffort, setWeeklyEffort] = useState<{ week: string; weekLabel: string; hours: number; byType: Record<string, number> }[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    fetchSCIs().then(s => {
      setSCIs(s.sort((a, b) => a.name.localeCompare(b.name)));
      if (s.length > 0) setSelectedId(s[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setDataLoading(true);
    Promise.all([
      calculateMemberCapacity(selectedId),
      fetchInitiativesForMember(selectedId),
      fetchMemberWeeklyEffort(selectedId, 8),
      fetchAllTasks(),
    ]).then(([cap, inits, effort, allTasks]) => {
      setCapacity(cap);
      setInitiatives(inits);
      setWeeklyEffort(effort);
      // Filter tasks where this person is SCI on the initiative
      const initIds = new Set(inits.map(i => i.id));
      setTasks(allTasks.filter(t => initIds.has(t.initiative_id)));
    }).finally(() => setDataLoading(false));
  }, [selectedId]);

  // Work type breakdown from initiatives
  const workTypeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of initiatives) {
      map.set(i.type, (map.get(i.type) || 0) + 1);
    }
    const total = initiatives.length || 1;
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count, pct: Math.round(count / total * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [initiatives]);

  // Stacked bar chart data for weekly effort
  const allWorkTypes = useMemo(() => {
    const types = new Set<string>();
    for (const w of weeklyEffort) {
      for (const t of Object.keys(w.byType)) types.add(t);
    }
    return Array.from(types).sort();
  }, [weeklyEffort]);

  const stackedData = useMemo(() => {
    return weeklyEffort.map(w => ({
      weekLabel: w.weekLabel,
      ...w.byType,
      total: w.hours,
    }));
  }, [weeklyEffort]);

  // Task summary
  const openTasks = tasks.filter(t => OPEN_TASK_STATUSES.has(t.status)).length;
  const completedTasks = tasks.filter(t => t.status === 'Closed - Completed').length;
  const totalTasks = tasks.length;

  const tooltipStyle = { contentStyle: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 } };

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  const selectedSCI = scis.find(s => s.id === selectedId);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Person Selector */}
      <div className="flex items-center gap-4">
        <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Team Member</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm min-w-[220px]"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
        >
          {scis.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {selectedSCI && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary-brand-color)15', color: 'var(--primary-brand-color)' }}>
            {initiatives.length} initiatives · {totalTasks} tasks
          </span>
        )}
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>
      ) : (
        <>
          {/* Top Row: Capacity Donut + Work Type Breakdown | Weekly Effort */}
          <div className="grid grid-cols-3 gap-4">
            {/* Capacity Donut */}
            <div className="rounded-lg p-4 flex flex-col items-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>Capacity</div>
              {capacity ? (
                <>
                  <div style={{ width: 140, height: 140 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Planned', value: capacity.plannedHours },
                            { name: 'Available', value: Math.max(0, 40 - capacity.plannedHours) },
                          ]}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={55}
                          innerRadius={35}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <Cell fill={getCapacityColor(capacity.plannedPct)} />
                          <Cell fill="var(--border-default)" />
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-lg font-bold font-mono" style={{ color: getCapacityColor(capacity.plannedPct) }}>
                      {Math.round(capacity.plannedPct)}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{getCapacityLabel(capacity.plannedPct)}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {capacity.plannedHours.toFixed(1)}h planned · {capacity.actualHours.toFixed(1)}h actual
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs py-8" style={{ color: 'var(--text-muted)' }}>No capacity data</div>
              )}
            </div>

            {/* Work Type Breakdown */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Work Type Breakdown</div>
              {workTypeBreakdown.length === 0 ? (
                <div className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>No initiatives</div>
              ) : (
                <div className="space-y-2.5">
                  {workTypeBreakdown.map(({ type, count, pct }) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span style={{ color: 'var(--text-body)' }}>{type}</span>
                        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border-default)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] || 'var(--primary-brand-color)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 8-Week Effort Trend */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>8-Week Effort Trend</div>
              {stackedData.length === 0 ? (
                <div className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>No effort logged yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stackedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {allWorkTypes.map(type => (
                      <Bar key={type} dataKey={type} stackId="effort" fill={TYPE_COLORS[type] || 'var(--primary-brand-color)'} maxBarSize={24} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Initiative Table */}
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Initiatives ({initiatives.length})</span>
              {totalTasks > 0 && (
                <div className="flex gap-3 text-xs">
                  <span style={{ color: 'var(--color-info)' }}>{openTasks} open tasks</span>
                  <span style={{ color: 'var(--color-success)' }}>{completedTasks} completed</span>
                  <span style={{ color: 'var(--text-muted)' }}>{totalTasks} total</span>
                </div>
              )}
            </div>
            {initiatives.length === 0 ? (
              <div className="px-4 py-8 text-xs text-center" style={{ color: 'var(--text-muted)' }}>No initiatives assigned</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {initiatives.map(init => (
                    <tr key={init.id} className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{init.display_id}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-heading)' }}>{init.name}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${TYPE_COLORS[init.type] || '#6b7280'}20`, color: TYPE_COLORS[init.type] || '#6b7280' }}>
                          {init.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-body)' }}>{init.status}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{init.work_effort || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
