import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { fetchTaskWithDetails } from '../../lib/queries';
import { deleteTask } from '../../lib/mutations';
import type { TaskWithDetails } from '../../lib/supabase';
import { TASK_STATUS_COLORS, PRIORITY_COLORS } from '../../lib/constants';
import NotesTab from './NotesTab';
import ActionItemsTab from './ActionItemsTab';

interface TaskDetailViewProps {
  taskId: string;
  onBack: () => void;
  onEditTask: (task: TaskWithDetails) => void;
}

type Tab = 'notes' | 'actions' | 'overview';

export default function TaskDetailView({ taskId, onBack, onEditTask }: TaskDetailViewProps) {
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('notes');

  useEffect(() => {
    loadTask();
  }, [taskId]);

  async function loadTask() {
    setLoading(true);
    const data = await fetchTaskWithDetails(taskId);
    setTask(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm('Delete this task and all its notes and action items?')) return;
    try {
      await deleteTask(task.id);
      onBack();
    } catch (err) {
      console.error('Delete task error:', err);
    }
  }

  if (loading || !task) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} />
      </div>
    );
  }

  const statusColor = TASK_STATUS_COLORS[task.status] || '#6b7280';
  const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'notes', label: 'Notes', count: task.notes?.length },
    { key: 'actions', label: 'Action Items', count: task.action_items?.length },
    { key: 'overview', label: 'Overview' },
  ];

  return (
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm mb-3 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={16} />
            Back{task.initiative ? ` to ${task.initiative.name}` : ''}
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                  {task.display_id}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                  {task.status}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>
                  {task.priority}
                </span>
                {task.module && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                    {task.module}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>{task.description}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onEditTask(task)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
              style={
                activeTab === tab.key
                  ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' }
                  : { color: 'var(--text-body)' }
              }
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                  style={{
                    backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-hover)',
                    color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'notes' && <NotesTab taskId={taskId} />}
          {activeTab === 'actions' && <ActionItemsTab taskId={taskId} />}
          {activeTab === 'overview' && <TaskOverview task={task} />}
        </div>
      </div>

      {/* Right sidebar */}
      <div
        className="w-72 border-l p-4 space-y-4 overflow-y-auto shrink-0"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Task Info
        </h3>
        <PropRow label="Status" value={task.status} />
        <PropRow label="Priority" value={task.priority} />
        <PropRow label="Module" value={task.module} />
        <PropRow label="Primary Analyst" value={task.primary_analyst?.name} />
        <PropRow label="Education Required" value={task.education_required ? 'Yes' : 'No'} />
        <PropRow label="Build Review" value={task.build_review_status} />
        <PropRow label="Build Review Date" value={task.build_review_date ? new Date(task.build_review_date).toLocaleDateString() : undefined} />
        <PropRow label="Resolution Date" value={task.resolution_date ? new Date(task.resolution_date).toLocaleDateString() : undefined} />
        {task.initiative && (
          <>
            <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-default)' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Initiative</span>
            </div>
            <PropRow label="Name" value={task.initiative.name} />
            <PropRow label="ID" value={task.initiative.display_id} />
          </>
        )}
      </div>
    </div>
  );
}

function PropRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm" style={{ color: value ? 'var(--text-heading)' : 'var(--text-muted)' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function TaskOverview({ task }: { task: TaskWithDetails }) {
  const fields = [
    { label: 'Task ID', value: task.display_id },
    { label: 'Description', value: task.description },
    { label: 'Module', value: task.module },
    { label: 'Priority', value: task.priority },
    { label: 'Status', value: task.status },
    { label: 'Primary Analyst', value: task.primary_analyst?.name },
    { label: 'Education Required', value: task.education_required ? 'Yes' : 'No' },
    { label: 'Build Review', value: task.build_review_status },
    { label: 'Build Review Date', value: task.build_review_date },
    { label: 'Resolution Date', value: task.resolution_date },
    { label: 'Created', value: new Date(task.created_at).toLocaleString() },
    { label: 'Updated', value: new Date(task.updated_at).toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={f.label}>
          <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
          <div className="text-sm" style={{ color: f.value ? 'var(--text-heading)' : 'var(--text-muted)' }}>
            {f.value || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}
