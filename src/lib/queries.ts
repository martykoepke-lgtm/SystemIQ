import { supabase, DEFAULT_ORG_ID } from './supabase';
import type {
  Initiative,
  InitiativeWithDetails,
  Task,
  TaskWithDetails,
  Note,
  ActionItem,
  Document,
  TeamMember,
  FieldOption,
  PipelineItem,
  EffortLog,
  GovernanceRecord,
  UserPreference,
} from './supabase';
import { OPEN_TASK_STATUSES } from './constants';

// ─── Initiatives ───

export async function fetchInitiatives(): Promise<Initiative[]> {
  const { data, error } = await supabase
    .from('initiatives')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('fetchInitiatives error:', error);
    return [];
  }
  return data || [];
}

export async function fetchInitiativeWithDetails(id: string): Promise<InitiativeWithDetails | null> {
  const { data: initiative, error } = await supabase
    .from('initiatives')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !initiative) {
    console.warn('fetchInitiativeWithDetails error:', error);
    return null;
  }

  // Fetch related data in parallel
  const [tasksRes, notesRes, actionItemsRes, docsRes, primarySciRes, secondarySciRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('initiative_id', id).order('created_at', { ascending: false }),
    supabase.from('notes').select('*').eq('initiative_id', id).is('task_id', null).order('created_at', { ascending: false }),
    supabase.from('action_items').select('*').eq('initiative_id', id).is('task_id', null).order('created_at', { ascending: false }),
    supabase.from('documents').select('*').eq('initiative_id', id).is('task_id', null).order('created_at', { ascending: false }),
    initiative.primary_sci_id ? supabase.from('team_members').select('*').eq('id', initiative.primary_sci_id).single() : Promise.resolve({ data: null }),
    initiative.secondary_sci_id ? supabase.from('team_members').select('*').eq('id', initiative.secondary_sci_id).single() : Promise.resolve({ data: null }),
  ]);

  const tasks = tasksRes.data || [];
  const openTaskCount = tasks.filter((t: Task) => OPEN_TASK_STATUSES.has(t.status)).length;

  return {
    ...initiative,
    tasks,
    task_count: tasks.length,
    open_task_count: openTaskCount,
    notes: notesRes.data || [],
    action_items: actionItemsRes.data || [],
    documents: docsRes.data || [],
    primary_sci: primarySciRes.data as TeamMember | null,
    secondary_sci: secondarySciRes.data as TeamMember | null,
  };
}

export async function fetchInitiativesWithCounts(): Promise<(Initiative & { task_count: number; open_task_count: number })[]> {
  const [initRes, tasksRes] = await Promise.all([
    supabase
      .from('initiatives')
      .select('*')
      .eq('organization_id', DEFAULT_ORG_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id, initiative_id, status')
      .eq('organization_id', DEFAULT_ORG_ID),
  ]);

  const initiatives = initRes.data || [];
  const tasks = tasksRes.data || [];

  // Build task count maps
  const taskCountMap: Record<string, number> = {};
  const openTaskCountMap: Record<string, number> = {};
  for (const t of tasks) {
    taskCountMap[t.initiative_id] = (taskCountMap[t.initiative_id] || 0) + 1;
    if (OPEN_TASK_STATUSES.has(t.status)) {
      openTaskCountMap[t.initiative_id] = (openTaskCountMap[t.initiative_id] || 0) + 1;
    }
  }

  return initiatives.map((init) => ({
    ...init,
    task_count: taskCountMap[init.id] || 0,
    open_task_count: openTaskCountMap[init.id] || 0,
  }));
}

// ─── Tasks ───

export async function fetchTasksForInitiative(initiativeId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('initiative_id', initiativeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('fetchTasksForInitiative error:', error);
    return [];
  }
  return data || [];
}

export async function fetchTaskWithDetails(id: string): Promise<TaskWithDetails | null> {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !task) return null;

  const [notesRes, actionItemsRes, docsRes, initiativeRes, analystRes] = await Promise.all([
    supabase.from('notes').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('action_items').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('documents').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('initiatives').select('*').eq('id', task.initiative_id).single(),
    task.primary_analyst_id ? supabase.from('team_members').select('*').eq('id', task.primary_analyst_id).single() : Promise.resolve({ data: null }),
  ]);

  return {
    ...task,
    notes: notesRes.data || [],
    action_items: actionItemsRes.data || [],
    documents: docsRes.data || [],
    initiative: initiativeRes.data as Initiative,
    primary_analyst: analystRes.data as TeamMember | null,
  };
}

export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('fetchAllTasks error:', error);
    return [];
  }
  return data || [];
}

