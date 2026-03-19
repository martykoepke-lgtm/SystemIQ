import { ChevronRight } from 'lucide-react';
import type { Initiative } from '../../lib/supabase';
import { PRIORITY_COLORS, TYPE_COLORS, STATUS_COLORS } from '../../lib/constants';

interface InitiativeCardProps {
  initiative: Initiative & { task_count: number; open_task_count: number };
  onClick: (id: string) => void;
}

export default function InitiativeCard({ initiative, onClick }: InitiativeCardProps) {
  const typeColor = TYPE_COLORS[initiative.type] || '#6b7280';
  const priorityColor = PRIORITY_COLORS[initiative.priority] || '#6b7280';
  const statusColor = STATUS_COLORS[initiative.status] || '#6b7280';

  return (
    <button
      onClick={() => onClick(initiative.id)}
      className="w-full text-left rounded-lg p-4 transition-all group"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary-brand-color)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top row: ID + Priority + Type */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
        >
          {initiative.display_id}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}
        >
          {initiative.priority}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
        >
          {initiative.type}
        </span>
        <div className="flex-1" />
        <ChevronRight
          size={16}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold mb-1.5 leading-tight" style={{ color: 'var(--text-heading)' }}>
        {initiative.name}
      </h3>

      {/* Description snippet */}
      {initiative.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {initiative.description}
        </p>
      )}

      {/* Bottom row: Status + Task count */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
        >
          {initiative.status}
        </span>
        {initiative.task_count > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {initiative.open_task_count} open / {initiative.task_count} tasks
          </span>
        )}
        {initiative.go_live_wave && (
          <span
            className="text-xs ml-auto px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--color-epic-gold)15', color: 'var(--color-epic-gold)' }}
          >
            {initiative.go_live_wave}
          </span>
        )}
      </div>
    </button>
  );
}
