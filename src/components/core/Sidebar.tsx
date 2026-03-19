import {
  Home,
  Zap,
  Users,
  Boxes,
  UserCog,
  GitPullRequestArrow,
  Archive,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type CommandSubView = 'home' | 'epicgold' | 'analyst' | 'module' | 'sci' | 'pipeline' | 'archived';

interface SidebarProps {
  activeSubView: CommandSubView;
  onNavigate: (sub: CommandSubView) => void;
}

const NAV_ITEMS: { key: CommandSubView; label: string; icon: React.ElementType }[] = [
  { key: 'home', label: 'Command Home', icon: Home },
  { key: 'epicgold', label: 'All Items', icon: Zap },
  { key: 'analyst', label: 'By Analyst', icon: Users },
  { key: 'module', label: 'By Module', icon: Boxes },
  { key: 'sci', label: 'By SCI', icon: UserCog },
  { key: 'pipeline', label: 'Pipeline', icon: GitPullRequestArrow },
  { key: 'archived', label: 'Archived', icon: Archive },
];

export default function Sidebar({ activeSubView, onNavigate }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Dual mode sidebar
  const bg = isDark ? '#1e293b' : '#ffffff';
  const textDefault = isDark ? '#94a3b8' : '#64748b';
  const textHover = isDark ? '#e2e8f0' : '#1e293b';
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(139,43,110,0.06)';
  const activeBg = isDark ? 'rgba(139, 43, 110, 0.25)' : 'rgba(139, 43, 110, 0.1)';
  const activeText = isDark ? '#d4a0c4' : '#8B2B6E';
  const borderColor = isDark ? '#334155' : '#e5e7eb';

  return (
    <aside
      className="w-60 flex flex-col border-r shrink-0"
      style={{
        backgroundColor: bg,
        borderColor,
        minHeight: 'calc(100vh - 3.5rem)',
      }}
    >
      <nav className="flex-1 px-3 pt-3 pb-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSubView === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                isActive
                  ? {
                      backgroundColor: activeBg,
                      color: activeText,
                      borderLeft: '3px solid var(--primary-brand-color)',
                    }
                  : {
                      color: textDefault,
                      borderLeft: '3px solid transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = hoverBg;
                  e.currentTarget.style.color = textHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = textDefault;
                }
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.key === 'epicgold' && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-mono"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                >
                  EG
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t" style={{ borderColor }}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: textDefault }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = hoverBg;
            e.currentTarget.style.color = textHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = textDefault;
          }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
