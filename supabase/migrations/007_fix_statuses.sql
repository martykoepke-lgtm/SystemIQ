-- Fix initiative and task statuses to match PRCC spreadsheet data exactly
-- The seed data may have used simplified statuses

-- EG Initiative status fixes (from PRCC Initiatives tab)
UPDATE initiatives SET status = 'In Progress' WHERE display_id = 'EG-0002';
UPDATE initiatives SET status = 'Ready for Discussion' WHERE display_id = 'EG-0003';
UPDATE initiatives SET status = 'Under Review' WHERE display_id = 'EG-0004';
UPDATE initiatives SET status = 'Under Review' WHERE display_id = 'EG-0006';
UPDATE initiatives SET status = 'Under Review' WHERE display_id = 'EG-0007';
UPDATE initiatives SET status = 'In Progress' WHERE display_id = 'EG-0008';
UPDATE initiatives SET status = 'Under Review' WHERE display_id = 'EG-0009';
UPDATE initiatives SET status = 'In Progress' WHERE display_id = 'EG-0010';
UPDATE initiatives SET status = 'Ready for Discussion' WHERE display_id = 'EG-0011';
UPDATE initiatives SET status = 'Under Review' WHERE display_id = 'EG-0012';
UPDATE initiatives SET status = 'Not Started' WHERE display_id = 'EG-0013';
UPDATE initiatives SET status = 'Ready for Discussion' WHERE display_id = 'EG-0015';
UPDATE initiatives SET status = 'Completed' WHERE display_id = 'EG-0016';
UPDATE initiatives SET status = 'In Progress' WHERE display_id = 'EG-0017';
UPDATE initiatives SET status = 'In Progress' WHERE display_id = 'EG-0018';
UPDATE initiatives SET status = 'Ready for Discussion' WHERE display_id = 'EG-0019';
UPDATE initiatives SET status = 'Ready for Discussion' WHERE display_id = 'EG-0020';
UPDATE initiatives SET status = 'Ready for Discussion' WHERE display_id = 'EG-0022';
UPDATE initiatives SET status = 'Under Review' WHERE display_id = 'EG-0023';
UPDATE initiatives SET status = 'Under Review' WHERE display_id = 'EG-0024';
UPDATE initiatives SET status = 'In Progress' WHERE display_id = 'EG-0025';
UPDATE initiatives SET status = 'Ready for Discussion' WHERE display_id = 'EG-0026';
UPDATE initiatives SET status = 'In Progress' WHERE display_id = 'EG-0027';

-- Task status fixes (from PRCC Tasks tab — exact statuses)
UPDATE tasks SET status = 'Build In Progress' WHERE display_id = 'TSK-0005';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0006';
UPDATE tasks SET status = 'Analyst Assigned' WHERE display_id = 'TSK-0007';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0009';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0010';
UPDATE tasks SET status = 'Analyst Assigned' WHERE display_id = 'TSK-0012';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0013';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0015';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0016';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0017';
UPDATE tasks SET status = 'Build Analyst Assigned' WHERE display_id = 'TSK-0018';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0019';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0021';
UPDATE tasks SET status = 'Closed - Completed', resolution_date = '2026-03-12' WHERE display_id = 'TSK-0022';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0023';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0024';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0025';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0026';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0027';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0028';
UPDATE tasks SET status = 'Build Analyst Assigned' WHERE display_id = 'TSK-0029';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0030';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0031';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0032';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0033';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0034';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0035';
UPDATE tasks SET status = 'Build Analyst Assigned' WHERE display_id = 'TSK-0036';
UPDATE tasks SET status = 'Dismissed' WHERE display_id = 'TSK-0037';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0038';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0039';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0040';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0041';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0042';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0043';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0044';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0045';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0046';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0047';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0048';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0049';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0050';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0051';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0053';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0054';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0055';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0056';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0058';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0060';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0061';
UPDATE tasks SET status = 'Identified' WHERE display_id = 'TSK-0062';
UPDATE tasks SET status = 'Build In Progress' WHERE display_id = 'TSK-0063';

-- EG-0016 ICU Liberation is Completed — should appear in Archived
-- Already set above. Verify:
-- SELECT display_id, name, status FROM initiatives WHERE display_id = 'EG-0016';
