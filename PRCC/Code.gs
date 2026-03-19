// ============================================================
// POLICY REVIEW COMMAND CENTER v2 — Server-Side (Code.gs)
// Google Apps Script Web App Backend
// Initiative → Task hierarchy with Notes, Action Items, Documents
// ============================================================

// ---- SHEET NAMES ----
const SHEET_NAMES = {
  INITIATIVES:      'Initiatives',
  TASKS:            'Tasks',
  TASK_NOTES:       'Notes',
  TASK_ACTIONS:     'TaskActionItems',
  TASK_DOCUMENTS:   'TaskDocuments',       // legacy — kept for migration
  INIT_DOCUMENTS:   'InitiativeDocuments', // new: documents at initiative level
  CONFIG:           'PRCC_Config',
  // Legacy / reference sheets (read-only)
  MASTER_LOG:       'Master Missing Components Log',
  ARCHIVE:          'Archived Components',
  CSH_PSG:          'CSH PSG',
  ANALYST_DASHBOARD:'Analyst Dashboard'
};

// ---- ID PREFIXES ----
const ID_PREFIXES = {
  nextInitiativeId:     'EG',
  nextTaskId:           'TSK',
  nextTaskNoteId:       'NTE',
  nextTaskActionItemId: 'TAI',
  nextTaskDocumentId:   'TDC',
  nextInitiativeDocumentId: 'IDC'
};

// ---- INITIATIVE STATUSES ----
const INITIATIVE_STATUSES = [
  'Not Started', 'Define', 'Ready for Discussion', 'In Progress', 'Under Review', 'Completed',
  'On Hold', 'Deferred', 'Dismissed'
];

// ---- TASK STATUSES ----
const TASK_STATUSES = [
  'Identified', 'Needs Analyst - Discussion', 'Needs Analyst - Build',
  'Build Analyst Assigned', 'Build In Progress', 'Non Prod Testing',
  'On Hold', 'Closed - Completed', 'Closed - Deferred', 'Dismissed'
];

// ---- PRIORITIES ----
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

// ---- INITIATIVE TYPES ----
const INITIATIVE_TYPES = ['Guideline', 'Policy', 'Board Goal', 'Standard Practice'];

// ---- APPLICATIONS (Epic modules) ----
const APPLICATIONS = [
  'Ambulatory', 'ClinDoc', 'Orders', 'Willow', 'OPA', 'ASAP', 'Grand Central', 'Healthy Planet',
  'OpTime', 'Stork', 'Beaker', 'Beacon', 'Bugsy', 'Resolute',
  'MyChart', 'EpicCare Ambulatory', 'Cadence', 'Prelude', 'Radiant',
  'Cupid', 'Caboodle', 'Rover', 'Lumens', 'Haiku'
];

// ---- VENUES ----
const VENUES = ['ED', 'Acute Inpatient', 'Ambulatory', 'Periop', 'Outpatient Surgery', 'Acute Outpatient'];

// ---- ROLES / DISCIPLINES ----
const ROLES = [
  'Provider', 'APP', 'Medical Resident', 'Medical Student',
  'Nursing', 'Nursing Student', 'Pharmacist',
  'Medical Assistant', 'Registration/Front Office',
  'Care Coordination', 'Social Work',
  'Lab', 'Imaging', 'Quality',
  'Infection Prevention', 'Critical Care'
];

// ---- SPECIALTIES / SERVICE LINES ----
const SPECIALTIES = [
  // Primary Care / General
  'Primary Care', 'Hospital Medicine', 'Geriatrics',
  // Medical Specialties
  'Cardiology', 'Pulmonology', 'Gastroenterology', 'Nephrology', 'Endocrinology',
  'Hematology', 'Rheumatology', 'Infectious Disease', 'Allergy & Immunology',
  'Dermatology', 'Neurology', 'Emergency Medicine', 'Urgent Care',
  // Oncology
  'Oncology', 'Radiation Oncology',
  // Surgical
  'General Surgery', 'Orthopedic Surgery', 'Neurosurgery', 'Cardiothoracic Surgery',
  'Vascular Surgery', 'Trauma Surgery', 'Plastic Surgery', 'Bariatric Surgery', 'Transplant Surgery',
  // Women's & Maternal
  'OB/GYN', 'Maternal-Fetal Medicine', 'Women\'s Health',
  // Pediatrics
  'Pediatrics', 'Neonatal/NICU',
  // Behavioral Health
  'Behavioral Health', 'Psychiatry', 'Addiction Medicine',
  // Rehab & Therapy
  'Physical Therapy', 'Occupational Therapy', 'Speech & Language', 'Respiratory Therapy', 'Rehab Medicine',
  // Ancillary / Diagnostic
  'Laboratory/Pathology', 'Radiology/Imaging',
  // Other
  'Critical Care/ICU', 'Ophthalmology', 'ENT', 'Urology', 'Anesthesiology',
  'Pain Management', 'Palliative Care', 'Hospice', 'Sleep Medicine', 'Wound Care', 'Sports Medicine'
];

// ---- EDUCATION OPTIONS ----
const EDUCATION_OPTIONS = ['', 'Yes', 'No'];

// ---- BUILD REVIEW OPTIONS ----
const BUILD_REVIEW_OPTIONS = [
  '', 'Yes - Build can be complete',
  'No - Did not meet with analyst', 'In Progress'
];

// ---- NOTE TYPES ----
const NOTE_TYPES = ['General', 'Decision', 'Blocker', 'Status Update', 'Meeting Notes'];

// ---- ACTION ITEM STATUSES ----
const ACTION_ITEM_STATUSES = ['Not Started', 'In Progress', 'Complete', 'Deferred'];

// ---- GO-LIVE WAVES ----
const GO_LIVE_WAVES = [
  'Wave 3', 'New Beginnings South', 'Wave 4', 'Wave 4.5', 'Wave 5'
];

// ---- DOCUMENT TYPES ----
const DOCUMENT_TYPES = [
  'Requirements', 'Design Spec', 'Meeting Notes', 'Policy',
  'Build Guide', 'Test Plan', 'Other'
];

// ---- HARDCODED SEED LISTS (merged with dynamic data) ----
const SEED_ANALYSTS = [
  'Adam Henderson', 'Alex Cordell', 'Amanda Davidson', 'Christi Allen', 'Christi Elsmore',
  'Corrinne Welch', 'Desiree Upton', 'Gary Hudson', 'Jared Boynton', 'Jennifer Brennan',
  'Karan Patel', 'Karen Sykes', 'Kate Glass', 'Maria Delacruz',
  'Mary Eckert', 'Matthew Walsh', 'Megan Rutt', 'Michelle Ryan',
  'Myra Ventrcek', 'Pam Shadle', 'Patrick McGovern', 'Racquel Calhoun',
  'Ryan Carr', 'Sara Garcia', 'Sheron Johnson'
];

const SEED_SCIS = [
  'Brooke Searl', 'Dawn Jacobson', 'Jason Mihos', 'Kim Willis',
  'Marisa Radick', 'Marty Koepke', 'Melissa Plummer',
  'Sherry Brennaman', 'Trudy Finch', 'Van Nguyen', 'Yvette Kirk'
];

