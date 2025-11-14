-- Create screen_history table to track changes to screens
CREATE TABLE IF NOT EXISTS screen_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_history table to track changes to tasks
CREATE TABLE IF NOT EXISTS task_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE screen_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for screen_history
CREATE POLICY "Users can view screen history for their projects"
ON screen_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM screens s
    JOIN projects p ON s.project_id = p.id
    WHERE s.id = screen_history.screen_id
    AND (p.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    ))
  )
);

CREATE POLICY "Users can insert screen history"
ON screen_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM screens s
    JOIN projects p ON s.project_id = p.id
    WHERE s.id = screen_history.screen_id
    AND (p.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    ))
  )
);

-- RLS Policies for task_history
CREATE POLICY "Users can view task history for their projects"
ON task_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN screens s ON t.screen_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE t.id = task_history.task_id
    AND (p.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    ))
  )
);

CREATE POLICY "Users can insert task history"
ON task_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN screens s ON t.screen_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE t.id = task_history.task_id
    AND (p.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    ))
  )
);

-- Create indexes for better performance
CREATE INDEX idx_screen_history_screen_id ON screen_history(screen_id);
CREATE INDEX idx_screen_history_edited_at ON screen_history(edited_at DESC);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_edited_at ON task_history(edited_at DESC);
