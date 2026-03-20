import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { InitiativeMetric } from '../../lib/supabase';
import { createInitiativeMetric, updateInitiativeMetric, type CreateInitiativeMetricInput } from '../../lib/mutations';

interface MetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initiativeId: string;
  editingMetric?: InitiativeMetric | null;
}

const UNIT_OPTIONS = [
  { value: 'percent', label: '%' },
  { value: 'dollars', label: '$' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'count', label: 'Count' },
  { value: 'score', label: 'Score' },
];

export function getUnitLabel(unit: string): string {
  return UNIT_OPTIONS.find(u => u.value === unit)?.label || unit;
}

export default function MetricModal({ isOpen, onClose, onSaved, initiativeId, editingMetric }: MetricModalProps) {
  const [metricName, setMetricName] = useState('');
  const [unit, setUnit] = useState('percent');
  const [baselineValue, setBaselineValue] = useState('');
  const [baselineDate, setBaselineDate] = useState('');
  const [baselineTimeframe, setBaselineTimeframe] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [resultTimeframe, setResultTimeframe] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingMetric) {
      setMetricName(editingMetric.metric_name);
      setUnit(editingMetric.unit);
      setBaselineValue(editingMetric.baseline_value != null ? String(editingMetric.baseline_value) : '');
      setBaselineDate(editingMetric.baseline_date || '');
      setBaselineTimeframe(editingMetric.baseline_timeframe || '');
      setTargetValue(editingMetric.target_value != null ? String(editingMetric.target_value) : '');
      setResultValue(editingMetric.result_value != null ? String(editingMetric.result_value) : '');
      setResultDate(editingMetric.result_date || '');
      setResultTimeframe(editingMetric.result_timeframe || '');
      setNotes(editingMetric.notes || '');
    } else {
      setMetricName('');
      setUnit('percent');
      setBaselineValue('');
      setBaselineDate('');
      setBaselineTimeframe('');
      setTargetValue('');
      setResultValue('');
      setResultDate('');
      setResultTimeframe('');
      setNotes('');
    }
  }, [editingMetric, isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!metricName.trim()) return;
    setSaving(true);

    const input: CreateInitiativeMetricInput = {
      initiative_id: initiativeId,
      metric_name: metricName.trim(),
      unit,
      baseline_value: baselineValue ? parseFloat(baselineValue) : null,
      baseline_date: baselineDate || null,
      baseline_timeframe: baselineTimeframe || null,
      target_value: targetValue ? parseFloat(targetValue) : null,
      result_value: resultValue ? parseFloat(resultValue) : null,
      result_date: resultDate || null,
      result_timeframe: resultTimeframe || null,
      notes: notes || null,
    };

    try {
      if (editingMetric) {
        const { initiative_id: _, ...updates } = input;
        await updateInitiativeMetric(editingMetric.id, updates);
      } else {
        await createInitiativeMetric(input);
      }
      onSaved();
    } catch (err) {
      console.error('Error saving metric:', err);
    } finally {
      setSaving(false);
    }
  }

  const sectionLabelStyle = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
    marginTop: '20px',
  };

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
            {editingMetric ? 'Edit Metric' : 'Add Metric'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-1">
          {/* Metric Name + Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Metric Name
              </label>
              <input
                type="text"
                value={metricName}
                onChange={e => setMetricName(e.target.value)}
                placeholder="e.g., Patient Wait Time"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Unit
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              >
                {UNIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pre-Initiative Baseline */}
          <div style={sectionLabelStyle}>
            <span style={{ color: 'var(--text-muted)' }}>Pre-Initiative Baseline</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Value</label>
              <input
                type="number"
                step="any"
                value={baselineValue}
                onChange={e => setBaselineValue(e.target.value)}
                placeholder="e.g., 45"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Date</label>
              <input
                type="date"
                value={baselineDate}
                onChange={e => setBaselineDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Timeframe</label>
            <input
              type="text"
              value={baselineTimeframe}
              onChange={e => setBaselineTimeframe(e.target.value)}
              placeholder="e.g., Jan-Jun 26"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
            />
          </div>

          {/* Target */}
          <div style={sectionLabelStyle}>
            <span style={{ color: '#f59e0b' }}>Target</span>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Target Value</label>
            <input
              type="number"
              step="any"
              value={targetValue}
              onChange={e => setTargetValue(e.target.value)}
              placeholder="e.g., 20"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
            />
          </div>

          {/* Post-Initiative Result */}
          <div style={sectionLabelStyle}>
            <span style={{ color: '#22c55e' }}>Post-Initiative Result</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Value</label>
              <input
                type="number"
                step="any"
                value={resultValue}
                onChange={e => setResultValue(e.target.value)}
                placeholder="e.g., 22"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Date</label>
              <input
                type="date"
                value={resultDate}
                onChange={e => setResultDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Timeframe</label>
            <input
              type="text"
              value={resultTimeframe}
              onChange={e => setResultTimeframe(e.target.value)}
              placeholder="e.g., Jan-Jun 26"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
            />
          </div>

          {/* Notes */}
          <div style={sectionLabelStyle}>
            <span style={{ color: 'var(--text-muted)' }}>Notes</span>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional context for this metric..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)' }}
          />
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
            disabled={saving || !metricName.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
            style={{
              backgroundColor: saving || !metricName.trim() ? '#9ca3af' : 'var(--primary-brand-color)',
              cursor: saving || !metricName.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingMetric ? 'Update Metric' : 'Add Metric'}
          </button>
        </div>
      </div>
    </div>
  );
}
