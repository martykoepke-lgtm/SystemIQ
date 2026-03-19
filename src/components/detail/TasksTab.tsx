import { useState, useEffect } from 'react';
import { Plus, ChevronRight, User } from 'lucide-react';
import { fetchTasksForInitiative } from '../../lib/queries';
import type { Task } from '../../lib/supabase';
import { TASK_STATUS_COLORS, PRIORITY_COLORS, OPEN_TASK_STATUSES } from '../../lib/constants';

interface TasksTabProps {
  initiativeId: string;
  onOpenTask: (taskId: string) => void;
  onCreateTask: () => void;
}

export default function TasksTab({ initiativeId, onOpenTask, onCreateTask }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [initiativeId]);

  async function loadTasks() {
    setLoading(true);
    const data = await fetchTasksForInitiative(initiativeId);
    setTasks(data);
    setLoading(false);
  }

  // Group by status
  const openTasks = tasks.filter((t) => OPEN_TASK_STATUSES.has(t.status));
  const closedTasks = tasks.filter((t) => !OPEN_TASK_STATUSES.has(t.status));

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
          {openTasks.length} open · {closedTasks.length} closed
        </span>
        <button
          onClick={onCreateTask}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--primary-brand-color)' }}
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tasks yet. Add the first task for this initiative.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((task) => {
            const statusColor = TASK_STATUS_COLORS[task.status] || '#6b7280';
            const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';
            return (
              <button
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-brand-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: statusColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{task.display_id}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>
                      {task.priority}
                    </span>
                    {task.module && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                        {task.module}
                      </span>
                    )}
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--text-heading)' }}>{task.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                    {task.status}
                  </span>
                  {task.primary_analyst_id && <User size={14} style={{ color: 'var(--text-muted)' }} />}
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
