-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS task_update_trigger ON tasks;
DROP TRIGGER IF EXISTS task_insert_trigger ON tasks;
DROP TRIGGER IF EXISTS screen_update_trigger ON screens;
DROP FUNCTION IF EXISTS log_task_change();
DROP FUNCTION IF EXISTS log_screen_change();

-- Simpler function to log task changes (bypasses RLS)
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_history (task_id, title, description, status, edited_by, edited_at)
  VALUES (NEW.id, NEW.title, NEW.description, NEW.status, NEW.created_by, NOW());
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the update
  RAISE WARNING 'Failed to log task change: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simpler function to log screen changes (bypasses RLS)
CREATE OR REPLACE FUNCTION log_screen_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO screen_history (screen_id, title, description, edited_by, edited_at)
  VALUES (NEW.id, NEW.title, NEW.description, NEW.created_by, NOW());
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the update
  RAISE WARNING 'Failed to log screen change: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers - fire on ANY update (not just specific fields)
CREATE TRIGGER task_update_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_change();

CREATE TRIGGER task_insert_trigger
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_change();

CREATE TRIGGER screen_update_trigger
  AFTER UPDATE ON screens
  FOR EACH ROW
  EXECUTE FUNCTION log_screen_change();

-- Grant necessary permissions
GRANT INSERT ON task_history TO authenticated;
GRANT INSERT ON screen_history TO authenticated;
