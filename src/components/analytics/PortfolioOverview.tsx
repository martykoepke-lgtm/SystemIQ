import { useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchInitiatives, fetchAllTasks, fetchTeamMembers } from '../../lib/queries';
import { countByField } from '../../lib/analyticsEngine';
import type { Initiative, Task, TeamMember } from '../../lib/supabase';
import { TYPE_COLORS, STATUS_COLORS, PRIORITY_COLORS, ACTIVE_INITIATIVE_STATUSES, OPEN_TASK_STATUSES } from '../../lib/constants';

type SortKey = 'display_id' | 'name' | 'type' | 'status' | 'priority' | 'sci' | 'tasks';
type SortDir = 'asc' | 'desc';

export default function PortfolioOverview() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sciFilter, setSciFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('display_id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    Promise.all([fetchInitiatives(), fetchAllTasks(), fetchTeamMembers()])
      .then(([i, t, m]) => { setInitiatives(i); setTasks(t); setMembers(m); })
      .finally(() => setLoading(false));
  }, []);

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

  const filtered = useMemo(() => {
    let items = initiatives;
    if (typeFilter !== 'All') items = items.filter(i => i.type === typeFilter);
    if (statusFilter !== 'All') items = items.filter(i => i.status === statusFilter);
    if (sciFilter) items = items.filter(i => i.primary_sci_id === sciFilter);
    return items;
  }, [initiatives, typeFilter, statusFilter, sciFilter]);

  const statuses = useMemo(() => ['All', ...new Set(initiatives.map(i => i.status))], [initiatives]);
  const scis = useMemo(() => members.filter(m => m.role === 'sci' || m.role === 'mi').sort((a, b) => a.name.localeCompare(b.name)), [members]);

  // KPI calculations
  const activeCount = initiatives.filter(i => ACTIVE_INITIATIVE_STATUSES.has(i.status)).length;
  const completedCount = initiatives.filter(i => i.status === 'Completed').length;
  const egCount = initiatives.filter(i => i.display_id.startsWith('EG-')).length;
  const sysCount = initiatives.filter(i => i.display_id.startsWith('SYS-')).length;
  const openTaskCount = tasks.filter(t => OPEN_TASK_STATUSES.has(t.status)).length;

  // Chart data
  const statusDist = countByField(filtered, 'status');
  const typeDist = countByField(filtered, 'type');
  const priorityDist = countByField(filtered, 'priority');

  // Sorting
  const sorted = useMemo(() => {
    const items = [...filtered];
    items.sort((a, b) => {
      let va: string | number = '', vb: string | number = '';
      switch (sortKey) {
        case 'display_id': va = a.display_id; vb = b.display_id; break;
        case 'name': va = a.name; vb = b.name; break;
        case 'type': va = a.type; vb = b.type; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'priority': {
          const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
          va = order[a.priority as keyof typeof order] ?? 9;
          vb = order[b.priority as keyof typeof order] ?? 9;
          break;
        }
        case 'sci': va = memberMap.get(a.primary_sci_id || '') || ''; vb = memberMap.get(b.primary_sci_id || '') || ''; break;
        case 'tasks': va = taskCountMap.get(a.id)?.open || 0; vb = taskCountMap.get(b.id)?.open || 0; break;
      }
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return items;
  }, [filtered, sortKey, sortDir, memberMap, taskCountMap]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const types = useMemo(() => ['All', ...new Set(initiatives.map(i => i.type))], [initiatives]);

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>SCI</label>
          <select value={sciFilter} onChange={e => setSciFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            <option value="">All SCIs</option>
            {scis.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {(typeFilter !== 'All' || statusFilter !== 'All' || sciFilter) && (
          <button onClick={() => { setTypeFilter('All'); setStatusFilter('All'); setSciFilter(''); }}
            className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-danger)' }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard label="Active" value={activeCount} color="var(--color-info)" />
        <KPICard label="Total" value={initiatives.length} sub={`${egCount} EG · ${sysCount} SYS`} color="var(--primary-brand-color)" />
        <KPICard label="Completed" value={completedCount} sub={`${initiatives.length > 0 ? Math.round(completedCount / initiatives.length * 100) : 0}%`} color="var(--color-success)" />
        <KPICard label="Open Tasks" value={openTaskCount} sub={`of ${tasks.length} total`} color="var(--color-warning)" />
        <KPICard label="EG Approved" value={initiatives.filter(i => i.eg_approved).length} color="var(--color-epic-gold)" />
      </div>

      {/* 3 Pie Charts */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Status Distribution" data={statusDist} colorMap={STATUS_COLORS} />
        <ChartCard title="Type Distribution" data={typeDist} colorMap={TYPE_COLORS} />
        <ChartCard title="Priority Distribution" data={priorityDist} colorMap={PRIORITY_COLORS} />
      </div>

      {/* Initiative Table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        <div className="px-4 py-3 font-semibold text-sm" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-heading)' }}>
          Initiatives ({sorted.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: 'var(--text-body)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                {([
                  ['display_id', 'ID', 'w-24'],
                  ['name', 'Name', 'flex-1'],
                  ['type', 'Type', 'w-36'],
                  ['status', 'Status', 'w-36'],
                  ['priority', 'Priority', 'w-24'],
                  ['sci', 'Primary SCI', 'w-40'],
                  ['tasks', 'Tasks', 'w-24'],
                ] as [SortKey, string, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-3 py-2 text-left text-xs font-medium uppercase cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleSort(key)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {sortKey === key ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.3 }} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(init => {
                const tc = taskCountMap.get(init.id);
                return (
                  <tr key={init.id} className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{init.display_id}</td>
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-heading)' }}>{init.name}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${TYPE_COLORS[init.type] || '#6b7280'}20`, color: TYPE_COLORS[init.type] || '#6b7280' }}>
                        {init.type}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[init.status] || '#6b7280'}20`, color: STATUS_COLORS[init.status] || '#6b7280' }}>
                        {init.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium" style={{ color: PRIORITY_COLORS[init.priority] || '#6b7280' }}>
                        {init.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {memberMap.get(init.primary_sci_id || '') || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {tc ? `${tc.open}/${tc.total}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderLeft: `4px solid ${color}` }}>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs font-medium uppercase mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, data, colorMap }: { title: string; data: { name: string; count: number }[]; colorMap: Record<string, string> }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>{title}</div>
      {data.length === 0 ? (
        <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No data</div>
      ) : (
        <div className="flex">
          <div style={{ width: 140, height: 140 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={colorMap[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1 ml-2 overflow-y-auto" style={{ maxHeight: 140 }}>
            {data.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorMap[d.name] || '#6b7280' }} />
                <span className="flex-1 truncate" style={{ color: 'var(--text-body)' }}>{d.name}</span>
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
