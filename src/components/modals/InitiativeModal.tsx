import { useState, useEffect } from 'react';
import Modal, { ModalButton } from '../core/Modal';
import type { Initiative, TeamMember } from '../../lib/supabase';
import { createInitiative, updateInitiative, type CreateInitiativeInput } from '../../lib/mutations';
import { fetchSCIs } from '../../lib/queries';
import {
  INITIATIVE_TYPES,
  PRIORITIES,
  INITIATIVE_STATUSES,
  PHASES,
  WORK_EFFORT_OPTIONS,
  ROLES,
  GO_LIVE_WAVES,
  EPIC_MODULES,
  VENUES,
  ROLES_IMPACTED,
  SPECIALTIES,
  EG_SUBTYPES,
  EG_SUBTYPE_COLORS,
} from '../../lib/constants';

const TYPE_CARDS = [
  { key: 'Epic Gold', label: 'Epic Gold', color: '#f59e0b' },
  { key: 'System Project', label: 'System Project', color: '#8b5cf6' },
  { key: 'System Initiative', label: 'System Initiative', color: '#0ea5e9' },
  { key: 'Market Project', label: 'Market Initiative', color: '#ec4899' },
  { key: 'Governance', label: 'Governance', color: '#6366f1' },
  { key: 'Consultation', label: 'Consultation', color: '#14b8a6' },
  { key: 'Team Assignment', label: 'Team Assignment', color: '#a855f7' },
  { key: 'Ticket', label: 'Ticket', color: '#f97316' },
  { key: 'General Support', label: 'General Support', color: '#6b7280' },
];

interface InitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initiative?: Initiative | null; // null = create mode
}

