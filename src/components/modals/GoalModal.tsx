import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Goal } from '../../lib/supabase';
import { createGoal, updateGoal, type CreateGoalInput } from '../../lib/mutations';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingGoal?: Goal | null;
  /** Force level for SCI-created goals */
  forceLevel?: 'organization' | 'team' | 'individual';
  /** Auto-set owner name */
  defaultOwner?: string;
  /** Auto-set team_member_id for individual goals */
  defaultMemberId?: string;
}

const LEVEL_OPTIONS = [
  { value: 'organization', label: 'Organizational' },
  { value: 'team', label: 'Team' },
  { value: 'individual', label: 'Individual' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
] as const;

export default function GoalModal({
  isOpen, onClose, onSaved, editingGoal, forceLevel, defaultOwner, defaultMemberId,
}: GoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'organization' | 'team' | 'individual'>('individual');
  const [ownerName, setOwnerName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || '');
      setLevel(editingGoal.level);
      setOwnerName(editingGoal.owner_name || '');
      setTargetDate(editingGoal.target_date || '');
      setStatus(editingGoal.status || 'active');
    } else {
      setTitle('');
      setDescription('');
      setLevel(forceLevel || 'individual');
      setOwnerName(defaultOwner || '');
      setTargetDate('');
      setStatus('active');
    }
  }, [editingGoal, isOpen, forceLevel, defaultOwner]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const input: CreateGoalInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      level: forceLevel || level,
      owner_name: ownerName.trim() || 'Unassigned',
      team_member_id: (forceLevel === 'individual' || level === 'individual') ? (defaultMemberId || null) : null,
      target_date: targetDate || undefined,
      status,
    };

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, input);
      } else {
        await createGoal(input);
      }
      onSaved();
    } catch (err) {
      console.error('Error saving goal:', err);
    } finally {
      setSaving(false);
    }
  }

  const effectiveLevel = forceLevel || level;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl shadow-2xl border overflow-y-auto max-h-[90vh]"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
            {editingGoal ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Goal Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Reduce documentation burden by 20%"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
            />
          </div>

          {/* Level + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Level
              </label>
              {forceLevel ? (
                <div className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-body)' }}>
                  {LEVEL_OPTIONS.find(l => l.value === forceLevel)?.label}
                </div>
              ) : (
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
                >
                  {LEVEL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the goal and expected outcomes..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
            />
          </div>

          {/* Owner + Target Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Owner
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder={effectiveLevel === 'individual' ? 'Auto-set' : 'e.g., System Leadership'}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm font-medium"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
            style={{
              backgroundColor: saving || !title.trim() ? '#9ca3af' : 'var(--primary-brand-color)',
              cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingGoal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}
