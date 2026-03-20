import { useState, useEffect } from 'react';
import { X, Search, Plus, UserPlus } from 'lucide-react';
import { fetchAllStakeholders } from '../../lib/queries';
import { createStakeholder, addStakeholderToInitiative } from '../../lib/mutations';
import type { Stakeholder } from '../../lib/supabase';

interface StakeholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initiativeId: string;
  existingStakeholderIds: string[];
}

const STAKEHOLDER_ROLES = [
  'Sponsor',
  'Lead',
  'SME',
  'Informaticist',
  'Analyst',
  'Approver',
  'Advisor',
  'Clinical Leader',
  'IT Lead',
  'EHR Analyst',
  'Workgroup Lead',
  'Practice Council Lead',
  'SCI Leader',
  'Executive Sponsor',
  'Technical Lead',
  'Contributor',
  'End User',
  'Other',
];

export default function StakeholderModal({ isOpen, onClose, onSaved, initiativeId, existingStakeholderIds }: StakeholderModalProps) {
  const [allStakeholders, setAllStakeholders] = useState<Stakeholder[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'select' | 'create'>('select');

  // Create new stakeholder fields
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStakeholders();
      setSearch('');
      setSelectedRole('');
      setMode('select');
      resetNewFields();
    }
  }, [isOpen]);

  function resetNewFields() {
    setNewName('');
    setNewTitle('');
    setNewEmail('');
    setNewDepartment('');
  }

  async function loadStakeholders() {
    const data = await fetchAllStakeholders();
    setAllStakeholders(data);
  }

  const filteredStakeholders = allStakeholders.filter((s) => {
    if (existingStakeholderIds.includes(s.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  async function handleSelectStakeholder(stakeholder: Stakeholder) {
    setSaving(true);
    try {
      await addStakeholderToInitiative(initiativeId, stakeholder.id, selectedRole || undefined);
      onSaved();
    } catch (err) {
      console.error('Error adding stakeholder:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAndAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const stakeholder = await createStakeholder({
        name: newName.trim(),
        title: newTitle.trim() || undefined,
        email: newEmail.trim() || undefined,
        department: newDepartment.trim() || undefined,
      });
      await addStakeholderToInitiative(initiativeId, stakeholder.id, selectedRole || undefined);
      onSaved();
    } catch (err) {
      console.error('Error creating stakeholder:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <UserPlus size={20} style={{ color: 'var(--primary-brand-color)' }} />
            Add Stakeholder
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Role selector (shared between both modes) */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Role on this initiative
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
            >
              <option value="">Select role...</option>
              {STAKEHOLDER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
            <button
              onClick={() => setMode('select')}
              className="flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              style={mode === 'select'
                ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-heading)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                : { color: 'var(--text-muted)' }
              }
            >
              <Search size={14} /> Search Existing
            </button>
            <button
              onClick={() => setMode('create')}
              className="flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              style={mode === 'create'
                ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-heading)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                : { color: 'var(--text-muted)' }
              }
            >
              <Plus size={14} /> Create New
            </button>
          </div>

          {mode === 'select' ? (
            <>
              {/* Search bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by name, title, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
                  autoFocus
                />
              </div>

              {/* Stakeholder list */}
              <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border p-1" style={{ borderColor: 'var(--border-default)' }}>
                {filteredStakeholders.length === 0 ? (
                  <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    <p className="text-sm">{search ? 'No matching stakeholders' : 'No stakeholders available'}</p>
                    <button
                      onClick={() => setMode('create')}
                      className="text-xs mt-1 underline"
                      style={{ color: 'var(--primary-brand-color)' }}
                    >
                      Create a new one
                    </button>
                  </div>
                ) : (
                  filteredStakeholders.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStakeholder(s)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                      style={{ color: 'var(--text-body)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: 'var(--primary-brand-color)' }}
                      >
                        {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>{s.name}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {[s.title, s.department].filter(Boolean).join(' \u00B7 ') || s.email || 'No details'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Create new stakeholder form */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. VP of Clinical Informatics"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@org.com"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. IT, Clinical"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
                  />
                </div>
              </div>
              <button
                onClick={handleCreateAndAdd}
                disabled={saving || !newName.trim()}
                className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                  backgroundColor: !newName.trim() || saving ? 'var(--text-muted)' : 'var(--primary-brand-color)',
                  opacity: !newName.trim() || saving ? 0.5 : 1,
                }}
              >
                {saving ? 'Adding...' : 'Create & Add to Initiative'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
