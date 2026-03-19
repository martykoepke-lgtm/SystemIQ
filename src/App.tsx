import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import TopBar, { type MainView } from './components/core/TopBar';
import Sidebar, { type CommandSubView } from './components/core/Sidebar';
import CommandPalette from './components/core/CommandPalette';
import AnalystPortal from './components/portal/AnalystPortal';
import PlaceholderView from './components/core/PlaceholderView';
import CommandHomeView from './components/command/CommandHomeView';
import EpicGoldView from './components/command/EpicGoldView';
import AnalystView from './components/command/AnalystView';
import ModuleView from './components/command/ModuleView';
import SCIView from './components/command/SCIView';
import PipelineView from './components/command/PipelineView';
import ArchivedView from './components/command/ArchivedView';
import InitiativeDetailView from './components/detail/InitiativeDetailView';
import TaskDetailView from './components/detail/TaskDetailView';
import InitiativeModal from './components/modals/InitiativeModal';
import TaskModal from './components/modals/TaskModal';
import TeamManagement from './components/admin/TeamManagement';
import StaffView from './components/workforce/StaffView';
import ManagerView from './components/workforce/ManagerView';
import WorkDashView from './components/workforce/WorkDashView';
import PortfolioOverview from './components/analytics/PortfolioOverview';
import EffortTrends from './components/analytics/EffortTrends';
import TaskAnalytics from './components/analytics/TaskAnalytics';
import ResourceView from './components/analytics/ResourceView';
import HeatmapView from './components/analytics/HeatmapView';
import CostAnalytics from './components/analytics/CostAnalytics';
import PortfolioInsights from './components/analytics/PortfolioInsights';
import TimelineView from './components/analytics/TimelineView';
import GoalsView from './components/analytics/GoalsView';
import type { InitiativeWithDetails, TaskWithDetails, PipelineItem, Initiative } from './lib/supabase';
import { promoteToEpicGold, promoteFromPipeline } from './lib/mutations';
import {
  Zap,
  Home,
  Users,
  Boxes,
  UserCog,
  GitPullRequestArrow,
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  BarChart3,
  Shield,
  Settings,
  SlidersHorizontal,
  Gauge,
  TrendingUp,
  ListChecks,
  User,
  Grid3x3,
  DollarSign,
  Lightbulb,
  CalendarRange,
  Target,
} from 'lucide-react';

// ─── Sub-view types ───
type WorkforceSubView = 'workdash' | 'staff' | 'manager';
type AnalyticsSubView = 'portfolio' | 'insights' | 'effort' | 'tasks' | 'resource' | 'heatmap' | 'costs' | 'timeline' | 'goals';
type AdminSubView = 'team' | 'settings' | 'fields' | 'capacity';

function getInitialView(): MainView {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('workforce')) return 'workforce';
  if (hash.startsWith('analytics')) return 'analytics';
  if (hash.startsWith('admin')) return 'admin';
  return 'command';
}

function getInitialSubView(main: string): string {
  const hash = window.location.hash.replace('#', '');
  const parts = hash.split('/');
  if (parts.length > 1) return parts[1];
  const defaults: Record<string, string> = {
    command: 'home',
    workforce: 'workdash',
    analytics: 'portfolio',
    admin: 'team',
  };
  return defaults[main] || 'home';
}

