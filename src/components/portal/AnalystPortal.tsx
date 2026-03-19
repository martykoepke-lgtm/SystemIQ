/**
 * Analyst EG Portal — Standalone view of the Epic Gold Command Center
 * Accessible via /#portal or /portal.html
 * Shows the full EG command center (Epic Gold, Analyst, Module, SCI, Pipeline, Dashboard)
 * WITHOUT Workforce, Analytics, or Admin tabs.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar, { type CommandSubView } from '../core/Sidebar';
import CommandHomeView from '../command/CommandHomeView';
import EpicGoldView from '../command/EpicGoldView';
import AnalystView from '../command/AnalystView';
import ModuleView from '../command/ModuleView';
import SCIView from '../command/SCIView';
import PipelineView from '../command/PipelineView';
import ArchivedView from '../command/ArchivedView';
import InitiativeDetailView from '../detail/InitiativeDetailView';
import TaskDetailView from '../detail/TaskDetailView';
import InitiativeModal from '../modals/InitiativeModal';
import TaskModal from '../modals/TaskModal';
import { promoteFromPipeline } from '../../lib/mutations';
import { Zap, Moon, Sun } from 'lucide-react';
import type { InitiativeWithDetails, TaskWithDetails, PipelineItem } from '../../lib/supabase';

export default function AnalystPortal() {
  const { theme, toggleTheme } = useTheme();
  const [commandSub, setCommandSub] = useState<CommandSubView>('epicgold');
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<InitiativeWithDetails | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalInitiativeId, setTaskModalInitiativeId] = useState<string>('');
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Hash sync for portal sub-views
  useEffect(() => {
    const portalHash = `portal/${commandSub}`;
    window.location.hash = portalHash;
  }, [commandSub]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#portal/', '').replace('#portal', '');
      if (hash && ['home', 'epicgold', 'analyst', 'module', 'sci', 'pipeline', 'archived'].includes(hash)) {
        setCommandSub(hash as CommandSubView);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const renderContent = () => {
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
            if (!confirm(`Promote "${item.name}" to Epic Gold Command Center?`)) return;
            try {
              const newId = await promoteFromPipeline(item.id);
              alert('Promoted! New initiative created.');
              setSelectedInitiativeId(newId);
            } catch (err: unknown) {
              alert(`Promotion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }}
          onOpenItem={async (item: PipelineItem) => {
            if (item.status === 'promoted' && item.promoted_initiative_id) {
              setSelectedInitiativeId(item.promoted_initiative_id);
              return;
            }
            try {
              const newId = await promoteFromPipeline(item.id, true);
              setSelectedInitiativeId(newId);
            } catch (err: unknown) {
              alert(`Could not open: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }}
        />;
      case 'archived':
        return <ArchivedView onOpenInitiative={(id) => setSelectedInitiativeId(id)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Minimal top bar — just branding + theme toggle */}
      <header
        className="h-12 flex items-center justify-between px-5 border-b shrink-0"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-2.5">
          <Zap size={20} style={{ color: 'var(--color-epic-gold)' }} />
          <span className="text-base font-bold" style={{ color: 'var(--color-epic-gold)' }}>
            Epic Gold Command Center
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
            Analyst Portal
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main layout: Sidebar + Content */}
      <div className="flex flex-1">
        <Sidebar activeSubView={commandSub} onNavigate={(sub) => { setCommandSub(sub); setSelectedInitiativeId(null); setSelectedTaskId(null); }} />
        <div className="flex-1 flex flex-col">{renderContent()}</div>
      </div>

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
