-- Add status column to tasks table
ALTER TABLE tasks
ADD COLUMN status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'waiting', 'done'));

-- Update existing tasks to have 'not_started' status
UPDATE tasks
SET status = 'not_started'
WHERE status IS NULL;

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

-- Comment describing the status values
COMMENT ON COLUMN tasks.status IS 'Task status: not_started, in_progress, waiting, done';
