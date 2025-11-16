-- Add priority column to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS priority VARCHAR(10);

-- Add comment
COMMENT ON COLUMN public.tasks.priority IS 'Priority level for task: red (high), yellow (medium), or null (none)';

-- Add constraint to ensure only valid values
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('red', 'yellow') OR priority IS NULL);