export default function InitiativeModal({ isOpen, onClose, onSaved, initiative }: InitiativeModalProps) {
  const isEdit = !!initiative;
  const [saving, setSaving] = useState(false);
  const [scis, setScis] = useState<TeamMember[]>([]);

  const [form, setForm] = useState<CreateInitiativeInput>({
    name: '',
    description: '',
    type: 'Epic Gold',
    priority: 'Medium',
    status: 'Not Started',
    work_effort: 'M',
    phase: '',
    role: 'Owner',
    start_date: '',
    target_date: '',
    primary_sci_id: '',
    secondary_sci_id: '',
    go_live_wave: '',
    applications: [],
    venues: [],
    roles_impacted: [],
    specialty_service_line: [],
    system_sponsor: '',
    policy_link: '',
    ehr_requirements_link: '',
    specialized_workflow_needed: false,
    eg_subtype: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchSCIs().then(setScis);
      if (initiative) {
        setForm({
          name: initiative.name,
          description: initiative.description || '',
          type: initiative.type,
          priority: initiative.priority,
          status: initiative.status,
          work_effort: initiative.work_effort || 'M',
          phase: initiative.phase || '',
          role: initiative.role || 'Owner',
          start_date: initiative.start_date || '',
          target_date: initiative.target_date || '',
          primary_sci_id: initiative.primary_sci_id || '',
          secondary_sci_id: initiative.secondary_sci_id || '',
          go_live_wave: initiative.go_live_wave || '',
          applications: initiative.applications || [],
          venues: initiative.venues || [],
          roles_impacted: initiative.roles_impacted || [],
          specialty_service_line: initiative.specialty_service_line || [],
          system_sponsor: initiative.system_sponsor || '',
          policy_link: initiative.policy_link || '',
          ehr_requirements_link: initiative.ehr_requirements_link || '',
          specialized_workflow_needed: initiative.specialized_workflow_needed || false,
          eg_subtype: initiative.eg_subtype || '',
        });
      } else {
        setForm({
          name: '',
          description: '',
          type: 'Epic Gold',
          priority: 'Medium',
          status: 'Not Started',
          work_effort: 'M',
          phase: '',
          role: 'Owner',
          start_date: '',
          target_date: '',
          primary_sci_id: '',
          secondary_sci_id: '',
          go_live_wave: '',
          applications: [],
          venues: [],
          roles_impacted: [],
          specialty_service_line: [],
          system_sponsor: '',
          policy_link: '',
          ehr_requirements_link: '',
          specialized_workflow_needed: false,
        });
      }
    }
  }, [isOpen, initiative]);

  const isEpicGold = form.type === 'Epic Gold';

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (isEdit && initiative) {
        await updateInitiative(initiative.id, form);
      } else {
        await createInitiative(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save initiative error:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof CreateInitiativeInput>(key: K, value: CreateInitiativeInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'applications' | 'venues' | 'roles_impacted' | 'specialty_service_line', item: string) => {
    setForm((prev) => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-body)',
    borderColor: 'var(--border-default)',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '4px',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Initiative' : 'New Initiative'}
      size="wide"
      footer={
        <>
          <ModalButton onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Initiative'}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* ─── Type Chooser (visual cards) ─── */}
        {!isEdit && (
          <div>
            <label style={labelStyle}>What type of work is this?</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {TYPE_CARDS.map((card) => {
                const selected = form.type === card.key;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => updateField('type', card.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      border: `2px solid ${selected ? card.color : 'var(--border-default)'}`,
                      backgroundColor: selected ? `${card.color}18` : 'transparent',
                      color: selected ? card.color : 'var(--text-body)',
                    }}
                  >
                    {card.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label style={labelStyle}>Initiative Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={inputStyle}
            placeholder={isEpicGold ? 'e.g., Medication Reconciliation Policy Update' : 'e.g., Patient Portal Optimization'}
          />
        </div>

        {/* EG Sub-Type (conditional — only for Epic Gold) */}
        {isEpicGold && (
          <div>
            <label style={labelStyle}>Type (Standard, Policy, Guideline, Board Goal) *</label>
            <div className="flex gap-1.5 mt-1">
              {EG_SUBTYPES.map((st) => {
                const selected = form.eg_subtype === st;
                const color = EG_SUBTYPE_COLORS[st] || '#6b7280';
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateField('eg_subtype', st)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      border: `2px solid ${selected ? color : 'var(--border-default)'}`,
                      backgroundColor: selected ? `${color}18` : 'transparent',
                      color: selected ? color : 'var(--text-body)',
                    }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={inputStyle}
            rows={2}
            placeholder="Brief description..."
          />
        </div>

        {/* Row: Priority + Status (Type is now chosen above) */}
        <div className="grid grid-cols-3 gap-3">
          {isEdit && (
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              >
                {INITIATIVE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => updateField('priority', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              {INITIATIVE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row: Primary SCI + Secondary SCI */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Primary SCI</label>
            <select
              value={form.primary_sci_id}
              onChange={(e) => updateField('primary_sci_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <option value="">Select SCI...</option>
              {scis.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Secondary SCI</label>
            <select
              value={form.secondary_sci_id}
              onChange={(e) => updateField('secondary_sci_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <option value="">Select SCI...</option>
              {scis.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row: Work Effort + Phase */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Work Effort</label>
            <select
              value={form.work_effort}
              onChange={(e) => updateField('work_effort', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              {WORK_EFFORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Phase</label>
            <select
              value={form.phase}
              onChange={(e) => updateField('phase', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <option value="">Select phase...</option>
              {PHASES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Target Date</label>
            <input
              type="date"
              value={form.target_date}
              onChange={(e) => updateField('target_date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        {/* ─── Epic Gold-specific fields ─── */}
        {/* ─── Standard Fields: Venues, Roles, Specialty (always visible) ─── */}
        <div>
          <label style={labelStyle}>Venues</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {VENUES.map((v) => {
              const selected = form.venues?.includes(v);
              return (
                <button key={v} type="button" onClick={() => toggleArrayItem('venues', v)}
                  className="px-2 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ backgroundColor: selected ? 'var(--primary-brand-color)' : 'var(--bg-surface-hover)', color: selected ? 'white' : 'var(--text-body)' }}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Roles / Disciplines Impacted</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ROLES_IMPACTED.map((r) => {
              const selected = form.roles_impacted?.includes(r);
              return (
                <button key={r} type="button" onClick={() => toggleArrayItem('roles_impacted', r)}
                  className="px-2 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ backgroundColor: selected ? 'var(--primary-brand-color)' : 'var(--bg-surface-hover)', color: selected ? 'white' : 'var(--text-body)' }}>
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Specialty / Service Line</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {SPECIALTIES.map((s) => {
              const selected = form.specialty_service_line?.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleArrayItem('specialty_service_line', s)}
                  className="px-2 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ backgroundColor: selected ? 'var(--primary-brand-color)' : 'var(--bg-surface-hover)', color: selected ? 'white' : 'var(--text-body)' }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Epic Gold-specific fields ─── */}
        {isEpicGold && (
          <div
            className="rounded-lg p-4 space-y-4"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-epic-gold)' }}>
                Epic Gold Fields
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Go-Live Wave</label>
                <select value={form.go_live_wave} onChange={(e) => updateField('go_live_wave', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
                  <option value="">Select wave...</option>
                  {GO_LIVE_WAVES.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>System Sponsor</label>
                <input type="text" value={form.system_sponsor} onChange={(e) => updateField('system_sponsor', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle} placeholder="Sponsor name..." />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Applications / Modules</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {EPIC_MODULES.map((mod) => {
                  const selected = form.applications?.includes(mod);
                  return (
                    <button key={mod} type="button" onClick={() => toggleArrayItem('applications', mod)}
                      className="px-2 py-1 rounded-full text-xs font-medium transition-colors"
                      style={{ backgroundColor: selected ? 'var(--primary-brand-color)' : 'var(--bg-surface-hover)', color: selected ? 'white' : 'var(--text-body)' }}>
                      {mod}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Policy Link</label>
                <input
                  type="url"
                  value={form.policy_link}
                  onChange={(e) => updateField('policy_link', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label style={labelStyle}>EHR Requirements Link</label>
                <input
                  type="url"
                  value={form.ehr_requirements_link}
                  onChange={(e) => updateField('ehr_requirements_link', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Specialized Workflow */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.specialized_workflow_needed || false}
                onChange={(e) => updateField('specialized_workflow_needed', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--text-body)' }}>
                Specialized workflow build needed
              </span>
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}
