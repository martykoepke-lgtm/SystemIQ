import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  Loader2,
  ChevronDown,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { fetchTeamMembers, fetchInitiativesForMember, fetchActionItemsForInitiatives, fetchEffortLogs, fetchUserPreference } from '../../lib/queries';
import { saveUserPreference, deleteUserPreference, updateActionItem } from '../../lib/mutations';
import { loadCapacityConfig, calculatePlannedHours, calculateMemberCapacity } from '../../lib/workloadCalculator';
import type { TeamMember, Initiative, ActionItem, EffortLog } from '../../lib/supabase';
import type { CapacityConfig, MemberCapacity } from '../../lib/workloadCalculator';
import { TYPE_COLORS, STATUS_COLORS, EFFORT_SIZE_HOURS, SCI_ROLES, getCapacityColor, getCapacityLabel } from '../../lib/constants';
import { startOfWeek, format, isBefore, isToday, parseISO } from 'date-fns';
import InitiativeDetailView from '../detail/InitiativeDetailView';
import type { InitiativeWithDetails, TaskWithDetails } from '../../lib/supabase';
import TaskDetailView from '../detail/TaskDetailView';

interface WorkDashViewProps {
  onEditInitiative?: (initiative: InitiativeWithDetails) => void;
}

const PREF_KEY = 'workdash_favorite_member';

