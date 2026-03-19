import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Save, Copy, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { supabase, DEFAULT_ORG_ID } from '../../lib/supabase';
import type { Initiative, TeamMember, EffortLog } from '../../lib/supabase';
import { saveEffortLog, saveUserPreference, deleteUserPreference } from '../../lib/mutations';
import { fetchUserPreference } from '../../lib/queries';
import { loadCapacityConfig, calculatePlannedHours, getCapacityThreshold } from '../../lib/workloadCalculator';
import { ACTIVE_INITIATIVE_STATUSES, TYPE_COLORS } from '../../lib/constants';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day); // Sunday start
  return d.toISOString().split('T')[0];
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function StaffView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scis, setScis] = useState<TeamMember[]>([]);
  const [selectedSCI, setSelectedSCI] = useState<string>('');
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [effortLogs, setEffortLogs] = useState<EffortLog[]>([]);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [editedHours, setEditedHours] = useState<Record<string, number>>({});
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({});
  const [plannedTotal, setPlannedTotal] = useState(0);
  const [actualTotal, setActualTotal] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const STAFF_PREF_KEY = 'staffview_favorite_member';

  useEffect(() => { loadSCIs(); }, []);

  async function loadSCIs() {
    const { data } = await supabase.from('team_members').select('*')
      .eq('organization_id', DEFAULT_ORG_ID).eq('is_active', true).in('role', ['sci', 'sci_manager']).order('name');
    const members = data || [];
    setScis(members);

    // Check for favorite
    const pref = await fetchUserPreference(STAFF_PREF_KEY);
    if (pref && members.some((m) => m.id === pref.preference_value)) {
      setSelectedSCI(pref.preference_value);
      setIsFavorited(true);
    }

    setLoading(false);
  }

  async function toggleStaffFavorite() {
    if (isFavorited) {
      await deleteUserPreference(STAFF_PREF_KEY);
      setIsFavorited(false);
    } else if (selectedSCI) {
      await saveUserPreference(STAFF_PREF_KEY, selectedSCI);
      setIsFavorited(true);
    }
  }

  useEffect(() => {
    if (selectedSCI) loadMemberData();
  }, [selectedSCI, weekStart]);

  async function loadMemberData() {
    setLoading(true);
    const config = await loadCapacityConfig();

    // Fetch initiatives for this SCI
    const { data: inits } = await supabase.from('initiatives').select('*')
      .eq('organization_id', DEFAULT_ORG_ID).eq('is_active', true)
      .or(`primary_sci_id.eq.${selectedSCI},secondary_sci_id.eq.${selectedSCI}`);

    const activeInits = (inits || []).filter(i => ACTIVE_INITIATIVE_STATUSES.has(i.status));
    setInitiatives(activeInits);

    // Calculate planned
    let planned = 0;
    for (const init of activeInits) {
      planned += calculatePlannedHours(init, config);
    }
    setPlannedTotal(planned);

    // Fetch effort logs for this week
    const { data: logs } = await supabase.from('effort_logs').select('*')
      .eq('team_member_id', selectedSCI).eq('week_start_date', weekStart);

    setEffortLogs(logs || []);

    // Set edited hours from existing logs
    const hours: Record<string, number> = {};
    const notes: Record<string, string> = {};
    let actual = 0;
    for (const log of logs || []) {
      hours[log.initiative_id] = log.hours_spent;
      notes[log.initiative_id] = log.note || '';
      actual += log.hours_spent;
    }
    setEditedHours(hours);
    setEditedNotes(notes);
    setActualTotal(actual);
    setLoading(false);
  }

  const unsavedTotal = useMemo(() => {
    return Object.values(editedHours).reduce((sum, h) => sum + (h || 0), 0);
  }, [editedHours]);

  const handleHoursChange = (initId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setEditedHours(prev => ({ ...prev, [initId]: num }));
  };

  const handleSaveAll = async () => {
    if (!selectedSCI) return;
    setSaving(true);
    try {
      for (const init of initiatives) {
        const hours = editedHours[init.id] ?? 0;
        if (hours > 0 || effortLogs.some(l => l.initiative_id === init.id)) {
          await saveEffortLog({
            team_member_id: selectedSCI,
            initiative_id: init.id,
            week_start_date: weekStart,
            hours_spent: hours,
            note: editedNotes[init.id] || undefined,
          });
        }
      }
      await loadMemberData();
    } catch (err) {
      console.error('Save effort error:', err);
    } finally {
      setSaving(false);
    }
  };

  const prevWeek = () => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };
  const nextWeek = () => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const plannedPct = Math.round((plannedTotal / 40) * 100);
  const actualPct = Math.round((unsavedTotal / 40) * 100);
  const plannedThreshold = getCapacityThreshold(plannedPct);
  const actualThreshold = getCapacityThreshold(actualPct);
  const selectedName = scis.find(s => s.id === selectedSCI)?.name;

  // Group initiatives by type
  const grouped = useMemo(() => {
    const groups: Record<string, Initiative[]> = {};
    for (const init of initiatives) {
      if (!groups[init.type]) groups[init.type] = [];
      groups[init.type].push(init);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [initiatives]);

  if (loading && !selectedSCI) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with capacity */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-4">
          <select value={selectedSCI} onChange={(e) => setSelectedSCI(e.target.value)}
            className="px-3 py-1.5 rounded-lg border text-sm font-medium"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            <option value="">Select team member...</option>
            {scis.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Favorite button */}
          {selectedSCI && (
            <button
              onClick={toggleStaffFavorite}
              className="p-1.5 rounded-lg border transition-all"
              style={{
                borderColor: isFavorited ? '#f59e0b' : 'var(--border-default)',
                backgroundColor: isFavorited ? '#f59e0b15' : 'transparent',
                color: isFavorited ? '#f59e0b' : 'var(--text-muted)',
              }}
              title={isFavorited ? 'Remove favorite' : 'Set as favorite (auto-selects on load)'}
            >
              <Star size={16} fill={isFavorited ? '#f59e0b' : 'none'} />
            </button>
          )}

          {/* Week selector */}
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium px-2" style={{ color: 'var(--text-heading)' }}>{formatWeek(weekStart)}</span>
            <button onClick={nextWeek} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><ChevronRight size={16} /></button>
          </div>

          <div className="flex-1" />

          {selectedSCI && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Planned: </span>
                <span className="font-bold" style={{ color: plannedThreshold.color }}>{plannedTotal.toFixed(1)}h ({plannedPct}%)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>This Week: </span>
                <span className="font-bold" style={{ color: actualThreshold.color }}>{unsavedTotal.toFixed(1)}h ({actualPct}%)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Variance: </span>
                <span className="font-bold" style={{ color: unsavedTotal - plannedTotal > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {unsavedTotal - plannedTotal > 0 ? '+' : ''}{(unsavedTotal - plannedTotal).toFixed(1)}h
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {!selectedSCI ? (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>Select a team member to log effort</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>
        ) : initiatives.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>No active initiatives for {selectedName}</div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid px-4 py-1.5 border-b text-xs font-medium uppercase tracking-wider sticky top-0 z-10"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)',
                gridTemplateColumns: '72px 1fr 100px 80px 80px 200px' }}>
              <div>ID</div>
              <div>Initiative</div>
              <div>Type</div>
              <div>Effort</div>
              <div>Hours</div>
              <div>Note</div>
            </div>

            {grouped.map(([type, inits]) => (
              <div key={type}>
                <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-b"
                  style={{ backgroundColor: 'var(--bg-surface-hover)', color: TYPE_COLORS[type] || 'var(--text-heading)', borderColor: 'var(--border-default)' }}>
                  {type} ({inits.length})
                </div>
                {inits.map(init => {
                  const typeColor = TYPE_COLORS[init.type] || '#6b7280';
                  return (
                    <div key={init.id} className="grid items-center px-4 py-2 border-b"
                      style={{ borderColor: 'var(--border-default)', gridTemplateColumns: '72px 1fr 100px 80px 80px 200px' }}>
                      <div className="text-xs font-mono" style={{ color: typeColor }}>{init.display_id}</div>
                      <div className="text-sm truncate pr-2" style={{ color: 'var(--text-heading)' }}>{init.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{init.type}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{init.work_effort || '—'}</div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          value={editedHours[init.id] ?? ''}
                          onChange={(e) => handleHoursChange(init.id, e.target.value)}
                          className="w-16 px-2 py-1 rounded border text-sm text-center"
                          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editedNotes[init.id] || ''}
                          onChange={(e) => setEditedNotes(prev => ({ ...prev, [init.id]: e.target.value }))}
                          className="w-full px-2 py-1 rounded border text-xs"
                          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
                          placeholder="Note..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer with save */}
      {selectedSCI && initiatives.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Total: <strong style={{ color: 'var(--text-heading)' }}>{unsavedTotal.toFixed(1)} hrs</strong> across {initiatives.length} initiatives
          </span>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--primary-brand-color)', opacity: saving ? 0.5 : 1 }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      )}
    </div>
  );
}
