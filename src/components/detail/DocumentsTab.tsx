import { useState, useEffect } from 'react';
import { Plus, ExternalLink, X, FileText } from 'lucide-react';
import { fetchDocuments } from '../../lib/queries';
import { createDocument, deleteDocument } from '../../lib/mutations';
import type { Document } from '../../lib/supabase';
import { DOCUMENT_TYPES } from '../../lib/constants';

interface DocumentsTabProps {
  initiativeId?: string;
  taskId?: string;
}

export default function DocumentsTab({ initiativeId, taskId }: DocumentsTabProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Reference');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [initiativeId, taskId]);

  async function loadDocs() {
    const data = await fetchDocuments({ initiative_id: initiativeId, task_id: taskId });
    setDocs(data);
  }

  async function handleAdd() {
    if (!docName.trim()) return;
    setSaving(true);
    try {
      await createDocument({
        initiative_id: initiativeId,
        task_id: taskId,
        document_name: docName.trim(),
        document_type: docType,
        url: url || undefined,
      });
      setDocName('');
      setDocType('Reference');
      setUrl('');
      setShowForm(false);
      await loadDocs();
    } catch (err) {
      console.error('Add document error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Delete document error:', err);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-body)',
    borderColor: 'var(--border-default)',
  };

  return (
    <div className="space-y-3">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--primary-brand-color)' }}
        >
          <Plus size={14} />
          Link Document
        </button>
      )}

      {showForm && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)' }}
        >
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Document name..."
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={inputStyle}
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={inputStyle}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            <button
              onClick={handleAdd}
              disabled={saving || !docName.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--primary-brand-color)', opacity: saving || !docName.trim() ? 0.5 : 1 }}
            >
              {saving ? 'Linking...' : 'Link'}
            </button>
          </div>
        </div>
      )}

      {docs.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No documents linked yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 group"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <FileText size={16} style={{ color: 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: 'var(--primary-brand-color)' }}
                  >
                    {doc.document_name}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>{doc.document_name}</span>
                )}
                {doc.document_type && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{doc.document_type}</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
