import { useState, useEffect, useMemo } from 'react';
import { Loader2, UserCog, ChevronRight } from 'lucide-react';
import { fetchInitiativesWithCounts, fetchTeamMembers } from '../../lib/queries';
import type { Initiative, TeamMember } from '../../lib/supabase';
import { TYPE_COLORS, STATUS_COLORS, PRIORITY_COLORS, ACTIVE_INITIATIVE_STATUSES } from '../../lib/constants';

type InitiativeWithCounts = Initiative & { task_count: number; open_task_count: number };

interface SCIViewProps {
  onOpenInitiative: (id: string) => void;
}

export default function SCIView({ onOpenInitiative }: SCIViewProps) {
  const [initiatives, setInitiatives] = useState<InitiativeWithCounts[]>([]);
  const [scis, setScis] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSCI, setSelectedSCI] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [initData, sciData] = await Promise.all([
      fetchInitiativesWithCounts(),
      fetchTeamMembers('sci'),
    ]);
    setInitiatives(initData);
    setScis(sciData);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!selectedSCI) return [];
    // EG Command Center only — show eg_approved items
    const items = initiatives.filter(
      (i) => i.eg_approved && (i.primary_sci_id === selectedSCI || i.secondary_sci_id === selectedSCI) && ACTIVE_INITIATIVE_STATUSES.has(i.status)
    );
    // On Hold to bottom
    items.sort((a, b) => (a.status === 'On Hold' ? 1 : 0) - (b.status === 'On Hold' ? 1 : 0));
    return items;
  }, [initiatives, selectedSCI]);

  const selectedName = scis.find(s => s.id === selectedSCI)?.name;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <UserCog size={20} style={{ color: 'var(--text-heading)' }} />
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>By SCI</h2>
        <select
          value={selectedSCI}
          onChange={(e) => setSelectedSCI(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
        >
          <option value="">Select SCI...</option>
          {scis.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {selectedName && (
          <span className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} initiative{filtered.length !== 1 ? 's' : ''} for {selectedName}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedSCI ? (
          <div className="text-center py-12">
            <UserCog size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select an SCI to view their initiatives</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active initiatives for {selectedName}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((init) => {
              const typeColor = TYPE_COLORS[init.type] || '#6b7280';
              const statusColor = STATUS_COLORS[init.status] || '#6b7280';
              const priorityColor = PRIORITY_COLORS[init.priority] || '#6b7280';
              return (
                <button
                  key={init.id}
                  onClick={() => onOpenInitiative(init.id)}
                  className="w-full text-left rounded-lg p-4 transition-all group"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-brand-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>{init.display_id}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>{init.priority}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>{init.type}</span>
                    <div className="flex-1" />
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>{init.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>{init.status}</span>
                    {init.task_count > 0 && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{init.open_task_count} open / {init.task_count} tasks</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
