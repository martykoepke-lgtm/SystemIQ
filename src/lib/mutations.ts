import { supabase, DEFAULT_ORG_ID } from './supabase';

// ─── Display ID generation (client-side counter) ───

async function getNextDisplayId(entityType: string): Promise<string> {
  // Read current counter
  const { data: counter, error: readErr } = await supabase
    .from('id_counters')
    .select('id, prefix, next_value')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('entity_type', entityType)
    .single();

  if (readErr || !counter) {
    console.warn('getNextDisplayId: no counter for', entityType, readErr);
    const ts = Date.now().toString(36).toUpperCase();
    return `GEN-${ts}`;
  }

  const displayId = `${counter.prefix}-${String(counter.next_value).padStart(4, '0')}`;

  // Increment counter
  await supabase
    .from('id_counters')
    .update({ next_value: counter.next_value + 1 })
    .eq('id', counter.id);

  return displayId;
}

// ─── Initiatives ───

export interface CreateInitiativeInput {
  name: string;
  description?: string;
  type: string;
  priority?: string;
  status?: string;
  primary_sci_id?: string;
  secondary_sci_id?: string;
  work_effort?: string;
  phase?: string;
  role?: string;
  start_date?: string;
  target_date?: string;
  // Epic Gold-specific
  eg_subtype?: string; // Standard Practice, Guideline, Policy, Board Goal
  go_live_wave?: string;
  applications?: string[];
  venues?: string[];
  roles_impacted?: string[];
  specialty_service_line?: string[];
  system_sponsor?: string;
  policy_link?: string;
  ehr_requirements_link?: string;
  specialized_workflow_needed?: boolean;
}

// Convert empty strings to null for UUID and optional fields
function cleanInput(input: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === '' || value === undefined) {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function createInitiative(input: CreateInitiativeInput) {
  const entityType = input.type === 'Epic Gold' ? 'initiative_eg' : 'initiative_sys';
  const displayId = await getNextDisplayId(entityType);

  const payload = cleanInput({
    organization_id: DEFAULT_ORG_ID,
    display_id: displayId,
    ...input,
  });

  console.log('Creating initiative with payload:', payload);

  const { data, error } = await supabase
    .from('initiatives')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error.message, error.details, error.hint);
    throw error;
  }
  return data;
}

