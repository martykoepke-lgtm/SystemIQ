import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from 'recharts';
import { fetchEffortByWeek, fetchEffortByWorkType, fetchEffortByPhase, fetchTopEffortInitiatives } from '../../lib/analyticsEngine';
import { fetchSCIs } from '../../lib/queries';
import type { TeamMember, Initiative } from '../../lib/supabase';
import { TYPE_COLORS } from '../../lib/constants';

export default function EffortTrends() {
  const [weeklyData, setWeeklyData] = useState<{ weekLabel: string; totalHours: number; initiativeCount: number }[]>([]);
  const [byType, setByType] = useState<{ type: string; hours: number; count: number }[]>([]);
  const [byPhase, setByPhase] = useState<{ type: string; hours: number; count: number }[]>([]);
  const [topEffort, setTopEffort] = useState<{ initiative: Initiative; totalHours: number }[]>([]);
  const [scis, setSCIs] = useState<TeamMember[]>([]);
  const [weeks, setWeeks] = useState(16);
  const [personFilter, setPersonFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSCIs().then(setSCIs);
  }, []);

  useEffect(() => {
    setLoading(true);
    const memberId = personFilter || undefined;
    Promise.all([
      fetchEffortByWeek(weeks, memberId),
      fetchEffortByWorkType(memberId),
      fetchEffortByPhase(memberId),
      fetchTopEffortInitiatives(10),
    ]).then(([w, t, p, top]) => {
      setWeeklyData(w);
      setByType(t);
      setByPhase(p);
      setTopEffort(top);
    }).finally(() => setLoading(false));
  }, [weeks, personFilter]);

  const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 },
  };

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Weeks</label>
          <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={16}>16</option>
            <option value={24}>24</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Person</label>
          <select value={personFilter} onChange={e => setPersonFilter(e.target.value)} className="px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
            <option value="">All SCIs</option>
            {scis.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Portfolio Effort Trend</div>
        {weeklyData.length === 0 ? (
          <div className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>No effort data available. Log effort in Staff View to see trends.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis yAxisId="hours" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip {...tooltipStyle} />
              <Legend />
              <Line yAxisId="hours" type="monotone" dataKey="totalHours" stroke="var(--primary-brand-color)" strokeWidth={2} name="Hours" dot={false} />
              <Line yAxisId="count" type="monotone" dataKey="initiativeCount" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Initiatives" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* By Type + By Phase */}
      <div className="grid grid-cols-2 gap-4">
        <HorizontalBarCard title="Hours by Work Type" data={byType.map(d => ({ name: d.type, value: d.hours }))} colorMap={TYPE_COLORS} />
        <HorizontalBarCard title="Hours by Phase" data={byPhase.map(d => ({ name: d.type, value: d.hours }))} />
      </div>

      {/* Top Effort Initiatives */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Top Effort Initiatives</div>
        {topEffort.length === 0 ? (
          <div className="px-4 py-8 text-xs text-center" style={{ color: 'var(--text-muted)' }}>No effort data</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Type</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {topEffort.map(({ initiative: init, totalHours }) => (
                <tr key={init.id} className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{init.display_id}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-heading)' }}>{init.name}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${TYPE_COLORS[init.type] || '#6b7280'}20`, color: TYPE_COLORS[init.type] || '#6b7280' }}>
                      {init.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium" style={{ color: 'var(--text-heading)' }}>{totalHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function HorizontalBarCard({ title, data, colorMap }: { title: string; data: { name: string; value: number }[]; colorMap?: Record<string, string> }) {
  const defaultColor = 'var(--primary-brand-color)';
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>{title}</div>
      {data.length === 0 ? (
        <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(140, data.length * 32)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'var(--text-body)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((d) => (
                <Cell key={d.name} fill={colorMap?.[d.name] || defaultColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
