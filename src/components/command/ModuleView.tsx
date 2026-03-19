import { useState, useEffect, useMemo } from 'react';
import { Loader2, Boxes, ChevronRight, ChevronDown, User } from 'lucide-react';
import { fetchAllTasks, fetchTeamMembers, fetchInitiatives } from '../../lib/queries';
import type { Task, TeamMember, Initiative } from '../../lib/supabase';
import { TASK_STATUS_COLORS, PRIORITY_COLORS, OPEN_TASK_STATUSES } from '../../lib/constants';

interface ModuleViewProps {
  onOpenTask: (taskId: string) => void;
}

type GroupBy = 'status' | 'analyst' | 'initiative';

export default function ModuleView({ onOpenTask }: ModuleViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analysts, setAnalysts] = useState<TeamMember[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [analystFilter, setAnalystFilter] = useState<string>('');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [taskData, analystData, initData] = await Promise.all([
      fetchAllTasks(), fetchTeamMembers('analyst'), fetchInitiatives(),
    ]);
    setTasks(taskData);
    setAnalysts(analystData);
    setInitiatives(initData);
    setLoading(false);
  }

  const analystMap = useMemo(() => {
    const map: Record<string, string> = {};
    analysts.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [analysts]);

  const initMap = useMemo(() => {
    const map: Record<string, string> = {};
    initiatives.forEach(i => { map[i.id] = i.name; });
    return map;
  }, [initiatives]);

  // EG Command Center only — filter to tasks under eg_approved initiatives
  const egInitIds = useMemo(() => new Set(initiatives.filter(i => i.eg_approved).map(i => i.id)), [initiatives]);
  const egTasks = useMemo(() => tasks.filter(t => egInitIds.has(t.initiative_id)), [tasks, egInitIds]);

  // Unique filter options
  const allModules = useMemo(() => [...new Set(egTasks.map(t => t.module).filter(Boolean))].sort() as string[], [egTasks]);
  const allStatuses = useMemo(() => [...new Set(egTasks.map(t => t.status))].sort(), [egTasks]);

  // Filter
  const filtered = useMemo(() => {
    let items = egTasks;
    if (moduleFilter) items = items.filter(t => t.module === moduleFilter);
    if (statusFilter) items = items.filter(t => t.status === statusFilter);
    if (analystFilter === '_unassigned') items = items.filter(t => !t.primary_analyst_id);
    else if (analystFilter) items = items.filter(t => t.primary_analyst_id === analystFilter);
    // On Hold tasks go to bottom
    items = [...items].sort((a, b) => {
      const aHold = a.status === 'On Hold' ? 1 : 0;
      const bHold = b.status === 'On Hold' ? 1 : 0;
      return aHold - bHold;
    });
    return items;
  }, [tasks, moduleFilter, statusFilter, analystFilter]);

  // Group
  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const t of filtered) {
      let key = '';
      if (groupBy === 'status') key = t.status;
      else if (groupBy === 'analyst') key = t.primary_analyst_id ? analystMap[t.primary_analyst_id] || 'Unknown' : 'Unassigned';
      else if (groupBy === 'initiative') key = initMap[t.initiative_id] || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupBy, analystMap, initMap]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar with filters */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b flex-wrap" style={{ borderColor: 'var(--border-default)' }}>
        <Boxes size={18} style={{ color: 'var(--text-heading)' }} />
        <span className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>By Module</span>
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Modules ({tasks.length})</option>
          {allModules.map(m => {
            const count = egTasks.filter(t => t.module === m).length;
            return <option key={m} value={m}>{m} ({count})</option>;
          })}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={analystFilter} onChange={(e) => setAnalystFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Analysts</option>
          <option value="_unassigned">Unassigned</option>
          {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Group:</span>
        {(['module' as const, 'status', 'analyst', 'initiative'] as const).map(g => (
          <button key={g} onClick={() => { setGroupBy(g === 'module' ? 'status' : g); if (g === 'module') { setModuleFilter(''); } }}
            className="px-2 py-1 rounded text-xs font-medium transition-colors"
            style={groupBy === g || (g === 'module' && !moduleFilter) ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-muted)' }}>
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}

        <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{filtered.length} tasks</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Column headers */}
        <div className="grid px-4 py-1.5 border-b text-xs font-medium uppercase tracking-wider sticky top-0 z-10"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)',
            gridTemplateColumns: '28px 72px 1fr 100px 80px 130px 130px' }}>
          <div />
          <div>Task</div>
          <div>Description</div>
          <div>Module</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Analyst</div>
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No tasks match your filters</div>
        ) : (
          grouped.map(([group, groupTasks]) => {
            const isCollapsed = collapsedGroups.has(group);
            return (
              <div key={group}>
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left border-b"
                  style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-hover)' }}>
                  {isCollapsed ? <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-heading)' }}>{group}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>({groupTasks.length})</span>
                </button>
                {!isCollapsed && groupTasks.map(task => {
                  const statusColor = TASK_STATUS_COLORS[task.status] || '#6b7280';
                  const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';
                  return (
                    <button
                      key={task.id}
                      onClick={() => onOpenTask(task.id)}
                      className="w-full grid items-center px-4 py-1.5 text-left border-b transition-colors"
                      style={{ borderColor: 'var(--border-default)', gridTemplateColumns: '28px 72px 1fr 100px 80px 130px 130px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div><div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} /></div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{task.display_id}</div>
                      <div className="text-xs truncate pr-2" style={{ color: 'var(--text-body)' }}>{task.description}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.module || '—'}</div>
                      <div><span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>{task.priority}</span></div>
                      <div><span className="text-xs px-1 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>{task.status}</span></div>
                      <div className="text-xs truncate" style={{ color: task.primary_analyst_id ? 'var(--text-body)' : 'var(--color-warning)' }}>
                        {task.primary_analyst_id ? analystMap[task.primary_analyst_id] || '—' : 'Unassigned'}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