// ============================================================
// WEB APP ENTRY
// ============================================================

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Epic Gold System Readiness Command Center')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function includeRaw(filename) {
  return HtmlService.createTemplateFromFile(filename).getRawContent();
}

// ============================================================
// GENERIC HELPERS
// ============================================================

/**
 * Reads a sheet into an array of objects keyed by trimmed header names.
 * Each object also gets a _row property (1-based sheet row).
 */
function sheetToJson(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    if (!data[i].join('').trim()) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) val = val.toISOString();
      obj[headers[j]] = val;
    }
    obj._row = i + 1;
    rows.push(obj);
  }
  return rows;
}

/**
 * Finds row index (1-based) by ID in column A.
 * Returns { sheet, rowIndex, data, headers } or null.
 */
function findRowById(sheetName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return null;

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      return { sheet: sheet, rowIndex: i + 1, data: data[i], headers: headers };
    }
  }
  return null;
}

/**
 * Gets next auto-increment ID from PRCC_Config sheet.
 * key = config row key (e.g., 'nextInitiativeId')
 * Returns formatted ID like 'EG-0001'
 */
function getNextId(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!config) return null;

  var data = config.getDataRange().getValues();
  var prefix = ID_PREFIXES[key] || 'ID';

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      var nextNum = parseInt(data[i][1]) || 1;
      config.getRange(i + 1, 2).setValue(nextNum + 1);
      SpreadsheetApp.flush();
      return prefix + '-' + String(nextNum).padStart(4, '0');
    }
  }
  // Key not found — add it
  config.appendRow([key, 2]);
  SpreadsheetApp.flush();
  return prefix + '-0001';
}

/**
 * Cascade-deletes all rows in a sheet where keyField matches keyValue.
 * Deletes bottom-up to avoid row-shifting issues.
 */
function deleteRelatedRows(sheetName, keyField, keyValue) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var keyCol = headers.indexOf(keyField);
  if (keyCol < 0) return;

  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyCol]).trim() === String(keyValue).trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * Creates a sheet if it doesn't exist, with bold frozen header row.
 * If the sheet already exists, ensures all expected headers are present
 * (appends any missing columns so re-running setup picks up new fields).
 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    // Sheet exists — check for missing columns and append them
    var lastCol = sheet.getLastColumn();
    var existing = lastCol > 0
      ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); })
      : [];
    headers.forEach(function(h) {
      if (existing.indexOf(h) < 0) {
        var newCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, newCol).setValue(h).setFontWeight('bold');
        existing.push(h);
      }
    });
  }
  return sheet;
}

/**
 * Builds a row array that matches a sheet's header order from a data object.
 * Ensures data lands in the correct column regardless of column position.
 */
function buildRowFromHeaders(sheet, data) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function(h) { return String(h).trim(); });
  var row = [];
  headers.forEach(function(h) {
    row.push(data[h] !== undefined ? data[h] : '');
  });
  return row;
}

// ============================================================
// SETUP — creates all v2 sheets + config
// ============================================================

function setupPRCC() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Initiatives
  getOrCreateSheet(ss, SHEET_NAMES.INITIATIVES, [
    'id', 'name', 'description', 'type', 'priority',
    'primarySCI', 'secondarySCI',
    'applications', 'venues', 'rolesImpacted', 'specialtyServiceLine',
    'systemSponsor', 'goLiveWave',
    'policyLink', 'ehrRequirementsLink',
    'status', 'createdDate', 'updatedDate'
  ]);

  // Tasks
  getOrCreateSheet(ss, SHEET_NAMES.TASKS, [
    'id', 'initiativeId', 'description', 'module', 'priority',
    'primaryAnalyst', 'additionalAnalysts', 'status',
    'educationRequired', 'buildReviewComplete', 'buildReviewDate',
    'resolutionDate', 'createdDate'
  ]);

  // Notes (supports both task-level and initiative-level notes)
  getOrCreateSheet(ss, SHEET_NAMES.TASK_NOTES, [
    'id', 'taskId', 'initiativeId', 'timestamp', 'author', 'noteText', 'noteType'
  ]);

  // TaskActionItems
  getOrCreateSheet(ss, SHEET_NAMES.TASK_ACTIONS, [
    'id', 'taskId', 'description', 'owner', 'dueDate',
    'status', 'completedDate', 'notes', 'createdDate'
  ]);

  // TaskDocuments (legacy — kept for migration reference)
  getOrCreateSheet(ss, SHEET_NAMES.TASK_DOCUMENTS, [
    'id', 'taskId', 'documentName', 'documentType', 'url', 'dateAdded'
  ]);

  // InitiativeDocuments (new — documents at initiative level)
  getOrCreateSheet(ss, SHEET_NAMES.INIT_DOCUMENTS, [
    'id', 'initiativeId', 'documentName', 'documentType', 'url', 'dateAdded'
  ]);

  // Config — seed ID counters
  var configSheet = getOrCreateSheet(ss, SHEET_NAMES.CONFIG, ['key', 'value']);
  var configData = configSheet.getDataRange().getValues();
  var existingKeys = {};
  for (var i = 1; i < configData.length; i++) {
    existingKeys[String(configData[i][0]).trim()] = true;
  }

  var seeds = [
    ['nextInitiativeId', 1],
    ['nextTaskId', 1],
    ['nextTaskNoteId', 1],
    ['nextTaskActionItemId', 1],
    ['nextTaskDocumentId', 1],
    ['nextInitiativeDocumentId', 1]
  ];
  seeds.forEach(function(pair) {
    if (!existingKeys[pair[0]]) {
      configSheet.appendRow(pair);
    }
  });

  SpreadsheetApp.flush();
  return { success: true, message: 'PRCC v2 setup complete — all sheets created.' };
}

// ============================================================
// DATA LOADING — HOME BUNDLE
// ============================================================

/**
 * Returns all data needed for the app in a single server call.
 */
function getHomeBundle() {
  var initiatives = sheetToJson(SHEET_NAMES.INITIATIVES);
  var tasks = sheetToJson(SHEET_NAMES.TASKS);
  var config = getConfigData();
  var pipeline = getPipelineItems();
  var archived = getArchivedItems();

  // Build clean SCI, Analyst, and unified People lists from seed lists ONLY.
  // Dynamic scanning of sheet data introduced dirty compound names (e.g. "Marisa Radick & Brooke Snow").
  // To add new people, update SEED_SCIS or SEED_ANALYSTS constants at top of file.
  config.scis = SEED_SCIS.slice().sort();
  config.analysts = SEED_ANALYSTS.slice().sort();

  // Unified people list: deduped merge of analysts + SCIs for owner/person dropdowns
  var peopleSet = {};
  config.scis.forEach(function(n) { peopleSet[n] = true; });
  config.analysts.forEach(function(n) { peopleSet[n] = true; });
  config.people = Object.keys(peopleSet).sort();

  // Compute dashboard counts
  var counts = computeDashboardCounts(initiatives, tasks);

  // Add action item metrics
  var aiMetrics = computeActionItemMetrics();
  counts.overdueActionItems = aiMetrics.overdue;
  counts.openActionItems = aiMetrics.openItems;
  counts.totalActionItems = aiMetrics.totalItems;
  counts.actionItemsByOwner = aiMetrics.byOwner;

  // Stamp open action item count onto each task for card badges
  var aiByTask = aiMetrics.byTask || {};
  tasks.forEach(function(t) {
    t.openActionItems = aiByTask[t.id] || 0;
  });

  // Include all action items so the client can display them in My Tasks panel
  var allActionItems = sheetToJson(SHEET_NAMES.TASK_ACTIONS);

  return {
    initiatives: initiatives,
    tasks: tasks,
    actionItems: allActionItems,
    config: config,
    counts: counts,
    pipeline: pipeline,
    archived: archived
  };
}

