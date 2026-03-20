import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { fetchAllTasks, fetchTeamMembers, fetchInitiatives } from '../../lib/queries';
import { countTasksByField, countTasksByAnalyst, countBuildReviewStatus } from '../../lib/analyticsEngine';
import type { Task, TeamMember, Initiative } from '../../lib/supabase';
import { TASK_STATUS_COLORS, OPEN_TASK_STATUSES } from '../../lib/constants';

const BUILD_REVIEW_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  approved: '#22c55e',
  not_met: '#ef4444',
  'Not Set': '#6b7280',
};

export default function TaskAnalytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('All');
  const [analystFilter, setAnalystFilter] = useState('All');
  const [initFilter, setInitFilter] = useState('All');

  useEffect(() => {
    Promise.all([fetchAllTasks(), fetchTeamMembers(), fetchInitiatives()])
      .then(([t, m, i]) => { setTasks(t); setMembers(m); setInitiatives(i); })
      .finally(() => setLoading(false));
  }, []);

  const analysts = useMemo(() => members.filter(m => m.role === 'analyst'), [members]);
  const modules = useMemo(() => ['All', ...new Set(tasks.map(t => t.module).filter(Boolean) as string[])].sort(), [tasks]);
  const filtered = useMemo(() => {
    let items = tasks;
    if (moduleFilter !== 'All') items = items.filter(t => t.module === moduleFilter);
    if (analystFilter !== 'All') items = items.filter(t => t.primary_analyst_id === analystFilter);
    if (initFilter !== 'All') items = items.filter(t => t.initiative_id === initFilter);
    return items;
  }, [tasks, moduleFilter, analystFilter, initFilter]);

  // KPIs
  const openCount = filtered.filter(t => OPEN_TASK_STATUSES.has(t.status)).length;
  const completedCount = filtered.filter(t => t.status === 'Closed - Completed').length;
  const unassignedCount = filtered.filter(t => !t.primary_analyst_id).length;
  const buildPending = filtered.filter(t => t.build_review_status === 'pending' || t.build_review_status === 'in_progress').length;

  // Charts
  const byStatus = countTasksByField(filtered, 'status');
  const byModule = countTasksByField(filtered, 'module');
  const byAnalyst = countTasksByAnalyst(filtered, members);
  const buildReview = countBuildReviewStatus(filtered);

  const tooltipStyle = { contentStyle: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 } };

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <FilterSelect label="Initiative" value={initFilter} onChange={setInitFilter} options={[{ value: 'All', label: 'All Initiatives' }, ...initiatives.map(i => ({ value: i.id, label: `${i.display_id} ${i.name}` }))]} />
        <FilterSelect label="Module" value={moduleFilter} onChange={setModuleFilter} options={modules.map(m => ({ value: m, label: m }))} />
        <FilterSelect label="Analyst" value={analystFilter} onChange={setAnalystFilter} options={[{ value: 'All', label: 'All Analysts' }, ...analysts.map(a => ({ value: a.id, label: a.name }))]} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Open Tasks" value={openCount} color="var(--color-info)" />
        <KPICard label="Completed" value={completedCount} color="var(--color-success)" />
        <KPICard label="Unassigned" value={unassignedCount} color="var(--color-warning)" />
        <KPICard label="Build Reviews" value={buildPending} sub="pending/in progress" color="#f59e0b" />
      </div>

      {/* 2x2 Chart Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tasks by Status */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Tasks by Status</div>
          <ResponsiveContainer width="100%" height={Math.max(160, byStatus.length * 28)}>
            <BarChart data={byStatus} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10, fill: 'var(--text-body)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {byStatus.map(d => <Cell key={d.name} fill={TASK_STATUS_COLORS[d.name] || '#6b7280'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Module */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Tasks by Module</div>
          <ResponsiveContainer width="100%" height={Math.max(160, byModule.length * 28)}>
            <BarChart data={byModule} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'var(--text-body)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="var(--primary-brand-color)" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Analyst */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Tasks by Analyst</div>
          <ResponsiveContainer width="100%" height={Math.max(160, byAnalyst.length * 28)}>
            <BarChart data={byAnalyst} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text-body)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Build Review Status */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Build Review Status</div>
          <div className="flex items-center">
            <div style={{ width: 160, height: 160 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={buildReview} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {buildReview.map(d => <Cell key={d.name} fill={BUILD_REVIEW_COLORS[d.name] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 ml-4">
              {buildReview.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BUILD_REVIEW_COLORS[d.name] || '#6b7280' }} />
                  <span style={{ color: 'var(--text-body)' }}>{d.name}</span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
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

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="px-2 py-1 rounded-lg border text-sm max-w-[200px]" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
