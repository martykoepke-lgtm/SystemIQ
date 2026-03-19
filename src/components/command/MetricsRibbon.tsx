import type { Initiative } from '../../lib/supabase';
import { ACTIVE_INITIATIVE_STATUSES, PRIORITY_COLORS } from '../../lib/constants';

interface MetricsRibbonProps {
  initiatives: (Initiative & { task_count: number; open_task_count: number })[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export default function MetricsRibbon({ initiatives, activeFilter, onFilterChange }: MetricsRibbonProps) {
  const totalActive = initiatives.filter((i) => ACTIVE_INITIATIVE_STATUSES.has(i.status)).length;
  const highPriorityTasks = initiatives.reduce((sum, i) => {
    if (i.priority === 'Critical' || i.priority === 'High') return sum + i.open_task_count;
    return sum;
  }, 0);
  const unassignedCount = initiatives.filter((i) => !i.primary_sci_id && ACTIVE_INITIATIVE_STATUSES.has(i.status)).length;
  const epicGoldCount = initiatives.filter((i) => i.type === 'Epic Gold' && ACTIVE_INITIATIVE_STATUSES.has(i.status)).length;

  const pills = [
    { key: null, label: 'All Initiatives', value: totalActive, color: 'var(--primary-brand-color)' },
    { key: 'epicgold', label: 'Epic Gold', value: epicGoldCount, color: 'var(--color-epic-gold)' },
    { key: 'high', label: 'High Priority Tasks', value: highPriorityTasks, color: PRIORITY_COLORS.High },
    { key: 'unassigned', label: 'Unassigned', value: unassignedCount, color: PRIORITY_COLORS.Low },
  ];

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 border-b overflow-x-auto"
      style={{ borderColor: 'var(--border-default)' }}
    >
      {pills.map((pill) => {
        const isActive = activeFilter === pill.key;
        return (
          <button
            key={pill.key ?? 'all'}
            onClick={() => onFilterChange(isActive ? null : pill.key)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: isActive ? pill.color : 'var(--bg-surface)',
              color: isActive ? 'white' : 'var(--text-body)',
              border: isActive ? 'none' : '1px solid var(--border-default)',
            }}
          >
            <span>{pill.label}</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-mono"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${pill.color}20`,
                color: isActive ? 'white' : pill.color,
              }}
            >
              {pill.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