/**
 * Returns config options for dropdowns and current user email.
 */
function getConfigData() {
  return {
    initiativeStatuses: INITIATIVE_STATUSES,
    taskStatuses: TASK_STATUSES,
    priorities: PRIORITIES,
    initiativeTypes: INITIATIVE_TYPES,
    applications: APPLICATIONS,
    venues: VENUES,
    roles: ROLES,
    specialties: SPECIALTIES,
    educationOptions: EDUCATION_OPTIONS,
    buildReviewOptions: BUILD_REVIEW_OPTIONS,
    noteTypes: NOTE_TYPES,
    actionItemStatuses: ACTION_ITEM_STATUSES,
    goLiveWaves: GO_LIVE_WAVES,
    documentTypes: DOCUMENT_TYPES,
    analysts: SEED_ANALYSTS,
    scis: SEED_SCIS,
    currentUser: Session.getActiveUser().getEmail()
  };
}

/**
 * Dashboard counts from initiatives + tasks.
 * Returns comprehensive metrics for executive & operational dashboards.
 */
function computeDashboardCounts(initiatives, tasks) {
  var now = new Date();
  var nowMs = now.getTime();
  var DAY_MS = 86400000;

  // ── Initiative classifications ──
  var activeStatuses = ['Not Started', 'Define', 'Ready for Discussion', 'In Progress', 'Under Review', 'On Hold'];
  var closedInitStatuses = ['Completed', 'Dismissed'];
  var openInits = initiatives.filter(function(i) { return activeStatuses.indexOf(i.status) >= 0; });
  var completedInits = initiatives.filter(function(i) { return i.status === 'Completed'; });
  var deferredInits = initiatives.filter(function(i) { return i.status === 'Deferred'; });

  // ── Task classifications ──
  var openTaskStatuses = ['Identified', 'Needs Analyst - Discussion', 'Needs Analyst - Build', 'Build Analyst Assigned', 'Build In Progress', 'Non Prod Testing', 'On Hold'];
  var closedTaskStatuses = ['Closed - Completed', 'Closed - Deferred', 'Dismissed'];
  var openTasks = tasks.filter(function(t) { return openTaskStatuses.indexOf(t.status) >= 0; });
  var completedTasks = tasks.filter(function(t) { return t.status === 'Closed - Completed'; });
  var allClosedTasks = tasks.filter(function(t) { return closedTaskStatuses.indexOf(t.status) >= 0; });

  // ── KPI: Counts & rates ──
  var highPriority = openTasks.filter(function(t) {
    return t.priority === 'Critical' || t.priority === 'High';
  });
  var unassigned = openTasks.filter(function(t) { return !t.primaryAnalyst; });
  var inBuild = openTasks.filter(function(t) { return t.status === 'Build In Progress'; });
  var taskCompletionPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  var initCompletionPct = initiatives.length > 0 ? Math.round((completedInits.length / initiatives.length) * 100) : 0;

  // ── Velocity: Tasks closed in last 30 days ──
  var thirtyDaysAgo = new Date(nowMs - (30 * DAY_MS));
  var closedLast30 = completedTasks.filter(function(t) {
    if (!t.resolutionDate) return false;
    return new Date(t.resolutionDate) >= thirtyDaysAgo;
  }).length;

  // ── AGING: How long open tasks have been sitting ──
  var aging30 = 0, aging60 = 0, aging90 = 0;
  openTasks.forEach(function(t) {
    if (!t.createdDate) return;
    var ageDays = Math.floor((nowMs - new Date(t.createdDate).getTime()) / DAY_MS);
    if (ageDays >= 90) aging90++;
    else if (ageDays >= 60) aging60++;
    else if (ageDays >= 30) aging30++;
  });

  // ── STALE: Initiatives not updated in 30+ days ──
  var staleInits = openInits.filter(function(i) {
    if (!i.updatedDate) return true; // never updated = stale
    var ageDays = Math.floor((nowMs - new Date(i.updatedDate).getTime()) / DAY_MS);
    return ageDays >= 30;
  }).length;

  // ── BUILD REVIEW HEALTH ──
  var buildTasks = tasks.filter(function(t) { return t.status === 'Build In Progress'; });
  var buildReviewDone = buildTasks.filter(function(t) {
    return t.buildReviewComplete === 'Yes - Build can be complete';
  }).length;
  var buildReviewPending = buildTasks.filter(function(t) {
    return !t.buildReviewComplete || t.buildReviewComplete === '' || t.buildReviewComplete === 'In Progress';
  }).length;
  var buildReviewFailed = buildTasks.filter(function(t) {
    return t.buildReviewComplete === 'No - Did not meet with analyst';
  }).length;

  // ── EDUCATION TRACKING ──
  var educationRequired = openTasks.filter(function(t) { return t.educationRequired === 'Yes'; }).length;

  // ── GO-LIVE WAVE READINESS ──
  var byWave = {};
  initiatives.forEach(function(i) {
    var wave = i.goLiveWave || 'Unassigned';
    if (!byWave[wave]) byWave[wave] = { total: 0, completed: 0, open: 0, tasks: 0, tasksCompleted: 0 };
    byWave[wave].total++;
    if (i.status === 'Completed') byWave[wave].completed++;
    if (activeStatuses.indexOf(i.status) >= 0) byWave[wave].open++;
  });
  tasks.forEach(function(t) {
    // Find parent initiative to get wave
    var parentInit = null;
    for (var ix = 0; ix < initiatives.length; ix++) {
      if (String(initiatives[ix].id) === String(t.initiativeId)) { parentInit = initiatives[ix]; break; }
    }
    var wave = (parentInit && parentInit.goLiveWave) ? parentInit.goLiveWave : 'Unassigned';
    if (!byWave[wave]) byWave[wave] = { total: 0, completed: 0, open: 0, tasks: 0, tasksCompleted: 0 };
    byWave[wave].tasks++;
    if (t.status === 'Closed - Completed') byWave[wave].tasksCompleted++;
  });

  // ── STATUS DISTRIBUTION (funnels) ──
  var initStatusDist = {};
  INITIATIVE_STATUSES.forEach(function(s) { initStatusDist[s] = 0; });
  initiatives.forEach(function(i) { initStatusDist[i.status] = (initStatusDist[i.status] || 0) + 1; });

  var taskStatusDist = {};
  TASK_STATUSES.forEach(function(s) { taskStatusDist[s] = 0; });
  tasks.forEach(function(t) { taskStatusDist[t.status] = (taskStatusDist[t.status] || 0) + 1; });

  // ── PRIORITY DISTRIBUTION ──
  var initPriorityDist = {};
  PRIORITIES.forEach(function(p) { initPriorityDist[p] = 0; });
  openInits.forEach(function(i) { initPriorityDist[i.priority] = (initPriorityDist[i.priority] || 0) + 1; });

  // ── By Analyst ──
  var byAnalyst = {};
  openTasks.forEach(function(t) {
    var a = t.primaryAnalyst || 'Unassigned';
    byAnalyst[a] = (byAnalyst[a] || 0) + 1;
  });

  // ── By Module ──
  var byModule = {};
  openTasks.forEach(function(t) {
    var m = t.module || 'Unknown';
    byModule[m] = (byModule[m] || 0) + 1;
  });

  // ── By SCI ──
  var bySCI = {};
  openInits.forEach(function(i) {
    var s = i.primarySCI || 'Unassigned';
    bySCI[s] = (bySCI[s] || 0) + 1;
  });

  // ── By Venue (initiatives — multi-select field) ──
  var byVenue = {};
  openInits.forEach(function(i) {
    var vals = (i.venues || '').split(',').map(function(v) { return v.trim(); }).filter(Boolean);
    if (!vals.length) { byVenue['Unassigned'] = (byVenue['Unassigned'] || 0) + 1; }
    vals.forEach(function(v) { byVenue[v] = (byVenue[v] || 0) + 1; });
  });

  // ── By Role (initiatives — multi-select field) ──
  var byRole = {};
  openInits.forEach(function(i) {
    var vals = (i.rolesImpacted || '').split(',').map(function(v) { return v.trim(); }).filter(Boolean);
    if (!vals.length) { byRole['Unassigned'] = (byRole['Unassigned'] || 0) + 1; }
    vals.forEach(function(v) { byRole[v] = (byRole[v] || 0) + 1; });
  });

  // ── By Specialty / Service Line (initiatives — multi-select field) ──
  var bySpecialty = {};
  openInits.forEach(function(i) {
    var vals = (i.specialtyServiceLine || '').split(',').map(function(v) { return v.trim(); }).filter(Boolean);
    if (!vals.length) { bySpecialty['Unassigned'] = (bySpecialty['Unassigned'] || 0) + 1; }
    vals.forEach(function(v) { bySpecialty[v] = (bySpecialty[v] || 0) + 1; });
  });

  // ── Analyst workload detail (open task breakdown by priority) ──
  var analystDetail = {};
  openTasks.forEach(function(t) {
    var a = t.primaryAnalyst || 'Unassigned';
    if (!analystDetail[a]) analystDetail[a] = { total: 0, critical: 0, high: 0, medium: 0, low: 0, inBuild: 0 };
    analystDetail[a].total++;
    var p = (t.priority || 'Medium').toLowerCase();
    if (analystDetail[a][p] !== undefined) analystDetail[a][p]++;
    if (t.status === 'Build In Progress') analystDetail[a].inBuild++;
  });

  return {
    // KPI tiles
    totalInitiatives: openInits.length,
    allInitiatives: initiatives.length,
    completedInitiatives: completedInits.length,
    deferredInitiatives: deferredInits.length,
    initCompletionPct: initCompletionPct,
    totalOpenTasks: openTasks.length,
    allTasks: tasks.length,
    completedTasks: completedTasks.length,
    taskCompletionPct: taskCompletionPct,
    highPriority: highPriority.length,
    unassigned: unassigned.length,
    inBuild: inBuild.length,
    // Velocity
    closedLast30: closedLast30,
    // Aging
    aging30: aging30,
    aging60: aging60,
    aging90: aging90,
    staleInits: staleInits,
    // Build Review
    buildReviewDone: buildReviewDone,
    buildReviewPending: buildReviewPending,
    buildReviewFailed: buildReviewFailed,
    // Education
    educationRequired: educationRequired,
    // Wave readiness
    byWave: byWave,
    // Distributions
    initStatusDist: initStatusDist,
    taskStatusDist: taskStatusDist,
    initPriorityDist: initPriorityDist,
    // Breakdowns
    byAnalyst: byAnalyst,
    byModule: byModule,
    bySCI: bySCI,
    analystDetail: analystDetail,
    byVenue: byVenue,
    byRole: byRole,
    bySpecialty: bySpecialty
  };
}

