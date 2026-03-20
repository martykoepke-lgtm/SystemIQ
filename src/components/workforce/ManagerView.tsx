import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchTeamMembers } from '../../lib/queries';
import { calculateTeamCapacity, type MemberCapacity } from '../../lib/workloadCalculator';
import type { TeamMember } from '../../lib/supabase';
import { TYPE_COLORS } from '../../lib/constants';

export default function ManagerView() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [capacities, setCapacities] = useState<MemberCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const allMembers = await fetchTeamMembers();
    setMembers(allMembers);
    const sciMembers = allMembers.filter(m => m.role === 'sci');
    const caps = await calculateTeamCapacity(sciMembers);
    setCapacities(caps);
    setLoading(false);
  }

  const managers = useMemo(() => members.filter(m => m.role === 'sci_manager'), [members]);

  const filtered = useMemo(() => {
    if (managerFilter === 'all') return capacities;
    return capacities.filter(c => c.member.manager_id === managerFilter);
  }, [capacities, managerFilter]);

  // Team-level aggregates
  const teamStats = useMemo(() => {
    const totalInits = filtered.reduce((s, c) => s + c.initiativeCount, 0);
    const avgPlanned = filtered.length > 0 ? filtered.reduce((s, c) => s + c.plannedPct, 0) / filtered.length : 0;
    const avgActual = filtered.length > 0 ? filtered.reduce((s, c) => s + c.actualPct, 0) / filtered.length : 0;
    return { totalInits, avgPlanned: Math.round(avgPlanned), avgActual: Math.round(avgActual), memberCount: filtered.length };
  }, [filtered]);

  const selectedCapacity = selectedCard ? capacities.find(c => c.member.id === selectedCard) : null;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Manager's View</h2>
        <div className="flex gap-1">
          <button onClick={() => setManagerFilter('all')}
            className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
            style={managerFilter === 'all' ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-body)' }}>
            All Teams ({capacities.length})
          </button>
          {managers.map(m => {
            const count = capacities.filter(c => c.member.manager_id === m.id).length;
            return (
              <button key={m.id} onClick={() => setManagerFilter(m.id)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                style={managerFilter === m.id ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-body)' }}>
                {m.name.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{teamStats.memberCount} members</span>
          <span>{teamStats.totalInits} initiatives</span>
          <span>Avg capacity: {teamStats.avgPlanned}%</span>
        </div>
      </div>

      {/* Capacity Cards Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-4 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map(cap => {
            const isSelected = selectedCard === cap.member.id;
            return (
              <button
                key={cap.member.id}
                onClick={() => setSelectedCard(isSelected ? null : cap.member.id)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: isSelected ? `2px solid ${cap.capacityColor}` : '1px solid var(--border-default)',
                }}
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: cap.capacityColor }}>
                    {cap.member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{cap.member.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{cap.initiativeCount} initiatives</div>
                  </div>
                </div>

                {/* Capacity bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: 'var(--text-muted)' }}>Planned</span>
                      <span style={{ color: cap.capacityColor }}>{cap.plannedHours.toFixed(1)}h ({Math.round(cap.plannedPct)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(cap.plannedPct, 100)}%`, backgroundColor: cap.capacityColor }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: 'var(--text-muted)' }}>Actual</span>
                      <span style={{ color: 'var(--text-body)' }}>{cap.actualHours.toFixed(1)}h ({Math.round(cap.actualPct)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(cap.actualPct, 100)}%`, backgroundColor: 'var(--color-info)' }} />
                    </div>
                  </div>
                </div>

                {/* Variance */}
                <div className="mt-2 text-xs text-right" style={{ color: cap.variance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {cap.variance > 0 ? '+' : ''}{cap.variance.toFixed(1)}h variance
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel when card selected */}
        {selectedCapacity && (
          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-heading)' }}>
              {selectedCapacity.member.name} — {selectedCapacity.initiativeCount} Active Initiatives
            </h3>
            <div className="grid gap-1">
              {selectedCapacity.initiatives.map(init => {
                const typeColor = TYPE_COLORS[init.type] || '#6b7280';
                return (
                  <div key={init.id} className="grid items-center px-3 py-1.5 rounded"
                    style={{ gridTemplateColumns: '72px 1fr 100px 80px 80px', backgroundColor: 'var(--bg-surface-hover)' }}>
                    <span className="text-xs font-mono" style={{ color: typeColor }}>{init.display_id}</span>
                    <span className="text-sm truncate" style={{ color: 'var(--text-heading)' }}>{init.name}</span>
                    <span className="text-xs" style={{ color: typeColor }}>{init.type}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{init.work_effort || '—'}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{init.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
