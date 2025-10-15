-- Add completion_note column to service_calls table
ALTER TABLE service_calls
ADD COLUMN IF NOT EXISTS completion_note TEXT;

-- Add comment to document the column
COMMENT ON COLUMN service_calls.completion_note IS 'Optional note from employee when completing the service call';