export default function WorkDashView({ onEditInitiative }: WorkDashViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [effortLogs, setEffortLogs] = useState<EffortLog[]>([]);
  const [capacity, setCapacity] = useState<MemberCapacity | null>(null);
  const [config, setConfig] = useState<CapacityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Drill-in state
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalInitiativeId, setTaskModalInitiativeId] = useState('');

  // Load team members and check for favorite on mount
  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    const [allMembers, cfg] = await Promise.all([
      fetchTeamMembers(),
      loadCapacityConfig(),
    ]);

    // Filter to SCI-family roles (the ones who get assigned to initiatives)
    const sciMembers = allMembers.filter((m) => SCI_ROLES.has(m.role));
    setMembers(sciMembers);
    setConfig(cfg);

    // Check for favorite
    const pref = await fetchUserPreference(PREF_KEY);
    if (pref && sciMembers.some((m) => m.id === pref.preference_value)) {
      setSelectedMemberId(pref.preference_value);
      setIsFavorited(true);
    } else if (sciMembers.length > 0) {
      setSelectedMemberId(sciMembers[0].id);
    }

    setLoading(false);
  }

  // Load data when selected member changes
  useEffect(() => {
    if (selectedMemberId) {
      loadMemberData();
    }
  }, [selectedMemberId]);

  async function loadMemberData() {
    if (!selectedMemberId || !config) return;
    setDataLoading(true);

    const [inits, logs, allInits, allLogs] = await Promise.all([
      fetchInitiativesForMember(selectedMemberId),
      fetchEffortLogs(selectedMemberId),
      // For capacity calculation, need all initiatives and all effort logs
      (async () => {
        const { data } = await (await import('../../lib/supabase')).supabase
          .from('initiatives')
          .select('*')
          .eq('organization_id', (await import('../../lib/supabase')).DEFAULT_ORG_ID)
          .eq('is_active', true);
        return data || [];
      })(),
      (async () => {
        const { data } = await (await import('../../lib/supabase')).supabase
          .from('effort_logs')
          .select('*')
          .eq('organization_id', (await import('../../lib/supabase')).DEFAULT_ORG_ID);
        return data || [];
      })(),
    ]);

    setInitiatives(inits);
    setEffortLogs(logs);

    // Fetch action items for these initiatives
    const initIds = inits.map((i) => i.id);
    const items = await fetchActionItemsForInitiatives(initIds);
    setActionItems(items);

    // Calculate capacity
    const member = members.find((m) => m.id === selectedMemberId);
    if (member) {
      const cap = await calculateMemberCapacity(member, allInits, allLogs, config);
      setCapacity(cap);
    }

    setDataLoading(false);
  }

  const refreshData = useCallback(() => {
    loadMemberData();
  }, [selectedMemberId, config, members]);

  // Favorite handling
  async function toggleFavorite() {
    if (isFavorited) {
      await deleteUserPreference(PREF_KEY);
      setIsFavorited(false);
    } else {
      await saveUserPreference(PREF_KEY, selectedMemberId);
      setIsFavorited(true);
    }
  }

  function handleSelectMember(id: string) {
    setSelectedMemberId(id);
    setDropdownOpen(false);
    setSelectedInitiativeId(null);
    setSelectedTaskId(null);
  }

  // Current week effort per initiative
  const currentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
  const currentWeekStr = format(currentWeek, 'yyyy-MM-dd');

  const weeklyHoursMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of effortLogs) {
      if (log.week_start_date === currentWeekStr) {
        map[log.initiative_id] = log.hours_spent;
      }
    }
    return map;
  }, [effortLogs, currentWeekStr]);

  // Open action items, grouped by initiative
  const openActionItems = useMemo(() => {
    return actionItems
      .filter((ai) => ai.status !== 'Complete')
      .sort((a, b) => {
        // Overdue first
        const aOverdue = a.due_date && isBefore(parseISO(a.due_date), new Date()) ? 0 : 1;
        const bOverdue = b.due_date && isBefore(parseISO(b.due_date), new Date()) ? 0 : 1;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;
        // Then by due date
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });
  }, [actionItems]);

  const actionItemsByInitiative = useMemo(() => {
    const grouped: Record<string, ActionItem[]> = {};
    for (const ai of openActionItems) {
      const key = ai.initiative_id || 'unlinked';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ai);
    }
    return grouped;
  }, [openActionItems]);

  const initiativeMap = useMemo(() => {
    const map: Record<string, Initiative> = {};
    for (const i of initiatives) map[i.id] = i;
    return map;
  }, [initiatives]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  async function toggleActionItemStatus(item: ActionItem) {
    const nextStatus = item.status === 'Not Started' ? 'In Progress' : item.status === 'In Progress' ? 'Complete' : 'Not Started';
    await updateActionItem(item.id, {
      status: nextStatus,
      completed_date: nextStatus === 'Complete' ? new Date().toISOString() : undefined,
    });
    refreshData();
  }

  // If loading initial data
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} />
      </div>
    );
  }

  // If drilling into task detail
  if (selectedTaskId) {
    return (
      <TaskDetailView
        taskId={selectedTaskId}
        onBack={() => setSelectedTaskId(null)}
        onEditTask={() => {}}
      />
    );
  }

  // If drilling into initiative detail
  if (selectedInitiativeId) {
    return (
      <InitiativeDetailView
        key={selectedInitiativeId}
        initiativeId={selectedInitiativeId}
        onBack={() => { setSelectedInitiativeId(null); refreshData(); }}
        onOpenTask={(taskId) => setSelectedTaskId(taskId)}
        onCreateTask={(initId) => { setTaskModalInitiativeId(initId); setTaskModalOpen(true); }}
        onEditInitiative={onEditInitiative || (() => {})}
        teamMemberId={selectedMemberId}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar — Person Selector + Capacity */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between">
          {/* Person selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium min-w-[220px] justify-between"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)', color: 'var(--text-heading)' }}
              >
                <div className="flex items-center gap-2">
                  {selectedMember && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--primary-brand-color)' }}
                    >
                      {selectedMember.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <span>{selectedMember?.name || 'Select person...'}</span>
                </div>
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div
                    className="absolute top-full left-0 mt-1 w-72 max-h-64 overflow-y-auto rounded-lg border shadow-lg z-20"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                  >
                    {members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMember(m.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                        style={{
                          color: m.id === selectedMemberId ? 'var(--primary-brand-color)' : 'var(--text-body)',
                          backgroundColor: m.id === selectedMemberId ? 'rgba(var(--primary-brand-rgb, 59, 130, 246), 0.08)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (m.id !== selectedMemberId) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                        onMouseLeave={(e) => { if (m.id !== selectedMemberId) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: 'var(--primary-brand-color)' }}
                        >
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.role.replace('_', ' ')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Favorite button */}
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-lg border transition-all"
              style={{
                borderColor: isFavorited ? '#f59e0b' : 'var(--border-default)',
                backgroundColor: isFavorited ? '#f59e0b15' : 'transparent',
                color: isFavorited ? '#f59e0b' : 'var(--text-muted)',
              }}
              title={isFavorited ? 'Remove favorite (will no longer auto-select)' : 'Set as favorite (auto-selects on load)'}
            >
              <Star size={18} fill={isFavorited ? '#f59e0b' : 'none'} />
            </button>
          </div>

          {/* Capacity Summary */}
          {capacity && !dataLoading && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center gap-4 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>
                    Planned: <strong style={{ color: 'var(--text-heading)' }}>{capacity.plannedHours.toFixed(1)}h</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Actual: <strong style={{ color: 'var(--text-heading)' }}>{capacity.actualHours.toFixed(1)}h</strong>
                  </span>
                  <span style={{ color: capacity.variance >= 0 ? '#dc2626' : '#22c55e' }}>
                    {capacity.variance >= 0 ? '+' : ''}{capacity.variance.toFixed(1)}h
                  </span>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="w-40">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                  <span className="font-bold" style={{ color: getCapacityColor(capacity.plannedPct) }}>
                    {capacity.plannedPct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(capacity.plannedPct, 100)}%`,
                      backgroundColor: getCapacityColor(capacity.plannedPct),
                    }}
                  />
                </div>
                <div className="text-xs mt-0.5" style={{ color: getCapacityColor(capacity.plannedPct) }}>
                  {getCapacityLabel(capacity.plannedPct)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Initiative List (left) + Action Items (right) */}
      {dataLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel — Initiative Cards */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                My Initiatives ({initiatives.length})
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {initiatives.filter((i) => i.status === 'In Progress').length} in progress
              </span>
            </div>

            {initiatives.length === 0 ? (
              <div
                className="text-center py-16 rounded-lg border border-dashed"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
              >
                <p className="text-sm">No initiatives assigned</p>
                <p className="text-xs mt-1">Initiatives assigned to this SCI will appear here</p>
              </div>
            ) : (
              initiatives.map((init) => {
                const typeColor = TYPE_COLORS[init.type] || '#6b7280';
                const statusColor = STATUS_COLORS[init.status] || '#6b7280';
                const plannedHrs = config ? calculatePlannedHours(init, config) : 0;
                const weekHrs = weeklyHoursMap[init.id] || 0;

                return (
                  <button
                    key={init.id}
                    onClick={() => setSelectedInitiativeId(init.id)}
                    className="w-full text-left rounded-lg border p-4 transition-all hover:shadow-sm"
                    style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)', borderLeftWidth: 3, borderLeftColor: typeColor }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = typeColor}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.borderLeftColor = typeColor; }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                            {init.display_id}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                            {init.status}
                          </span>
                          {init.phase && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                              {init.phase}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
                          {init.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ color: typeColor }}>{init.type}</span>
                          {init.work_effort && (
                            <span>Effort: {init.work_effort} ({EFFORT_SIZE_HOURS[init.work_effort] || 0}h/wk)</span>
                          )}
                        </div>
                      </div>

                      {/* Hours badge */}
                      <div className="text-right shrink-0 ml-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <span className="text-sm font-mono font-semibold" style={{ color: 'var(--primary-brand-color)' }}>
                            {weekHrs > 0 ? `${weekHrs}h` : '—'}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {plannedHrs > 0 ? `${plannedHrs.toFixed(1)}h planned` : 'No plan'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Panel — Action Items */}
          <div
            className="w-80 border-l overflow-y-auto p-4 shrink-0"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
          >
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
              <AlertCircle size={16} style={{ color: 'var(--primary-brand-color)' }} />
              Open Action Items ({openActionItems.length})
            </h2>

            {openActionItems.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle2 size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(actionItemsByInitiative).map(([initId, items]) => {
                  const init = initiativeMap[initId];
                  const typeColor = init ? (TYPE_COLORS[init.type] || '#6b7280') : '#6b7280';
                  return (
                    <div key={initId}>
                      {init && (
                        <button
                          onClick={() => setSelectedInitiativeId(init.id)}
                          className="text-xs font-mono font-semibold mb-1.5 flex items-center gap-1 transition-colors"
                          style={{ color: typeColor }}
                        >
                          {init.display_id} — {init.name.length > 30 ? init.name.slice(0, 30) + '...' : init.name}
                        </button>
                      )}
                      <div className="space-y-1">
                        {items.map((item) => {
                          const isOverdue = item.due_date && isBefore(parseISO(item.due_date), new Date()) && !isToday(parseISO(item.due_date));
                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-2 py-1.5 px-2 rounded transition-colors"
                              style={{ backgroundColor: isOverdue ? 'rgba(239,68,68,0.05)' : 'transparent' }}
                            >
                              <button
                                onClick={() => toggleActionItemStatus(item)}
                                className="mt-0.5 shrink-0"
                                style={{ color: item.status === 'In Progress' ? 'var(--primary-brand-color)' : 'var(--text-muted)' }}
                              >
                                {item.status === 'In Progress' ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <Circle size={14} />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs leading-snug" style={{ color: 'var(--text-body)' }}>
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.due_date && (
                                    <span className="text-xs" style={{ color: isOverdue ? '#dc2626' : 'var(--text-muted)' }}>
                                      {isOverdue ? 'Overdue: ' : ''}{format(parseISO(item.due_date), 'MMM d')}
                                    </span>
                                  )}
                                  {item.owner && (
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {item.owner}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
