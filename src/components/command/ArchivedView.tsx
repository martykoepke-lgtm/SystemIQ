import { useState, useEffect, useMemo } from 'react';
import { Loader2, Archive, ChevronRight } from 'lucide-react';
import { fetchInitiativesWithCounts } from '../../lib/queries';
import type { Initiative } from '../../lib/supabase';
import { TYPE_COLORS, STATUS_COLORS, PRIORITY_COLORS } from '../../lib/constants';

type InitiativeWithCounts = Initiative & { task_count: number; open_task_count: number };

const ARCHIVED_STATUSES = new Set(['Completed', 'Dismissed', 'Deferred']);

interface ArchivedViewProps {
  onOpenInitiative: (id: string) => void;
}

export default function ArchivedView({ onOpenInitiative }: ArchivedViewProps) {
  const [initiatives, setInitiatives] = useState<InitiativeWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await fetchInitiativesWithCounts();
    setInitiatives(data);
    setLoading(false);
  }

  const archived = useMemo(() => {
    let items = initiatives.filter(i => ARCHIVED_STATUSES.has(i.status));
    if (statusFilter) items = items.filter(i => i.status === statusFilter);
    return items;
  }, [initiatives, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    initiatives.filter(i => ARCHIVED_STATUSES.has(i.status)).forEach(i => {
      c[i.status] = (c[i.status] || 0) + 1;
    });
    return c;
  }, [initiatives]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <Archive size={20} style={{ color: 'var(--text-heading)' }} />
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Archived</h2>
        <div className="flex gap-1">
          <button onClick={() => setStatusFilter('')}
            className="px-2 py-1 rounded text-xs font-medium transition-colors"
            style={!statusFilter ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-muted)' }}>
            All ({archived.length})
          </button>
          {['Completed', 'Dismissed', 'Deferred'].map(s => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className="px-2 py-1 rounded text-xs font-medium transition-colors"
              style={statusFilter === s ? { backgroundColor: STATUS_COLORS[s] || '#6b7280', color: 'white' } : { color: 'var(--text-muted)' }}>
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {archived.length === 0 ? (
          <div className="text-center py-12">
            <Archive size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No archived initiatives</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                <th className="text-left px-4 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)', width: '80px' }}>ID</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Initiative</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)', width: '120px' }}>Type</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)', width: '100px' }}>Status</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)', width: '80px' }}>Tasks</th>
              </tr>
            </thead>
            <tbody>
              {archived.map(init => {
                const typeColor = TYPE_COLORS[init.type] || '#6b7280';
                const statusColor = STATUS_COLORS[init.status] || '#6b7280';
                return (
                  <tr key={init.id} onClick={() => onOpenInitiative(init.id)}
                    className="border-b cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border-default)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: typeColor }}>{init.display_id}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--text-heading)' }}>{init.name}</td>
                    <td className="px-3 py-2.5"><span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor}12`, color: typeColor }}>{init.type}</span></td>
                    <td className="px-3 py-2.5"><span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>{init.status}</span></td>
                    <td className="px-3 py-2.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{init.task_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
