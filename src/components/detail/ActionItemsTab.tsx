import { useState, useEffect } from 'react';
import { Plus, Check, Circle, Clock, X, Pencil } from 'lucide-react';
import { fetchActionItems } from '../../lib/queries';
import { createActionItem, updateActionItem, deleteActionItem } from '../../lib/mutations';
import type { ActionItem } from '../../lib/supabase';
import { ACTION_ITEM_STATUSES } from '../../lib/constants';

interface ActionItemsTabProps {
  initiativeId?: string;
  taskId?: string;
}

const CLASSIFICATIONS = ['Action Item', 'Follow-Up', 'Decision', 'Risk', 'Blocker', 'Question'];

const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#6b7280',
  'In Progress': '#3b82f6',
  Complete: '#22c55e',
  Deferred: '#a855f7',
};

export default function ActionItemsTab({ initiativeId, taskId }: ActionItemsTabProps) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [desc, setDesc] = useState('');
  const [classification, setClassification] = useState('Action Item');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadItems();
  }, [initiativeId, taskId]);

  async function loadItems() {
    const data = await fetchActionItems({ initiative_id: initiativeId, task_id: taskId });
    // Sort: Not Started → In Progress → Deferred → Complete, then by due date
    data.sort((a, b) => {
      const statusOrder = { 'Not Started': 0, 'In Progress': 1, Deferred: 2, Complete: 3 };
      const sa = statusOrder[a.status as keyof typeof statusOrder] ?? 0;
      const sb = statusOrder[b.status as keyof typeof statusOrder] ?? 0;
      if (sa !== sb) return sa - sb;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
    setItems(data);
  }

  function resetForm() {
    setDesc('');
    setClassification('Action Item');
    setOwner('');
    setDueDate('');
    setStatus('Not Started');
    setNotes('');
    setEditingItem(null);
    setShowForm(false);
  }

  function openEdit(item: ActionItem) {
    setDesc(item.description);
    setClassification((item as any).classification || 'Action Item');
    setOwner(item.owner || '');
    setDueDate(item.due_date || '');
    setStatus(item.status);
    setNotes(item.notes || '');
    setEditingItem(item);
    setShowForm(true);
  }

  function openNew() {
    resetForm();
    setShowForm(true);
  }

  async function handleSave() {
    if (!desc.trim()) return;
    setSaving(true);
    try {
      const payload = {
        description: desc.trim(),
        owner: owner || undefined,
        due_date: dueDate || undefined,
        status,
        notes: notes || undefined,
        completed_date: status === 'Complete' ? new Date().toISOString().split('T')[0] : undefined,
      };

      if (editingItem) {
        await updateActionItem(editingItem.id, payload);
      } else {
        await createActionItem({
          initiative_id: initiativeId,
          task_id: taskId,
          ...payload,
        });
      }
      resetForm();
      await loadItems();
    } catch (err) {
      console.error('Save action item error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(item: ActionItem, newStatus: string) {
    try {
      await updateActionItem(item.id, {
        status: newStatus,
        completed_date: newStatus === 'Complete' ? new Date().toISOString().split('T')[0] : undefined,
      });
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: newStatus, completed_date: newStatus === 'Complete' ? new Date().toISOString().split('T')[0] : null } : i
      ));
    } catch (err) {
      console.error('Update status error:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this action item?')) return;
    try {
      await deleteActionItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Delete action item error:', err);
    }
  }

  const isOverdue = (item: ActionItem) => {
    if (!item.due_date || item.status === 'Complete') return false;
    return new Date(item.due_date + 'T23:59:59') < new Date();
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-body)',
    borderColor: 'var(--border-default)',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '4px',
  };

  return (
    <div className="space-y-3">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--primary-brand-color)' }}
        >
          <Plus size={14} />
          New Action Item
        </button>
      )}

      {/* Form (create or edit) */}
      {showForm && (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
              {editingItem ? 'Edit Action Item' : 'New Action Item'}
            </h3>
            <button onClick={resetForm} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
          </div>

          {/* Task description */}
          <div>
            <label style={labelStyle}>Task</label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Classification + Owner side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Classification</label>
              <select
                value={classification}
                onChange={e => setClassification(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              >
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Owner</label>
              <input
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="Who's responsible?"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={labelStyle}>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              {ACTION_ITEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional context..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-hover)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !desc.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--primary-brand-color)', opacity: saving || !desc.trim() ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <Check size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No action items yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map(item => {
            const done = item.status === 'Complete';
            const overdue = isOverdue(item);
            const statusColor = STATUS_COLORS[item.status] || '#6b7280';

            return (
              <div
                key={item.id}
                className="rounded-lg px-3 py-2.5 group"
                style={{
                  backgroundColor: overdue ? 'rgba(239,68,68,0.04)' : 'var(--bg-surface)',
                  border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : 'var(--border-default)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Status checkbox */}
                  <button
                    onClick={() => handleStatusChange(item, done ? 'Not Started' : 'Complete')}
                    className="mt-0.5 shrink-0"
                  >
                    {done ? (
                      <Check size={18} style={{ color: 'var(--color-success)' }} />
                    ) : item.status === 'In Progress' ? (
                      <Clock size={18} style={{ color: '#3b82f6' }} />
                    ) : (
                      <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm"
                      style={{
                        color: done ? 'var(--text-muted)' : 'var(--text-body)',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {item.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {/* Inline status selector */}
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item, e.target.value)}
                        className="text-xs px-1.5 py-0.5 rounded border-0 font-medium cursor-pointer"
                        style={{ backgroundColor: `${statusColor}15`, color: statusColor, outline: 'none' }}
                      >
                        {ACTION_ITEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      {item.owner && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.owner}</span>
                      )}

                      {item.due_date && (
                        <span
                          className="text-xs flex items-center gap-1"
                          style={{ color: overdue ? 'var(--color-danger)' : 'var(--text-muted)' }}
                        >
                          <Clock size={10} />
                          {overdue ? 'Overdue: ' : ''}{new Date(item.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}

                      {item.notes && (
                        <span className="text-xs italic truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit + Delete buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
