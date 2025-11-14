-- Add priority column to screens table
ALTER TABLE public.screens
ADD COLUMN IF NOT EXISTS priority VARCHAR(10);

-- Add comment to explain this column
COMMENT ON COLUMN public.screens.priority IS 'Priority level for screen: red (high), yellow (medium), or null (none)';

-- Optional: Add check constraint to ensure only valid values
ALTER TABLE public.screens
ADD CONSTRAINT screens_priority_check CHECK (priority IN ('red', 'yellow') OR priority IS NULL);
