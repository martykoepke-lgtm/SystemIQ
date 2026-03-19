import { useEffect, useState, useRef } from 'react';
import {
  Home,
  Zap,
  Users,
  Boxes,
  UserCog,
  GitPullRequestArrow,
  LayoutDashboard,
  BarChart3,
  Settings,
  Briefcase,
  ClipboardList,
  Shield,
} from 'lucide-react';
import type { MainView } from './TopBar';
import type { CommandSubView } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: MainView, sub?: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Command Center
    { id: 'cmd-home', label: 'Command Home', description: 'All initiatives board', icon: Home, action: () => onNavigate('command', 'home'), group: 'EG Command Center' },
    { id: 'cmd-eg', label: 'Epic Gold', description: 'Epic Gold initiatives & tasks', icon: Zap, action: () => onNavigate('command', 'epicgold'), group: 'EG Command Center' },
    { id: 'cmd-analyst', label: 'By Analyst', description: 'View tasks by analyst', icon: Users, action: () => onNavigate('command', 'analyst'), group: 'EG Command Center' },
    { id: 'cmd-module', label: 'By Module', description: 'View tasks by Epic module', icon: Boxes, action: () => onNavigate('command', 'module'), group: 'EG Command Center' },
    { id: 'cmd-sci', label: 'By SCI', description: 'View initiatives by SCI', icon: UserCog, action: () => onNavigate('command', 'sci'), group: 'EG Command Center' },
    { id: 'cmd-pipeline', label: 'Pipeline', description: 'CSH PSG intake queue', icon: GitPullRequestArrow, action: () => onNavigate('command', 'pipeline'), group: 'EG Command Center' },
    // Workforce
    { id: 'wf-dash', label: 'Work Dashboard', description: 'Personal initiative command center', icon: LayoutDashboard, action: () => onNavigate('workforce', 'workdash'), group: 'Workforce' },
    { id: 'wf-staff', label: 'Staff View', description: 'Bulk effort entry', icon: Briefcase, action: () => onNavigate('workforce', 'staff'), group: 'Workforce' },
    { id: 'wf-mgr', label: "Manager's View", description: 'Team capacity cards', icon: ClipboardList, action: () => onNavigate('workforce', 'manager'), group: 'Workforce' },
    // Analytics
    { id: 'an-portfolio', label: 'Portfolio Analytics', description: 'Effort trends & distributions', icon: BarChart3, action: () => onNavigate('analytics', 'portfolio'), group: 'Analytics' },
    { id: 'an-exec', label: 'Executive Dashboard', description: 'Wave readiness & module coverage', icon: Shield, action: () => onNavigate('analytics', 'executive'), group: 'Analytics' },
    // Admin
    { id: 'admin-team', label: 'Team Management', description: 'Manage SCIs & analysts', icon: Users, action: () => onNavigate('admin', 'team'), group: 'Admin' },
    { id: 'admin-settings', label: 'Application Settings', description: 'Branding & labels', icon: Settings, action: () => onNavigate('admin', 'settings'), group: 'Admin' },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle is handled by parent
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group filtered items
  const groups: Record<string, CommandItem[]> = {};
  for (const item of filtered) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Search input */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-heading)' }}
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div
                className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {group}
              </div>
              {items.map((item) => {
                flatIndex++;
                const isSelected = flatIndex === selectedIndex;
                const Icon = item.icon;
                const idx = flatIndex;
                return (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                      color: isSelected ? 'var(--text-heading)' : 'var(--text-body)',
                    }}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.description}
                      </div>
                    </div>
                    {isSelected && (
                      <kbd
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                      >
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
