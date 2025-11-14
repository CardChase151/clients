-- Delete all screens and tasks for a specific project
-- This keeps the project but removes all screens/tasks so you can re-upload

-- First, find your project ID by running:
-- SELECT id, name FROM projects WHERE name LIKE '%meditation%';

-- Then replace 'YOUR_PROJECT_ID' below with the actual project ID

-- Delete all tasks for screens in this project
DELETE FROM tasks
WHERE screen_id IN (
  SELECT id FROM screens WHERE project_id = 'YOUR_PROJECT_ID'
);

-- Delete all screens for this project
DELETE FROM screens
WHERE project_id = 'YOUR_PROJECT_ID';

-- Verify it's empty:
-- SELECT * FROM screens WHERE project_id = 'YOUR_PROJECT_ID';
-- SELECT * FROM tasks WHERE screen_id IN (SELECT id FROM screens WHERE project_id = 'YOUR_PROJECT_ID');