function AppContent() {
  const [activeView, setActiveView] = useState<MainView>(getInitialView);
  const [commandSub, setCommandSub] = useState<CommandSubView>(getInitialSubView('command') as CommandSubView);
  const [workforceSub, setWorkforceSub] = useState<WorkforceSubView>(getInitialSubView('workforce') as WorkforceSubView);
  const [analyticsSub, setAnalyticsSub] = useState<AnalyticsSubView>(getInitialSubView('analytics') as AnalyticsSubView);
  const [adminSub, setAdminSub] = useState<AdminSubView>(getInitialSubView('admin') as AdminSubView);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<InitiativeWithDetails | null>(null);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalInitiativeId, setTaskModalInitiativeId] = useState<string>('');
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ─── URL hash sync ───
  useEffect(() => {
    let hash = activeView;
    const subs: Record<string, string> = { command: commandSub, workforce: workforceSub, analytics: analyticsSub, admin: adminSub };
    const defaults: Record<string, string> = { command: 'home', workforce: 'workdash', analytics: 'portfolio', admin: 'team' };
    const sub = subs[activeView];
    if (sub && sub !== defaults[activeView]) hash += '/' + sub;
    window.location.hash = hash;
  }, [activeView, commandSub, workforceSub, analyticsSub, adminSub]);

  // ─── Ctrl+K shortcut ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Navigation handler ───
  const navigate = useCallback((view: MainView, sub?: string) => {
    setActiveView(view);
    if (sub) {
      if (view === 'command') setCommandSub(sub as CommandSubView);
      if (view === 'workforce') setWorkforceSub(sub as WorkforceSubView);
      if (view === 'analytics') setAnalyticsSub(sub as AnalyticsSubView);
      if (view === 'admin') setAdminSub(sub as AdminSubView);
    }
  }, []);

  // ─── Sub-tab bars for non-sidebar views ───
  const renderSubTabs = (
    tabs: { key: string; label: string; icon: React.ElementType }[],
    active: string,
    onSelect: (key: string) => void
  ) => (
    <div
      className="flex items-center gap-1 px-4 py-2 border-b"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              isActive
                ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' }
                : { color: 'var(--text-body)' }
            }
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ─── Render content based on active view ───
  const renderContent = () => {
    switch (activeView) {
      case 'command':
        // Content area for command views (sidebar handles sub-nav)
        // Detail drill-in takes priority
        if (selectedTaskId) {
          return (
            <TaskDetailView
              taskId={selectedTaskId}
              onBack={() => setSelectedTaskId(null)}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskModalInitiativeId(task.initiative_id);
                setTaskModalOpen(true);
              }}
            />
          );
        }
        if (selectedInitiativeId) {
          return (
            <InitiativeDetailView
              key={selectedInitiativeId}
              initiativeId={selectedInitiativeId}
              onBack={() => setSelectedInitiativeId(null)}
              onOpenTask={(taskId) => setSelectedTaskId(taskId)}
              onCreateTask={(initId) => {
                setTaskModalInitiativeId(initId);
                setTaskModalOpen(true);
              }}
              onEditInitiative={(init) => {
                setEditingInitiative(init);
                setInitiativeModalOpen(true);
              }}
            />
          );
        }

        switch (commandSub) {
          case 'home':
            return (
              <CommandHomeView
                key={refreshKey}
                onOpenInitiative={(id) => setSelectedInitiativeId(id)}
                onCreateInitiative={() => { setEditingInitiative(null); setInitiativeModalOpen(true); }}
              />
            );
          case 'epicgold':
            return (
              <EpicGoldView
                key={refreshKey}
                onOpenInitiative={(id) => setSelectedInitiativeId(id)}
                onOpenTask={(id) => setSelectedTaskId(id)}
                onCreateInitiative={() => { setEditingInitiative(null); setInitiativeModalOpen(true); }}
              />
            );
          case 'analyst':
            return (
              <AnalystView
                onOpenTask={(id) => setSelectedTaskId(id)}
                onOpenInitiative={(id) => setSelectedInitiativeId(id)}
              />
            );
          case 'module':
            return <ModuleView onOpenTask={(id) => setSelectedTaskId(id)} />;
          case 'sci':
            return <SCIView onOpenInitiative={(id) => setSelectedInitiativeId(id)} />;
          case 'pipeline':
            return <PipelineView
              onPromoteItem={async (item: PipelineItem) => {
                if (!confirm(`Promote "${item.name}" to Epic Gold Command Center?\n\nThis will create a new EG-* initiative.`)) return;
                try {
                  const newId = await promoteFromPipeline(item.id);
                  alert(`Promoted! New initiative created.`);
                  setSelectedInitiativeId(newId);
                } catch (err: unknown) {
                  alert(`Promotion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }}
              onOpenItem={async (item: PipelineItem) => {
                // If already promoted, open the linked initiative
                if (item.status === 'promoted' && item.promoted_initiative_id) {
                  setSelectedInitiativeId(item.promoted_initiative_id);
                  return;
                }
                // Otherwise, auto-create initiative from pipeline data and open it
                try {
                  const newId = await promoteFromPipeline(item.id, true); // silentMode — creates with eg_approved=false
                  setSelectedInitiativeId(newId);
                } catch (err: unknown) {
                  alert(`Could not open: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }}
            />;
          case 'archived':
            return <ArchivedView onOpenInitiative={(id) => setSelectedInitiativeId(id)} />;
        }
        break;

      case 'workforce':
        return (
          <div className="flex-1 flex flex-col">
            {renderSubTabs(
              [
                { key: 'workdash', label: 'Work Dash', icon: LayoutDashboard },
                { key: 'staff', label: 'Staff View', icon: Briefcase },
                { key: 'manager', label: "Manager's View", icon: ClipboardList },
              ],
              workforceSub,
              (key) => setWorkforceSub(key as WorkforceSubView)
            )}
            <div className="flex-1 flex">
              {workforceSub === 'workdash' && (
                <WorkDashView
                  onEditInitiative={(init) => {
                    setEditingInitiative(init);
                    setInitiativeModalOpen(true);
                  }}
                />
              )}
              {workforceSub === 'staff' && <StaffView />}
              {workforceSub === 'manager' && <ManagerView />}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="flex-1 flex flex-col">
            {renderSubTabs(
              [
                { key: 'portfolio', label: 'Portfolio', icon: BarChart3 },
                { key: 'insights', label: 'Insights', icon: Lightbulb },
                { key: 'effort', label: 'Effort', icon: TrendingUp },
                { key: 'tasks', label: 'Tasks', icon: ListChecks },
                { key: 'resource', label: 'Resource', icon: User },
                { key: 'heatmap', label: 'Heatmap', icon: Grid3x3 },
                { key: 'costs', label: 'Costs', icon: DollarSign },
                { key: 'timeline', label: 'Timeline', icon: CalendarRange },
                { key: 'goals', label: 'Goals', icon: Target },
              ],
              analyticsSub,
              (key) => setAnalyticsSub(key as AnalyticsSubView)
            )}
            <div className="flex-1 flex">
              {analyticsSub === 'portfolio' && <PortfolioOverview />}
              {analyticsSub === 'insights' && <PortfolioInsights />}
              {analyticsSub === 'effort' && <EffortTrends />}
              {analyticsSub === 'tasks' && <TaskAnalytics />}
              {analyticsSub === 'resource' && <ResourceView />}
              {analyticsSub === 'heatmap' && <HeatmapView />}
              {analyticsSub === 'costs' && <CostAnalytics />}
              {analyticsSub === 'timeline' && <TimelineView />}
              {analyticsSub === 'goals' && <GoalsView />}
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="flex-1 flex flex-col">
            {renderSubTabs(
              [
                { key: 'team', label: 'Team Management', icon: Users },
                { key: 'settings', label: 'Settings', icon: Settings },
                { key: 'fields', label: 'Field Options', icon: SlidersHorizontal },
                { key: 'capacity', label: 'Capacity', icon: Gauge },
              ],
              adminSub,
              (key) => setAdminSub(key as AdminSubView)
            )}
            <div className="flex-1 flex">
              {adminSub === 'team' && <TeamManagement />}
              {adminSub === 'settings' && <PlaceholderView title="Application Settings" subtitle="Branding & labels — Phase 7" icon={<Settings size={40} />} />}
              {adminSub === 'fields' && <PlaceholderView title="Field Options" subtitle="Configure dropdowns — Phase 7" icon={<SlidersHorizontal size={40} />} />}
              {adminSub === 'capacity' && <PlaceholderView title="Capacity Settings" subtitle="Thresholds & calculator weights — Phase 7" icon={<Gauge size={40} />} />}
            </div>
          </div>
        );
    }
  };

  // ─── Layout: Command Center gets a sidebar, other views get sub-tabs ───
  const showSidebar = activeView === 'command';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      <TopBar
        activeView={activeView}
        onNavigate={navigate}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar activeSubView={commandSub} onNavigate={(sub) => setCommandSub(sub)} />
        )}
        <div className="flex-1 flex flex-col">{renderContent()}</div>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(view, sub) => {
          navigate(view, sub);
          setCommandPaletteOpen(false);
        }}
      />

      <InitiativeModal
        isOpen={initiativeModalOpen}
        onClose={() => { setInitiativeModalOpen(false); setEditingInitiative(null); }}
        onSaved={() => { refreshData(); setSelectedInitiativeId(null); }}
        initiative={editingInitiative}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onSaved={() => { refreshData(); setSelectedTaskId(null); }}
        initiativeId={taskModalInitiativeId}
        task={editingTask}
      />
    </div>
  );
}

function isPortalMode(): boolean {
  const hash = window.location.hash;
  return hash.startsWith('#portal');
}

export default function App() {
  const [portalMode] = useState(isPortalMode);

  return (
    <ThemeProvider>
      {portalMode ? <AnalystPortal /> : <AppContent />}
    </ThemeProvider>
  );
}
