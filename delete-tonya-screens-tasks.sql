-- Delete all screens and tasks for "Just be a good human - Meditation App"
-- Project ID: 42fecd3e-5f31-42af-9309-153a93e5f9a8

-- Delete all tasks for screens in this project
DELETE FROM tasks
WHERE screen_id IN (
  SELECT id FROM screens WHERE project_id = '42fecd3e-5f31-42af-9309-153a93e5f9a8'
);

-- Delete all screens for this project
DELETE FROM screens
WHERE project_id = '42fecd3e-5f31-42af-9309-153a93e5f9a8';

-- Verify it's empty (should return 0 rows):
SELECT COUNT(*) as screens_remaining FROM screens WHERE project_id = '42fecd3e-5f31-42af-9309-153a93e5f9a8';
