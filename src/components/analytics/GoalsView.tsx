import { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, ChevronDown, ChevronRight, User, Calendar, Link2, TrendingUp, X, Search } from 'lucide-react';
import { fetchInitiatives } from '../../lib/queries';
import { supabase, DEFAULT_ORG_ID } from '../../lib/supabase';
import type { Initiative } from '../../lib/supabase';

interface Goal {
  id: string;
  title: string;
  description: string;
  level: 'organization' | 'team' | 'individual';
  owner_name: string;
  target_date: string | null;
  status: 'active' | 'completed' | 'paused';
  linked_initiative_ids: string[];
}

type Level = 'organization' | 'team' | 'individual';

export default function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<Level>('organization');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingForLevel, setAddingForLevel] = useState<Level | null>(null);
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [inits] = await Promise.all([fetchInitiatives()]);
    setInitiatives(inits);

    // Load goals from local storage for now (can be moved to Supabase table later)
    const stored = localStorage.getItem('systemiq_goals');
    if (stored) {
      try { setGoals(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }

  function saveGoals(updated: Goal[]) {
    setGoals(updated);
    localStorage.setItem('systemiq_goals', JSON.stringify(updated));
  }

  const filtered = useMemo(() => goals.filter(g => g.level === activeLevel), [goals, activeLevel]);

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const getProgress = (goal: Goal): number => {
    if (goal.linked_initiative_ids.length === 0) return 0;
    let total = 0;
    for (const id of goal.linked_initiative_ids) {
      const init = initiatives.find(i => i.id === id);
      if (!init) continue;
      if (init.completion_percentage) { total += init.completion_percentage; continue; }
      switch (init.status) {
        case 'Completed': total += 100; break;
        case 'In Progress': total += 50; break;
        case 'On Hold': case 'Deferred': total += 25; break;
        default: total += 0;
      }
    }
    return Math.round(total / goal.linked_initiative_ids.length);
  };

  const getProgressColor = (pct: number): string => {
    if (pct >= 75) return '#22c55e';
    if (pct >= 40) return '#eab308';
    if (pct > 0) return 'var(--primary-brand-color)';
    return 'var(--border-default)';
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'linked_initiative_ids' | 'status'>) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      linked_initiative_ids: [],
      status: 'active',
    };
    saveGoals([...goals, newGoal]);
    setAddingForLevel(null);
  };

  const linkInitiative = (goalId: string, initId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      if (g.linked_initiative_ids.includes(initId)) return g;
      return { ...g, linked_initiative_ids: [...g.linked_initiative_ids, initId] };
    });
    saveGoals(updated);
  };

  const unlinkInitiative = (goalId: string, initId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return { ...g, linked_initiative_ids: g.linked_initiative_ids.filter(id => id !== initId) };
    });
    saveGoals(updated);
  };

  const deleteGoal = (goalId: string) => {
    if (!confirm('Delete this goal?')) return;
    saveGoals(goals.filter(g => g.id !== goalId));
  };

  const levelCounts = {
    organization: goals.filter(g => g.level === 'organization').length,
    team: goals.filter(g => g.level === 'team').length,
    individual: goals.filter(g => g.level === 'individual').length,
  };

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{goals.length} total goals</span>
        <span>{goals.filter(g => g.status === 'active').length} active</span>
        <span>{goals.reduce((s, g) => s + g.linked_initiative_ids.length, 0)} linked initiatives</span>
      </div>

      {/* Level Tabs */}
      <div className="flex gap-2">
        {(['organization', 'team', 'individual'] as Level[]).map(level => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={activeLevel === level
              ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' }
              : { color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-hover)' }
            }
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-full" style={activeLevel === level ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: 'var(--border-default)' }}>
              {levelCounts[level]}
            </span>
          </button>
        ))}
      </div>

      {/* Add Goal */}
      {addingForLevel === activeLevel ? (
        <AddGoalForm level={activeLevel} onSave={addGoal} onCancel={() => setAddingForLevel(null)} />
      ) : (
        <button
          onClick={() => setAddingForLevel(activeLevel)}
          className="w-full py-3 rounded-lg border-2 border-dashed text-sm font-medium transition-colors"
          style={{ borderColor: 'var(--primary-brand-color)', color: 'var(--primary-brand-color)' }}
        >
          <Plus size={16} className="inline mr-1" />
          Add {activeLevel.charAt(0).toUpperCase() + activeLevel.slice(1)} Goal
        </button>
      )}

      {/* Goal Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && !addingForLevel && (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            No {activeLevel} goals yet. Click above to create one.
          </div>
        )}
        {filtered.map(goal => {
          const isExpanded = expanded.has(goal.id);
          const progress = getProgress(goal);
          const progressColor = getProgressColor(progress);
          const linkedInits = goal.linked_initiative_ids.map(id => initiatives.find(i => i.id === id)).filter(Boolean) as Initiative[];

          return (
            <div key={goal.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleExpand(goal.id)} className="mt-1 shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{goal.title}</div>
                    {goal.description && <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-body)' }}>{goal.description}</div>}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <User size={12} /> {goal.owner_name}
                      </span>
                      {goal.target_date && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Calendar size={12} /> {new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Link2 size={12} /> {goal.linked_initiative_ids.length} linked
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono" style={{ color: progressColor }}>{progress}%</div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>Delete</button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border-default)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
                </div>
              </div>

              {/* Expanded: Linked initiatives */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'var(--border-default)' }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Linked Initiatives</div>
                  {linkedInits.length === 0 ? (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No initiatives linked yet</div>
                  ) : (
                    <div className="space-y-1">
                      {linkedInits.map(init => (
                        <div key={init.id} className="flex items-center gap-2 text-xs py-1">
                          <TrendingUp size={12} style={{ color: 'var(--primary-brand-color)' }} />
                          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{init.display_id}</span>
                          <span className="flex-1" style={{ color: 'var(--text-body)' }}>{init.name}</span>
                          <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS_INLINE[init.status] || '#6b7280'}20`, color: STATUS_COLORS_INLINE[init.status] || '#6b7280' }}>
                            {init.status}
                          </span>
                          <button onClick={() => unlinkInitiative(goal.id, init.id)} style={{ color: 'var(--text-muted)' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Link button / search */}
                  {linkingGoalId === goal.id ? (
                    <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Search size={12} style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text" value={linkSearch} onChange={e => setLinkSearch(e.target.value)}
                          placeholder="Search initiatives..."
                          className="flex-1 text-xs px-2 py-1 rounded border"
                          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
                          autoFocus
                        />
                        <button onClick={() => { setLinkingGoalId(null); setLinkSearch(''); }} style={{ color: 'var(--text-muted)' }}>
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {initiatives
                          .filter(i => !goal.linked_initiative_ids.includes(i.id))
                          .filter(i => !linkSearch || i.name.toLowerCase().includes(linkSearch.toLowerCase()) || i.display_id.toLowerCase().includes(linkSearch.toLowerCase()))
                          .slice(0, 5)
                          .map(init => (
                            <button
                              key={init.id}
                              onClick={() => { linkInitiative(goal.id, init.id); setLinkSearch(''); }}
                              className="w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center gap-2"
                              style={{ color: 'var(--text-body)' }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-brand-color)'; e.currentTarget.style.color = 'white'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-body)'; }}
                            >
                              <span className="font-mono" style={{ opacity: 0.7 }}>{init.display_id}</span>
                              {init.name}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLinkingGoalId(goal.id)}
                      className="text-xs mt-1 flex items-center gap-1"
                      style={{ color: 'var(--primary-brand-color)' }}
                    >
                      <Link2 size={12} /> Link Initiative
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_COLORS_INLINE: Record<string, string> = {
  'Not Started': '#6b7280',
  Define: '#8b5cf6',
  'Ready for Discussion': '#f59e0b',
  'In Progress': '#3b82f6',
  'Under Review': '#6366f1',
  Completed: '#22c55e',
  'On Hold': '#f97316',
  Deferred: '#a855f7',
  Dismissed: '#9ca3af',
};

function AddGoalForm({
  level,
  onSave,
  onCancel,
}: {
  level: Level;
  onSave: (goal: { title: string; description: string; level: Level; owner_name: string; target_date: string | null }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)',
  };

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>New {level} Goal</div>
      <input
        type="text" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Goal title *"
        className="w-full px-3 py-2 rounded-lg border text-sm"
        style={inputStyle}
        autoFocus
      />
      <textarea
        value={description} onChange={e => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
        style={inputStyle}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text" value={owner} onChange={e => setOwner(e.target.value)}
          placeholder="Owner"
          className="px-3 py-2 rounded-lg border text-sm"
          style={inputStyle}
        />
        <input
          type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={inputStyle}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-hover)' }}>Cancel</button>
        <button
          onClick={() => onSave({ title, description, level, owner_name: owner || 'Unassigned', target_date: targetDate || null })}
          disabled={!title.trim()}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--primary-brand-color)', opacity: title.trim() ? 1 : 0.5 }}
        >
          Save Goal
        </button>
      </div>
    </div>
  );
}

import React from 'react';
