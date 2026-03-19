import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Users, Loader2, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { fetchTeamMembers } from '../../lib/queries';
import { createTeamMember, updateTeamMember, type CreateTeamMemberInput } from '../../lib/mutations';
import type { TeamMember } from '../../lib/supabase';
import { TEAM_MEMBER_ROLES, LEADER_ROLES, SCI_ROLES, MI_ROLES, ANALYST_ROLES } from '../../lib/constants';

type RoleFilter = 'all' | 'sci_leaders' | 'scis' | 'mi_leaders' | 'mis' | 'analyst_leaders' | 'analysts';

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sci_leaders', label: 'SCI Leaders' },
  { key: 'scis', label: 'SCIs' },
  { key: 'mi_leaders', label: 'MI Leaders' },
  { key: 'mis', label: 'MIs' },
  { key: 'analyst_leaders', label: 'Analyst Leaders' },
  { key: 'analysts', label: 'Analysts' },
];

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    const data = await fetchTeamMembers();
    setMembers(data);
    // Auto-expand all leaders
    const leaderIds = new Set(data.filter(m => LEADER_ROLES.has(m.role)).map(m => m.id));
    setExpandedManagers(leaderIds);
    setLoading(false);
  }

  // Group by manager (leaders at top)
  const leaders = useMemo(() => members.filter(m => LEADER_ROLES.has(m.role)), [members]);
  const managedMembers = useMemo(() => {
    const map: Record<string, TeamMember[]> = {};
    for (const m of members) {
      if (m.manager_id) {
        if (!map[m.manager_id]) map[m.manager_id] = [];
        map[m.manager_id].push(m);
      }
    }
    // Sort reports alphabetically
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [members]);
  const unassigned = useMemo(() =>
    members.filter(m => !m.manager_id && !LEADER_ROLES.has(m.role)).sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  );

  // Apply role filter
  const applyRoleFilter = (list: TeamMember[]): TeamMember[] => {
    switch (roleFilter) {
      case 'sci_leaders': return list.filter(m => SCI_ROLES.has(m.role) && LEADER_ROLES.has(m.role));
      case 'scis': return list.filter(m => m.role === 'sci');
      case 'mi_leaders': return list.filter(m => MI_ROLES.has(m.role) && LEADER_ROLES.has(m.role));
      case 'mis': return list.filter(m => m.role === 'mi');
      case 'analyst_leaders': return list.filter(m => ANALYST_ROLES.has(m.role) && LEADER_ROLES.has(m.role));
      case 'analysts': return list.filter(m => m.role === 'analyst');
      default: return list;
    }
  };

  // Filtered list for flat view (when searching or filtering)
  const filtered = useMemo(() => {
    let items = applyRoleFilter(members);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(m => m.name.toLowerCase().includes(q) || (m.email?.toLowerCase().includes(q)));
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [members, roleFilter, search]);

  const toggleManager = (id: string) => {
    setExpandedManagers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getRoleLabel = (role: string) => {
    const found = TEAM_MEMBER_ROLES.find(r => r.key === role);
    return found ? found.label : role;
  };

  const getRoleShortLabel = (role: string): string => {
    switch (role) {
      case 'sci': return 'SCI';
      case 'mi': return 'MI';
      case 'analyst': return 'Analyst';
      case 'sci_manager': return 'SCI Manager';
      case 'sci_director': return 'SCI Director';
      case 'mi_manager': return 'MI Manager';
      case 'mi_director': return 'MI Director';
      case 'analyst_manager': return 'Analyst Mgr';
      case 'analyst_director': return 'Analyst Dir';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    if (SCI_ROLES.has(role)) return '#8B2B6E';
    if (MI_ROLES.has(role)) return '#059669';
    if (ANALYST_ROLES.has(role)) return '#3b82f6';
    return '#6b7280';
  };

  const getCategoryIcon = (role: string) => {
    if (LEADER_ROLES.has(role)) return <Shield size={14} />;
    return null;
  };

  // Summary stats
  const sciCount = members.filter(m => m.role === 'sci').length;
  const miCount = members.filter(m => m.role === 'mi').length;
  const analystCount = members.filter(m => m.role === 'analyst').length;
  const leaderCount = leaders.length;

  // Determine whether to show flat or grouped view
  const showFlat = !!(search || roleFilter !== 'all');

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-brand-color)' }} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Team Management</h2>
        <div className="flex-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="px-3 py-1.5 rounded-lg border text-sm w-48"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)', borderColor: 'var(--border-default)' }}
        />
        <button
          onClick={() => { setEditingMember(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--primary-brand-color)' }}
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap" style={{ borderColor: 'var(--border-default)' }}>
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setRoleFilter(f.key)}
            className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
            style={roleFilter === f.key
              ? { backgroundColor: 'var(--primary-brand-color)', color: 'white' }
              : { color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-hover)' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-6 px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>{members.length} total</span>
        <span style={{ color: '#8B2B6E' }}>{sciCount} SCIs</span>
        <span style={{ color: '#059669' }}>{miCount} MIs</span>
        <span style={{ color: '#3b82f6' }}>{analystCount} Analysts</span>
        <span>{leaderCount} Leaders</span>
        <span style={{ color: unassigned.length > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
          {unassigned.length} unassigned
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {showFlat ? (
          /* Flat filtered list */
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No members match your filter</div>
            ) : (
              filtered.map((m) => (
                <MemberRow key={m.id} member={m} getRoleShortLabel={getRoleShortLabel} getRoleBadgeColor={getRoleBadgeColor} getCategoryIcon={getCategoryIcon} onEdit={() => { setEditingMember(m); setShowForm(true); }} />
              ))
            )}
          </div>
        ) : (
          /* Grouped by leader/manager */
          <div className="space-y-4">
            {/* Sort leaders: Directors first, then Managers, within each category SCI > MI > Analyst */}
            {leaders
              .sort((a, b) => {
                const catOrder = (r: string) => SCI_ROLES.has(r) ? 0 : MI_ROLES.has(r) ? 1 : 2;
                const levelOrder = (r: string) => r.includes('director') ? 0 : 1;
                const ca = catOrder(a.role), cb = catOrder(b.role);
                if (ca !== cb) return ca - cb;
                const la = levelOrder(a.role), lb = levelOrder(b.role);
                if (la !== lb) return la - lb;
                return a.name.localeCompare(b.name);
              })
              .map((mgr) => {
                const reports = managedMembers[mgr.id] || [];
                const expanded = expandedManagers.has(mgr.id);
                const badgeColor = getRoleBadgeColor(mgr.role);
                return (
                  <div key={mgr.id} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                    <button
                      onClick={() => toggleManager(mgr.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                      {expanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {mgr.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{mgr.name}</span>
                        {mgr.title && <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>· {mgr.title}</span>}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${badgeColor}15`, color: badgeColor }}>
                        {getRoleShortLabel(mgr.role)}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{reports.length} reports</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingMember(mgr); setShowForm(true); }}
                        className="p-1 rounded transition-colors hover:bg-black/5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Pencil size={14} />
                      </button>
                    </button>
                    {expanded && (
                      <div className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                        {reports.length === 0 ? (
                          <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>No direct reports</div>
                        ) : (
                          reports.map((m) => (
                            <MemberRow key={m.id} member={m} getRoleShortLabel={getRoleShortLabel} getRoleBadgeColor={getRoleBadgeColor} getCategoryIcon={getCategoryIcon} onEdit={() => { setEditingMember(m); setShowForm(true); }} indent />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Unassigned */}
            {unassigned.length > 0 && (
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <Users size={16} style={{ color: 'var(--color-warning)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Unassigned Members</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-warning)' }}>{unassigned.length}</span>
                </div>
                <div className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                  {unassigned.map((m) => (
                    <MemberRow key={m.id} member={m} getRoleShortLabel={getRoleShortLabel} getRoleBadgeColor={getRoleBadgeColor} getCategoryIcon={getCategoryIcon} onEdit={() => { setEditingMember(m); setShowForm(true); }} indent />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline Form Panel */}
      {showForm && (
        <MemberFormPanel
          member={editingMember}
          allMembers={members}
          onSave={async () => { await loadMembers(); setShowForm(false); setEditingMember(null); }}
          onClose={() => { setShowForm(false); setEditingMember(null); }}
        />
      )}
    </div>
  );
}

function MemberRow({
  member,
  getRoleShortLabel,
  getRoleBadgeColor,
  getCategoryIcon,
  onEdit,
  indent,
}: {
  member: TeamMember;
  getRoleShortLabel: (role: string) => string;
  getRoleBadgeColor: (role: string) => string;
  getCategoryIcon: (role: string) => React.ReactNode;
  onEdit: () => void;
  indent?: boolean;
}) {
  const badgeColor = getRoleBadgeColor(member.role);
  const icon = getCategoryIcon(member.role);
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-t group transition-colors"
      style={{ borderColor: 'var(--border-default)', paddingLeft: indent ? '2.5rem' : undefined }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: badgeColor }}
      >
        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
          {member.name}
          {icon && <span style={{ color: badgeColor }}>{icon}</span>}
          {!member.is_active && <span className="text-xs px-1 py-0.5 rounded bg-gray-200 text-gray-500">Inactive</span>}
        </div>
        {member.email && <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{member.email}</div>}
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${badgeColor}15`, color: badgeColor }}>
        {getRoleShortLabel(member.role)}
      </span>
      {member.title && <span className="text-xs hidden lg:block" style={{ color: 'var(--text-muted)' }}>{member.title}</span>}
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
        style={{ color: 'var(--text-muted)' }}
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}

function MemberFormPanel({
  member,
  allMembers,
  onSave,
  onClose,
}: {
  member: TeamMember | null;
  allMembers: TeamMember[];
  onSave: () => void;
  onClose: () => void;
}) {
  const isEdit = !!member;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateTeamMemberInput & { is_active?: boolean }>({
    name: member?.name || '',
    email: member?.email || '',
    role: member?.role || 'sci',
    manager_id: member?.manager_id || '',
    title: member?.title || '',
    is_active: member?.is_active ?? true,
  });

  // Only show leaders as potential managers (filter to compatible category)
  const potentialManagers = useMemo(() => {
    return allMembers.filter(m => LEADER_ROLES.has(m.role) && m.id !== member?.id);
  }, [allMembers, member]);

  // Group roles by category for the dropdown
  const roleGroups = [
    { label: 'System Clinical Informatics', roles: TEAM_MEMBER_ROLES.filter(r => r.category === 'sci') },
    { label: 'Medical Informatics', roles: TEAM_MEMBER_ROLES.filter(r => r.category === 'mi') },
    { label: 'Application Analysts', roles: TEAM_MEMBER_ROLES.filter(r => r.category === 'analyst') },
  ];

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        manager_id: form.manager_id || undefined,
        email: form.email || undefined,
        title: form.title || undefined,
      };
      if (isEdit && member) {
        await updateTeamMember(member.id, payload);
      } else {
        await createTeamMember(payload);
      }
      onSave();
    } catch (err) {
      console.error('Save member error:', err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-body)',
    borderColor: 'var(--border-default)',
  };
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '4px',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="w-96 h-full overflow-y-auto animate-slide-in"
        style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border-default)' }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
            {isEdit ? 'Edit Member' : 'Add Member'}
          </h3>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label style={labelStyle}>Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email || ''} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle} placeholder="email@example.com" />
          </div>
          <div>
            <label style={labelStyle}>Title</label>
            <input type="text" value={form.title || ''} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle} placeholder="Job title" />
          </div>
          <div>
            <label style={labelStyle}>Role *</label>
            <select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
              {roleGroups.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Reports To</label>
            <select value={form.manager_id || ''} onChange={(e) => setForm(p => ({ ...p, manager_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
              <option value="">No manager</option>
              {potentialManagers
                .sort((a, b) => {
                  const catOrder = (r: string) => SCI_ROLES.has(r) ? 0 : MI_ROLES.has(r) ? 1 : 2;
                  const ca = catOrder(a.role), cb = catOrder(b.role);
                  if (ca !== cb) return ca - cb;
                  return a.name.localeCompare(b.name);
                })
                .map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({getRoleShort(m.role)})</option>
                ))
              }
            </select>
          </div>
          {isEdit && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm" style={{ color: 'var(--text-body)' }}>Active</span>
              </label>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor: 'var(--border-default)' }}>
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-body)' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--primary-brand-color)', opacity: saving || !form.name.trim() ? 0.5 : 1 }}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getRoleShort(role: string): string {
  switch (role) {
    case 'sci_manager': return 'SCI Mgr';
    case 'sci_director': return 'SCI Dir';
    case 'mi_manager': return 'MI Mgr';
    case 'mi_director': return 'MI Dir';
    case 'analyst_manager': return 'Analyst Mgr';
    case 'analyst_director': return 'Analyst Dir';
    default: return role.toUpperCase();
  }
}
