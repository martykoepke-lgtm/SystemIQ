import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Pencil, Trash2, X, Plus } from 'lucide-react';
import { fetchInitiativeWithDetails, fetchInitiativeMetrics } from '../../lib/queries';
import { deleteInitiative, removeStakeholderFromInitiative } from '../../lib/mutations';
import type { InitiativeWithDetails, InitiativeMetric } from '../../lib/supabase';
import { TYPE_COLORS, PRIORITY_COLORS, STATUS_COLORS } from '../../lib/constants';
import TasksTab from './TasksTab';
import NotesTab from './NotesTab';
import ActionItemsTab from './ActionItemsTab';
import DocumentsTab from './DocumentsTab';
import GoalsSection from './GoalsSection';
import MetricsTab from './MetricsTab';
import GovernanceTab from './GovernanceTab';
import EffortLogModal from '../modals/EffortLogModal';
import MetricModal from '../modals/MetricModal';
import StakeholderModal from '../modals/StakeholderModal';

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
  const [metrics, setMetrics] = useState<InitiativeMetric[]>([]);
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<InitiativeMetric | null>(null);
  const [stakeholderModalOpen, setStakeholderModalOpen] = useState(false);

  useEffect(() => {
    loadInitiative();
  }, [initiativeId]);

  async function loadInitiative() {
    setLoading(true);
    const [data, metricsData] = await Promise.all([
      fetchInitiativeWithDetails(initiativeId),
      fetchInitiativeMetrics(initiativeId),
    ]);
    setInitiative(data);
    setMetrics(metricsData);
    setLoading(false);
  }

  async function refreshMetrics() {
    const metricsData = await fetchInitiativeMetrics(initiativeId);
    setMetrics(metricsData);
  }

  async function handleRemoveStakeholder(pivotId: string) {
    try {
      await removeStakeholderFromInitiative(pivotId);
      loadInitiative();
    } catch (err) {
      console.error('Error removing stakeholder:', err);
    }
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
              metrics={metrics}
              onAddMetric={() => { setEditingMetric(null); setMetricModalOpen(true); }}
              onEditMetric={(m) => { setEditingMetric(m); setMetricModalOpen(true); }}
              onMetricsChanged={refreshMetrics}
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
        {/* Stakeholders Section */}
        <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Stakeholders
            </span>
            <button
              onClick={() => setStakeholderModalOpen(true)}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{ color: 'var(--primary-brand-color)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={12} /> ADD
            </button>
          </div>

          {(!initiative.stakeholders || initiative.stakeholders.length === 0) ? (
            <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No stakeholders assigned</p>
          ) : (
            <div className="space-y-2">
              {initiative.stakeholders.map((s) => (
                <div
                  key={s.pivot_id}
                  className="flex items-center gap-2.5 py-2 px-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: 'var(--primary-brand-color)' }}
                  >
                    {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-heading)' }}>
                      {s.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {[s.role, s.department].filter(Boolean).join(' \u00B7 ') || s.title || '\u2014'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStakeholder(s.pivot_id)}
                    className="shrink-0 p-1 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    title="Remove stakeholder"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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

      {/* Metric Modal */}
      <MetricModal
        isOpen={metricModalOpen}
        onClose={() => { setMetricModalOpen(false); setEditingMetric(null); }}
        onSaved={() => { setMetricModalOpen(false); setEditingMetric(null); refreshMetrics(); }}
        initiativeId={initiativeId}
        editingMetric={editingMetric}
      />

      {/* Stakeholder Modal */}
      <StakeholderModal
        isOpen={stakeholderModalOpen}
        onClose={() => setStakeholderModalOpen(false)}
        onSaved={() => { setStakeholderModalOpen(false); loadInitiative(); }}
        initiativeId={initiativeId}
        existingStakeholderIds={initiative.stakeholders?.map((s) => s.id) || []}
      />
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
    <div className="space-y-6">
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

      {/* Goals Section */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <GoalsSection initiativeId={initiative.id} />
      </div>
    </div>
  );
}
