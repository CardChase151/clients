-- Add 'review' status to tasks table
-- This migration adds the 'review' status option to the task status enum

-- First, check if we need to alter the enum type (if it exists)
-- If your tasks.status column uses an enum, we need to add 'review' to it

-- Option 1: If using PostgreSQL ENUM type (most likely for Supabase)
-- Add 'review' to the status enum if it doesn't exist
DO $$
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'review'
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'task_status'
        )
    ) THEN
        -- Add 'review' to the enum
        ALTER TYPE task_status ADD VALUE 'review';
    END IF;
END $$;

-- Option 2: If status is just a text/varchar column with check constraint
-- (Run this if Option 1 doesn't work - means you're not using enum)
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
--   CHECK (status IN ('not_started', 'in_progress', 'waiting', 'review', 'done'));

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

-- Verify the changes
SELECT
    enumlabel as available_statuses
FROM pg_enum
WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'task_status'
)
ORDER BY enumsortorder;