/**
 * Get overdue action items count for dashboard.
 * Separated because action items are in their own sheet.
 */
function computeActionItemMetrics() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TASK_ACTIONS);
  if (!sheet || sheet.getLastRow() < 2) return { overdue: 0, openItems: 0, totalItems: 0, byOwner: {} };

  var items = sheetToJson(sheet);
  var now = new Date();
  var todayStr = now.toISOString().split('T')[0];

  var openItems = items.filter(function(a) { return a.status !== 'Complete'; });
  var overdue = openItems.filter(function(a) {
    if (!a.dueDate) return false;
    var due = String(a.dueDate).split('T')[0];
    return due < todayStr;
  });

  // Group open items by owner for per-person dashboard
  var byOwner = {};
  openItems.forEach(function(a) {
    var owner = a.owner || 'Unassigned';
    if (!byOwner[owner]) byOwner[owner] = { open: 0, overdue: 0 };
    byOwner[owner].open++;
    if (a.dueDate && String(a.dueDate).split('T')[0] < todayStr) {
      byOwner[owner].overdue++;
    }
  });

  // Per-task open action item counts
  var byTask = {};
  openItems.forEach(function(a) {
    var tid = a.taskId || '';
    if (!tid) return;
    if (!byTask[tid]) byTask[tid] = 0;
    byTask[tid]++;
  });

  return {
    overdue: overdue.length,
    openItems: openItems.length,
    totalItems: items.length,
    byOwner: byOwner,
    byTask: byTask
  };
}

// ============================================================
// INITIATIVE CRUD
// ============================================================

