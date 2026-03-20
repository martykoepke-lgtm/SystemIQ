import { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, ChevronLeft, ChevronRight, Star, ChevronDown, ChevronUp, Target, Plus, Pencil, Trash2, Link2, X, Search } from 'lucide-react';
import { supabase, DEFAULT_ORG_ID } from '../../lib/supabase';
import type { Initiative, TeamMember, EffortLog, Goal } from '../../lib/supabase';
import { saveEffortLog, saveUserPreference, deleteUserPreference, linkInitiativeToGoal, unlinkInitiativeFromGoal, deleteGoal } from '../../lib/mutations';
import { fetchUserPreference, fetchGoalsForMember, fetchInitiativesForGoal, fetchInitiativesForMember } from '../../lib/queries';
import { loadCapacityConfig, calculatePlannedHours, getCapacityThreshold } from '../../lib/workloadCalculator';
import { ACTIVE_INITIATIVE_STATUSES, TYPE_COLORS } from '../../lib/constants';
import GoalModal from '../modals/GoalModal';

// ─── Goal helpers ───

const LEVEL_COLORS: Record<string, string> = {
  organization: '#8B2B6E',
  team: '#3b82f6',
  individual: '#22c55e',
};

const LEVEL_LABELS: Record<string, string> = {
  organization: 'Org',
  team: 'Team',
  individual: 'Individual',
};

