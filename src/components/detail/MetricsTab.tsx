import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Clock, TrendingUp, TrendingDown, Minus, Plus, Pencil, Trash2, Target } from 'lucide-react';
import { fetchEffortLogsForInitiative } from '../../lib/queries';
import { loadCapacityConfig, calculatePlannedHours } from '../../lib/workloadCalculator';
import { deleteInitiativeMetric } from '../../lib/mutations';
import type { Initiative, EffortLog, InitiativeMetric } from '../../lib/supabase';
import type { CapacityConfig } from '../../lib/workloadCalculator';
import { EFFORT_SIZE_HOURS } from '../../lib/constants';
import { startOfWeek, format, subWeeks } from 'date-fns';
import { getUnitLabel } from '../modals/MetricModal';

interface MetricsTabProps {
  initiative: Initiative;
  onLogEffort: () => void;
  metrics?: InitiativeMetric[];
  onAddMetric?: () => void;
  onEditMetric?: (metric: InitiativeMetric) => void;
  onMetricsChanged?: () => void;
}

export default function MetricsTab({ initiative, onLogEffort, metrics, onAddMetric, onEditMetric, onMetricsChanged }: MetricsTabProps) {
  const [effortLogs, setEffortLogs] = useState<EffortLog[]>([]);
  const [config, setConfig] = useState<CapacityConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [initiative.id]);

  async function loadData() {
    setLoading(true);
    const [logs, cfg] = await Promise.all([
      fetchEffortLogsForInitiative(initiative.id),
      loadCapacityConfig(),
    ]);
    setEffortLogs(logs);
    setConfig(cfg);
    setLoading(false);
  }

  const plannedHours = useMemo(() => {
    if (!config) return 0;
    return calculatePlannedHours(initiative, config);
  }, [initiative, config]);

  const currentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
  const currentWeekStr = format(currentWeek, 'yyyy-MM-dd');

  const currentWeekLog = effortLogs.find((l) => l.week_start_date === currentWeekStr);
  const currentWeekHours = currentWeekLog?.hours_spent || 0;

  // Last 8 weeks of data for sparkline
  const weeklyData = useMemo(() => {
    const weeks: { week: string; hours: number; label: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 0 });
      const weekStr = format(weekStart, 'yyyy-MM-dd');
      const log = effortLogs.find((l) => l.week_start_date === weekStr);
      weeks.push({
        week: weekStr,
        hours: log?.hours_spent || 0,
        label: format(weekStart, 'MMM d'),
      });
    }
    return weeks;
  }, [effortLogs]);

  const totalHoursLogged = effortLogs.reduce((sum, l) => sum + l.hours_spent, 0);
  const weeksLogged = new Set(effortLogs.map((l) => l.week_start_date)).size;

  // Trend: compare last 2 weeks
  const lastWeekHours = weeklyData[weeklyData.length - 2]?.hours || 0;
  const trend = currentWeekHours - lastWeekHours;

  const maxBarHeight = 60;
  const maxHours = Math.max(...weeklyData.map((w) => w.hours), plannedHours, 1);

  async function handleDeleteMetric(metric: InitiativeMetric) {
    if (!confirm(`Delete metric "${metric.metric_name}"?`)) return;
    try {
      await deleteInitiativeMetric(metric.id);
      onMetricsChanged?.();
    } catch (err) {
      console.error('Error deleting metric:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
        Loading metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ═══ OUTCOME METRICS SECTION ═══ */}
      <div>
        {/* Add Metric button */}
        {onAddMetric && (
          <button
            onClick={onAddMetric}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium mb-4"
            style={{ backgroundColor: 'var(--primary-brand-color)', color: 'white' }}
          >
            <Target size={14} /> Add Metric
          </button>
        )}

        {/* Metric Cards */}
        {metrics && metrics.length > 0 && (
          <div className="space-y-4">
            {metrics.map((metric) => (
              <OutcomeMetricCard
                key={metric.id}
                metric={metric}
                onEdit={() => onEditMetric?.(metric)}
                onDelete={() => handleDeleteMetric(metric)}
              />
            ))}
          </div>
        )}

        {metrics && metrics.length === 0 && (
          <div
            className="text-center py-8 rounded-lg border border-dashed mb-2"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
          >
            <Target size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No outcome metrics defined yet</p>
            <p className="text-xs mt-1">Track pre/post initiative impact by adding metrics</p>
          </div>
        )}
      </div>

      {/* ═══ DIVIDER ═══ */}
      {metrics !== undefined && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-default)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Effort Tracking
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-default)' }} />
        </div>
      )}

      {/* ═══ EFFORT TRACKING (EXISTING) ═══ */}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <EffortCard
          label="Planned Hours/Wk"
          value={`${plannedHours.toFixed(1)}h`}
          sub={initiative.work_effort ? `${initiative.work_effort} effort` : 'No effort set'}
          icon={<Clock size={16} />}
          color="var(--primary-brand-color)"
        />
        <EffortCard
          label="This Week"
          value={`${currentWeekHours.toFixed(1)}h`}
          sub={
            trend > 0 ? `+${trend.toFixed(1)}h vs last week` :
            trend < 0 ? `${trend.toFixed(1)}h vs last week` :
            'Same as last week'
          }
          icon={trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
          color={trend > 0 ? '#f59e0b' : trend < 0 ? '#22c55e' : '#6b7280'}
        />
        <EffortCard
          label="Total Hours Invested"
          value={`${totalHoursLogged.toFixed(1)}h`}
          sub={`Across ${weeksLogged} week${weeksLogged !== 1 ? 's' : ''}`}
          icon={<BarChart3 size={16} />}
          color="#8b5cf6"
        />
        <EffortCard
          label="Variance"
          value={`${(currentWeekHours - plannedHours) >= 0 ? '+' : ''}${(currentWeekHours - plannedHours).toFixed(1)}h`}
          sub={currentWeekHours > plannedHours ? 'Over planned' : currentWeekHours < plannedHours ? 'Under planned' : 'On target'}
          icon={currentWeekHours > plannedHours ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          color={currentWeekHours > plannedHours ? '#dc2626' : '#22c55e'}
        />
      </div>

      {/* Weekly Effort Chart */}
      <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
            Weekly Effort (Last 8 Weeks)
          </h3>
          <button
            onClick={onLogEffort}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--primary-brand-color)', color: 'white' }}
          >
            <Plus size={14} /> Log Effort
          </button>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end gap-2" style={{ height: maxBarHeight + 30 }}>
          {weeklyData.map((w) => {
            const barHeight = maxHours > 0 ? (w.hours / maxHours) * maxBarHeight : 0;
            const isCurrentWeek = w.week === currentWeekStr;
            return (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                  {w.hours > 0 ? `${w.hours}h` : ''}
                </span>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: Math.max(barHeight, w.hours > 0 ? 4 : 1),
                    backgroundColor: isCurrentWeek ? 'var(--primary-brand-color)' : w.hours > 0 ? '#60a5fa' : 'var(--bg-surface-hover)',
                    opacity: isCurrentWeek ? 1 : 0.7,
                  }}
                />
                <div className="w-full" style={{ height: 2, backgroundColor: '#f59e0b', opacity: 0.5, marginTop: -2 }} />
                <span className="text-xs" style={{ color: isCurrentWeek ? 'var(--text-heading)' : 'var(--text-muted)', fontSize: 10, fontWeight: isCurrentWeek ? 600 : 400 }}>
                  {w.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded" style={{ backgroundColor: '#60a5fa' }} /> Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5" style={{ backgroundColor: '#f59e0b' }} /> Planned ({plannedHours.toFixed(1)}h)
          </span>
        </div>
      </div>

      {/* Effort Size Reference */}
      <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>
          Effort Size Reference
        </h3>
        <div className="flex gap-3">
          {Object.entries(EFFORT_SIZE_HOURS).map(([key, hours]) => {
            const isActive = initiative.work_effort === key;
            return (
              <div
                key={key}
                className="flex-1 text-center rounded-lg p-2 border"
                style={{
                  borderColor: isActive ? 'var(--primary-brand-color)' : 'var(--border-default)',
                  backgroundColor: isActive ? 'rgba(var(--primary-brand-rgb, 59, 130, 246), 0.08)' : 'transparent',
                }}
              >
                <div className="text-sm font-bold" style={{ color: isActive ? 'var(--primary-brand-color)' : 'var(--text-heading)' }}>
                  {key}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{hours}h/wk</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Effort Logs */}
      {effortLogs.length > 0 && (
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>
            Recent Effort Logs
          </h3>
          <div className="space-y-2">
            {effortLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 px-3 rounded"
                style={{ backgroundColor: 'var(--bg-page)' }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
                    Week of {format(new Date(log.week_start_date + 'T00:00:00'), 'MMM d, yyyy')}
                  </span>
                  {log.note && (
                    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>— {log.note}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {log.effort_size && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                      {log.effort_size}
                    </span>
                  )}
                  <span className="text-sm font-mono font-semibold" style={{ color: 'var(--primary-brand-color)' }}>
                    {log.hours_spent}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Outcome Metric Card ───

function OutcomeMetricCard({ metric, onEdit, onDelete }: {
  metric: InitiativeMetric;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const unitLabel = getUnitLabel(metric.unit);
  const hasResult = metric.result_value != null && metric.baseline_value != null;

  let pctChange = 0;
  let changeDirection: 'up' | 'down' | 'flat' = 'flat';
  if (hasResult && metric.baseline_value !== 0) {
    pctChange = ((metric.result_value! - metric.baseline_value!) / Math.abs(metric.baseline_value!)) * 100;
    changeDirection = pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'flat';
  }

  // For time/cost units, decrease = good (green). For count/score/dollars, increase = good.
  const decreaseIsGood = ['minutes', 'hours', 'days'].includes(metric.unit);
  const changeIsPositive = decreaseIsGood ? changeDirection === 'down' : changeDirection === 'up';
  const changeColor = hasResult ? (changeIsPositive ? '#22c55e' : '#dc2626') : '#6b7280';

  function formatValue(val: number | null) {
    if (val == null) return null;
    // Format large numbers with commas
    if (Math.abs(val) >= 1000) return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  }

  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
            {metric.metric_name}
          </h3>
          <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {unitLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Three-column layout: Baseline | Target | Result */}
      <div className="grid grid-cols-3 gap-4">
        {/* Baseline */}
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Baseline
          </div>
          {metric.baseline_value != null ? (
            <>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
                {formatValue(metric.baseline_value)}
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{unitLabel}</span>
              </div>
              {metric.baseline_date && (
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(metric.baseline_date)}
                </div>
              )}
              {metric.baseline_timeframe && (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {metric.baseline_timeframe}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Not set</div>
          )}
        </div>

        {/* Target */}
        <div className="text-center border-x" style={{ borderColor: 'var(--border-default)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#f59e0b' }}>
            Target
          </div>
          {metric.target_value != null ? (
            <div className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
              {formatValue(metric.target_value)}
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{unitLabel}</span>
            </div>
          ) : (
            <div className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Not set</div>
          )}
        </div>

        {/* Result */}
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: changeColor }}>
            Result
          </div>
          {metric.result_value != null ? (
            <>
              <div className="text-2xl font-bold" style={{ color: changeColor }}>
                {formatValue(metric.result_value)}
                <span className="text-sm font-normal ml-1">{unitLabel}</span>
              </div>
              {metric.result_date && (
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(metric.result_date)}
                </div>
              )}
              {hasResult && (
                <span
                  className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                  style={{ backgroundColor: `${changeColor}15`, color: changeColor }}
                >
                  {changeDirection === 'down' ? '↓' : changeDirection === 'up' ? '↑' : '—'}
                  {Math.abs(pctChange).toFixed(0)}% change
                </span>
              )}
            </>
          ) : (
            <div className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Not set</div>
          )}
        </div>
      </div>

      {/* Notes */}
      {metric.notes && (
        <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
          {metric.notes}
        </div>
      )}
    </div>
  );
}


// ─── Effort KPI Card ───

function EffortCard({ label, value, sub, icon, color }: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)', borderLeftWidth: 3, borderLeftColor: color }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}