function createInitiative(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.INITIATIVES);
  var id = getNextId('nextInitiativeId');
  var now = new Date().toISOString();

  var rowData = {
    id:                 id,
    name:               data.name || '',
    description:        data.description || '',
    type:               data.type || '',
    priority:           data.priority || 'Medium',
    primarySCI:         data.primarySCI || '',
    secondarySCI:       data.secondarySCI || '',
    applications:       data.applications || '',
    venues:             data.venues || '',
    rolesImpacted:      data.rolesImpacted || '',
    specialtyServiceLine: data.specialtyServiceLine || '',
    systemSponsor:      data.systemSponsor || '',
    goLiveWave:         data.goLiveWave || '',
    status:             data.status || 'Not Started',
    createdDate:        now,
    updatedDate:        now
  };
  sheet.appendRow(buildRowFromHeaders(sheet, rowData));
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function updateInitiative(id, data) {
  var result = findRowById(SHEET_NAMES.INITIATIVES, id);
  if (!result) return { success: false, error: 'Initiative not found' };

  var sheet = result.sheet;
  var rowIndex = result.rowIndex;
  var headers = result.headers;
  var now = new Date().toISOString();

  headers.forEach(function(h, colIdx) {
    if (h === 'id' || h === 'createdDate') return;
    if (h === 'updatedDate') {
      sheet.getRange(rowIndex, colIdx + 1).setValue(now);
    } else if (data[h] !== undefined) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(data[h]);
    }
  });
  SpreadsheetApp.flush();
  return { success: true };
}

function deleteInitiative(id) {
  var result = findRowById(SHEET_NAMES.INITIATIVES, id);
  if (!result) return { success: false, error: 'Initiative not found' };

  // Get all tasks for this initiative
  var tasks = sheetToJson(SHEET_NAMES.TASKS).filter(function(t) {
    return String(t.initiativeId) === String(id);
  });

  // Cascade delete: for each task, delete its notes, action items, documents
  tasks.forEach(function(t) {
    deleteRelatedRows(SHEET_NAMES.TASK_NOTES, 'taskId', t.id);
    deleteRelatedRows(SHEET_NAMES.TASK_ACTIONS, 'taskId', t.id);
    deleteRelatedRows(SHEET_NAMES.TASK_DOCUMENTS, 'taskId', t.id);
  });

  // Delete all tasks for this initiative
  deleteRelatedRows(SHEET_NAMES.TASKS, 'initiativeId', id);

  // Delete initiative-level notes and documents
  deleteRelatedRows(SHEET_NAMES.TASK_NOTES, 'initiativeId', id);
  deleteRelatedRows(SHEET_NAMES.INIT_DOCUMENTS, 'initiativeId', id);

  // Delete the initiative itself
  result.sheet.deleteRow(result.rowIndex);
  SpreadsheetApp.flush();
  return { success: true };
}

function getInitiativeById(id) {
  var initiatives = sheetToJson(SHEET_NAMES.INITIATIVES);
  var initiative = null;
  for (var i = 0; i < initiatives.length; i++) {
    if (String(initiatives[i].id) === String(id)) {
      initiative = initiatives[i];
      break;
    }
  }
  return initiative;
}

// ============================================================
// TASK CRUD
// ============================================================

function createTask(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  var id = getNextId('nextTaskId');
  var now = new Date().toISOString();

  var rowData = {
    id:                 id,
    initiativeId:       data.initiativeId || '',
    description:        data.description || '',
    module:             data.module || '',
    priority:           data.priority || 'Medium',
    primaryAnalyst:     data.primaryAnalyst || '',
    additionalAnalysts: data.additionalAnalysts || '',
    status:             data.status || 'Identified',
    educationRequired:  data.educationRequired || '',
    buildReviewComplete:data.buildReviewComplete || '',
    buildReviewDate:    data.buildReviewDate || '',
    resolutionDate:     data.resolutionDate || '',
    createdDate:        now
  };
  sheet.appendRow(buildRowFromHeaders(sheet, rowData));
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function updateTask(id, data) {
  var result = findRowById(SHEET_NAMES.TASKS, id);
  if (!result) return { success: false, error: 'Task not found' };

  var sheet = result.sheet;
  var rowIndex = result.rowIndex;
  var headers = result.headers;

  headers.forEach(function(h, colIdx) {
    if (h === 'id' || h === 'createdDate') return;
    if (data[h] !== undefined) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(data[h]);
    }
  });
  SpreadsheetApp.flush();
  return { success: true };
}

function deleteTask(id) {
  var result = findRowById(SHEET_NAMES.TASKS, id);
  if (!result) return { success: false, error: 'Task not found' };

  // Cascade delete child records
  deleteRelatedRows(SHEET_NAMES.TASK_NOTES, 'taskId', id);
  deleteRelatedRows(SHEET_NAMES.TASK_ACTIONS, 'taskId', id);
  deleteRelatedRows(SHEET_NAMES.TASK_DOCUMENTS, 'taskId', id);

  result.sheet.deleteRow(result.rowIndex);
  SpreadsheetApp.flush();
  return { success: true };
}

function getTasksByInitiative(initiativeId) {
  return sheetToJson(SHEET_NAMES.TASKS).filter(function(t) {
    return String(t.initiativeId) === String(initiativeId);
  });
}

// ============================================================
// TASK NOTES CRUD
// ============================================================

function createTaskNote(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TASK_NOTES);
  var id = getNextId('nextTaskNoteId');
  var now = new Date().toISOString();

  var rowData = {
    id:           id,
    taskId:       data.taskId || '',
    initiativeId: data.initiativeId || '',
    timestamp:    now,
    author:       data.author || Session.getActiveUser().getEmail(),
    noteText:     data.noteText || '',
    noteType:     data.noteType || 'General'
  };
  sheet.appendRow(buildRowFromHeaders(sheet, rowData));
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function deleteTaskNote(id) {
  var result = findRowById(SHEET_NAMES.TASK_NOTES, id);
  if (!result) return { success: false, error: 'Note not found' };
  result.sheet.deleteRow(result.rowIndex);
  SpreadsheetApp.flush();
  return { success: true };
}

function getTaskNotes(taskId) {
  return sheetToJson(SHEET_NAMES.TASK_NOTES).filter(function(n) {
    return String(n.taskId) === String(taskId);
  });
}

function getInitiativeNotes(initiativeId) {
  return sheetToJson(SHEET_NAMES.TASK_NOTES).filter(function(n) {
    return String(n.initiativeId) === String(initiativeId);
  });
}

function createInitiativeNote(data) {
  return createTaskNote({
    initiativeId: data.initiativeId || '',
    noteText: data.noteText || '',
    noteType: data.noteType || 'General'
  });
}

// ============================================================
// TASK ACTION ITEMS CRUD
// ============================================================

function createTaskActionItem(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TASK_ACTIONS);
  var id = getNextId('nextTaskActionItemId');
  var now = new Date().toISOString();

  var rowData = {
    id:            id,
    taskId:        data.taskId || '',
    description:   data.description || '',
    owner:         data.owner || '',
    dueDate:       data.dueDate || '',
    status:        data.status || 'Not Started',
    completedDate: '',
    notes:         data.notes || '',
    createdDate:   now
  };
  sheet.appendRow(buildRowFromHeaders(sheet, rowData));
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function updateTaskActionItem(id, data) {
  var result = findRowById(SHEET_NAMES.TASK_ACTIONS, id);
  if (!result) return { success: false, error: 'Action item not found' };

  var sheet = result.sheet;
  var rowIndex = result.rowIndex;
  var headers = result.headers;

  headers.forEach(function(h, colIdx) {
    if (h === 'id' || h === 'createdDate') return;
    if (h === 'completedDate' && (data.status === 'Complete')) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(new Date().toISOString());
    } else if (data[h] !== undefined) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(data[h]);
    }
  });
  SpreadsheetApp.flush();
  return { success: true };
}