function calculateGoalProgress(linkedInitiatives: Initiative[]): number {
  if (linkedInitiatives.length === 0) return 0;
  let total = 0;
  for (const init of linkedInitiatives) {
    const s = (init.status || '').toLowerCase();
    if (s === 'completed' || s === 'complete') total += 100;
    else if (s === 'in progress' || s === 'in-progress') total += 50;
    else if (s === 'on hold' || s === 'on-hold') total += 25;
  }
  return Math.round(total / linkedInitiatives.length);
}

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
  const [_actualTotal, setActualTotal] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Goals section state
  const [goalsExpanded, setGoalsExpanded] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalLinkedInits, setGoalLinkedInits] = useState<Record<string, Initiative[]>>({});
  const [memberInitiatives, setMemberInitiatives] = useState<Initiative[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [linkSearchGoalId, setLinkSearchGoalId] = useState<string | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

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

  // Load goals when selected member changes
  useEffect(() => {
    if (selectedSCI) {
      loadGoals();
    } else {
      setGoals([]);
      setGoalLinkedInits({});
      setMemberInitiatives([]);
    }
  }, [selectedSCI]);

  async function loadGoals() {
    if (!selectedSCI) return;
    setGoalsLoading(true);
    try {
      const [goalsData, memberInits] = await Promise.all([
        fetchGoalsForMember(selectedSCI),
        fetchInitiativesForMember(selectedSCI),
      ]);
      setGoals(goalsData);
      setMemberInitiatives(memberInits);

      // Load linked initiatives for each goal
      const linksMap: Record<string, Initiative[]> = {};
      await Promise.all(goalsData.map(async (goal) => {
        const initIds = await fetchInitiativesForGoal(goal.id);
        linksMap[goal.id] = memberInits.filter(i => initIds.includes(i.id));
      }));
      setGoalLinkedInits(linksMap);
    } catch (err) {
      console.error('Error loading goals:', err);
    } finally {
      setGoalsLoading(false);
    }
  }

  async function handleLinkInitiative(goalId: string, initiativeId: string) {
    try {
      await linkInitiativeToGoal(initiativeId, goalId);
      // Refresh linked initiatives for this goal
      const initIds = await fetchInitiativesForGoal(goalId);
      setGoalLinkedInits(prev => ({
        ...prev,
        [goalId]: memberInitiatives.filter(i => initIds.includes(i.id)),
      }));
      setLinkSearchGoalId(null);
      setLinkSearchQuery('');
    } catch (err) {
      console.error('Link initiative error:', err);
    }
  }

  async function handleUnlinkInitiative(goalId: string, initiativeId: string) {
    try {
      await unlinkInitiativeFromGoal(initiativeId, goalId);
      setGoalLinkedInits(prev => ({
        ...prev,
        [goalId]: (prev[goalId] || []).filter(i => i.id !== initiativeId),
      }));
    } catch (err) {
      console.error('Unlink initiative error:', err);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    try {
      await deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setGoalLinkedInits(prev => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
    } catch (err) {
      console.error('Delete goal error:', err);
    }
  }

  const orgTeamGoals = useMemo(() => goals.filter(g => g.level === 'organization' || g.level === 'team'), [goals]);
  const individualGoals = useMemo(() => goals.filter(g => g.level === 'individual'), [goals]);

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

          {/* Favorite button — always visible like WorkDash */}
          <button
            onClick={toggleStaffFavorite}
            disabled={!selectedSCI}
            className="p-1.5 rounded-lg border transition-all"
            style={{
              borderColor: isFavorited ? '#f59e0b' : 'var(--border-default)',
              backgroundColor: isFavorited ? '#f59e0b15' : 'transparent',
              color: isFavorited ? '#f59e0b' : 'var(--text-muted)',
              opacity: selectedSCI ? 1 : 0.4,
            }}
            title={isFavorited ? 'Remove favorite (will no longer auto-select)' : 'Set as favorite (auto-selects on load)'}
          >
            <Star size={16} fill={isFavorited ? '#f59e0b' : 'none'} />
          </button>

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

      {/* ─── Goals Section ─── */}
      {selectedSCI && (
        <div className="border-t" style={{ borderColor: 'var(--border-default)' }}>
          {/* Collapsible header */}
          <button
            onClick={() => setGoalsExpanded(!goalsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center gap-2">
              <Target size={16} style={{ color: 'var(--primary-brand-color)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                Goals ({goals.length})
              </span>
            </div>
            {goalsExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>

          {goalsExpanded && (
            <div className="px-4 pb-4 space-y-4" style={{ backgroundColor: 'var(--bg-page)' }}>
              {goalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} />
                </div>
              ) : (
                <>
                  {/* Organization & Team Goals */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      Organization & Team Goals
                    </h4>
                    {orgTeamGoals.length === 0 ? (
                      <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No organization or team goals set.</p>
                    ) : (
                      <div className="space-y-2">
                        {orgTeamGoals.map(goal => {
                          const linked = goalLinkedInits[goal.id] || [];
                          const progress = calculateGoalProgress(linked);
                          const levelColor = LEVEL_COLORS[goal.level] || '#6b7280';
                          const isLinking = linkSearchGoalId === goal.id;
                          const linkedIds = new Set(linked.map(i => i.id));
                          const availableInits = memberInitiatives.filter(i => {
                            if (linkedIds.has(i.id)) return false;
                            if (!linkSearchQuery) return true;
                            const q = linkSearchQuery.toLowerCase();
                            return i.name.toLowerCase().includes(q) || i.display_id.toLowerCase().includes(q);
                          }).slice(0, 8);

                          return (
                            <div key={goal.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>{goal.title}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ color: levelColor, backgroundColor: `${levelColor}15`, border: `1px solid ${levelColor}30` }}>
                                      {LEVEL_LABELS[goal.level]}
                                    </span>
                                  </div>
                                  {goal.description && (
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {goal.description}
                                    </p>
                                  )}
                                </div>
                                {goal.target_date && (
                                  <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-hover)' }}>
                                    {new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-default)' }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progress >= 75 ? '#22c55e' : progress >= 40 ? '#f59e0b' : 'var(--primary-brand-color)' }} />
                                </div>
                                <span className="text-[10px] font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>{progress}%</span>
                              </div>

                              {/* Linked initiative chips */}
                              <div className="flex flex-wrap items-center gap-1">
                                {linked.map(init => (
                                  <span key={init.id} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-body)' }}>
                                    <span className="font-mono" style={{ color: TYPE_COLORS[init.type] || '#6b7280' }}>{init.display_id}</span>
                                    {init.name.length > 25 ? init.name.slice(0, 25) + '...' : init.name}
                                    <button onClick={() => handleUnlinkInitiative(goal.id, init.id)} className="ml-0.5 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                                      <X size={10} />
                                    </button>
                                  </span>
                                ))}
                                <button
                                  onClick={() => { setLinkSearchGoalId(isLinking ? null : goal.id); setLinkSearchQuery(''); }}
                                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
                                  style={{ color: 'var(--primary-brand-color)', backgroundColor: isLinking ? `var(--primary-brand-color)15` : 'transparent' }}
                                >
                                  <Link2 size={10} />
                                  Link Initiative
                                </button>
                              </div>

                              {/* Link search dropdown */}
                              {isLinking && (
                                <div className="rounded-lg p-2 space-y-1.5" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                                  <div className="flex items-center gap-1.5">
                                    <Search size={12} style={{ color: 'var(--text-muted)' }} />
                                    <input
                                      type="text"
                                      value={linkSearchQuery}
                                      onChange={e => setLinkSearchQuery(e.target.value)}
                                      placeholder="Search by name or ID..."
                                      className="flex-1 text-xs px-2 py-1 rounded border"
                                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
                                      autoFocus
                                    />
                                    <button onClick={() => { setLinkSearchGoalId(null); setLinkSearchQuery(''); }} style={{ color: 'var(--text-muted)' }}>
                                      <X size={14} />
                                    </button>
                                  </div>
                                  {availableInits.length === 0 ? (
                                    <p className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>No matching initiatives found.</p>
                                  ) : (
                                    <div className="space-y-0.5">
                                      {availableInits.map(init => (
                                        <button
                                          key={init.id}
                                          onClick={() => handleLinkInitiative(goal.id, init.id)}
                                          className="w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors"
                                          style={{ color: 'var(--text-body)' }}
                                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-brand-color)'; e.currentTarget.style.color = 'white'; }}
                                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-body)'; }}
                                        >
                                          <span className="font-mono" style={{ color: TYPE_COLORS[init.type] || '#6b7280' }}>{init.display_id}</span>
                                          <span className="flex-1 truncate">{init.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* My Individual Goals */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        My Individual Goals
                      </h4>
                      <button
                        onClick={() => { setEditingGoal(null); setGoalModalOpen(true); }}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg font-medium"
                        style={{ color: 'var(--primary-brand-color)', backgroundColor: `var(--primary-brand-color)08` }}
                      >
                        <Plus size={12} />
                        New Goal
                      </button>
                    </div>
                    {individualGoals.length === 0 ? (
                      <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No individual goals yet. Click "+ New Goal" to create one.</p>
                    ) : (
                      <div className="space-y-2">
                        {individualGoals.map(goal => {
                          const linked = goalLinkedInits[goal.id] || [];
                          const progress = calculateGoalProgress(linked);
                          const levelColor = LEVEL_COLORS[goal.level] || '#6b7280';
                          const isLinking = linkSearchGoalId === goal.id;
                          const linkedIds = new Set(linked.map(i => i.id));
                          const availableInits = memberInitiatives.filter(i => {
                            if (linkedIds.has(i.id)) return false;
                            if (!linkSearchQuery) return true;
                            const q = linkSearchQuery.toLowerCase();
                            return i.name.toLowerCase().includes(q) || i.display_id.toLowerCase().includes(q);
                          }).slice(0, 8);

                          return (
                            <div key={goal.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>{goal.title}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ color: levelColor, backgroundColor: `${levelColor}15`, border: `1px solid ${levelColor}30` }}>
                                      {LEVEL_LABELS[goal.level]}
                                    </span>
                                  </div>
                                  {goal.description && (
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {goal.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {goal.target_date && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded mr-1" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-hover)' }}>
                                      {new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  )}
                                  <button onClick={() => { setEditingGoal(goal); setGoalModalOpen(true); }} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }} title="Edit goal">
                                    <Pencil size={13} />
                                  </button>
                                  <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--color-danger, #ef4444)' }} title="Delete goal">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-default)' }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progress >= 75 ? '#22c55e' : progress >= 40 ? '#f59e0b' : 'var(--primary-brand-color)' }} />
                                </div>
                                <span className="text-[10px] font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>{progress}%</span>
                              </div>

                              {/* Linked initiative chips */}
                              <div className="flex flex-wrap items-center gap-1">
                                {linked.map(init => (
                                  <span key={init.id} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-body)' }}>
                                    <span className="font-mono" style={{ color: TYPE_COLORS[init.type] || '#6b7280' }}>{init.display_id}</span>
                                    {init.name.length > 25 ? init.name.slice(0, 25) + '...' : init.name}
                                    <button onClick={() => handleUnlinkInitiative(goal.id, init.id)} className="ml-0.5 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                                      <X size={10} />
                                    </button>
                                  </span>
                                ))}
                                <button
                                  onClick={() => { setLinkSearchGoalId(isLinking ? null : goal.id); setLinkSearchQuery(''); }}
                                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
                                  style={{ color: 'var(--primary-brand-color)', backgroundColor: isLinking ? `var(--primary-brand-color)15` : 'transparent' }}
                                >
                                  <Link2 size={10} />
                                  Link Initiative
                                </button>
                              </div>

                              {/* Link search dropdown */}
                              {isLinking && (
                                <div className="rounded-lg p-2 space-y-1.5" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                                  <div className="flex items-center gap-1.5">
                                    <Search size={12} style={{ color: 'var(--text-muted)' }} />
                                    <input
                                      type="text"
                                      value={linkSearchQuery}
                                      onChange={e => setLinkSearchQuery(e.target.value)}
                                      placeholder="Search by name or ID..."
                                      className="flex-1 text-xs px-2 py-1 rounded border"
                                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
                                      autoFocus
                                    />
                                    <button onClick={() => { setLinkSearchGoalId(null); setLinkSearchQuery(''); }} style={{ color: 'var(--text-muted)' }}>
                                      <X size={14} />
                                    </button>
                                  </div>
                                  {availableInits.length === 0 ? (
                                    <p className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>No matching initiatives found.</p>
                                  ) : (
                                    <div className="space-y-0.5">
                                      {availableInits.map(init => (
                                        <button
                                          key={init.id}
                                          onClick={() => handleLinkInitiative(goal.id, init.id)}
                                          className="w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors"
                                          style={{ color: 'var(--text-body)' }}
                                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-brand-color)'; e.currentTarget.style.color = 'white'; }}
                                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-body)'; }}
                                        >
                                          <span className="font-mono" style={{ color: TYPE_COLORS[init.type] || '#6b7280' }}>{init.display_id}</span>
                                          <span className="flex-1 truncate">{init.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => { setGoalModalOpen(false); setEditingGoal(null); }}
        onSaved={() => { setGoalModalOpen(false); setEditingGoal(null); loadGoals(); }}
        editingGoal={editingGoal}
        forceLevel="individual"
        defaultOwner={selectedName || ''}
        defaultMemberId={selectedSCI}
      />
    </div>
  );
}
