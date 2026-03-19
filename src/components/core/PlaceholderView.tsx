import type { ReactNode } from 'react';

interface PlaceholderViewProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function PlaceholderView({ title, subtitle, icon }: PlaceholderViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        className="text-center rounded-xl p-12 max-w-md w-full"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {icon && (
          <div className="mb-4 flex justify-center" style={{ color: 'var(--text-muted)' }}>
            {icon}
          </div>
        )}
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-heading)' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