function deleteTaskActionItem(id) {
  var result = findRowById(SHEET_NAMES.TASK_ACTIONS, id);
  if (!result) return { success: false, error: 'Action item not found' };
  result.sheet.deleteRow(result.rowIndex);
  SpreadsheetApp.flush();
  return { success: true };
}

function getTaskActionItems(taskId) {
  return sheetToJson(SHEET_NAMES.TASK_ACTIONS).filter(function(a) {
    return String(a.taskId) === String(taskId);
  });
}

// ============================================================
// TASK DOCUMENTS CRUD
// ============================================================

function createTaskDocument(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TASK_DOCUMENTS);
  var id = getNextId('nextTaskDocumentId');
  var now = new Date().toISOString();

  var rowData = {
    id:           id,
    taskId:       data.taskId || '',
    documentName: data.documentName || '',
    documentType: data.documentType || 'Other',
    url:          data.url || '',
    dateAdded:    now
  };
  sheet.appendRow(buildRowFromHeaders(sheet, rowData));
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function deleteTaskDocument(id) {
  var result = findRowById(SHEET_NAMES.TASK_DOCUMENTS, id);
  if (!result) return { success: false, error: 'Document not found' };
  result.sheet.deleteRow(result.rowIndex);
  SpreadsheetApp.flush();
  return { success: true };
}

function getTaskDocuments(taskId) {
  return sheetToJson(SHEET_NAMES.TASK_DOCUMENTS).filter(function(d) {
    return String(d.taskId) === String(taskId);
  });
}

// ============================================================
// INITIATIVE DOCUMENTS CRUD (documents at initiative level)
// ============================================================

function createInitiativeDocument(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.INIT_DOCUMENTS);
  if (!sheet) {
    // Auto-create if missing
    sheet = getOrCreateSheet(ss, SHEET_NAMES.INIT_DOCUMENTS, [
      'id', 'initiativeId', 'documentName', 'documentType', 'url', 'dateAdded'
    ]);
  }
  var id = getNextId('nextInitiativeDocumentId');
  var now = new Date().toISOString();

  var rowData = {
    id:           id,
    initiativeId: data.initiativeId || '',
    documentName: data.documentName || '',
    documentType: data.documentType || 'Other',
    url:          data.url || '',
    dateAdded:    now
  };
  sheet.appendRow(buildRowFromHeaders(sheet, rowData));
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function deleteInitiativeDocument(id) {
  var result = findRowById(SHEET_NAMES.INIT_DOCUMENTS, id);
  if (!result) return { success: false, error: 'Document not found' };
  result.sheet.deleteRow(result.rowIndex);
  SpreadsheetApp.flush();
  return { success: true };
}

function getInitiativeDocuments(initiativeId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.INIT_DOCUMENTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  return sheetToJson(SHEET_NAMES.INIT_DOCUMENTS).filter(function(d) {
    return String(d.initiativeId) === String(initiativeId);
  });
}

// ============================================================
// TASK DETAIL BUNDLE — loads all sub-items for a task
// ============================================================

function getTaskDetailBundle(taskId) {
  return {
    notes: getTaskNotes(taskId),
    actionItems: getTaskActionItems(taskId),
    documents: getTaskDocuments(taskId)
  };
}

// ============================================================
// CSH PSG PIPELINE (read-only from existing sheet)
// ============================================================

function getPipelineItems() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.CSH_PSG);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  // Normalize headers: collapse internal newlines/whitespace (column B header spans two lines in the sheet)
  var headers = data[0].map(function(h) { return String(h).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim(); });
  var items = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i].join('').trim()) continue;
    var obj = {};
    headers.forEach(function(h, idx) {
      var val = data[i][idx];
      if (val instanceof Date) val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      obj[h || 'col_' + idx] = val !== undefined && val !== null ? val : '';
    });
    obj._row = i + 1;
    items.push(obj);
  }
  return items;
}

/**
 * Promotes a CSH PSG pipeline row to a new Initiative.
 * Pre-fills fields from the pipeline row data.
 * Returns the new initiative ID so the user can add tasks.
 */
function promoteToInitiative(data) {
  var result = createInitiative({
    name: data.name || '',
    description: data.description || '',
    type: data.type || '',
    priority: data.priority || 'Medium',
    primarySCI: data.primarySCI || '',
    secondarySCI: data.secondarySCI || '',
    applications: data.applications || '',
    venues: data.venues || '',
    rolesImpacted: data.rolesImpacted || '',
    specialtyServiceLine: data.specialtyServiceLine || '',
    systemSponsor: data.systemSponsor || '',
    goLiveWave: data.goLiveWave || '',
    status: 'Not Started'
  });

  // Auto-create InitiativeDocuments from pipeline document links
  if (result.success && data.documentLinks) {
    var links = data.documentLinks;
    for (var i = 0; i < links.length; i++) {
      if (links[i].url) {
        createInitiativeDocument({
          initiativeId: result.id,
          documentName: links[i].name || 'Document',
          documentType: links[i].type || 'Other',
          url: links[i].url
        });
      }
    }
  }

  return result;
}

// ============================================================
// ARCHIVED ITEMS (read-only from existing sheet)
// ============================================================

function getArchivedItems() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.ARCHIVE);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var items = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i].join('').trim()) continue;
    var obj = {};
    headers.forEach(function(h, idx) {
      var val = data[i][idx];
      if (val instanceof Date) val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      obj[h] = val !== undefined && val !== null ? val : '';
    });
    items.push(obj);
  }
  return items;
}

// ============================================================
// DATA MIGRATION — Master Missing Components Log → Initiatives + Tasks
// ============================================================

/**
 * Migrates all rows from the Master Missing Components Log into the new
 * Initiatives + Tasks hierarchy. Groups rows by policy name to create
 * one Initiative per unique policy, with one Task per old row.
 *
 * Known old columns: ID, CSH Policy, Module, Priority, Primary Analyst,
 * Primary SCI, Status, Notes, Description (+ any others).
 * Any unmapped columns are appended to the task description so nothing is lost.
 *
 * Safe to run: checks if Initiatives sheet already has data and warns.
 */
