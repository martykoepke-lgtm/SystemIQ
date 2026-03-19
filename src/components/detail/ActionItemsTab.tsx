import { useState, useEffect } from 'react';
import { Plus, Check, Circle, Clock, X } from 'lucide-react';
import { fetchActionItems } from '../../lib/queries';
import { createActionItem, updateActionItem, deleteActionItem } from '../../lib/mutations';
import type { ActionItem } from '../../lib/supabase';

interface ActionItemsTabProps {
  initiativeId?: string;
  taskId?: string;
}

export default function ActionItemsTab({ initiativeId, taskId }: ActionItemsTabProps) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadItems();
  }, [initiativeId, taskId]);

  async function loadItems() {
    const data = await fetchActionItems({ initiative_id: initiativeId, task_id: taskId });
    setItems(data);
  }

  async function handleAdd() {
    if (!desc.trim()) return;
    setSaving(true);
    try {
      await createActionItem({
        initiative_id: initiativeId,
        task_id: taskId,
        description: desc.trim(),
        owner: owner || undefined,
        due_date: dueDate || undefined,
        status: 'Not Started',
      });
      setDesc('');
      setOwner('');
      setDueDate('');
      setShowForm(false);
      await loadItems();
    } catch (err) {
      console.error('Add action item error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(item: ActionItem) {
    const newStatus = item.status === 'Complete' ? 'Not Started' : 'Complete';
    try {
      await updateActionItem(item.id, {
        status: newStatus,
        completed_date: newStatus === 'Complete' ? new Date().toISOString().split('T')[0] : undefined,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      console.error('Toggle action item error:', err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteActionItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Delete action item error:', err);
    }
  }

  const isOverdue = (item: ActionItem) => {
    if (!item.due_date || item.status === 'Complete') return false;
    return new Date(item.due_date) < new Date();
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-body)',
    borderColor: 'var(--border-default)',
  };

  return (
    <div className="space-y-3">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--primary-brand-color)' }}
        >
          <Plus size={14} />
          New Action Item
        </button>
      )}

      {/* Inline add form */}
      {showForm && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)' }}
        >
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Action item description..."
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={inputStyle}
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner"
              className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
              style={inputStyle}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !desc.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--primary-brand-color)', opacity: saving || !desc.trim() ? 0.5 : 1 }}
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <Check size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No action items yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const done = item.status === 'Complete';
            const overdue = isOverdue(item);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 group"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <button onClick={() => toggleComplete(item)} className="mt-0.5 shrink-0">
                  {done ? (
                    <Check size={18} style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>
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
                  <div className="flex items-center gap-2 mt-1">
                    {item.owner && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.owner}</span>
                    )}
                    {item.due_date && (
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: overdue ? 'var(--color-danger)' : 'var(--text-muted)' }}
                      >
                        <Clock size={10} />
                        {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
