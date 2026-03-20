/**
 * GoalsSection — Shows linked goals for an initiative and lets you link/unlink.
 * Drop this into InitiativeDetailView's Details tab.
 */
import { useState, useEffect, useMemo } from 'react';
import { Target, X, Search, Plus } from 'lucide-react';
import { fetchGoals, fetchGoalsForInitiative } from '../../lib/queries';
import { linkInitiativeToGoal, unlinkInitiativeFromGoal } from '../../lib/mutations';
import type { Goal } from '../../lib/supabase';

interface GoalsSectionProps {
  initiativeId: string;
}

export default function GoalsSection({ initiativeId }: GoalsSectionProps) {
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [linkedGoalIds, setLinkedGoalIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [initiativeId]);

  async function loadData() {
    setLoading(true);
    const [goals, links] = await Promise.all([
      fetchGoals(),
      fetchGoalsForInitiative(initiativeId),
    ]);
    setAllGoals(goals);
    setLinkedGoalIds(new Set(links.map(l => l.goal_id)));
    setLoading(false);
  }

  const linkedGoals = useMemo(() =>
    allGoals.filter(g => linkedGoalIds.has(g.id)),
    [allGoals, linkedGoalIds]
  );

  const availableGoals = useMemo(() => {
    let available = allGoals.filter(g => !linkedGoalIds.has(g.id) && g.status === 'active');
    if (search) {
      const q = search.toLowerCase();
      available = available.filter(g => g.title.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q));
    }
    return available.slice(0, 6);
  }, [allGoals, linkedGoalIds, search]);

  async function handleLink(goalId: string) {
    try {
      await linkInitiativeToGoal(initiativeId, goalId);
      setLinkedGoalIds(prev => new Set(prev).add(goalId));
      setSearch('');
    } catch (err) {
      console.error('Link goal error:', err);
    }
  }

  async function handleUnlink(goalId: string) {
    try {
      await unlinkInitiativeFromGoal(initiativeId, goalId);
      setLinkedGoalIds(prev => {
        const next = new Set(prev);
        next.delete(goalId);
        return next;
      });
    } catch (err) {
      console.error('Unlink goal error:', err);
    }
  }

  const levelColors: Record<string, string> = {
    organization: '#8B2B6E',
    team: '#3b82f6',
    individual: '#22c55e',
  };

  if (loading) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Target size={13} />
          Linked Goals ({linkedGoals.length})
        </h4>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-xs flex items-center gap-1 px-2 py-0.5 rounded"
          style={{ color: 'var(--primary-brand-color)' }}
        >
          <Plus size={12} />
          Link Goal
        </button>
      </div>

      {/* Linked goals */}
      {linkedGoals.length > 0 && (
        <div className="space-y-1">
          {linkedGoals.map(goal => (
            <div key={goal.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: levelColors[goal.level] || '#6b7280' }} />
              <span className="flex-1 truncate" style={{ color: 'var(--text-body)' }}>{goal.title}</span>
              <span className="text-xs px-1 py-0.5 rounded" style={{ color: levelColors[goal.level], backgroundColor: `${levelColors[goal.level]}15`, fontSize: '9px' }}>
                {goal.level}
              </span>
              <button onClick={() => handleUnlink(goal.id)} style={{ color: 'var(--text-muted)' }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {linkedGoals.length === 0 && !showSearch && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No goals linked. Click "Link Goal" to associate this initiative with organizational objectives.</p>
      )}

      {/* Search/link UI */}
      {showSearch && (
        <div className="rounded-lg p-2 space-y-1.5" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
          <div className="flex items-center gap-1.5">
            <Search size={12} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search goals..."
              className="flex-1 text-xs px-2 py-1 rounded border"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
              autoFocus
            />
            <button onClick={() => { setShowSearch(false); setSearch(''); }} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>

          {availableGoals.length === 0 ? (
            <p className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>
              {allGoals.length === 0 ? 'No goals created yet. Create goals in Analytics → Goals.' : 'No matching goals found.'}
            </p>
          ) : (
            <div className="space-y-0.5">
              {availableGoals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => handleLink(goal.id)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-body)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-brand-color)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-body)'; }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: levelColors[goal.level] || '#6b7280' }} />
                  <span className="flex-1 truncate">{goal.title}</span>
                  <span style={{ fontSize: '9px', opacity: 0.7 }}>{goal.level}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