function migrateFromMasterLog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_LOG);
  if (!masterSheet || masterSheet.getLastRow() <= 1) {
    return { success: false, error: 'Master Missing Components Log sheet not found or empty.' };
  }

  // Safety check — don't double-migrate
  var initSheet = ss.getSheetByName(SHEET_NAMES.INITIATIVES);
  var taskSheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  if (!initSheet || !taskSheet) {
    return { success: false, error: 'Run Setup first to create the Initiatives and Tasks sheets.' };
  }
  if (initSheet.getLastRow() > 1) {
    return { success: false, error: 'Initiatives sheet already has data. Clear it first or migration will create duplicates.' };
  }

  // Read ALL old data dynamically
  var oldItems = sheetToJson(SHEET_NAMES.MASTER_LOG);
  if (!oldItems.length) {
    return { success: false, error: 'No data rows found in Master Missing Components Log.' };
  }

  // Known column mappings (old header → where it maps)
  var MAPPED_INITIATIVE_FIELDS = ['CSH Policy', 'Priority', 'Primary SCI', 'Status'];
  var MAPPED_TASK_FIELDS = ['Module', 'Primary Analyst', 'Status', 'Priority'];
  var SKIP_FIELDS = ['ID', '_row']; // Old ID is preserved in description, _row is internal

  // ---- Group by policy name ----
  var groups = {};
  var groupOrder = []; // preserve original order
  oldItems.forEach(function(item) {
    var policyName = String(item['CSH Policy'] || '').trim();
    if (!policyName) policyName = 'Unnamed Policy';
    if (!groups[policyName]) {
      groups[policyName] = [];
      groupOrder.push(policyName);
    }
    groups[policyName].push(item);
  });

  // ---- Status mapping: old → new initiative status ----
  function deriveInitiativeStatus(items) {
    var statuses = items.map(function(i) { return String(i['Status'] || '').trim(); });
    if (statuses.indexOf('Build In Progress') >= 0) return 'In Progress';
    if (statuses.indexOf('Build Analyst Assigned') >= 0 || statuses.indexOf('Analyst Assigned') >= 0) return 'In Progress';
    if (statuses.indexOf('Identified') >= 0) return 'Not Started';
    var allClosed = statuses.every(function(s) {
      return s === 'Closed - Completed' || s === 'Closed - Deferred' || s === 'Dismissed' || !s;
    });
    if (allClosed) {
      if (statuses.indexOf('Closed - Completed') >= 0) return 'Completed';
      if (statuses.indexOf('Closed - Deferred') >= 0) return 'Deferred';
      return 'Dismissed';
    }
    return 'Not Started';
  }

  // ---- Map old task status to new task status ----
  function mapTaskStatus(oldStatus) {
    var s = String(oldStatus || '').trim();
    if (TASK_STATUSES.indexOf(s) >= 0) return s;
    // Try partial matches
    if (s.toLowerCase().indexOf('complete') >= 0) return 'Closed - Completed';
    if (s.toLowerCase().indexOf('defer') >= 0) return 'Closed - Deferred';
    if (s.toLowerCase().indexOf('dismiss') >= 0) return 'Dismissed';
    if (s.toLowerCase().indexOf('build') >= 0) return 'Build In Progress';
    if (s.toLowerCase().indexOf('assign') >= 0) return 'Build Analyst Assigned';
    return 'Identified';
  }

  // ---- Map old priority ----
  function mapPriority(oldPriority) {
    var p = String(oldPriority || '').trim();
    if (PRIORITIES.indexOf(p) >= 0) return p;
    if (p.toLowerCase() === 'critical') return 'Critical';
    if (p.toLowerCase() === 'high') return 'High';
    if (p.toLowerCase() === 'low') return 'Low';
    return 'Medium';
  }

  // ---- Build unmapped data string for a row ----
  function getUnmappedData(item) {
    var allMapped = MAPPED_INITIATIVE_FIELDS.concat(MAPPED_TASK_FIELDS).concat(SKIP_FIELDS);
    var extras = [];
    Object.keys(item).forEach(function(key) {
      if (allMapped.indexOf(key) >= 0) return;
      var val = item[key];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        extras.push(key + ': ' + String(val).trim());
      }
    });
    return extras.join(' | ');
  }

  var now = new Date().toISOString();
  var createdInits = 0;
  var createdTasks = 0;

  // ---- Process each group ----
  groupOrder.forEach(function(policyName) {
    var items = groups[policyName];
    var first = items[0];

    // Collect unique modules across all items in this group
    var modules = [];
    items.forEach(function(item) {
      var m = String(item['Module'] || '').trim();
      if (m && modules.indexOf(m) < 0) modules.push(m);
    });

    // Create Initiative
    var initId = getNextId('nextInitiativeId');
    var initData = {
      id:                  initId,
      name:                policyName,
      description:         '',
      type:                '',
      priority:            mapPriority(first['Priority']),
      primarySCI:          String(first['Primary SCI'] || '').trim(),
      secondarySCI:        '',
      applications:        modules.join(','),
      venues:              '',
      rolesImpacted:       '',
      specialtyServiceLine: '',
      systemSponsor:       '',
      goLiveWave:          '',
      policyLink:          '',
      ehrRequirementsLink: '',
      status:              deriveInitiativeStatus(items),
      createdDate:         now,
      updatedDate:         now
    };
    initSheet.appendRow(buildRowFromHeaders(initSheet, initData));
    createdInits++;

    // Create one Task per old row
    items.forEach(function(item) {
      var taskId = getNextId('nextTaskId');
      var module = String(item['Module'] || '').trim();
      var oldId = String(item['ID'] || '').trim();

      // Build task description: include module context + old ID reference + any unmapped data
      var descParts = [];
      if (module) descParts.push(module);
      else descParts.push(policyName);
      if (oldId) descParts.push('[Legacy ID: ' + oldId + ']');

      var unmapped = getUnmappedData(item);
      if (unmapped) descParts.push('(' + unmapped + ')');

      var taskData = {
        id:                  taskId,
        initiativeId:        initId,
        description:         descParts.join(' — '),
        module:              module,
        priority:            mapPriority(item['Priority']),
        primaryAnalyst:      String(item['Primary Analyst'] || '').trim(),
        additionalAnalysts:  '',
        status:              mapTaskStatus(item['Status']),
        educationRequired:   '',
        buildReviewComplete: '',
        buildReviewDate:     '',
        resolutionDate:      '',
        createdDate:         now
      };
      taskSheet.appendRow(buildRowFromHeaders(taskSheet, taskData));
      createdTasks++;
    });
  });

  SpreadsheetApp.flush();
  return {
    success: true,
    message: 'Migration complete! Created ' + createdInits + ' initiatives with ' + createdTasks + ' tasks from the Master Missing Components Log.'
  };
}

/**
 * Selective migration: migrates specific rows by their old IDs from the Master Log.
 * All specified rows are grouped into a SINGLE Initiative with Tasks under it.
 *
 * @param {string[]} oldIds - Array of old IDs (e.g., ['MCI-0010','MCI-0011','MCI-0012','MCI-0013'])
 * @param {string} overrideName - Optional initiative name override (uses CSH Policy from first row if blank)
 * @returns {object} - { success, id, message } or { success: false, error }
 */
