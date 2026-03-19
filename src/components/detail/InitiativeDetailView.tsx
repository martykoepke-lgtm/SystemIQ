import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { fetchInitiativeWithDetails } from '../../lib/queries';
import { deleteInitiative } from '../../lib/mutations';
import type { InitiativeWithDetails } from '../../lib/supabase';
import { TYPE_COLORS, PRIORITY_COLORS, STATUS_COLORS } from '../../lib/constants';
import TasksTab from './TasksTab';
import NotesTab from './NotesTab';
import ActionItemsTab from './ActionItemsTab';
import DocumentsTab from './DocumentsTab';
import MetricsTab from './MetricsTab';
import GovernanceTab from './GovernanceTab';
import EffortLogModal from '../modals/EffortLogModal';

interface InitiativeDetailViewProps {
  initiativeId: string;
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
  onCreateTask: (initiativeId: string) => void;
  onEditInitiative: (initiative: InitiativeWithDetails) => void;
  teamMemberId?: string;
}

type Tab = 'tasks' | 'notes' | 'actions' | 'details' | 'documents' | 'metrics' | 'governance';

export default function InitiativeDetailView({
  initiativeId,
  onBack,
  onOpenTask,
  onCreateTask,
  onEditInitiative,
  teamMemberId,
}: InitiativeDetailViewProps) {
  const [initiative, setInitiative] = useState<InitiativeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [effortLogOpen, setEffortLogOpen] = useState(false);

  useEffect(() => {
    loadInitiative();
  }, [initiativeId]);

  async function loadInitiative() {
    setLoading(true);
    const data = await fetchInitiativeWithDetails(initiativeId);
    setInitiative(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!initiative) return;
    if (!confirm(`Delete "${initiative.name}"? This will remove all tasks, notes, and action items.`)) return;
    try {
      await deleteInitiative(initiative.id);
      onBack();
    } catch (err) {
      console.error('Delete initiative error:', err);
    }
  }

  if (loading || !initiative) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} />
      </div>
    );
  }

  const typeColor = TYPE_COLORS[initiative.type] || '#6b7280';
  const priorityColor = PRIORITY_COLORS[initiative.priority] || '#6b7280';
  const statusColor = STATUS_COLORS[initiative.status] || '#6b7280';

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'tasks', label: 'Tasks', count: initiative.task_count },
    { key: 'notes', label: 'Notes', count: initiative.notes?.length },
    { key: 'actions', label: 'Action Items', count: initiative.action_items?.length },
    { key: 'documents', label: 'Documents', count: initiative.documents?.length },
    { key: 'metrics', label: 'Metrics' },
    { key: 'governance', label: 'Governance' },
    { key: 'details', label: 'Details' },
  ];

  return (
    <div className="flex-1 flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm mb-3 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={16} />
            Back to initiatives
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                  {initiative.display_id}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                  {initiative.status}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>
                  {initiative.priority}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                  {initiative.type}
                </span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>{initiative.name}</h1>
              {initiative.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{initiative.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onEditInitiative(initiative)}
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
          {activeTab === 'tasks' && (
            <TasksTab
              initiativeId={initiativeId}
              onOpenTask={onOpenTask}
              onCreateTask={() => onCreateTask(initiativeId)}
            />
          )}
          {activeTab === 'notes' && <NotesTab initiativeId={initiativeId} />}
          {activeTab === 'actions' && <ActionItemsTab initiativeId={initiativeId} />}
          {activeTab === 'documents' && <DocumentsTab initiativeId={initiativeId} />}
          {activeTab === 'metrics' && (
            <MetricsTab
              initiative={initiative}
              onLogEffort={() => setEffortLogOpen(true)}
            />
          )}
          {activeTab === 'governance' && <GovernanceTab initiativeId={initiativeId} />}
          {activeTab === 'details' && <DetailsPanel initiative={initiative} />}
        </div>
      </div>

      {/* Right sidebar — initiative properties */}
      <div
        className="w-72 border-l p-4 space-y-4 overflow-y-auto shrink-0"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Properties
        </h3>
        <PropRow label="Primary SCI" value={initiative.primary_sci?.name} />
        <PropRow label="Secondary SCI" value={initiative.secondary_sci?.name} />
        <PropRow label="Work Effort" value={initiative.work_effort} />
        <PropRow label="Phase" value={initiative.phase} />
        <PropRow label="Start Date" value={initiative.start_date ? new Date(initiative.start_date).toLocaleDateString() : undefined} />
        <PropRow label="Target Date" value={initiative.target_date ? new Date(initiative.target_date).toLocaleDateString() : undefined} />
        <PropRow label="Venues" value={initiative.venues?.join(', ')} />
        <PropRow label="Roles Impacted" value={initiative.roles_impacted?.join(', ')} />
        <PropRow label="Specialty" value={initiative.specialty_service_line?.join(', ')} />
        {initiative.type === 'Epic Gold' && (
          <>
            <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-default)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-epic-gold)' }}>Epic Gold</span>
            </div>
            <PropRow label="EG Type" value={initiative.eg_subtype} />
            <PropRow label="Wave" value={initiative.go_live_wave} />
            <PropRow label="System Sponsor" value={initiative.system_sponsor} />
            <PropRow label="Applications" value={initiative.applications?.join(', ')} />
          </>
        )}
      </div>

      {/* Effort Log Modal */}
      {teamMemberId && (
        <EffortLogModal
          isOpen={effortLogOpen}
          onClose={() => setEffortLogOpen(false)}
          onSaved={() => { setEffortLogOpen(false); loadInitiative(); }}
          initiativeId={initiativeId}
          teamMemberId={teamMemberId}
          currentEffortSize={initiative.work_effort}
        />
      )}
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

function DetailsPanel({ initiative }: { initiative: InitiativeWithDetails }) {
  const fields = [
    { label: 'Display ID', value: initiative.display_id },
    { label: 'Name', value: initiative.name },
    { label: 'Type', value: initiative.type },
    { label: 'Priority', value: initiative.priority },
    { label: 'Status', value: initiative.status },
    { label: 'Description', value: initiative.description },
    { label: 'Primary SCI', value: initiative.primary_sci?.name },
    { label: 'Secondary SCI', value: initiative.secondary_sci?.name },
    { label: 'Work Effort', value: initiative.work_effort },
    { label: 'Phase', value: initiative.phase },
    { label: 'Start Date', value: initiative.start_date },
    { label: 'Target Date', value: initiative.target_date },
    { label: 'Created', value: new Date(initiative.created_at).toLocaleString() },
    { label: 'Updated', value: new Date(initiative.updated_at).toLocaleString() },
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
