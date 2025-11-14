-- Fix RLS policies to allow admins to view all users' data

-- Update projects policies
DROP POLICY IF EXISTS "Allow authenticated read on projects" ON projects;
CREATE POLICY "Allow authenticated read on projects"
ON projects FOR SELECT
TO authenticated
USING (
  -- Users can see their own projects
  created_by = auth.uid()
  OR
  -- Admins can see all projects
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Update screens policies
DROP POLICY IF EXISTS "Allow authenticated read on screens" ON screens;
CREATE POLICY "Allow authenticated read on screens"
ON screens FOR SELECT
TO authenticated
USING (
  -- Users can see screens in their projects
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = screens.project_id
    AND projects.created_by = auth.uid()
  )
  OR
  -- Admins can see all screens
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Update tasks policies
DROP POLICY IF EXISTS "Allow authenticated read on tasks" ON tasks;
CREATE POLICY "Allow authenticated read on tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  -- Users can see tasks in their screens
  EXISTS (
    SELECT 1 FROM screens
    JOIN projects ON projects.id = screens.project_id
    WHERE screens.id = tasks.screen_id
    AND projects.created_by = auth.uid()
  )
  OR
  -- Admins can see all tasks
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