function migrateSelectedRows(oldIds, overrideName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_LOG);
  if (!masterSheet || masterSheet.getLastRow() <= 1) {
    return { success: false, error: 'Master Missing Components Log not found or empty.' };
  }

  var initSheet = ss.getSheetByName(SHEET_NAMES.INITIATIVES);
  var taskSheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  if (!initSheet || !taskSheet) {
    return { success: false, error: 'Run Setup first to create the Initiatives and Tasks sheets.' };
  }

  // Read all old data and filter to requested IDs
  var allItems = sheetToJson(SHEET_NAMES.MASTER_LOG);
  var idSet = {};
  oldIds.forEach(function(id) { idSet[String(id).trim()] = true; });

  var items = allItems.filter(function(item) {
    return idSet[String(item['ID'] || '').trim()];
  });

  if (!items.length) {
    return { success: false, error: 'No matching rows found for IDs: ' + oldIds.join(', ') };
  }

  var first = items[0];
  var policyName = overrideName || String(first['CSH Policy'] || 'Unnamed Policy').trim();

  // Collect unique modules
  var modules = [];
  items.forEach(function(item) {
    var m = String(item['Module'] || '').trim();
    if (m && modules.indexOf(m) < 0) modules.push(m);
  });

  // Priority: use highest priority from the group
  var priorityRank = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  var bestPriority = 'Medium';
  var bestRank = 0;
  items.forEach(function(item) {
    var p = String(item['Priority'] || '').trim();
    if ((priorityRank[p] || 0) > bestRank) {
      bestRank = priorityRank[p] || 0;
      bestPriority = p;
    }
  });

  // Derive initiative status from task statuses
  var statuses = items.map(function(i) { return String(i['Status'] || '').trim(); });
  var initStatus = 'Not Started';
  if (statuses.indexOf('Build In Progress') >= 0) initStatus = 'In Progress';
  else if (statuses.indexOf('Build Analyst Assigned') >= 0 || statuses.indexOf('Analyst Assigned') >= 0) initStatus = 'In Progress';
  else if (statuses.indexOf('Identified') >= 0) initStatus = 'Not Started';
  else {
    var allClosed = statuses.every(function(s) {
      return s === 'Closed - Completed' || s === 'Closed - Deferred' || s === 'Dismissed' || !s;
    });
    if (allClosed) {
      if (statuses.indexOf('Closed - Completed') >= 0) initStatus = 'Completed';
      else if (statuses.indexOf('Closed - Deferred') >= 0) initStatus = 'Deferred';
      else initStatus = 'Dismissed';
    }
  }

  var now = new Date().toISOString();

  // ---- Create Initiative ----
  var initId = getNextId('nextInitiativeId');
  var initData = {
    id:                  initId,
    name:                policyName,
    description:         '',
    type:                '',
    priority:            bestPriority,
    primarySCI:          String(first['Primary SCI'] || '').trim(),
    secondarySCI:        '',
    applications:        modules.join(','),
    venues:              '',
    rolesImpacted:       '',
    specialtyServiceLine: '',
    systemSponsor:       '',
    goLiveWave:          '',
    policyLink:          '',
    ehrRequirementsLink: '',
    status:              initStatus,
    createdDate:         now,
    updatedDate:         now
  };
  initSheet.appendRow(buildRowFromHeaders(initSheet, initData));

  // ---- Create Tasks ----
  // Known mapped fields — anything else gets appended to task description
  var knownFields = ['ID', 'CSH Policy', 'Module', 'Priority', 'Primary Analyst', 'Primary SCI', 'Status', '_row'];

  items.forEach(function(item) {
    var taskId = getNextId('nextTaskId');
    var module = String(item['Module'] || '').trim();
    var oldId = String(item['ID'] || '').trim();

    // Build task description from module + old ID + any unmapped columns
    var descParts = [];
    if (module) descParts.push(module);
    else descParts.push(policyName);

    // Capture unmapped column data so nothing is lost
    var extras = [];
    Object.keys(item).forEach(function(key) {
      if (knownFields.indexOf(key) >= 0) return;
      var val = item[key];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        extras.push(key + ': ' + String(val).trim());
      }
    });
    if (extras.length) descParts.push('(' + extras.join(' | ') + ')');
    if (oldId) descParts.push('[Legacy: ' + oldId + ']');

    // Map task status
    var taskStatus = String(item['Status'] || '').trim();
    if (TASK_STATUSES.indexOf(taskStatus) < 0) taskStatus = 'Identified';

    var taskData = {
      id:                  taskId,
      initiativeId:        initId,
      description:         descParts.join(' — '),
      module:              module,
      priority:            String(item['Priority'] || 'Medium').trim(),
      primaryAnalyst:      String(item['Primary Analyst'] || '').trim(),
      additionalAnalysts:  '',
      status:              taskStatus,
      educationRequired:   '',
      buildReviewComplete: '',
      buildReviewDate:     '',
      resolutionDate:      '',
      createdDate:         now
    };
    taskSheet.appendRow(buildRowFromHeaders(taskSheet, taskData));
  });

  SpreadsheetApp.flush();
  return {
    success: true,
    id: initId,
    message: 'Created initiative "' + policyName + '" (' + initId + ') with ' + items.length + ' tasks.'
  };
}

// ============================================================
// LEGACY onEdit TRIGGER (preserve for Master Log auto-archive)
// ============================================================

function onEdit(e) {
  if (!e || !e.source) return;
  var masterLogSheetName = 'Master Missing Components Log';
  var archiveSheetName = 'Archived Components';
  var statusColIndex = 8;
  var analystColIndex = 6;

  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== masterLogSheetName) return;

  var editedRow = e.range.getRow();
  var editedCol = e.range.getColumn();
  var newValue = e.value;

  if (editedCol === statusColIndex && editedRow > 1) {
    if (newValue === 'Closed - Completed' || newValue === 'Closed - Deferred') {
      var rowData = sheet.getRange(editedRow, 1, 1, sheet.getLastColumn()).getValues();
      var archiveSheet = e.source.getSheetByName(archiveSheetName);
      archiveSheet.appendRow(rowData[0]);
      var archivedRow = archiveSheet.getLastRow();
      archiveSheet.getRange(archivedRow, analystColIndex, 1, 1).setValue('');
      sheet.deleteRow(editedRow);
    }
  }
}

// ============================================================
// UTILITY: Pull analyst names from Analyst Dashboard tab
// Run from Apps Script editor: Run > listAnalystsFromDashboard
// Check Execution Log for the sorted name list.
// ============================================================
function listAnalystsFromDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.ANALYST_DASHBOARD);
  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('Analyst Dashboard sheet not found or empty.');
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  // Look for analyst-related columns
  var analystCols = [];
  headers.forEach(function(h, idx) {
    var lower = h.toLowerCase();
    if (lower.indexOf('analyst') >= 0 || lower.indexOf('name') >= 0 || lower === 'primary analyst') {
      analystCols.push(idx);
    }
  });

  // Fall back to column A if no analyst columns found
  if (!analystCols.length) analystCols = [0];

  var nameSet = {};
  for (var r = 1; r < data.length; r++) {
    analystCols.forEach(function(col) {
      var val = String(data[r][col] || '').trim();
      if (val) nameSet[val] = true;
    });
  }

  var names = Object.keys(nameSet).sort();
  Logger.log('=== Analysts from Dashboard (' + names.length + ') ===');
  Logger.log('Copy this into SEED_ANALYSTS in Code.gs:');
  names.forEach(function(n) { Logger.log("  '" + n + "',"); });
  return names;
}
