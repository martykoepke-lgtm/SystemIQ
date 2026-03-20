import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Zap, ChevronDown, ChevronRight, ChevronUp, X } from 'lucide-react';
import { fetchInitiativesWithCounts, fetchAllTasks, fetchTeamMembers } from '../../lib/queries';
import type { Initiative, Task, TeamMember } from '../../lib/supabase';
import {
  STATUS_COLORS,
  TASK_STATUS_COLORS,
  PRIORITY_COLORS,
  OPEN_TASK_STATUSES,
  EG_SUBTYPE_COLORS,
} from '../../lib/constants';

type InitiativeWithCounts = Initiative & { task_count: number; open_task_count: number };
type SortKey = 'display_id' | 'name' | 'eg_subtype' | 'primary_sci' | 'status' | 'go_live_wave' | 'tasks' | 'priority';
type SortDir = 'asc' | 'desc';

interface EpicGoldViewProps {
  onOpenInitiative: (id: string) => void;
  onOpenTask: (taskId: string) => void;
  onCreateInitiative: () => void;
}

export default function EpicGoldView({ onOpenInitiative, onOpenTask, onCreateInitiative }: EpicGoldViewProps) {
  const [initiatives, setInitiatives] = useState<InitiativeWithCounts[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analysts, setAnalysts] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [waveFilter, setWaveFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [sciFilter, setSciFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('display_id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [initData, taskData, analystData] = await Promise.all([
      fetchInitiativesWithCounts(),
      fetchAllTasks(),
      fetchTeamMembers('analyst'),
    ]);
    setInitiatives(initData);
    setTasks(taskData);
    setAnalysts(analystData);
    // Start collapsed
    setExpandedIds(new Set());
    setLoading(false);
  }

  // Get unique filter options from data
  // Only eg_approved initiatives belong in the Epic Gold Command Center
  const allEG = useMemo(() => initiatives.filter(i => i.eg_approved), [initiatives]);
  const waves = useMemo(() => [...new Set(allEG.filter(i => i.go_live_wave).map(i => i.go_live_wave!))].sort(), [allEG]);
  const allVenues = useMemo(() => {
    const s = new Set<string>();
    allEG.forEach(i => (i.venues as string[] || []).forEach(v => s.add(v)));
    return [...s].sort();
  }, [allEG]);
  const allRoles = useMemo(() => {
    const s = new Set<string>();
    allEG.forEach(i => (i.roles_impacted as string[] || []).forEach(r => s.add(r)));
    return [...s].sort();
  }, [allEG]);
  const allModules = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach(t => { if (t.module) s.add(t.module); });
    return [...s].sort();
  }, [tasks]);
  const ARCHIVED_STATUSES = new Set(['Completed', 'Dismissed', 'Deferred']);

  // Task map — must be defined before egInitiatives for sort
  const tasksByInitiative = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!map[t.initiative_id]) map[t.initiative_id] = [];
      map[t.initiative_id].push(t);
    }
    return map;
  }, [tasks]);

  // SCI names (fetch all team members for this)
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  useEffect(() => { fetchTeamMembers().then(setAllMembers); }, []);
  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    allMembers.forEach(m => { map[m.id] = m.name; });
    return map;
  }, [allMembers]);

  // Filter to Epic Gold — exclude archived, sort by column
  const egInitiatives = useMemo(() => {
    let items = allEG.filter(i => !ARCHIVED_STATUSES.has(i.status));
    if (waveFilter !== 'all') items = items.filter(i => i.go_live_wave === waveFilter);
    if (venueFilter) items = items.filter(i => (i.venues as string[] || []).includes(venueFilter));
    if (roleFilter) items = items.filter(i => (i.roles_impacted as string[] || []).includes(roleFilter));
    if (priorityFilter) items = items.filter(i => i.priority === priorityFilter);
    if (sciFilter) items = items.filter(i => i.primary_sci_id === sciFilter || i.secondary_sci_id === sciFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.display_id.toLowerCase().includes(q));
    }
    if (moduleFilter) {
      const initIdsWithModule = new Set(tasks.filter(t => t.module === moduleFilter).map(t => t.initiative_id));
      items = items.filter(i => initIdsWithModule.has(i.id));
    }
    // Sort by selected column
    items.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortKey) {
        case 'display_id': aVal = a.display_id; bVal = b.display_id; break;
        case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case 'eg_subtype': aVal = a.eg_subtype || ''; bVal = b.eg_subtype || ''; break;
        case 'primary_sci': aVal = (memberMap[a.primary_sci_id || ''] || '').toLowerCase(); bVal = (memberMap[b.primary_sci_id || ''] || '').toLowerCase(); break;
        case 'status': aVal = a.status; bVal = b.status; break;
        case 'go_live_wave': aVal = a.go_live_wave || ''; bVal = b.go_live_wave || ''; break;
        case 'priority': aVal = a.priority || ''; bVal = b.priority || ''; break;
        case 'tasks': {
          const aTasks = tasksByInitiative[a.id]?.filter(t => OPEN_TASK_STATUSES.has(t.status)).length || 0;
          const bTasks = tasksByInitiative[b.id]?.filter(t => OPEN_TASK_STATUSES.has(t.status)).length || 0;
          aVal = aTasks; bVal = bTasks; break;
        }
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [allEG, waveFilter, venueFilter, roleFilter, moduleFilter, sciFilter, priorityFilter, search, tasks, sortKey, sortDir, memberMap, tasksByInitiative]);

  // Name lookups
  const analystMap = useMemo(() => {
    const map: Record<string, string> = {};
    analysts.forEach((a) => { map[a.id] = a.name; });
    return map;
  }, [analysts]);

  // Stats
  const totalTasks = egInitiatives.reduce((sum, i) => sum + (tasksByInitiative[i.id]?.length || 0), 0);
  const openTasks = egInitiatives.reduce((sum, i) => {
    return sum + (tasksByInitiative[i.id]?.filter(t => OPEN_TASK_STATUSES.has(t.status)).length || 0);
  }, 0);
  const unassignedTasks = tasks.filter(t => {
    const init = initiatives.find(i => i.id === t.initiative_id);
    return init?.type === 'Epic Gold' && !t.primary_analyst_id && OPEN_TASK_STATUSES.has(t.status);
  }).length;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-epic-gold)' }} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <Zap size={20} style={{ color: 'var(--color-epic-gold)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Epic Gold Command Center</h2>
        </div>
        <button
          onClick={onCreateInitiative}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-epic-gold)' }}
        >
          <Plus size={16} />
          New Epic Gold
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 px-4 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <Stat label="Initiatives" value={egInitiatives.length} color="var(--color-epic-gold)" />
        <Stat label="Open Tasks" value={openTasks} color="var(--color-info)" />
        <Stat label="Total Tasks" value={totalTasks} color="var(--text-muted)" />
        <Stat label="Unassigned" value={unassignedTasks} color="var(--color-danger)" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap" style={{ borderColor: 'var(--border-default)' }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
          className="px-2 py-1 rounded-lg border text-xs w-40" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }} />
        <select value={waveFilter} onChange={(e) => setWaveFilter(e.target.value)}
          className="px-2 py-1 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="all">All Waves</option>
          {waves.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}
          className="px-2 py-1 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Venues</option>
          {allVenues.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-2 py-1 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Roles</option>
          {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          className="px-2 py-1 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Modules</option>
          {allModules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2 py-1 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
        </select>
        {(venueFilter || roleFilter || moduleFilter || priorityFilter || sciFilter || search) && (
          <button onClick={() => { setVenueFilter(''); setRoleFilter(''); setModuleFilter(''); setPriorityFilter(''); setSciFilter(''); setSearch(''); setWaveFilter('all'); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ color: 'var(--color-danger)' }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Column headers */}
      <div className="grid px-4 py-1.5 border-b text-xs font-medium uppercase tracking-wider"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)', gridTemplateColumns: '28px 72px 1fr 110px 130px 130px 120px 60px 50px' }}>
        <div />
        <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('display_id')}>ID <SortIcon col="display_id" /></div>
        <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('name')}>Initiative <SortIcon col="name" /></div>
        <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('eg_subtype')}>Type <SortIcon col="eg_subtype" /></div>
        <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('primary_sci')}>Primary SCI <SortIcon col="primary_sci" /></div>
        <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('status')}>Status <SortIcon col="status" /></div>
        <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('go_live_wave')}>Wave <SortIcon col="go_live_wave" /></div>
        <div className="cursor-pointer flex items-center gap-1 justify-center" onClick={() => handleSort('tasks')}>Tasks <SortIcon col="tasks" /></div>
        <div />
      </div>

      {/* Initiative accordion with nested tasks */}
      <div className="flex-1 overflow-y-auto space-y-0">
        {egInitiatives.length === 0 ? (
          <div className="text-center py-12">
            <Zap size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No Epic Gold initiatives found</p>
          </div>
        ) : (
          egInitiatives.map((init) => {
            const expanded = expandedIds.has(init.id);
            const initTasks = tasksByInitiative[init.id] || [];
            const openCount = initTasks.filter(t => OPEN_TASK_STATUSES.has(t.status)).length;
            const statusColor = STATUS_COLORS[init.status] || '#6b7280';

            return (
              <div
                key={init.id}
                className="border-b"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {/* Initiative header row — grid aligned */}
                <button
                  onClick={() => toggleExpand(init.id)}
                  className="w-full grid items-center px-4 py-2.5 text-left transition-colors"
                  style={{ backgroundColor: 'var(--bg-surface)', gridTemplateColumns: '28px 72px 1fr 110px 130px 130px 120px 60px 50px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
                >
                  <div>{expanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--color-epic-gold)' }}>{init.display_id}</div>
                  <div className="text-sm font-semibold truncate pr-2" style={{ color: 'var(--text-heading)' }}>{init.name}</div>
                  <div>{init.eg_subtype ? <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${EG_SUBTYPE_COLORS[init.eg_subtype] || '#6b7280'}15`, color: EG_SUBTYPE_COLORS[init.eg_subtype] || '#6b7280' }}>{init.eg_subtype}</span> : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-body)' }}>{init.primary_sci_id ? memberMap[init.primary_sci_id] || '—' : '—'}</div>
                  <div><span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>{init.status}</span></div>
                  <div className="text-xs" style={{ color: 'var(--color-epic-gold)' }}>{init.go_live_wave || '—'}</div>
                  <div className="text-xs font-mono text-center" style={{ color: openCount > 0 ? 'var(--color-info)' : 'var(--text-muted)' }}>{openCount}/{initTasks.length}</div>
                  <div className="text-right">
                    <span onClick={(e) => { e.stopPropagation(); onOpenInitiative(init.id); }} className="text-xs cursor-pointer" style={{ color: 'var(--primary-brand-color)' }}>Open</span>
                  </div>
                </button>

                {/* Expanded task list */}
                {expanded && (
                  <div className="border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-hover)' }}>
                    {/* Task sub-header */}
                    <div className="grid px-4 py-1 text-xs uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)', gridTemplateColumns: '28px 72px 1fr 100px 80px 130px 130px' }}>
                      <div />
                      <div>Task</div>
                      <div>Description</div>
                      <div>Module</div>
                      <div>Priority</div>
                      <div>Status</div>
                      <div>Analyst</div>
                    </div>
                    {initTasks.length === 0 ? (
                      <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>No tasks yet</div>
                    ) : (
                      initTasks.map((task) => {
                        const tStatusColor = TASK_STATUS_COLORS[task.status] || '#6b7280';
                        const tPriorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';
                        return (
                          <button
                            key={task.id}
                            onClick={() => onOpenTask(task.id)}
                            className="w-full grid items-center px-4 py-1.5 text-left border-t transition-colors"
                            style={{ borderColor: 'var(--border-default)', gridTemplateColumns: '28px 72px 1fr 100px 80px 130px 130px' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <div><div className="w-2 h-2 rounded-full" style={{ backgroundColor: tStatusColor }} /></div>
                            <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{task.display_id}</div>
                            <div className="text-xs truncate pr-2" style={{ color: 'var(--text-body)' }}>{task.description}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.module || '—'}</div>
                            <div><span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: `${tPriorityColor}15`, color: tPriorityColor }}>{task.priority}</span></div>
                            <div><span className="text-xs px-1 py-0.5 rounded-full" style={{ backgroundColor: `${tStatusColor}15`, color: tStatusColor }}>{task.status}</span></div>
                            <div className="text-xs truncate" style={{ color: task.primary_analyst_id ? 'var(--text-body)' : 'var(--color-warning)' }}>
                              {task.primary_analyst_id ? analystMap[task.primary_analyst_id] || '—' : 'Unassigned'}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg font-bold font-mono" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
