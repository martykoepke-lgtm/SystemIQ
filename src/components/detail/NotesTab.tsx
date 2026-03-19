import { useState, useEffect } from 'react';
import { Plus, X, MessageSquare } from 'lucide-react';
import { fetchNotes } from '../../lib/queries';
import { createNote, deleteNote } from '../../lib/mutations';
import type { Note } from '../../lib/supabase';
import { NOTE_TYPES } from '../../lib/constants';

interface NotesTabProps {
  initiativeId?: string;
  taskId?: string;
}

const TYPE_COLORS: Record<string, string> = {
  General: '#6b7280',
  Decision: '#3b82f6',
  Blocker: '#ef4444',
  'Status Update': '#22c55e',
  'Meeting Notes': '#8b5cf6',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotesTab({ initiativeId, taskId }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('General');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [initiativeId, taskId]);

  async function loadNotes() {
    const data = await fetchNotes({ initiative_id: initiativeId, task_id: taskId });
    setNotes(data);
  }

  async function handleAdd() {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await createNote({
        initiative_id: initiativeId,
        task_id: taskId,
        note_text: noteText.trim(),
        note_type: noteType,
        author: 'Current User', // TODO: replace with auth user
      });
      setNoteText('');
      setNoteType('General');
      await loadNotes();
    } catch (err) {
      console.error('Add note error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Delete note error:', err);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
            className="px-2 py-1 rounded-md border text-xs"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
          >
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
        />
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={saving || !noteText.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--primary-brand-color)', opacity: saving || !noteText.trim() ? 0.5 : 1 }}
          >
            <Plus size={14} />
            {saving ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const typeColor = TYPE_COLORS[note.note_type] || '#6b7280';
            return (
              <div
                key={note.id}
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                  >
                    {note.note_type}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {note.author} · {timeAgo(note.created_at)}
                  </span>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="ml-auto p-0.5 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-body)' }}>
                  {note.note_text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
