import { useState, useEffect, useMemo } from 'react';
import { Loader2, User, ChevronRight } from 'lucide-react';
import { fetchAllTasks, fetchTeamMembers, fetchInitiatives } from '../../lib/queries';
import type { Task, TeamMember, Initiative } from '../../lib/supabase';
import { TASK_STATUS_COLORS, PRIORITY_COLORS } from '../../lib/constants';

interface AnalystViewProps {
  onOpenTask: (taskId: string) => void;
  onOpenInitiative: (id: string) => void;
}

type GroupBy = 'initiative' | 'module' | 'status';

export default function AnalystView({ onOpenTask, onOpenInitiative: _onOpenInitiative }: AnalystViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analysts, setAnalysts] = useState<TeamMember[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [groupBy, setGroupBy] = useState<GroupBy>('initiative');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [taskData, analystData, initData] = await Promise.all([
      fetchAllTasks(),
      fetchTeamMembers('analyst'),
      fetchInitiatives(),
    ]);
    setTasks(taskData);
    setAnalysts(analystData);
    setInitiatives(initData);
    setLoading(false);
  }

  const initMap = useMemo(() => {
    const map: Record<string, Initiative> = {};
    initiatives.forEach((i) => { map[i.id] = i; });
    return map;
  }, [initiatives]);

  // EG Command Center only — filter to tasks under eg_approved initiatives
  const egInitIds = useMemo(() => new Set(initiatives.filter(i => i.eg_approved).map(i => i.id)), [initiatives]);
  const egTasks = useMemo(() => tasks.filter(t => egInitIds.has(t.initiative_id)), [tasks, egInitIds]);

  const allStatuses = useMemo(() => [...new Set(egTasks.map(t => t.status))].sort(), [egTasks]);
  const allModules = useMemo(() => [...new Set(egTasks.map(t => t.module).filter(Boolean))].sort() as string[], [egTasks]);

  const filteredTasks = useMemo(() => {
    if (!selectedAnalyst) return [];
    let items = egTasks.filter((t) => t.primary_analyst_id === selectedAnalyst);
    if (statusFilter) items = items.filter(t => t.status === statusFilter);
    if (moduleFilter) items = items.filter(t => t.module === moduleFilter);
    // On Hold to bottom
    items = [...items].sort((a, b) => (a.status === 'On Hold' ? 1 : 0) - (b.status === 'On Hold' ? 1 : 0));
    return items;
  }, [tasks, selectedAnalyst, statusFilter, moduleFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const t of filteredTasks) {
      let key = '';
      if (groupBy === 'initiative') key = initMap[t.initiative_id]?.name || 'Unknown';
      else if (groupBy === 'module') key = t.module || 'No Module';
      else key = t.status;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return groups;
  }, [filteredTasks, groupBy, initMap]);

  const selectedName = analysts.find(a => a.id === selectedAnalyst)?.name;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <select
          value={selectedAnalyst}
          onChange={(e) => setSelectedAnalyst(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
        >
          <option value="">Select Analyst...</option>
          {analysts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Modules</option>
          {allModules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Group:</span>
        {(['initiative', 'module', 'status'] as GroupBy[]).map((g) => (
          <button key={g} onClick={() => setGroupBy(g)}
            className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
            style={groupBy === g ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-body)' }}>
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
        {selectedName && (
          <span className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} for {selectedName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedAnalyst ? (
          <div className="text-center py-12">
            <User size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select an analyst to view their tasks</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tasks assigned to {selectedName}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([group, groupTasks]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                  {group}
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                    {groupTasks.length}
                  </span>
                </h3>
                <div className="space-y-1">
                  {groupTasks.map((task) => {
                    const statusColor = TASK_STATUS_COLORS[task.status] || '#6b7280';
                    const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';
                    return (
                      <button
                        key={task.id}
                        onClick={() => onOpenTask(task.id)}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left group transition-colors"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-brand-color)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{task.display_id}</span>
                        <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-heading)' }}>{task.description}</span>
                        {task.module && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>{task.module}</span>}
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>{task.priority}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>{task.status}</span>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
