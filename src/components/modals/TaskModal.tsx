import { useState, useEffect } from 'react';
import Modal, { ModalButton } from '../core/Modal';
import type { Task, TeamMember } from '../../lib/supabase';
import { createTask, updateTask, type CreateTaskInput } from '../../lib/mutations';
import { fetchAnalysts } from '../../lib/queries';
import {
  PRIORITIES,
  TASK_STATUSES,
  EPIC_MODULES,
  BUILD_REVIEW_OPTIONS,
} from '../../lib/constants';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initiativeId: string;
  task?: Task | null;
}

export default function TaskModal({ isOpen, onClose, onSaved, initiativeId, task }: TaskModalProps) {
  const isEdit = !!task;
  const [saving, setSaving] = useState(false);
  const [analysts, setAnalysts] = useState<TeamMember[]>([]);

  const [form, setForm] = useState<Omit<CreateTaskInput, 'initiative_id'>>({
    description: '',
    module: '',
    priority: 'Medium',
    status: 'Identified',
    primary_analyst_id: '',
    education_required: false,
    build_review_status: '',
    build_review_date: '',
    resolution_date: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchAnalysts().then(setAnalysts);
      if (task) {
        setForm({
          description: task.description,
          module: task.module || '',
          priority: task.priority,
          status: task.status,
          primary_analyst_id: task.primary_analyst_id || '',
          education_required: task.education_required,
          build_review_status: task.build_review_status || '',
          build_review_date: task.build_review_date || '',
          resolution_date: task.resolution_date || '',
        });
      } else {
        setForm({
          description: '',
          module: '',
          priority: 'Medium',
          status: 'Identified',
          primary_analyst_id: '',
          education_required: false,
          build_review_status: '',
          build_review_date: '',
          resolution_date: '',
        });
      }
    }
  }, [isOpen, task]);

  const handleSave = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      if (isEdit && task) {
        await updateTask(task.id, form);
      } else {
        await createTask({ ...form, initiative_id: initiativeId });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save task error:', err);
    } finally {
      setSaving(false);
    }
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
      title={isEdit ? 'Edit Task' : 'New Task'}
      size="wide"
      footer={
        <>
          <ModalButton onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSave} disabled={saving || !form.description.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label style={labelStyle}>Task Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={inputStyle}
            rows={3}
            placeholder="Describe the task..."
            autoFocus
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label style={labelStyle}>Module</label>
            <select
              value={form.module}
              onChange={(e) => setForm((p) => ({ ...p, module: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <option value="">Select module...</option>
              {EPIC_MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
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
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Primary Analyst</label>
            <select
              value={form.primary_analyst_id}
              onChange={(e) => setForm((p) => ({ ...p, primary_analyst_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <option value="">Select analyst...</option>
              {analysts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Build Review</label>
            <select
              value={form.build_review_status}
              onChange={(e) => setForm((p) => ({ ...p, build_review_status: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <option value="">Select...</option>
              {BUILD_REVIEW_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Build Review Date</label>
            <input
              type="date"
              value={form.build_review_date}
              onChange={(e) => setForm((p) => ({ ...p, build_review_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Resolution Date</label>
            <input
              type="date"
              value={form.resolution_date}
              onChange={(e) => setForm((p) => ({ ...p, resolution_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.education_required}
            onChange={(e) => setForm((p) => ({ ...p, education_required: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm" style={{ color: 'var(--text-body)' }}>Education required</span>
        </label>
      </div>
    </Modal>
  );
}
