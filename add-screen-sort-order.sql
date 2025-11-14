-- Add sort_order column to screens table
ALTER TABLE screens ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Set initial sort_order based on created_at (oldest = 1, newest = higher numbers)
WITH ordered_screens AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) as new_order
  FROM screens
)
UPDATE screens
SET sort_order = ordered_screens.new_order
FROM ordered_screens
WHERE screens.id = ordered_screens.id
AND screens.sort_order IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_screens_sort_order ON screens(project_id, sort_order);
