function buildDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dash = ss.getSheetByName('Dashboard');
  if (!dash) { dash = ss.insertSheet('Dashboard'); }
  dash.clear();
  // Set column widths
  dash.setColumnWidth(1, 200);
  dash.setColumnWidth(2, 80);
  dash.setColumnWidth(3, 80);
  dash.setColumnWidth(4, 20);
  dash.setColumnWidth(5, 200);
  dash.setColumnWidth(6, 80);
  dash.setColumnWidth(7, 80);
  dash.setColumnWidth(8, 20);
  dash.setColumnWidth(9, 220);
  dash.setColumnWidth(10, 80);
  dash.setColumnWidth(11, 80);
  var data = [];
  // Row 1: Title
  data.push(['EPIC GOLD INITIATIVES DASHBOARD','','','','','','','','','','']);
  // Row 2: Date
  data.push(['=CONCATENATE("Updated: ",TEXT(TODAY(),"MMM DD, YYYY"))','','','','','','','','','','']);
  // Row 3: blank
  data.push(['','','','','','','','','','','']);

  // ----------------------------------------------------------------
  // COLUMN MAP (after specialtyServiceLine was added after rolesImpacted):
  //   A:id  B:name  C:description  D:type  E:priority
  //   F:primarySCI  G:secondarySCI  H:applications  I:venues
  //   J:rolesImpacted  K:specialtyServiceLine  L:systemSponsor
  //   M:goLiveWave  N:policyLink  O:ehrRequirementsLink
  //   P:status  Q:createdDate  R:updatedDate
  //
  // Tasks columns (unchanged):
  //   A:id  B:initiativeId  C:description  D:module  E:priority
  //   F:primaryAnalyst  G:additionalAnalysts  H:status
  //   I:educationRequired  J:buildReviewComplete  K:buildReviewDate
  //   L:resolutionDate  M:createdDate
  // ----------------------------------------------------------------

  // Row 4: KPI labels
  data.push(['Total Initiatives','Total Tasks','Tasks w/ Analyst','Tasks Unassigned','High Priority Init.','Init. Completed','','','','','']);
  // Row 5: KPI formulas
  data.push([
    '=COUNTA(Initiatives!A2:A)',
    '=COUNTA(Tasks!A2:A)',
    '=COUNTIF(Tasks!F2:F,"<>")',
    '=COUNTIFS(Tasks!A2:A,"<>",Tasks!F2:F,"")',
    '=COUNTIF(Initiatives!E2:E,"High")',
    '=COUNTIF(Initiatives!P2:P,"Completed")',
    '','','','','']);
  // Row 6: blank
  data.push(['','','','','','','','','','','']);

  // Row 7: Section headers
  data.push(['INITIATIVE STATUS','Count','%','','TASK STATUS','Count','%','','INITIATIVE TYPE','Count','%']);
  // Row 8-13: Status breakdowns
  data.push(['In Progress',      '=COUNTIF(Initiatives!P2:P,"In Progress")',      '=IF($A$5=0,0,B8/$A$5)', '','Identified',              '=COUNTIF(Tasks!H2:H,"Identified")',              '=IF($B$5=0,0,F8/$B$5)', '','Standard Practice','=COUNTIF(Initiatives!D2:D,"Standard Practice")','=IF($A$5=0,0,J8/$A$5)']);
  data.push(['Under Review',     '=COUNTIF(Initiatives!P2:P,"Under Review")',     '=IF($A$5=0,0,B9/$A$5)', '','Analyst Assigned',         '=COUNTIF(Tasks!H2:H,"Build Analyst Assigned")',  '=IF($B$5=0,0,F9/$B$5)', '','Policy',           '=COUNTIF(Initiatives!D2:D,"Policy")',           '=IF($A$5=0,0,J9/$A$5)']);
  data.push(['Ready for Discussion','=COUNTIF(Initiatives!P2:P,"Ready for Discussion")','=IF($A$5=0,0,B10/$A$5)','','Build In Progress',  '=COUNTIF(Tasks!H2:H,"Build In Progress")',       '=IF($B$5=0,0,F10/$B$5)','','Guideline',        '=COUNTIF(Initiatives!D2:D,"Guideline")',        '=IF($A$5=0,0,J10/$A$5)']);
  data.push(['Not Started',      '=COUNTIF(Initiatives!P2:P,"Not Started")',      '=IF($A$5=0,0,B11/$A$5)','','Build Analyst Assigned',   '=COUNTIF(Tasks!H2:H,"Build Analyst Assigned")',  '=IF($B$5=0,0,F11/$B$5)','','Board Goal',       '=COUNTIF(Initiatives!D2:D,"Board Goal")',       '=IF($A$5=0,0,J11/$A$5)']);
  data.push(['Completed',        '=COUNTIF(Initiatives!P2:P,"Completed")',        '=IF($A$5=0,0,B12/$A$5)','','Closed - Completed',       '=COUNTIF(Tasks!H2:H,"Closed - Completed")',      '=IF($B$5=0,0,F12/$B$5)','','','','']);
  data.push(['',                  '',                                              '',                      '','Dismissed',                '=COUNTIF(Tasks!H2:H,"Dismissed")',               '=IF($B$5=0,0,F13/$B$5)','','','','']);

  // Row 14: blank
  data.push(['','','','','','','','','','','']);

  // Row 15: Section headers
  data.push(['INITIATIVE PRIORITY','Count','%','','GO-LIVE WAVE','Count','%','','BUILD REVIEW STATUS','Count','%']);
  // Row 16-19
  data.push(['High',   '=COUNTIF(Initiatives!E2:E,"High")',   '=IF($A$5=0,0,B16/$A$5)','','Wave 3',              '=COUNTIF(Initiatives!M2:M,"Wave 3")',              '=IF($A$5=0,0,F16/$A$5)','','In Progress',                   '=COUNTIF(Tasks!J2:J,"In Progress")',                   '=IF($B$5=0,0,J16/$B$5)']);
  data.push(['Medium', '=COUNTIF(Initiatives!E2:E,"Medium")', '=IF($A$5=0,0,B17/$A$5)','','New Beginnings South', '=COUNTIF(Initiatives!M2:M,"New Beginnings South")', '=IF($A$5=0,0,F17/$A$5)','','Yes - Build can be complete',   '=COUNTIF(Tasks!J2:J,"Yes - Build can be complete")',   '=IF($B$5=0,0,J17/$B$5)']);
  data.push(['Low',    '=COUNTIF(Initiatives!E2:E,"Low")',    '=IF($A$5=0,0,B18/$A$5)','','',                      '',                                                  '',                      '','No - Did not meet',             '=COUNTIF(Tasks!J2:J,"No - Did not meet with analyst")','=IF($B$5=0,0,J18/$B$5)']);
  data.push(['',       '',                                     '',                      '','',                      '',                                                  '',                      '','(blank)',                       '=COUNTIF(Tasks!J2:J,"")',                              '=IF($B$5=0,0,J19/$B$5)']);

  // Row 20: blank
  data.push(['','','','','','','','','','','']);

  // Row 21: Section headers
  data.push(['ANALYST WORKLOAD (Tasks)','Tasks','% of Total','','MODULE BREAKDOWN (Tasks)','Tasks','% of Total','','EDUCATION REQUIRED','Count','% of Total']);
  // Analysts + Modules + Education
  data.push(['Alex Cordell',     '=COUNTIF(Tasks!F2:F,"Alex Cordell")',     '=IF($B$5=0,0,B22/$B$5)','','ClinDoc',      '=COUNTIF(Tasks!D2:D,"ClinDoc")',      '=IF($B$5=0,0,F22/$B$5)','','Yes','=COUNTIF(Tasks!I2:I,"Yes")','=IF($B$5=0,0,J22/$B$5)']);
  data.push(['Michelle Ryan',    '=COUNTIF(Tasks!F2:F,"Michelle Ryan")',    '=IF($B$5=0,0,B23/$B$5)','','OPA',          '=COUNTIF(Tasks!D2:D,"OPA")',          '=IF($B$5=0,0,F23/$B$5)','','No', '=COUNTIF(Tasks!I2:I,"No")', '=IF($B$5=0,0,J23/$B$5)']);
  data.push(['Christi Allen',    '=COUNTIF(Tasks!F2:F,"Christi Allen")',    '=IF($B$5=0,0,B24/$B$5)','','ASAP',         '=COUNTIF(Tasks!D2:D,"ASAP")',         '=IF($B$5=0,0,F24/$B$5)','','','','']);
  data.push(['Megan Rutt',       '=COUNTIF(Tasks!F2:F,"Megan Rutt")',      '=IF($B$5=0,0,B25/$B$5)','','Stork',        '=COUNTIF(Tasks!D2:D,"Stork")',        '=IF($B$5=0,0,F25/$B$5)','','','','']);
  data.push(['Corrinne Welch',   '=COUNTIF(Tasks!F2:F,"Corrinne Welch")',  '=IF($B$5=0,0,B26/$B$5)','','Orders',       '=COUNTIF(Tasks!D2:D,"Orders")',       '=IF($B$5=0,0,F26/$B$5)','','','','']);
  data.push(['Sara Garcia',      '=COUNTIF(Tasks!F2:F,"Sara Garcia")',     '=IF($B$5=0,0,B27/$B$5)','','Grand Central', '=COUNTIF(Tasks!D2:D,"Grand Central")','=IF($B$5=0,0,F27/$B$5)','','','','']);
  data.push(['Adam Henderson',   '=COUNTIF(Tasks!F2:F,"Adam Henderson")',  '=IF($B$5=0,0,B28/$B$5)','','Bugsy',        '=COUNTIF(Tasks!D2:D,"Bugsy")',        '=IF($B$5=0,0,F28/$B$5)','','','','']);
  data.push(['Jennifer Brennan', '=COUNTIF(Tasks!F2:F,"Jennifer Brennan")','=IF($B$5=0,0,B29/$B$5)','','(blank/TBD)',   '=COUNTIF(Tasks!D2:D,"")',             '=IF($B$5=0,0,F29/$B$5)','','','','']);
  data.push(['Jared Boynton',    '=COUNTIF(Tasks!F2:F,"Jared Boynton")',   '=IF($B$5=0,0,B30/$B$5)','','','','','','','','']);
  data.push(['Desiree Upton',    '=COUNTIF(Tasks!F2:F,"Desiree Upton")',   '=IF($B$5=0,0,B31/$B$5)','','','','','','','','']);
  data.push(['(Unassigned)',     '=COUNTIFS(Tasks!A2:A,"<>",Tasks!F2:F,"")','=IF($B$5=0,0,B32/$B$5)','','','','','','','','']);

  // Row 33: blank
  data.push(['','','','','','','','','','','']);

  // Row 34: Section headers
  data.push(['VENUE ANALYSIS (Initiatives)','Count','%','','SCI LEAD WORKLOAD (Init.)','Count','%','','','','']);
  // Venues + SCIs
  data.push(['Acute Inpatient', '=COUNTIF(Initiatives!I2:I,"*Acute Inpatient*")', '=IF($A$5=0,0,B35/$A$5)','','Brooke Searl',     '=COUNTIF(Initiatives!F2:F,"Brooke Searl")',     '=IF($A$5=0,0,F35/$A$5)','','','','']);
  data.push(['ED',              '=COUNTIF(Initiatives!I2:I,"*ED*")',              '=IF($A$5=0,0,B36/$A$5)','','Marty Koepke',      '=COUNTIF(Initiatives!F2:F,"Marty Koepke")',     '=IF($A$5=0,0,F36/$A$5)','','','','']);
  data.push(['Ambulatory',      '=COUNTIF(Initiatives!I2:I,"*Ambulatory*")',      '=IF($A$5=0,0,B37/$A$5)','','Jason Mihos',       '=COUNTIF(Initiatives!F2:F,"Jason Mihos")',      '=IF($A$5=0,0,F37/$A$5)','','','','']);
  data.push(['Periop',          '=COUNTIF(Initiatives!I2:I,"*Periop*")',          '=IF($A$5=0,0,B38/$A$5)','','Marisa Radick',     '=COUNTIF(Initiatives!F2:F,"Marisa Radick")',    '=IF($A$5=0,0,F38/$A$5)','','','','']);
  data.push(['Outpatient Surgery','=COUNTIF(Initiatives!I2:I,"*Outpatient Surgery*")','=IF($A$5=0,0,B39/$A$5)','','Melissa Plummer',   '=COUNTIF(Initiatives!F2:F,"Melissa Plummer")',  '=IF($A$5=0,0,F39/$A$5)','','','','']);
  data.push(['Acute Outpatient', '=COUNTIF(Initiatives!I2:I,"*Acute Outpatient*")','=IF($A$5=0,0,B40/$A$5)','','Sherry Brennaman',  '=COUNTIF(Initiatives!F2:F,"Sherry Brennaman")', '=IF($A$5=0,0,F40/$A$5)','','','','']);
  data.push(['',                      '',                                             '',                     '','Trudy Finch',        '=COUNTIF(Initiatives!F2:F,"Trudy Finch")',      '=IF($A$5=0,0,F41/$A$5)','','','','']);
  data.push(['',                      '',                                             '',                     '','Dawn Jacobson',      '=COUNTIF(Initiatives!F2:F,"Dawn Jacobson")',    '=IF($A$5=0,0,F42/$A$5)','','','','']);

  // Row 43: blank
  data.push(['','','','','','','','','','','']);

  // Row 44: Section headers — ROLE & SPECIALTY BREAKDOWNS
  data.push(['ROLE BREAKDOWN (Initiatives)','Count','%','','SPECIALTY / SERVICE LINE (Initiatives)','Count','%','','','','']);

  // Roles (col J = rolesImpacted, multi-select so use wildcard)
  var roles = [
    'Provider', 'APP', 'Medical Resident', 'Medical Student',
    'Nursing', 'Nursing Student', 'Pharmacist',
    'Medical Assistant', 'Registration/Front Office',
    'Care Coordination', 'Social Work',
    'Lab', 'Imaging', 'Quality',
    'Infection Prevention', 'Critical Care'
  ];
  // Top specialties for the dashboard (curated subset — not all 50)
  var topSpecialties = [
    'Primary Care', 'Cardiology', 'Pulmonology',
    'Gastroenterology', 'Neurology', 'Emergency Medicine',
    'Oncology', 'General Surgery', 'Orthopedic Surgery',
    'OB/GYN', 'Pediatrics', 'Neonatal/NICU',
    'Behavioral Health', 'Psychiatry',
    'Physical Therapy', 'Occupational Therapy', 'Speech & Language',
    'Respiratory Therapy', 'Rehab Medicine',
    'Critical Care/ICU', 'Laboratory/Pathology', 'Radiology/Imaging',
    'Palliative Care'
  ];

  var maxRows = Math.max(roles.length, topSpecialties.length);
  var startRow = data.length + 1; // row number where role/specialty data starts

  for (var i = 0; i < maxRows; i++) {
    var roleCell = '', roleCntCell = '', rolePctCell = '';
    var specCell = '', specCntCell = '', specPctCell = '';

    if (i < roles.length) {
      roleCell = roles[i];
      roleCntCell = '=COUNTIF(Initiatives!J2:J,"*' + roles[i] + '*")';
      rolePctCell = '=IF($A$5=0,0,B' + (startRow + i) + '/$A$5)';
    }
    if (i < topSpecialties.length) {
      specCell = topSpecialties[i];
      specCntCell = '=COUNTIF(Initiatives!K2:K,"*' + topSpecialties[i] + '*")';
      specPctCell = '=IF($A$5=0,0,F' + (startRow + i) + '/$A$5)';
    }

    data.push([roleCell, roleCntCell, rolePctCell, '', specCell, specCntCell, specPctCell, '', '', '', '']);
  }

  // Write all data
  dash.getRange(1, 1, data.length, 11).setValues(data);

  // ================================================================
  // FORMATTING
  // ================================================================

  // Title row
  dash.getRange('A1').setFontSize(16).setFontWeight('bold');
  dash.getRange('A2').setFontSize(9).setFontColor('#666666');

  // KPI labels (row 4) and values (row 5)
  dash.getRange('A4:F4').setFontWeight('bold').setFontSize(8).setFontColor('#666666').setHorizontalAlignment('center');
  dash.getRange('A5:F5').setFontSize(20).setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('A5:F5').setBorder(true,true,true,true,false,false,'#cccccc',SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange('A5').setBackground('#e8f5e9'); // green
  dash.getRange('B5').setBackground('#e3f2fd'); // blue
  dash.getRange('C5').setBackground('#e8f5e9'); // green
  dash.getRange('D5').setBackground('#fff3e0'); // orange
  dash.getRange('E5').setBackground('#fce4ec'); // red
  dash.getRange('F5').setBackground('#f3e5f5'); // purple

  // Section headers
  var roleSpecHeaderRow = 44;
  var sectionRows = [7, 15, 21, 34, roleSpecHeaderRow];
  sectionRows.forEach(function(r) {
    dash.getRange(r, 1, 1, 11).setFontWeight('bold').setBackground('#1a237e').setFontColor('white').setFontSize(9);
  });

  // Percentage columns
  var roleSpecEndRow = roleSpecHeaderRow + Math.max(roles.length, topSpecialties.length);
  var pctCols = ['C8:C12','G8:G13','K8:K11','C16:C18','G16:G17','K16:K19','C22:C32','G22:G29','K22:K23','C35:C40','G35:G42',
    'C' + (roleSpecHeaderRow+1) + ':C' + roleSpecEndRow,
    'G' + (roleSpecHeaderRow+1) + ':G' + roleSpecEndRow
  ];
  pctCols.forEach(function(range) {
    dash.getRange(range).setNumberFormat('0%');
  });

  // Alternating row colors for data sections
  var dataRanges = [[8,12],[16,18],[22,32],[35,42],[roleSpecHeaderRow+1, roleSpecEndRow]];
  dataRanges.forEach(function(pair) {
    for (var r = pair[0]; r <= pair[1]; r++) {
      if ((r - pair[0]) % 2 === 1) {
        dash.getRange(r, 1, 1, 11).setBackground('#f5f5f5');
      }
    }
  });

  // Freeze row 1
  dash.setFrozenRows(1);
  SpreadsheetApp.flush();
  return 'Dashboard built successfully!';
}