// ─── Notes ───

export async function fetchNotes(params: { initiative_id?: string; task_id?: string }): Promise<Note[]> {
  let query = supabase.from('notes').select('*').eq('organization_id', DEFAULT_ORG_ID);
  if (params.initiative_id) query = query.eq('initiative_id', params.initiative_id);
  if (params.task_id) query = query.eq('task_id', params.task_id);
  const { data } = await query.order('created_at', { ascending: false });
  return data || [];
}

// ─── Action Items ───

export async function fetchActionItems(params: { initiative_id?: string; task_id?: string }): Promise<ActionItem[]> {
  let query = supabase.from('action_items').select('*').eq('organization_id', DEFAULT_ORG_ID);
  if (params.initiative_id) query = query.eq('initiative_id', params.initiative_id);
  if (params.task_id) query = query.eq('task_id', params.task_id);
  const { data } = await query.order('created_at', { ascending: false });
  return data || [];
}

// ─── Documents ───

export async function fetchDocuments(params: { initiative_id?: string; task_id?: string }): Promise<Document[]> {
  let query = supabase.from('documents').select('*').eq('organization_id', DEFAULT_ORG_ID);
  if (params.initiative_id) query = query.eq('initiative_id', params.initiative_id);
  if (params.task_id) query = query.eq('task_id', params.task_id);
  const { data } = await query.order('created_at', { ascending: false });
  return data || [];
}

// ─── Team Members ───

export async function fetchTeamMembers(role?: string): Promise<TeamMember[]> {
  let query = supabase.from('team_members').select('*').eq('organization_id', DEFAULT_ORG_ID).eq('is_active', true);
  if (role) query = query.eq('role', role);
  const { data } = await query.order('name');
  return data || [];
}

export async function fetchSCIs(): Promise<TeamMember[]> {
  return fetchTeamMembers('sci');
}

export async function fetchAnalysts(): Promise<TeamMember[]> {
  return fetchTeamMembers('analyst');
}

// ─── Field Options ───

export async function fetchFieldOptions(fieldType?: string): Promise<FieldOption[]> {
  let query = supabase.from('field_options').select('*').eq('organization_id', DEFAULT_ORG_ID).eq('is_active', true);
  if (fieldType) query = query.eq('field_type', fieldType);
  const { data } = await query.order('display_order');
  return data || [];
}

// ─── Pipeline ───

export async function fetchPipelineItems(): Promise<PipelineItem[]> {
  const { data } = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Effort Logs ───

export async function fetchAllActionItems(): Promise<ActionItem[]> {
  const { data } = await supabase
    .from('action_items')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID)
    .order('due_date', { ascending: true });
  return data || [];
}

export async function fetchEffortLogs(teamMemberId: string): Promise<EffortLog[]> {
  const { data } = await supabase
    .from('effort_logs')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .order('updated_at', { ascending: false });
  return data || [];
}

// ─── Governance Records ───

export async function fetchGovernanceRecords(initiativeId: string): Promise<GovernanceRecord[]> {
  const { data } = await supabase
    .from('governance_records')
    .select('*')
    .eq('initiative_id', initiativeId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── User Preferences ───

export async function fetchUserPreference(key: string, teamMemberId?: string): Promise<UserPreference | null> {
  let query = supabase
    .from('user_preferences')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('preference_key', key);

  if (teamMemberId) {
    query = query.eq('team_member_id', teamMemberId);
  } else {
    query = query.is('team_member_id', null);
  }

  const { data } = await query.single();
  return data || null;
}

// ─── Initiatives for a specific member ───

export async function fetchInitiativesForMember(memberId: string): Promise<Initiative[]> {
  const { data } = await supabase
    .from('initiatives')
    .select('*')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('is_active', true)
    .or(`primary_sci_id.eq.${memberId},secondary_sci_id.eq.${memberId}`)
    .order('type', { ascending: true });
  return data || [];
}

// ─── Action items for multiple initiatives ───

export async function fetchActionItemsForInitiatives(initiativeIds: string[]): Promise<ActionItem[]> {
  if (initiativeIds.length === 0) return [];
  const { data } = await supabase
    .from('action_items')
    .select('*')
    .in('initiative_id', initiativeIds)
    .is('task_id', null)
    .order('due_date', { ascending: true });
  return data || [];
}

// ─── Effort logs for a specific initiative ───

export async function fetchEffortLogsForInitiative(initiativeId: string): Promise<EffortLog[]> {
  const { data } = await supabase
    .from('effort_logs')
    .select('*')
    .eq('initiative_id', initiativeId)
    .order('week_start_date', { ascending: false });
  return data || [];
}
