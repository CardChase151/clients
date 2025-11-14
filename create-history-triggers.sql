-- Create triggers to automatically populate history tables when screens/tasks are updated

-- Function to log screen changes
CREATE OR REPLACE FUNCTION log_screen_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO screen_history (screen_id, title, description, edited_by, edited_at)
  VALUES (NEW.id, NEW.title, NEW.description, auth.uid(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log task changes
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_history (task_id, title, description, status, edited_by, edited_at)
  VALUES (NEW.id, NEW.title, NEW.description, NEW.status, auth.uid(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for screen updates
DROP TRIGGER IF EXISTS screen_update_trigger ON screens;
CREATE TRIGGER screen_update_trigger
  AFTER UPDATE ON screens
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title OR
        OLD.description IS DISTINCT FROM NEW.description)
  EXECUTE FUNCTION log_screen_change();

-- Trigger for task updates (especially status changes)
DROP TRIGGER IF EXISTS task_update_trigger ON tasks;
CREATE TRIGGER task_update_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR
        OLD.title IS DISTINCT FROM NEW.title OR
        OLD.description IS DISTINCT FROM NEW.description)
  EXECUTE FUNCTION log_task_change();

-- Also log when tasks are first created (to track new tasks)
DROP TRIGGER IF EXISTS task_insert_trigger ON tasks;
CREATE TRIGGER task_insert_trigger
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_change();
