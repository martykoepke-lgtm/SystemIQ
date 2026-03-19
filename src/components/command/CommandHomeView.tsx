import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchInitiativesWithCounts, fetchAllTasks, fetchTeamMembers, fetchAllActionItems } from '../../lib/queries';
import type { Initiative, Task, TeamMember, ActionItem } from '../../lib/supabase';
import {
  OPEN_TASK_STATUSES,
  STATUS_COLORS,
  PRIORITY_COLORS,
  TASK_STATUS_COLORS,
  EG_SUBTYPES,
  EG_SUBTYPE_COLORS,
} from '../../lib/constants';

type InitiativeWithCounts = Initiative & { task_count: number; open_task_count: number };

interface CommandHomeViewProps {
  onOpenInitiative: (id: string) => void;
  onCreateInitiative: () => void;
}

export default function CommandHomeView({ onOpenInitiative }: CommandHomeViewProps) {
  const [initiatives, setInitiatives] = useState<InitiativeWithCounts[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analysts, setAnalysts] = useState<TeamMember[]>([]);
  const [scis, setScis] = useState<TeamMember[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Filters ───
  const [fWave, setFWave] = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fSCI, setFSCI] = useState('');
  const [fSubtype, setFSubtype] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fVenue, setFVenue] = useState('');
  const [fRole, setFRole] = useState('');
  const [fSpecialty, setFSpecialty] = useState('');
  const [fModule, setFModule] = useState('');
  const [fAnalyst, setFAnalyst] = useState('');

  // Bottom table tab
  const [bottomTab, setBottomTab] = useState<'initiatives' | 'tasks'>('initiatives');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [initData, taskData, analystData, sciData, aiData] = await Promise.all([
      fetchInitiativesWithCounts(),
      fetchAllTasks(),
      fetchTeamMembers('analyst'),
      fetchTeamMembers('sci'),
      fetchAllActionItems(),
    ]);
    setInitiatives(initData);
    setTasks(taskData);
    setAnalysts(analystData);
    setScis(sciData);
    setActionItems(aiData);
    setLoading(false);
  }

  // ─── Name maps ───
  const analystMap = useMemo(() => { const m: Record<string, string> = {}; analysts.forEach(a => { m[a.id] = a.name; }); return m; }, [analysts]);
  const sciMap = useMemo(() => { const m: Record<string, string> = {}; scis.forEach(s => { m[s.id] = s.name; }); return m; }, [scis]);

  // ─── EG-scoped base data ───
  const egInits = useMemo(() => initiatives.filter(i => i.eg_approved), [initiatives]);
  const egInitIds = useMemo(() => new Set(egInits.map(i => i.id)), [egInits]);
  const egTasks = useMemo(() => tasks.filter(t => egInitIds.has(t.initiative_id)), [tasks, egInitIds]);
  const egAI = useMemo(() => actionItems.filter(ai => (ai.initiative_id && egInitIds.has(ai.initiative_id)) || (ai.task_id && egTasks.some(t => t.id === ai.task_id))), [actionItems, egInitIds, egTasks]);

  // ─── Filter options (derived from EG data) ───
  const waveOptions = useMemo(() => [...new Set(egInits.map(i => i.go_live_wave).filter(Boolean))].sort() as string[], [egInits]);
  const priorityOptions = useMemo(() => [...new Set(egInits.map(i => i.priority).filter(Boolean))].sort() as string[], [egInits]);
  const sciOptions = useMemo(() => {
    const ids = new Set<string>();
    egInits.forEach(i => { if (i.primary_sci_id) ids.add(i.primary_sci_id); });
    return [...ids].map(id => ({ id, name: sciMap[id] || 'Unknown' })).sort((a, b) => a.name.localeCompare(b.name));
  }, [egInits, sciMap]);
  const subtypeOptions = useMemo(() => [...new Set(egInits.map(i => i.eg_subtype).filter(Boolean))].sort() as string[], [egInits]);
  const statusOptions = useMemo(() => [...new Set(egInits.map(i => i.status).filter(Boolean))].sort() as string[], [egInits]);
  const venueOptions = useMemo(() => {
    const s = new Set<string>();
    egInits.forEach(i => (i.venues as string[] || []).forEach(v => s.add(v)));
    return [...s].sort();
  }, [egInits]);
  const roleOptions = useMemo(() => {
    const s = new Set<string>();
    egInits.forEach(i => (i.roles_impacted as string[] || []).forEach(r => s.add(r)));
    return [...s].sort();
  }, [egInits]);
  const specialtyOptions = useMemo(() => {
    const s = new Set<string>();
    egInits.forEach(i => (i.specialty_service_line as string[] || []).forEach(sp => s.add(sp)));
    return [...s].sort();
  }, [egInits]);
  const moduleOptions = useMemo(() => [...new Set(egTasks.map(t => t.module).filter(Boolean))].sort() as string[], [egTasks]);
  const analystOptions = useMemo(() => {
    const ids = new Set<string>();
    egTasks.forEach(t => { if (t.primary_analyst_id) ids.add(t.primary_analyst_id); });
    return [...ids].map(id => ({ id, name: analystMap[id] || 'Unknown' })).sort((a, b) => a.name.localeCompare(b.name));
  }, [egTasks, analystMap]);

  // ─── Apply filters ───
  const filteredInits = useMemo(() => {
    let items = egInits;
    if (fWave) items = items.filter(i => i.go_live_wave === fWave);
    if (fPriority) items = items.filter(i => i.priority === fPriority);
    if (fSCI) items = items.filter(i => i.primary_sci_id === fSCI);
    if (fSubtype) items = items.filter(i => i.eg_subtype === fSubtype);
    if (fStatus) items = items.filter(i => i.status === fStatus);
    if (fVenue) items = items.filter(i => (i.venues as string[] || []).includes(fVenue));
    if (fRole) items = items.filter(i => (i.roles_impacted as string[] || []).includes(fRole));
    if (fSpecialty) items = items.filter(i => (i.specialty_service_line as string[] || []).includes(fSpecialty));
    return items;
  }, [egInits, fWave, fPriority, fSCI, fSubtype, fStatus, fVenue, fRole, fSpecialty]);

  const filteredInitIds = useMemo(() => new Set(filteredInits.map(i => i.id)), [filteredInits]);

  const filteredTasks = useMemo(() => {
    let items = egTasks.filter(t => filteredInitIds.has(t.initiative_id));
    if (fModule) items = items.filter(t => t.module === fModule);
    if (fAnalyst) items = items.filter(t => t.primary_analyst_id === fAnalyst);
    return items;
  }, [egTasks, filteredInitIds, fModule, fAnalyst]);

  // ─── KPIs (from filtered data) ───
  const openTasks = filteredTasks.filter(t => OPEN_TASK_STATUSES.has(t.status));
  const completedTasks = filteredTasks.filter(t => t.status === 'Closed - Completed');
  const taskPct = filteredTasks.length > 0 ? Math.round((completedTasks.length / filteredTasks.length) * 100) : 0;
  const highCritTasks = openTasks.filter(t => t.priority === 'Critical' || t.priority === 'High').length;
  const unassignedTasks = openTasks.filter(t => !t.primary_analyst_id).length;
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = egAI.filter(ai => ai.due_date && ai.due_date < today && ai.status !== 'Complete').length;
  const openAICount = egAI.filter(ai => ai.status !== 'Complete').length;

  // ─── Distribution data ───
  const byAnalyst = useMemo(() => {
    const c: Record<string, number> = {};
    openTasks.forEach(t => { const n = t.primary_analyst_id ? (analystMap[t.primary_analyst_id] || 'Unknown') : 'Unassigned'; c[n] = (c[n] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [openTasks, analystMap]);

  const byModule = useMemo(() => {
    const c: Record<string, number> = {};
    openTasks.forEach(t => { c[t.module || 'Unknown'] = (c[t.module || 'Unknown'] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [openTasks]);

  const bySCI = useMemo(() => {
    const c: Record<string, number> = {};
    filteredInits.forEach(i => { const n = i.primary_sci_id ? (sciMap[i.primary_sci_id] || 'Unknown') : 'Unassigned'; c[n] = (c[n] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [filteredInits, sciMap]);

  const byWave = useMemo(() => {
    const c: Record<string, number> = {};
    filteredInits.forEach(i => { c[i.go_live_wave || 'Unassigned'] = (c[i.go_live_wave || 'Unassigned'] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [filteredInits]);

  const byVenue = useMemo(() => {
    const c: Record<string, number> = {};
    filteredInits.forEach(i => (i.venues as string[] || []).forEach(v => { c[v] = (c[v] || 0) + 1; }));
    if (filteredInits.some(i => !(i.venues as string[])?.length)) c['Unassigned'] = (c['Unassigned'] || 0) + filteredInits.filter(i => !(i.venues as string[])?.length).length;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [filteredInits]);

  const bySpecialty = useMemo(() => {
    const c: Record<string, number> = {};
    filteredInits.forEach(i => {
      const specs = i.specialty_service_line as string[] || [];
      if (specs.length === 0) c['Unassigned'] = (c['Unassigned'] || 0) + 1;
      else specs.forEach(s => { c[s] = (c[s] || 0) + 1; });
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [filteredInits]);

  // ─── Bottom table data ───
  const tableInits = useMemo(() => [...filteredInits].sort((a, b) => a.display_id.localeCompare(b.display_id)), [filteredInits]);
  const tableTasks = useMemo(() => [...filteredTasks].sort((a, b) => a.display_id.localeCompare(b.display_id)), [filteredTasks]);

  const hasFilters = fWave || fPriority || fSCI || fSubtype || fStatus || fVenue || fRole || fSpecialty || fModule || fAnalyst;
  const clearFilters = () => { setFWave(''); setFPriority(''); setFSCI(''); setFSubtype(''); setFStatus(''); setFVenue(''); setFRole(''); setFSpecialty(''); setFModule(''); setFAnalyst(''); };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Executive Dashboard</h2>
        {hasFilters && <button onClick={clearFilters} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-danger)' }}>Clear Filters</button>}
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="rounded-lg p-3 flex flex-wrap gap-2 items-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <FilterSelect label="WAVE" value={fWave} onChange={setFWave} options={waveOptions} />
        <FilterSelect label="PRIORITY" value={fPriority} onChange={setFPriority} options={priorityOptions} />
        <FilterSelect label="SCI" value={fSCI} onChange={setFSCI} options={sciOptions.map(s => s.name)} values={sciOptions.map(s => s.id)} />
        <FilterSelect label="TYPE" value={fSubtype} onChange={setFSubtype} options={subtypeOptions} />
        <FilterSelect label="STATUS" value={fStatus} onChange={setFStatus} options={statusOptions} />
        <FilterSelect label="VENUE" value={fVenue} onChange={setFVenue} options={venueOptions} />
        <FilterSelect label="ROLE" value={fRole} onChange={setFRole} options={roleOptions} />
        <FilterSelect label="SPECIALTY" value={fSpecialty} onChange={setFSpecialty} options={specialtyOptions} />
        <FilterSelect label="MODULE" value={fModule} onChange={setFModule} options={moduleOptions} />
        <FilterSelect label="ANALYST" value={fAnalyst} onChange={setFAnalyst} options={analystOptions.map(a => a.name)} values={analystOptions.map(a => a.id)} />
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <KPICard value={filteredInits.length} label="INITIATIVES" subtitle={`${filteredInits.filter(i => i.status !== 'Completed' && i.status !== 'On Hold').length} active`} borderColor="var(--primary-brand-color)" />
        <KPICard value={filteredTasks.length} label="TASKS" subtitle={`${openTasks.length} open`} borderColor="#0ea5e9" />
        <KPICard value={`${taskPct}%`} label="COMPLETION" subtitle={`${completedTasks.length} done`} borderColor="var(--color-success)" />
        <KPICard value={highCritTasks} label="HIGH/CRITICAL" subtitle="tasks" borderColor="var(--color-danger)" />
        <KPICard value={unassignedTasks} label="UNASSIGNED" subtitle="need analyst" borderColor="var(--color-warning)" />
        <KPICard value={overdueCount} label="OVERDUE ACTIONS" subtitle={`${openAICount} open`} borderColor="var(--color-danger)" />
      </div>

      {/* ─── Distribution Cards (3x2 grid) ─── */}
      <div className="grid grid-cols-3 gap-3">
        <DistCard title="BY ANALYST" data={byAnalyst} />
        <DistCard title="BY MODULE" data={byModule} />
        <DistCard title="BY SCI LEAD" data={bySCI} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <DistCard title="BY WAVE" data={byWave} />
        <DistCard title="BY VENUE" data={byVenue} />
        <DistCard title="BY SPECIALTY" data={bySpecialty} />
      </div>

      {/* ─── Bottom Table ─── */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button onClick={() => setBottomTab('initiatives')}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors"
            style={bottomTab === 'initiatives'
              ? { color: 'var(--primary-brand-color)', borderColor: 'var(--primary-brand-color)' }
              : { color: 'var(--text-muted)', borderColor: 'transparent' }}>
            Initiatives ({tableInits.length})
          </button>
          <button onClick={() => setBottomTab('tasks')}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors"
            style={bottomTab === 'tasks'
              ? { color: 'var(--primary-brand-color)', borderColor: 'var(--primary-brand-color)' }
              : { color: 'var(--text-muted)', borderColor: 'transparent' }}>
            Tasks ({tableTasks.length})
          </button>
        </div>

        {/* Table */}
        <div className="max-h-96 overflow-y-auto">
          {bottomTab === 'initiatives' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left px-3 py-2 font-medium">ID</th>
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Priority</th>
                  <th className="text-left px-3 py-2 font-medium">SCI</th>
                  <th className="text-left px-3 py-2 font-medium">Tasks</th>
                  <th className="text-left px-3 py-2 font-medium">Wave</th>
                  <th className="text-left px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tableInits.map(init => {
                  const statusColor = STATUS_COLORS[init.status] || '#6b7280';
                  const priorityColor = PRIORITY_COLORS[init.priority] || '#6b7280';
                  return (
                    <tr key={init.id}
                      onClick={() => onOpenInitiative(init.id)}
                      className="cursor-pointer border-t transition-colors"
                      style={{ borderColor: 'var(--border-default)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{init.display_id}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--text-heading)' }}>{init.name}</td>
                      <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>{init.status}</span></td>
                      <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}>{init.priority}</span></td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-body)' }}>{sciMap[init.primary_sci_id || ''] || '—'}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{init.open_task_count}/{init.task_count}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{init.go_live_wave || '—'}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(init.updated_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left px-3 py-2 font-medium">ID</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-left px-3 py-2 font-medium">Initiative</th>
                  <th className="text-left px-3 py-2 font-medium">Module</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Priority</th>
                  <th className="text-left px-3 py-2 font-medium">Analyst</th>
                  <th className="text-left px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tableTasks.map(task => {
                  const statusColor = TASK_STATUS_COLORS[task.status] || '#6b7280';
                  const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';
                  const init = egInits.find(i => i.id === task.initiative_id);
                  return (
                    <tr key={task.id}
                      onClick={() => onOpenInitiative(task.initiative_id)}
                      className="cursor-pointer border-t transition-colors"
                      style={{ borderColor: 'var(--border-default)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{task.display_id}</td>
                      <td className="px-3 py-2 max-w-xs truncate" style={{ color: 'var(--text-heading)' }}>{task.description}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{init?.display_id || '—'}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-body)' }}>{task.module || '—'}</td>
                      <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>{task.status}</span></td>
                      <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}>{task.priority}</span></td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-body)' }}>{analystMap[task.primary_analyst_id || ''] || 'Unassigned'}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(task.updated_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Select ───
function FilterSelect({ label, value, onChange, options, values }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  values?: string[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-2 py-1 rounded border text-xs min-w-[80px]"
        style={{ backgroundColor: 'var(--bg-input)', color: value ? 'var(--text-heading)' : 'var(--text-muted)', borderColor: value ? 'var(--primary-brand-color)' : 'var(--border-default)' }}>
        <option value="">All</option>
        {options.map((opt, i) => <option key={opt} value={values ? values[i] : opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// ─── KPI Card (colored left border, large monospace number) ───
function KPICard({ value, label, subtitle, borderColor }: {
  value: number | string;
  label: string;
  subtitle: string;
  borderColor: string;
}) {
  return (
    <div className="rounded-lg p-4" style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderLeft: `4px solid ${borderColor}`,
    }}>
      <div className="text-3xl font-bold font-mono" style={{ color: borderColor }}>{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{subtitle}</div>
    </div>
  );
}

// ─── Distribution Card (horizontal bars with counts) ───
function DistCard({ title, data }: { title: string; data: [string, number][] }) {
  const maxVal = Math.max(...data.map(([, v]) => v), 1);
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-heading)' }}>{title}</h4>
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {data.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data</p>
        ) : data.map(([name, count]) => (
          <div key={name}>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs" style={{ color: 'var(--text-body)' }}>{name}</span>
              <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-heading)' }}>{count}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
              <div className="h-full rounded-full" style={{
                width: `${(count / maxVal) * 100}%`,
                backgroundColor: 'var(--primary-brand-color)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
