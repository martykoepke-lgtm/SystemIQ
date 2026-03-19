import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, DEFAULT_ORG_ID } from '../../lib/supabase';
import { fetchSCIs } from '../../lib/queries';
import type { TeamMember } from '../../lib/supabase';
import { getCapacityColor, getCapacityLabel, DEFAULT_CAPACITY_THRESHOLDS } from '../../lib/constants';

interface HeatmapCell {
  memberId: string;
  week: string;
  hours: number;
  pct: number;
}

export default function HeatmapView() {
  const [scis, setSCIs] = useState<TeamMember[]>([]);
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeks] = useState(12);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const sciList = await fetchSCIs();
    setSCIs(sciList.sort((a, b) => a.name.localeCompare(b.name)));

    // Fetch all effort logs
    const { data: logs } = await supabase
      .from('effort_logs')
      .select('team_member_id, week_start_date, hours_spent')
      .eq('organization_id', DEFAULT_ORG_ID)
      .order('week_start_date', { ascending: true });

    if (!logs) { setLoading(false); return; }

    // Aggregate hours by member + week
    const map = new Map<string, number>(); // key: memberId|week
    for (const log of logs) {
      const key = `${log.team_member_id}|${log.week_start_date}`;
      map.set(key, (map.get(key) || 0) + (Number(log.hours_spent) || 0));
    }

    const sciIds = new Set(sciList.map(s => s.id));
    const heatCells: HeatmapCell[] = [];
    for (const [key, hours] of map.entries()) {
      const [memberId, week] = key.split('|');
      if (!sciIds.has(memberId)) continue;
      heatCells.push({
        memberId,
        week,
        hours: Math.round(hours * 10) / 10,
        pct: Math.round(hours / 40 * 100),
      });
    }
    setCells(heatCells);
    setLoading(false);
  }

  // Get last N weeks (generate from today going back)
  const weekColumns = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    // Find most recent Monday
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(monday);
      d.setDate(d.getDate() - i * 7);
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  }, [weeks]);

  // Build lookup
  const cellMap = useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    for (const c of cells) m.set(`${c.memberId}|${c.week}`, c);
    return m;
  }, [cells]);

  const [hoveredCell, setHoveredCell] = useState<{ member: string; week: string; hours: number; pct: number; x: number; y: number } | null>(null);

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Team Capacity Heatmap — Last {weeks} Weeks</div>

      {scis.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No SCIs found</div>
      ) : (
        <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <table className="w-full" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase sticky left-0" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', minWidth: 160 }}>
                  Team Member
                </th>
                {weekColumns.map(week => {
                  const d = new Date(week + 'T00:00:00');
                  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <th key={week} className="px-1 py-2 text-center text-xs font-medium" style={{ color: 'var(--text-muted)', minWidth: 56 }}>
                      {label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {scis.map(sci => (
                <tr key={sci.id} className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                  <td className="px-3 py-1.5 text-xs font-medium sticky left-0" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-heading)' }}>
                    {sci.name}
                  </td>
                  {weekColumns.map(week => {
                    const cell = cellMap.get(`${sci.id}|${week}`);
                    const hours = cell?.hours || 0;
                    const pct = cell?.pct || 0;
                    const hasData = !!cell;
                    return (
                      <td
                        key={week}
                        className="px-1 py-1.5 text-center relative"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({ member: sci.name, week, hours, pct, x: rect.left, y: rect.bottom });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className="mx-auto rounded text-xs font-mono flex items-center justify-center"
                          style={{
                            width: 44,
                            height: 28,
                            backgroundColor: hasData ? getCapacityColor(pct) : 'var(--bg-surface-hover)',
                            color: hasData ? (pct > 60 ? 'white' : 'var(--text-heading)') : 'var(--text-muted)',
                            fontSize: 10,
                            fontWeight: hasData ? 600 : 400,
                          }}
                        >
                          {hasData ? `${hours}h` : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y + 4,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>{hoveredCell.member}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Week of {new Date(hoveredCell.week + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-xs mt-1">
            <span className="font-mono font-bold" style={{ color: getCapacityColor(hoveredCell.pct) }}>{hoveredCell.hours}h</span>
            <span style={{ color: 'var(--text-muted)' }}> · {hoveredCell.pct}% · </span>
            <span style={{ color: getCapacityColor(hoveredCell.pct) }}>{getCapacityLabel(hoveredCell.pct)}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Legend:</span>
        {DEFAULT_CAPACITY_THRESHOLDS.map(t => (
          <div key={t.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: t.color }} />
            <span style={{ color: 'var(--text-body)' }}>{t.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)' }} />
          <span style={{ color: 'var(--text-muted)' }}>No Data</span>
        </div>
      </div>
    </div>
  );
}