export async function updateInitiative(id: string, updates: Partial<CreateInitiativeInput> & { status?: string; completion_percentage?: number }) {
  const { data, error } = await supabase
    .from('initiatives')
    .update({ ...cleanInput(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Epic Gold Promotion ───
// Upgrades a SYS-* initiative to EG-* status on the EG Command Center
// Same database row — only display_id and eg_approved change. Zero data loss.
export async function promoteToEpicGold(initiativeId: string): Promise<{ old_id: string; new_id: string }> {
  // 1. Get the current initiative to confirm it's a SYS-* item
  const { data: initiative, error: fetchErr } = await supabase
    .from('initiatives')
    .select('id, display_id, type, eg_approved')
    .eq('id', initiativeId)
    .single();

  if (fetchErr || !initiative) throw new Error('Initiative not found');

  if (initiative.eg_approved) {
    throw new Error(`${initiative.display_id} is already on the EG Command Center`);
  }

  if (!initiative.display_id.startsWith('SYS-')) {
    throw new Error(`Only SYS-* initiatives can be promoted. This is ${initiative.display_id}`);
  }

  // 2. Get next EG display ID
  const newDisplayId = await getNextDisplayId('initiative_eg');

  // 3. Update the SAME row — change display_id and flip eg_approved
  const { error: updateErr } = await supabase
    .from('initiatives')
    .update({
      display_id: newDisplayId,
      eg_approved: true,
      type: 'Epic Gold',
      updated_at: new Date().toISOString(),
    })
    .eq('id', initiativeId);

  if (updateErr) throw updateErr;

  // 4. Update all child tasks: STSK-* → ETSK-*
  const { data: childTasks } = await supabase
    .from('tasks')
    .select('id, display_id')
    .eq('initiative_id', initiativeId)
    .like('display_id', 'STSK-%');

  if (childTasks && childTasks.length > 0) {
    for (const task of childTasks) {
      const newTaskId = await getNextDisplayId('task_etsk');
      await supabase
        .from('tasks')
        .update({ display_id: newTaskId, updated_at: new Date().toISOString() })
        .eq('id', task.id);
    }
  }

  return { old_id: initiative.display_id, new_id: newDisplayId };
}

// Promotes a CSH PSG pipeline row into a NEW initiative
// silentMode=true: creates with eg_approved=false (stays in pipeline, but is now a real initiative)
// silentMode=false (default): creates with eg_approved=true (immediately on EG Command Center)
export async function promoteFromPipeline(pipelineItemId: string, silentMode: boolean = false, overrides: Partial<CreateInitiativeInput> = {}): Promise<string> {
  // 1. Get pipeline item
  const { data: item, error: fetchErr } = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('id', pipelineItemId)
    .single();

  if (fetchErr || !item) throw new Error('Pipeline item not found');

  // If already promoted, return the existing initiative ID
  if (item.status === 'promoted' && item.promoted_initiative_id) {
    return item.promoted_initiative_id;
  }

  // 2. Create the initiative
  // silentMode: SYS prefix, eg_approved=false (stays in pipeline view)
  // normalMode: EG prefix, eg_approved=true (goes to EG Command Center)
  const counterType = silentMode ? 'initiative_sys' : 'initiative_eg';
  const displayId = await getNextDisplayId(counterType);

  const payload = cleanInput({
    organization_id: DEFAULT_ORG_ID,
    display_id: displayId,
    name: overrides.name || item.name,
    description: overrides.description || item.details || null,
    type: 'Epic Gold',
    priority: overrides.priority || item.priority || 'Medium',
    status: 'Not Started',
    system_sponsor: overrides.system_sponsor || item.system_sponsor || null,
    applications: overrides.applications || (item.application ? [item.application] : null),
    specialty_service_line: overrides.specialty_service_line || (item.specialty ? [item.specialty] : null),
    policy_link: overrides.policy_link || item.policy_link || null,
    ehr_requirements_link: overrides.ehr_requirements_link || item.ehr_link || null,
    eg_approved: !silentMode,
    is_active: true,
    ...overrides,
  });

  const { data: newInit, error: insertErr } = await supabase
    .from('initiatives')
    .insert(payload)
    .select()
    .single();

  if (insertErr) throw insertErr;

  // 3. Mark pipeline item as promoted
  await supabase
    .from('pipeline_items')
    .update({
      status: 'promoted',
      promoted_initiative_id: newInit.id,
    })
    .eq('id', pipelineItemId);

  return newInit.id;
}

export async function deleteInitiative(id: string) {
  // Soft delete — set is_active = false
  const { error } = await supabase
    .from('initiatives')
    .update({ is_active: false, status: 'Deleted', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  // Also clean up effort logs (hard delete, same as GovernIQ)
  await supabase.from('effort_logs').delete().eq('initiative_id', id);
}

// ─── Tasks ───

export interface CreateTaskInput {
  initiative_id: string;
  description: string;
  module?: string;
  priority?: string;
  status?: string;
  primary_analyst_id?: string;
  additional_analysts?: string[];
  education_required?: boolean;
  build_review_status?: string;
  build_review_date?: string;
  resolution_date?: string;
}

export async function createTask(input: CreateTaskInput) {
  // Determine task prefix based on parent initiative type
  // If the parent initiative is EG-approved, use ETSK; otherwise STSK
  let taskCounterType = 'task_stsk'; // default: system task
  const { data: parentInit } = await supabase
    .from('initiatives')
    .select('eg_approved, display_id')
    .eq('id', input.initiative_id)
    .single();
  if (parentInit?.eg_approved || parentInit?.display_id?.startsWith('EG-')) {
    taskCounterType = 'task_etsk';
  }
  const displayId = await getNextDisplayId(taskCounterType);

  const payload = cleanInput({
    organization_id: DEFAULT_ORG_ID,
    display_id: displayId,
    ...input,
  });

  console.log('Creating task with payload:', payload);

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Supabase task insert error:', error.message, error.details, error.hint);
    throw error;
  }
  return data;
}

export async function updateTask(id: string, updates: Partial<CreateTaskInput>) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...cleanInput(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ─── Notes ───

export interface CreateNoteInput {
  initiative_id?: string;
  task_id?: string;
  note_text: string;
  note_type?: string;
  author?: string;
}

export async function createNote(input: CreateNoteInput) {
  const { data, error } = await supabase
    .from('notes')
    .insert({ organization_id: DEFAULT_ORG_ID, ...input })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Action Items ───

export interface CreateActionItemInput {
  initiative_id?: string;
  task_id?: string;
  description: string;
  owner?: string;
  due_date?: string;
  status?: string;
  notes?: string;
}

export async function createActionItem(input: CreateActionItemInput) {
  const { data, error } = await supabase
    .from('action_items')
    .insert({ organization_id: DEFAULT_ORG_ID, ...input })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActionItem(id: string, updates: Partial<CreateActionItemInput> & { completed_date?: string }) {
  const { data, error } = await supabase
    .from('action_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteActionItem(id: string) {
  const { error } = await supabase.from('action_items').delete().eq('id', id);
  if (error) throw error;
}

// ─── Documents ───

export interface CreateDocumentInput {
  initiative_id?: string;
  task_id?: string;
  document_name: string;
  document_type?: string;
  url?: string;
}

export async function createDocument(input: CreateDocumentInput) {
  const { data, error } = await supabase
    .from('documents')
    .insert({ organization_id: DEFAULT_ORG_ID, ...input })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

// ─── Team Members ───

export interface CreateTeamMemberInput {
  name: string;
  email?: string;
  role: string;
  manager_id?: string;
  title?: string;
}

export async function createTeamMember(input: CreateTeamMemberInput) {
  const cleaned = cleanInput({ organization_id: DEFAULT_ORG_ID, ...input });
  const { data, error } = await supabase
    .from('team_members')
    .insert(cleaned)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamMember(id: string, updates: Partial<CreateTeamMemberInput> & { is_active?: boolean }) {
  const cleaned = cleanInput({ ...updates, updated_at: new Date().toISOString() });
  const { data, error } = await supabase
    .from('team_members')
    .update(cleaned)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Effort Logs ───

export interface SaveEffortLogInput {
  team_member_id: string;
  initiative_id: string;
  week_start_date: string;
  hours_spent: number;
  effort_size?: string;
  note?: string;
}

export async function saveEffortLog(input: SaveEffortLogInput) {
  // Upsert: update if exists for same member+initiative+week, create otherwise
  const { data: existing } = await supabase
    .from('effort_logs')
    .select('id')
    .eq('team_member_id', input.team_member_id)
    .eq('initiative_id', input.initiative_id)
    .eq('week_start_date', input.week_start_date)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('effort_logs')
      .update({
        hours_spent: input.hours_spent,
        effort_size: input.effort_size,
        note: input.note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('effort_logs')
      .insert({ organization_id: DEFAULT_ORG_ID, ...input })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ─── Governance Records ───

export interface CreateGovernanceRecordInput {
  initiative_id: string;
  ticket_number?: string;
  submission_date?: string;
  review_date?: string;
  decision_date?: string;
  status?: string;
  conditions?: string;
}

export async function createGovernanceRecord(input: CreateGovernanceRecordInput) {
  const displayId = await getNextDisplayId('governance');

  const payload = cleanInput({
    organization_id: DEFAULT_ORG_ID,
    display_id: displayId,
    ...input,
  });

  const { data, error } = await supabase
    .from('governance_records')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGovernanceRecord(id: string, updates: Partial<CreateGovernanceRecordInput>) {
  const { data, error } = await supabase
    .from('governance_records')
    .update({ ...cleanInput(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGovernanceRecord(id: string) {
  const { error } = await supabase.from('governance_records').delete().eq('id', id);
  if (error) throw error;
}

// ─── User Preferences ───

export async function saveUserPreference(key: string, value: string, teamMemberId?: string) {
  // Upsert: check if preference exists, update or create
  let query = supabase
    .from('user_preferences')
    .select('id')
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('preference_key', key);

  if (teamMemberId) {
    query = query.eq('team_member_id', teamMemberId);
  } else {
    query = query.is('team_member_id', null);
  }

  const { data: existing } = await query.single();

  if (existing) {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({ preference_value: value, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const payload: Record<string, unknown> = {
      organization_id: DEFAULT_ORG_ID,
      preference_key: key,
      preference_value: value,
    };
    if (teamMemberId) payload.team_member_id = teamMemberId;

    const { data, error } = await supabase
      .from('user_preferences')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteUserPreference(key: string, teamMemberId?: string) {
  let query = supabase
    .from('user_preferences')
    .delete()
    .eq('organization_id', DEFAULT_ORG_ID)
    .eq('preference_key', key);

  if (teamMemberId) {
    query = query.eq('team_member_id', teamMemberId);
  } else {
    query = query.is('team_member_id', null);
  }

  const { error } = await query;
  if (error) throw error;
}

// ─── Pipeline ───

export async function promotePipelineItem(pipelineItemId: string, initiativeData: CreateInitiativeInput) {
  const initiative = await createInitiative(initiativeData);

  await supabase
    .from('pipeline_items')
    .update({ status: 'promoted', promoted_initiative_id: initiative.id })
    .eq('id', pipelineItemId);

  return initiative;
}
