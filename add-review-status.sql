-- Add 'review' status to tasks table
-- The status column uses a CHECK constraint, not an ENUM type

-- Drop the existing check constraint and recreate it with 'review' status
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('not_started', 'in_progress', 'waiting', 'review', 'done'));

-- Ensure email_history has proper structure for storing task snapshots
-- The changes_snapshot column should already be JSONB, but let's make sure
DO $$
BEGIN
    -- Check if changes_snapshot exists and is JSONB
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'email_history'
        AND column_name = 'changes_snapshot'
        AND data_type = 'jsonb'
    ) THEN
        -- If it's JSON, alter to JSONB for better performance
        ALTER TABLE email_history
        ALTER COLUMN changes_snapshot TYPE jsonb USING changes_snapshot::jsonb;
    END IF;
END $$;

-- Optional: Add an index on email_history for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_history_project_sent_at
ON email_history(project_id, sent_at DESC);

-- Optional: Add an index on task_history for status changes
CREATE INDEX IF NOT EXISTS idx_task_history_status_edited_at
ON task_history(task_id, status, edited_at DESC);

-- Verify the constraint was added successfully
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'tasks'::regclass
AND conname = 'tasks_status_check';
