import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Scale } from 'lucide-react';
import { fetchGovernanceRecords } from '../../lib/queries';
import { deleteGovernanceRecord } from '../../lib/mutations';
import type { GovernanceRecord } from '../../lib/supabase';
import { GOVERNANCE_STATUS_COLORS } from '../../lib/constants';
import GovernanceModal from '../modals/GovernanceModal';

interface GovernanceTabProps {
  initiativeId: string;
}

export default function GovernanceTab({ initiativeId }: GovernanceTabProps) {
  const [records, setRecords] = useState<GovernanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GovernanceRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [initiativeId]);

  async function loadRecords() {
    setLoading(true);
    const data = await fetchGovernanceRecords(initiativeId);
    setRecords(data);
    setLoading(false);
  }

  async function handleDelete(record: GovernanceRecord) {
    if (!confirm(`Delete governance record ${record.display_id}?`)) return;
    try {
      await deleteGovernanceRecord(record.id);
      loadRecords();
    } catch (err) {
      console.error('Delete governance record error:', err);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
        Loading governance records...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
          Governance Records ({records.length})
        </h3>
        <button
          onClick={() => { setEditingRecord(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: 'var(--primary-brand-color)', color: 'white' }}
        >
          <Plus size={14} /> Add Governance Record
        </button>
      </div>

      {records.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg border border-dashed"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
        >
          <Scale size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No governance records yet</p>
          <p className="text-xs mt-1">Add a record to track governance tickets for this initiative</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const statusColor = GOVERNANCE_STATUS_COLORS[record.status] || '#6b7280';
            return (
              <div
                key={record.id}
                className="rounded-lg border p-4"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-mono font-semibold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                    >
                      {record.display_id}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingRecord(record); setModalOpen(true); }}
                      className="p-1 rounded hover:bg-black/5 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(record)}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {record.ticket_number && (
                  <div className="mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ticket: </span>
                    <span className="text-sm font-mono" style={{ color: 'var(--text-heading)' }}>{record.ticket_number}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <PropItem label="Submitted" value={formatDate(record.submission_date)} />
                  <PropItem label="Review Date" value={formatDate(record.review_date)} />
                  <PropItem label="Decision Date" value={formatDate(record.decision_date)} />
                </div>

                {record.conditions && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Conditions / Notes</span>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-body)' }}>{record.conditions}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <GovernanceModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRecord(null); }}
        onSaved={loadRecords}
        initiativeId={initiativeId}
        record={editingRecord}
      />
    </div>
  );
}

function PropItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm" style={{ color: value !== '—' ? 'var(--text-heading)' : 'var(--text-muted)' }}>{value}</div>
    </div>
  );
}
