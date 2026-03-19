import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createGovernanceRecord, updateGovernanceRecord } from '../../lib/mutations';
import type { GovernanceRecord } from '../../lib/supabase';
import { GOVERNANCE_STATUSES, GOVERNANCE_STATUS_COLORS } from '../../lib/constants';

interface GovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initiativeId: string;
  record: GovernanceRecord | null;
}

export default function GovernanceModal({ isOpen, onClose, onSaved, initiativeId, record }: GovernanceModalProps) {
  const [ticketNumber, setTicketNumber] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [status, setStatus] = useState('Drafting');
  const [conditions, setConditions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setTicketNumber(record.ticket_number || '');
      setSubmissionDate(record.submission_date || '');
      setReviewDate(record.review_date || '');
      setDecisionDate(record.decision_date || '');
      setStatus(record.status);
      setConditions(record.conditions || '');
    } else {
      setTicketNumber('');
      setSubmissionDate('');
      setReviewDate('');
      setDecisionDate('');
      setStatus('Drafting');
      setConditions('');
    }
  }, [record, isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        initiative_id: initiativeId,
        ticket_number: ticketNumber || undefined,
        submission_date: submissionDate || undefined,
        review_date: reviewDate || undefined,
        decision_date: decisionDate || undefined,
        status,
        conditions: conditions || undefined,
      };

      if (record) {
        await updateGovernanceRecord(record.id, payload);
      } else {
        await createGovernanceRecord(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save governance record error:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-xl border p-6"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
            {record ? 'Edit Governance Record' : 'Add Governance Record'}
          </h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Ticket Number</label>
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="e.g., GOV-2026-0042"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)', fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Status</label>
            <div className="flex flex-wrap gap-1.5">
              {GOVERNANCE_STATUSES.map((s) => {
                const color = GOVERNANCE_STATUS_COLORS[s] || '#6b7280';
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? `${color}20` : 'transparent',
                      color: isActive ? color : 'var(--text-muted)',
                      border: `1px solid ${isActive ? color : 'var(--border-default)'}`,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Submission Date</label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Review Date</label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Decision Date</label>
              <input
                type="date"
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Conditions / Notes</label>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Any conditions, feedback, or notes from governance review..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)' }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--primary-brand-color)', color: 'white', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : record ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
