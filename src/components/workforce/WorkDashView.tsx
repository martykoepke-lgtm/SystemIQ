import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Users,
  X,
  Plus,
} from 'lucide-react';
import { fetchTeamMembers, fetchInitiativesForMember, fetchActionItemsForInitiatives, fetchEffortLogs, fetchUserPreference, fetchStakeholdersForInitiative } from '../../lib/queries';
import { saveUserPreference, deleteUserPreference, updateActionItem, saveEffortLog, removeStakeholderFromInitiative } from '../../lib/mutations';
import { loadCapacityConfig, calculatePlannedHours, calculateMemberCapacity } from '../../lib/workloadCalculator';
import type { TeamMember, Initiative, ActionItem, EffortLog, StakeholderWithRole } from '../../lib/supabase';
import type { CapacityConfig, MemberCapacity } from '../../lib/workloadCalculator';
import { TYPE_COLORS, STATUS_COLORS, getCapacityColor, getCapacityLabel } from '../../lib/constants';
import { startOfWeek, format, parseISO } from 'date-fns';
import InitiativeDetailView from '../detail/InitiativeDetailView';
import type { InitiativeWithDetails } from '../../lib/supabase';
import TaskDetailView from '../detail/TaskDetailView';
import StakeholderModal from '../modals/StakeholderModal';

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
  const [_taskModalOpen, setTaskModalOpen] = useState(false);
  const [_taskModalInitiativeId, setTaskModalInitiativeId] = useState('');

  // Sidebar state
  type SidebarTab = 'worklist' | 'stakeholders';
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('worklist');
  const [focusedInitiativeId, setFocusedInitiativeId] = useState<string | null>(null);
  const [sidebarStakeholders, setSidebarStakeholders] = useState<StakeholderWithRole[]>([]);
  const [stakeholdersLoading, setStakeholdersLoading] = useState(false);
  const [stakeholderModalOpen, setStakeholderModalOpen] = useState(false);

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

    // Filter to individual-contributor SCI roles only (exclude managers/directors — they don't work initiatives directly)
    const sciMembers = allMembers.filter((m) => m.role === 'sci' || m.role === 'mi');
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

  // Load stakeholders when focused initiative changes
  useEffect(() => {
    if (focusedInitiativeId) {
      loadSidebarStakeholders(focusedInitiativeId);
    } else {
      setSidebarStakeholders([]);
    }
  }, [focusedInitiativeId]);

  async function loadSidebarStakeholders(initId: string) {
    setStakeholdersLoading(true);
    const data = await fetchStakeholdersForInitiative(initId);
    setSidebarStakeholders(data);
    setStakeholdersLoading(false);
  }

  async function handleRemoveSidebarStakeholder(pivotId: string) {
    try {
      await removeStakeholderFromInitiative(pivotId);
      if (focusedInitiativeId) loadSidebarStakeholders(focusedInitiativeId);
    } catch (err) {
      console.error('Error removing stakeholder:', err);
    }
  }

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

  // Open action items
  const openActionItems = useMemo(() => {
    return actionItems.filter((ai) => ai.status !== 'Complete');
  }, [actionItems]);

  // Group by urgency bucket, then by initiative within each bucket
  const actionItemGroups = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const endOfWeekStr = format(endOfWeek, 'yyyy-MM-dd');

    type Bucket = { label: string; color: string; items: Map<string, ActionItem[]> };
    const buckets: Bucket[] = [
      { label: 'Overdue', color: '#dc2626', items: new Map() },
      { label: 'Today', color: '#f59e0b', items: new Map() },
      { label: 'This Week', color: '#3b82f6', items: new Map() },
      { label: 'Upcoming', color: '#22c55e', items: new Map() },
      { label: 'No Date', color: '#6b7280', items: new Map() },
    ];

    for (const ai of openActionItems) {
      let bucketIdx: number;
      if (!ai.due_date) {
        bucketIdx = 4;
      } else {
        const dueDate = ai.due_date;
        if (dueDate < todayStr) bucketIdx = 0;
        else if (dueDate === todayStr) bucketIdx = 1;
        else if (dueDate <= endOfWeekStr) bucketIdx = 2;
        else bucketIdx = 3;
      }
      const initKey = ai.initiative_id || 'unlinked';
      const bucket = buckets[bucketIdx];
      if (!bucket.items.has(initKey)) bucket.items.set(initKey, []);
      bucket.items.get(initKey)!.push(ai);
    }
    return buckets.filter(b => b.items.size > 0);
  }, [openActionItems]);

  const initiativeMap = useMemo(() => {
    const map: Record<string, Initiative> = {};
    for (const i of initiatives) map[i.id] = i;
    return map;
  }, [initiatives]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  async function changeActionItemStatus(item: ActionItem, newStatus: string) {
    // Optimistic update
    setActionItems(prev => prev.map(ai =>
      ai.id === item.id ? { ...ai, status: newStatus, completed_date: newStatus === 'Complete' ? new Date().toISOString().split('T')[0] : null } : ai
    ));
    try {
      await updateActionItem(item.id, {
        status: newStatus,
        completed_date: newStatus === 'Complete' ? new Date().toISOString().split('T')[0] : undefined,
      });
      // If completed, remove from open list after a brief delay for visual feedback
      if (newStatus === 'Complete') {
        setTimeout(() => refreshData(), 800);
      }
    } catch (err) {
      console.error('Update action item status error:', err);
      // Revert on error
      refreshData();
    }
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

      {/* Main Content: Initiative Table (left) + Action Items (right) */}
      {dataLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel — Compact Initiative Table */}
          <div className="flex-1 overflow-y-auto">
            {initiatives.length === 0 ? (
              <div className="text-center py-16 mx-6 mt-4 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                <p className="text-sm">No initiatives assigned</p>
                <p className="text-xs mt-1">Initiatives assigned to this SCI will appear here</p>
              </div>
            ) : (
              <WorkDashTable
                initiatives={initiatives}
                weeklyHoursMap={weeklyHoursMap}
                config={config}
                effortLogs={effortLogs}
                currentWeekStr={currentWeekStr}
                selectedMemberId={selectedMemberId}
                onOpenInitiative={(id) => setSelectedInitiativeId(id)}
                onFocusInitiative={(id) => setFocusedInitiativeId(id)}
                focusedInitiativeId={focusedInitiativeId}
                onRefresh={refreshData}
              />
            )}
          </div>

          {/* Right Panel — Tabbed Sidebar */}
          <div
            className="w-80 border-l flex flex-col shrink-0"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
          >
            {/* Sidebar Tabs */}
            <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => setSidebarTab('worklist')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2"
                style={{
                  color: sidebarTab === 'worklist' ? 'var(--primary-brand-color)' : 'var(--text-muted)',
                  borderColor: sidebarTab === 'worklist' ? 'var(--primary-brand-color)' : 'transparent',
                  backgroundColor: sidebarTab === 'worklist' ? 'rgba(var(--primary-brand-rgb, 59, 130, 246), 0.04)' : 'transparent',
                }}
              >
                <AlertCircle size={14} /> Worklist
              </button>
              <button
                onClick={() => setSidebarTab('stakeholders')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2"
                style={{
                  color: sidebarTab === 'stakeholders' ? 'var(--primary-brand-color)' : 'var(--text-muted)',
                  borderColor: sidebarTab === 'stakeholders' ? 'var(--primary-brand-color)' : 'transparent',
                  backgroundColor: sidebarTab === 'stakeholders' ? 'rgba(var(--primary-brand-rgb, 59, 130, 246), 0.04)' : 'transparent',
                }}
              >
                <Users size={14} /> Stakeholders
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {sidebarTab === 'worklist' ? (
                /* ─── Worklist (Action Items) — Grouped by Urgency → Initiative ─── */
                <>
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
                      {actionItemGroups.map((bucket) => (
                        <div key={bucket.label}>
                          {/* Urgency header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                            <span className="text-xs font-semibold uppercase" style={{ color: bucket.color }}>
                              {bucket.label}
                            </span>
                            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                              {Array.from(bucket.items.values()).reduce((s, arr) => s + arr.length, 0)}
                            </span>
                          </div>

                          {/* Initiatives within this urgency bucket */}
                          {Array.from(bucket.items.entries()).map(([initId, items]) => {
                            const init = initiativeMap[initId];
                            const typeColor = init ? (TYPE_COLORS[init.type] || '#6b7280') : '#6b7280';
                            return (
                              <div key={initId} className="mb-2">
                                {init && (
                                  <button
                                    onClick={() => setSelectedInitiativeId(init.id)}
                                    className="text-xs font-mono font-semibold mb-1 flex items-center gap-1 transition-colors"
                                    style={{ color: typeColor }}
                                  >
                                    {init.display_id} — {init.name.length > 28 ? init.name.slice(0, 28) + '...' : init.name}
                                  </button>
                                )}
                                <div className="space-y-1">
                                  {items.map((item) => {
                                    const done = item.status === 'Complete';
                                    const statusColor = item.status === 'Complete' ? '#22c55e' : item.status === 'In Progress' ? '#3b82f6' : item.status === 'Deferred' ? '#a855f7' : '#6b7280';
                                    return (
                                      <div
                                        key={item.id}
                                        className="flex items-start gap-2 py-1.5 px-2 rounded transition-all"
                                        style={{ opacity: done ? 0.5 : 1 }}
                                      >
                                        <button
                                          onClick={() => changeActionItemStatus(item, done ? 'Not Started' : 'Complete')}
                                          className="mt-0.5 shrink-0"
                                          title={done ? 'Mark not started' : 'Mark complete'}
                                        >
                                          {done ? (
                                            <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                                          ) : item.status === 'In Progress' ? (
                                            <Clock size={14} style={{ color: '#3b82f6' }} />
                                          ) : (
                                            <Circle size={14} style={{ color: 'var(--text-muted)' }} />
                                          )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs leading-snug" style={{
                                            color: done ? 'var(--text-muted)' : 'var(--text-body)',
                                            textDecoration: done ? 'line-through' : 'none',
                                          }}>
                                            {item.description}
                                          </p>
                                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <select
                                              value={item.status}
                                              onChange={e => changeActionItemStatus(item, e.target.value)}
                                              className="text-xs px-1 py-0 rounded border-0 font-medium cursor-pointer"
                                              style={{ backgroundColor: `${statusColor}15`, color: statusColor, outline: 'none', fontSize: '10px' }}
                                            >
                                              <option value="Not Started">Not Started</option>
                                              <option value="In Progress">In Progress</option>
                                              <option value="Complete">Complete</option>
                                              <option value="Deferred">Deferred</option>
                                            </select>
                                            {item.due_date && (
                                              <span className="text-xs" style={{ color: bucket.label === 'Overdue' ? '#dc2626' : 'var(--text-muted)', fontSize: '10px' }}>
                                                {format(parseISO(item.due_date), 'MMM d')}
                                              </span>
                                            )}
                                            {item.owner && (
                                              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
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
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* ─── Stakeholders Tab ─── */
                <>
                  {!focusedInitiativeId ? (
                    <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                      <Users size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Select an initiative</p>
                      <p className="text-xs mt-1">Click a row in the table to view its stakeholders</p>
                    </div>
                  ) : (
                    <>
                      {/* Initiative context header */}
                      <div className="mb-3 pb-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                        <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {initiativeMap[focusedInitiativeId]?.display_id}
                        </div>
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
                          {initiativeMap[focusedInitiativeId]?.name}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Stakeholders
                        </h2>
                        <button
                          onClick={() => setStakeholderModalOpen(true)}
                          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors"
                          style={{ color: 'var(--primary-brand-color)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Plus size={12} /> ADD
                        </button>
                      </div>

                      {stakeholdersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} />
                        </div>
                      ) : sidebarStakeholders.length === 0 ? (
                        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                          <Users size={24} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs">No stakeholders assigned</p>
                          <button
                            onClick={() => setStakeholderModalOpen(true)}
                            className="text-xs mt-1 underline"
                            style={{ color: 'var(--primary-brand-color)' }}
                          >
                            Add one
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sidebarStakeholders.map((s) => (
                            <div
                              key={s.pivot_id}
                              className="flex items-center gap-2.5 py-2 px-2 rounded-lg border"
                              style={{ borderColor: 'var(--border-default)' }}
                            >
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ backgroundColor: 'var(--primary-brand-color)' }}
                              >
                                {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-heading)' }}>
                                  {s.name}
                                </div>
                                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                  {[s.role, s.department].filter(Boolean).join(' \u00B7 ') || s.title || '\u2014'}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveSidebarStakeholder(s.pivot_id)}
                                className="shrink-0 p-1 rounded transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                title="Remove stakeholder"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stakeholder Modal */}
          {focusedInitiativeId && (
            <StakeholderModal
              isOpen={stakeholderModalOpen}
              onClose={() => setStakeholderModalOpen(false)}
              onSaved={() => { setStakeholderModalOpen(false); loadSidebarStakeholders(focusedInitiativeId); }}
              initiativeId={focusedInitiativeId}
              existingStakeholderIds={sidebarStakeholders.map((s) => s.id)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Compact Sortable Table (replaces card layout) ───

type SortKey = 'display_id' | 'name' | 'type' | 'status' | 'phase' | 'hours' | 'effort';
type SortDir = 'asc' | 'desc';

function WorkDashTable({
  initiatives,
  weeklyHoursMap,
  config,
  effortLogs: _effortLogs,
  currentWeekStr,
  selectedMemberId,
  onOpenInitiative,
  onFocusInitiative,
  focusedInitiativeId,
  onRefresh,
}: {
  initiatives: Initiative[];
  weeklyHoursMap: Record<string, number>;
  config: CapacityConfig | null;
  effortLogs: EffortLog[];
  currentWeekStr: string;
  selectedMemberId: string;
  onOpenInitiative: (id: string) => void;
  onFocusInitiative: (id: string) => void;
  focusedInitiativeId: string | null;
  onRefresh: () => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingHours, setEditingHours] = useState<Record<string, string>>({});
  const [_savingHours, setSavingHours] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error'>>({});

  const toggleExpand = (id: string) => setExpandedRows(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    const items = [...initiatives];
    items.sort((a, b) => {
      let va: string | number = '', vb: string | number = '';
      switch (sortKey) {
        case 'display_id': va = a.display_id; vb = b.display_id; break;
        case 'name': va = a.name; vb = b.name; break;
        case 'type': va = a.type; vb = b.type; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'phase': va = a.phase || ''; vb = b.phase || ''; break;
        case 'hours': va = weeklyHoursMap[a.id] || 0; vb = weeklyHoursMap[b.id] || 0; break;
        case 'effort': va = a.work_effort || ''; vb = b.work_effort || ''; break;
      }
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return items;
  }, [initiatives, sortKey, sortDir, weeklyHoursMap]);

  const handleHoursSave = async (initId: string) => {
    const value = editingHours[initId];
    if (value === undefined) return;
    const hours = parseFloat(value) || 0;

    setSavingHours(prev => new Set(prev).add(initId));
    try {
      await saveEffortLog({
        team_member_id: selectedMemberId,
        initiative_id: initId,
        week_start_date: currentWeekStr,
        hours_spent: hours,
      });
      setSaveStatus(prev => ({ ...prev, [initId]: 'success' }));
      setTimeout(() => setSaveStatus(prev => { const n = { ...prev }; delete n[initId]; return n; }), 1500);
      onRefresh();
    } catch {
      setSaveStatus(prev => ({ ...prev, [initId]: 'error' }));
      setTimeout(() => setSaveStatus(prev => { const n = { ...prev }; delete n[initId]; return n; }), 2000);
    } finally {
      setSavingHours(prev => { const n = new Set(prev); n.delete(initId); return n; });
      setEditingHours(prev => { const n = { ...prev }; delete n[initId]; return n; });
    }
  };

  const SortHeader = ({ label, field, width }: { label: string; field: SortKey; width?: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium uppercase cursor-pointer select-none"
      style={{ color: 'var(--text-muted)', width }}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field
          ? (sortDir === 'asc' ? <ChevronDown size={10} className="rotate-180" /> : <ChevronDown size={10} />)
          : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />
        }
      </span>
    </th>
  );

  return (
    <table className="w-full text-[13px]" style={{ color: 'var(--text-body)' }}>
      <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
        <tr>
          <th className="px-2 py-2 w-8" />
          <SortHeader label="Initiative" field="name" />
          <SortHeader label="Type" field="type" width="110px" />
          <SortHeader label="Status" field="status" width="120px" />
          <SortHeader label="Stage" field="phase" width="110px" />
          <SortHeader label="This Week" field="hours" width="90px" />
          <SortHeader label="Effort" field="effort" width="70px" />
          <th className="px-3 py-2 text-xs font-medium uppercase w-20" style={{ color: 'var(--text-muted)' }}>Planned</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(init => {
          const typeColor = TYPE_COLORS[init.type] || '#6b7280';
          const statusColor = STATUS_COLORS[init.status] || '#6b7280';
          const weekHrs = weeklyHoursMap[init.id] || 0;
          const plannedHrs = config ? calculatePlannedHours(init, config) : 0;
          const isExpanded = expandedRows.has(init.id);
          const isEditing = init.id in editingHours;
          const status = saveStatus[init.id];

          return (
            <React.Fragment key={init.id}>
              <tr
                className="border-t group cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: focusedInitiativeId === init.id ? 'rgba(var(--primary-brand-rgb, 59, 130, 246), 0.06)' : 'transparent',
                }}
                onClick={() => onFocusInitiative(init.id)}
                onMouseEnter={e => { if (focusedInitiativeId !== init.id) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                onMouseLeave={e => { if (focusedInitiativeId !== init.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {/* Expand chevron */}
                <td className="px-2 py-2.5">
                  <button onClick={() => toggleExpand(init.id)} style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </td>

                {/* Initiative name (clickable) */}
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onOpenInitiative(init.id)}
                    className="text-left hover:underline"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    <span className="font-mono text-xs mr-1.5" style={{ color: 'var(--text-muted)' }}>{init.display_id}</span>
                    <span className="font-medium">{init.name}</span>
                  </button>
                </td>

                {/* Type */}
                <td className="px-3 py-2.5">
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                    {init.type === 'Epic Gold' ? 'EG' : init.type === 'System Project' ? 'Sys Proj' : init.type === 'System Initiative' ? 'Sys Init' : init.type}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-2.5">
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                    {init.status}
                  </span>
                </td>

                {/* Phase/Stage */}
                <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {init.phase || '—'}
                </td>

                {/* This Week — inline editable */}
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="number"
                    value={isEditing ? editingHours[init.id] : (weekHrs > 0 ? weekHrs : '')}
                    onChange={e => setEditingHours(prev => ({ ...prev, [init.id]: e.target.value }))}
                    onBlur={() => handleHoursSave(init.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleHoursSave(init.id);
                      if (e.key === 'Tab') { e.preventDefault(); handleHoursSave(init.id); /* Tab to next will be handled by browser */ }
                    }}
                    onFocus={() => { if (!(init.id in editingHours)) setEditingHours(prev => ({ ...prev, [init.id]: String(weekHrs || '') })); }}
                    placeholder="—"
                    className="w-16 text-center text-[13px] px-1.5 py-1 rounded border font-mono transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-heading)',
                      borderColor: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--border-default)',
                      borderWidth: status ? 2 : 1,
                    }}
                    step="0.5"
                    min="0"
                    max="40"
                  />
                </td>

                {/* Effort size */}
                <td className="px-3 py-2.5 text-xs font-mono text-center" style={{ color: 'var(--text-muted)' }}>
                  {init.work_effort || '—'}
                </td>

                {/* Planned hours */}
                <td className="px-3 py-2.5 text-xs font-mono text-right" style={{ color: plannedHrs > 0 ? 'var(--text-body)' : 'var(--text-muted)' }}>
                  {plannedHrs > 0 ? `${plannedHrs.toFixed(1)}h` : '—'}
                </td>
              </tr>

              {/* Expanded row — latest note + quick details */}
              {isExpanded && (
                <tr>
                  <td colSpan={8} className="px-10 py-2" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                    <div className="flex gap-6 text-xs">
                      <div className="flex-1">
                        {init.description ? (
                          <p className="line-clamp-2" style={{ color: 'var(--text-body)' }}>{init.description}</p>
                        ) : (
                          <p style={{ color: 'var(--text-muted)' }}>No description</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        {init.start_date && <div style={{ color: 'var(--text-muted)' }}>Start: {init.start_date}</div>}
                        {init.target_date && <div style={{ color: 'var(--text-muted)' }}>Target: {init.target_date}</div>}
                        {init.go_live_wave && <div style={{ color: '#f59e0b' }}>Wave: {init.go_live_wave}</div>}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
