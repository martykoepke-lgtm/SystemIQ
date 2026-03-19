import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, Calendar } from 'lucide-react';
import { fetchInitiatives, fetchTeamMembers } from '../../lib/queries';
import type { Initiative, TeamMember } from '../../lib/supabase';
import { TYPE_COLORS, STATUS_COLORS } from '../../lib/constants';

type GroupBy = 'type' | 'member' | 'status' | 'phase';
type TimeRange = 'quarter' | '6months' | 'year' | 'all';
type StatusFilter = 'active' | 'all';

const PHASE_COLORS: Record<string, string> = {
  'Discovery/Define': '#3b82f6',
  Design: '#8b5cf6',
  Build: '#f59e0b',
  'Validate/Test': '#22c55e',
  Deploy: '#ef4444',
  'Post Go Live Support': '#6366f1',
  'Steady State': '#6b7280',
  'In Progress': '#0ea5e9',
  Maintenance: '#64748b',
  'N/A': '#9ca3af',
};

const ACTIVE_STATUSES = new Set(['Not Started', 'Define', 'Ready for Discussion', 'In Progress', 'Under Review', 'On Hold']);

export default function TimelineView() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('type');
  const [timeRange, setTimeRange] = useState<TimeRange>('6months');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  useEffect(() => {
    Promise.all([fetchInitiatives(), fetchTeamMembers()])
      .then(([i, m]) => { setInitiatives(i); setMembers(m); })
      .finally(() => setLoading(false));
  }, []);

  const memberMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, mem.name);
    return m;
  }, [members]);

  // Filter initiatives
  const filtered = useMemo(() => {
    let items = initiatives;
    if (statusFilter === 'active') items = items.filter(i => ACTIVE_STATUSES.has(i.status));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.display_id.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        (i.primary_sci_id && (memberMap.get(i.primary_sci_id) || '').toLowerCase().includes(q))
      );
    }
    // Only show items with at least a start or target date
    return items.filter(i => i.start_date || i.target_date);
  }, [initiatives, statusFilter, search, memberMap]);

  // Time range boundaries
  const { rangeStart, rangeEnd, months } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    switch (timeRange) {
      case 'quarter':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
        break;
      case '6months':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 5, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'all':
        start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        end = new Date(now.getFullYear() + 1, now.getMonth(), 0);
        break;
    }
    const m: { label: string; start: Date }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      m.push({ label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), start: new Date(cur) });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { rangeStart: start, rangeEnd: end, months: m };
  }, [timeRange]);

  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  // Group initiatives
  const grouped = useMemo(() => {
    const map = new Map<string, Initiative[]>();
    for (const init of filtered) {
      let key: string;
      switch (groupBy) {
        case 'type': key = init.type; break;
        case 'member': key = memberMap.get(init.primary_sci_id || '') || 'Unassigned'; break;
        case 'status': key = init.status; break;
        case 'phase': key = init.phase || 'Unspecified'; break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(init);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupBy, memberMap]);

  const getBarColor = (init: Initiative) => {
    if (groupBy === 'phase') return PHASE_COLORS[init.phase || ''] || '#6b7280';
    if (groupBy === 'status') return STATUS_COLORS[init.status] || '#6b7280';
    return TYPE_COLORS[init.type] || 'var(--primary-brand-color)';
  };

  const getBarPosition = (init: Initiative) => {
    const startDate = init.start_date ? new Date(init.start_date + 'T00:00:00') : new Date();
    const endDate = init.target_date ? new Date(init.target_date + 'T00:00:00') : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const left = Math.max(0, ((startDate.getTime() - rangeStart.getTime()) / totalMs) * 100);
    const width = Math.max(1, Math.min(100 - left, ((endDate.getTime() - startDate.getTime()) / totalMs) * 100));
    return { left: `${left}%`, width: `${width}%` };
  };

  const todayPct = ((Date.now() - rangeStart.getTime()) / totalMs) * 100;

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 rounded-lg border text-sm w-48"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
          />
        </div>

        <div className="flex gap-1">
          {(['type', 'member', 'status', 'phase'] as GroupBy[]).map(g => (
            <button key={g} onClick={() => setGroupBy(g)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={groupBy === g ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-hover)' }}
            >
              {g === 'member' ? 'Member' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['quarter', '6months', 'year', 'all'] as TimeRange[]).map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={timeRange === r ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-hover)' }}
            >
              {r === 'quarter' ? 'Quarter' : r === '6months' ? '6 Months' : r === 'year' ? 'Year' : 'All'}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['active', 'all'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={statusFilter === s ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-hover)' }}
            >
              {s === 'active' ? 'Active' : 'All'}
            </button>
          ))}
        </div>

        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} initiatives with dates
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No initiatives with dates found. Add start/target dates to see the timeline.</div>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          {/* Month headers */}
          <div className="flex sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
            <div className="shrink-0 px-3 py-2 text-xs font-medium uppercase" style={{ width: 220, color: 'var(--text-muted)' }}>Initiative</div>
            <div className="flex-1 flex relative">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="text-xs text-center py-2 border-l"
                  style={{ flex: 1, color: 'var(--text-muted)', borderColor: 'var(--border-default)' }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Grouped rows */}
          {grouped.map(([group, items]) => (
            <div key={group}>
              {/* Group header */}
              <div className="flex border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-hover)' }}>
                <div className="px-3 py-1.5 text-xs font-semibold" style={{ width: 220, color: 'var(--text-heading)' }}>
                  {group} <span className="font-mono font-normal" style={{ color: 'var(--text-muted)' }}>({items.length})</span>
                </div>
                <div className="flex-1" />
              </div>

              {/* Initiative rows */}
              {items.map(init => {
                const pos = getBarPosition(init);
                const sciName = memberMap.get(init.primary_sci_id || '') || '';
                return (
                  <div key={init.id} className="flex border-t group" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="shrink-0 px-3 py-2" style={{ width: 220 }}>
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--text-heading)' }}>{init.name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{sciName}</div>
                    </div>
                    <div className="flex-1 relative py-2 px-1">
                      {/* Today marker */}
                      {todayPct >= 0 && todayPct <= 100 && (
                        <div className="absolute top-0 bottom-0 w-px z-10" style={{ left: `${todayPct}%`, backgroundColor: '#ef4444' }} />
                      )}
                      {/* Bar */}
                      <div
                        className="absolute h-5 rounded-sm flex items-center px-1.5 text-white text-xs truncate"
                        style={{
                          left: pos.left,
                          width: pos.width,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: getBarColor(init),
                          opacity: 0.85,
                          fontSize: 10,
                          minWidth: 4,
                        }}
                        title={`${init.name} · ${init.start_date || '?'} → ${init.target_date || '?'}`}
                      >
                        {init.phase || init.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5" style={{ backgroundColor: '#ef4444' }} />
          <span style={{ color: 'var(--text-body)' }}>Today</span>
        </div>
        {groupBy === 'type' && Object.entries(TYPE_COLORS).slice(0, 6).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span style={{ color: 'var(--text-body)' }}>{name}</span>
          </div>
        ))}
        {groupBy === 'phase' && Object.entries(PHASE_COLORS).slice(0, 6).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span style={{ color: 'var(--text-body)' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
