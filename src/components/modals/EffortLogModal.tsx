import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { saveEffortLog } from '../../lib/mutations';
import { WORK_EFFORT_OPTIONS } from '../../lib/constants';
import { startOfWeek, format, subWeeks, addWeeks } from 'date-fns';

interface EffortLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initiativeId: string;
  teamMemberId: string;
  currentEffortSize?: string | null;
}

export default function EffortLogModal({ isOpen, onClose, onSaved, initiativeId, teamMemberId, currentEffortSize }: EffortLogModalProps) {
  const currentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
  const [weekDate, setWeekDate] = useState(format(currentWeek, 'yyyy-MM-dd'));
  const [effortSize, setEffortSize] = useState<string | null>(currentEffortSize || null);
  const [customHours, setCustomHours] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWeekDate(format(currentWeek, 'yyyy-MM-dd'));
      setEffortSize(currentEffortSize || null);
      setCustomHours('');
      setUseCustom(false);
      setNote('');
    }
  }, [isOpen, currentEffortSize]);

  const selectedOption = WORK_EFFORT_OPTIONS.find((o) => o.key === effortSize);
  const hours = useCustom ? parseFloat(customHours) || 0 : (selectedOption?.hours || 0);

  async function handleSave() {
    if (hours <= 0) return;
    setSaving(true);
    try {
      await saveEffortLog({
        team_member_id: teamMemberId,
        initiative_id: initiativeId,
        week_start_date: weekDate,
        hours_spent: hours,
        effort_size: useCustom ? undefined : effortSize || undefined,
        note: note || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save effort log error:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  // Week navigation
  const weekOptions = [];
  for (let i = 4; i >= -1; i--) {
    const w = i >= 0 ? subWeeks(currentWeek, i) : addWeeks(currentWeek, Math.abs(i));
    weekOptions.push({
      value: format(w, 'yyyy-MM-dd'),
      label: `Week of ${format(w, 'MMM d, yyyy')}${i === 0 ? ' (Current)' : ''}`,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md rounded-xl shadow-xl border p-6"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <Clock size={20} style={{ color: 'var(--primary-brand-color)' }} />
            Log Effort
          </h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Week Selector */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Week</label>
            <select
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)' }}
            >
              {weekOptions.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>

          {/* Effort Size Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Effort Size</label>
              <button
                onClick={() => { setUseCustom(!useCustom); setEffortSize(null); }}
                className="text-xs underline"
                style={{ color: 'var(--primary-brand-color)' }}
              >
                {useCustom ? 'Use presets' : 'Custom hours'}
              </button>
            </div>

            {useCustom ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  max="40"
                  step="0.5"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>hrs</span>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {WORK_EFFORT_OPTIONS.map((opt) => {
                  const isActive = effortSize === opt.key;
                  const sizeColors: Record<string, string> = { XS: '#22c55e', S: '#3b82f6', M: '#f59e0b', L: '#f97316', XL: '#dc2626' };
                  const color = sizeColors[opt.key] || '#6b7280';
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setEffortSize(opt.key)}
                      className="flex flex-col items-center p-2 rounded-lg border transition-all"
                      style={{
                        borderColor: isActive ? color : 'var(--border-default)',
                        backgroundColor: isActive ? `${color}15` : 'transparent',
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: isActive ? color : 'var(--text-heading)' }}>
                        {opt.key}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.hours}h</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hours Display */}
          <div
            className="text-center py-3 rounded-lg"
            style={{ backgroundColor: 'var(--bg-page)' }}
          >
            <span className="text-2xl font-bold" style={{ color: 'var(--primary-brand-color)' }}>
              {hours.toFixed(1)}
            </span>
            <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>hours this week</span>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 rounded-lg border text-sm"
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
            disabled={saving || hours <= 0}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--primary-brand-color)', color: 'white', opacity: saving || hours <= 0 ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
