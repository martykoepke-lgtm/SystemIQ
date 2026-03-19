import { useState, useEffect, useMemo } from 'react';
import { Loader2, GitPullRequestArrow, ArrowUpRight, ChevronDown, ChevronRight, ChevronUp, ExternalLink, Filter, CheckCircle } from 'lucide-react';
import { fetchPipelineItems } from '../../lib/queries';
import type { PipelineItem } from '../../lib/supabase';
import { PRIORITY_COLORS } from '../../lib/constants';

interface PipelineViewProps {
  onPromoteItem: (item: PipelineItem) => void;
  onOpenItem: (item: PipelineItem) => void;
}

type SortKey = 'name' | 'type' | 'priority' | 'sci_contact' | 'application' | 'specialty' | 'status';
type SortDir = 'asc' | 'desc';
type GroupBy = 'none' | 'priority' | 'sci_contact' | 'application' | 'type';
type TabFilter = 'pending' | 'promoted' | 'all';

const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function PipelineView({ onPromoteItem, onOpenItem }: PipelineViewProps) {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [tabFilter, setTabFilter] = useState<TabFilter>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sciFilter, setSciFilter] = useState<string>('');
  const [appFilter, setAppFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await fetchPipelineItems();
    setItems(data);
    setLoading(false);
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const pendingCount = items.filter(i => i.status !== 'promoted').length;
  const promotedCount = items.filter(i => i.status === 'promoted').length;

  // Filter options
  const sciOptions = useMemo(() => [...new Set(items.map(i => i.sci_contact).filter(Boolean))].sort() as string[], [items]);
  const appOptions = useMemo(() => [...new Set(items.map(i => i.application).filter(Boolean))].sort() as string[], [items]);

  // Filter
  const filtered = useMemo(() => {
    let result = items;
    // Tab filter
    if (tabFilter === 'pending') result = result.filter(i => i.status !== 'promoted');
    else if (tabFilter === 'promoted') result = result.filter(i => i.status === 'promoted');
    // Field filters
    if (priorityFilter) result = result.filter(i => i.priority === priorityFilter);
    if (sciFilter) result = result.filter(i => i.sci_contact?.includes(sciFilter));
    if (appFilter) result = result.filter(i => i.application?.includes(appFilter));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || (i.details?.toLowerCase().includes(q)) || (i.sci_contact?.toLowerCase().includes(q)));
    }
    return result;
  }, [items, tabFilter, priorityFilter, sciFilter, appFilter, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'type': cmp = (a.type || 'zzz').localeCompare(b.type || 'zzz'); break;
        case 'priority': cmp = (PRIORITY_ORDER[a.priority || ''] ?? 9) - (PRIORITY_ORDER[b.priority || ''] ?? 9); break;
        case 'sci_contact': cmp = (a.sci_contact || 'zzz').localeCompare(b.sci_contact || 'zzz'); break;
        case 'application': cmp = (a.application || 'zzz').localeCompare(b.application || 'zzz'); break;
        case 'specialty': cmp = (a.specialty || 'zzz').localeCompare(b.specialty || 'zzz'); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Group
  const grouped = useMemo(() => {
    if (groupBy === 'none') return [['All', sorted] as [string, PipelineItem[]]];
    const groups: Record<string, PipelineItem[]> = {};
    for (const item of sorted) {
      let key = '';
      if (groupBy === 'priority') key = item.priority || 'Unset';
      else if (groupBy === 'sci_contact') key = item.sci_contact || 'Unassigned';
      else if (groupBy === 'application') key = item.application || 'No Application';
      else if (groupBy === 'type') key = item.type || 'Untyped';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups);
  }, [sorted, groupBy]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b flex-wrap" style={{ borderColor: 'var(--border-default)' }}>
        <GitPullRequestArrow size={18} style={{ color: 'var(--text-heading)' }} />
        <span className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>Pipeline (CSH PSG)</span>

        {/* Status tabs */}
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
          {([
            { key: 'pending' as TabFilter, label: 'Pending', count: pendingCount },
            { key: 'promoted' as TabFilter, label: 'Promoted', count: promotedCount },
            { key: 'all' as TabFilter, label: 'All', count: items.length },
          ]).map(t => (
            <button key={t.key} onClick={() => setTabFilter(t.key)}
              className="px-2.5 py-1 text-xs font-medium flex items-center gap-1 transition-colors"
              style={tabFilter === t.key
                ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' }
                : { backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }
              }>
              {t.label} <span className="font-mono">({t.count})</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
          className="px-2 py-1 rounded-lg border text-xs w-40" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }} />
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select value={sciFilter} onChange={(e) => setSciFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All SCIs</option>
          {sciOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}>
          <option value="">All Apps</option>
          {appOptions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Group:</span>
        {(['none', 'priority', 'sci_contact', 'application', 'type'] as GroupBy[]).map(g => (
          <button key={g} onClick={() => setGroupBy(g)}
            className="px-2 py-1 rounded text-xs font-medium transition-colors"
            style={groupBy === g ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' } : { color: 'var(--text-muted)' }}>
            {g === 'none' ? '—' : g === 'sci_contact' ? 'SCI' : g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}

        <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{filtered.length} items</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {/* Column headers */}
        <div className="grid px-4 py-1.5 border-b text-xs font-medium uppercase tracking-wider sticky top-0 z-10"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)',
            gridTemplateColumns: '28px 1fr 80px 80px 140px 120px 100px 40px' }}>
          <div />
          <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('name')}>Name <SortIcon col="name" /></div>
          <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('status')}>Status <SortIcon col="status" /></div>
          <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('priority')}>Priority <SortIcon col="priority" /></div>
          <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('sci_contact')}>SCI Contact <SortIcon col="sci_contact" /></div>
          <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('specialty')}>Specialty <SortIcon col="specialty" /></div>
          <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort('application')}>Application <SortIcon col="application" /></div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Filter size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pipeline items match your filters</p>
          </div>
        ) : (
          grouped.map(([group, groupItems]) => (
            <div key={group}>
              {groupBy !== 'none' && (
                <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-b"
                  style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-heading)', borderColor: 'var(--border-default)' }}>
                  {group} <span className="font-mono font-normal" style={{ color: 'var(--text-muted)' }}>({groupItems.length})</span>
                </div>
              )}
              {groupItems.map(item => {
                const expanded = expandedIds.has(item.id);
                const priorityColor = PRIORITY_COLORS[item.priority || 'Medium'] || '#6b7280';
                const isPromoted = item.status === 'promoted';
                return (
                  <div key={item.id} className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <div
                      onClick={() => onOpenItem(item)}
                      className="w-full grid items-center px-4 py-2 text-left transition-colors cursor-pointer"
                      style={{ gridTemplateColumns: '28px 1fr 80px 80px 140px 120px 100px 40px', opacity: isPromoted ? 0.5 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}>{expanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}</div>
                      <div className="text-sm truncate pr-2" style={{ color: 'var(--text-heading)' }}>
                        {item.name}
                        {isPromoted && <CheckCircle size={12} className="inline ml-2" style={{ color: 'var(--color-success)' }} />}
                      </div>
                      <div>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{
                          backgroundColor: isPromoted ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                          color: isPromoted ? '#22c55e' : '#6b7280'
                        }}>
                          {isPromoted ? 'Promoted' : 'Queued'}
                        </span>
                      </div>
                      <div>{item.priority && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>{item.priority}</span>}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-body)' }}>{item.sci_contact || '—'}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.specialty || '—'}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.application || '—'}</div>
                      <div>
                        {!isPromoted && (
                          <span onClick={(e) => { e.stopPropagation(); onPromoteItem(item); }}
                            className="cursor-pointer" style={{ color: 'var(--color-success)' }} title="Promote to Epic Gold">
                            <ArrowUpRight size={14} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expanded && (
                      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-hover)' }}>
                        <div className="grid grid-cols-3 gap-3">
                          {item.details && <DetailField label="Details" value={item.details} wide />}
                          {item.specialty && <DetailField label="Specialty / Discipline" value={item.specialty} />}
                          {item.system_sponsor && <DetailField label="System Sponsor" value={item.system_sponsor} />}
                          {item.application && <DetailField label="Application(s)" value={item.application} />}
                          {item.policy_link && <LinkField label="Policy / Guideline" url={item.policy_link} />}
                          {item.ehr_link && <LinkField label="EHR Requirements" url={item.ehr_link} />}
                        </div>
                        {!item.details && !item.specialty && !item.system_sponsor && !item.policy_link && !item.ehr_link && (
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No additional details available</div>
                        )}
                        {!isPromoted && (
                          <div className="flex justify-end pt-3 mt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                            <button onClick={() => onPromoteItem(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                              style={{ backgroundColor: 'var(--color-success)' }}>
                              <ArrowUpRight size={14} /> Promote to Epic Gold
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-3' : ''}>
      <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm" style={{ color: 'var(--text-heading)' }}>{value}</div>
    </div>
  );
}

function LinkField({ label, url }: { label: string; url: string }) {
  if (!url.startsWith('http')) {
    return <DetailField label={label} value={<span className="text-xs" style={{ color: 'var(--text-body)' }}>{url}</span>} />;
  }
  return (
    <DetailField label={label} value={
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs" style={{ color: 'var(--primary-brand-color)' }}>
        Open Link <ExternalLink size={10} />
      </a>
    } />
  );
}
