import { Search, Command } from 'lucide-react';

export type MainView = 'command' | 'workforce' | 'analytics' | 'admin';

interface TopBarProps {
  activeView: MainView;
  onNavigate: (view: MainView) => void;
  onOpenCommandPalette: () => void;
}

const TABS: { key: MainView; label: string }[] = [
  { key: 'command', label: 'EG Command Center' },
  { key: 'workforce', label: 'Workforce' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'admin', label: 'Admin' },
];

export default function TopBar({ activeView, onNavigate, onOpenCommandPalette }: TopBarProps) {
  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Left: Brand + Tabs */}
      <div className="flex items-center gap-6">
        <h1
          className="text-lg font-bold tracking-tight cursor-pointer"
          style={{ color: 'var(--primary-brand-color)' }}
          onClick={() => onNavigate('command')}
        >
          SystemIQ
        </h1>

        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onNavigate(tab.key)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--primary-brand-color)',
                        color: 'white',
                      }
                    : {
                        color: 'var(--text-body)',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Search / Command Palette trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-input)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-brand-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd
            className="ml-4 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              color: 'var(--text-muted)',
            }}
          >
            <Command size={10} />K
          </kbd>
        </button>
      </div>
    </header>
  );
}
