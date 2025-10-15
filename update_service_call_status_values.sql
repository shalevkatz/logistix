-- Update service_calls status to only allow 3 values: open, completed, cannot_complete
-- Run this in Supabase SQL Editor

-- Step 1: First, update any existing 'in_progress' or 'cancelled' records to 'open'
UPDATE service_calls
SET status = 'open'
WHERE status IN ('in_progress', 'cancelled');

-- Step 2: Update the check constraint to only allow the 3 new statuses
-- First, drop the existing constraint if it exists
ALTER TABLE service_calls
DROP CONSTRAINT IF EXISTS service_calls_status_check;

-- Add new constraint with only 3 allowed values
ALTER TABLE service_calls
ADD CONSTRAINT service_calls_status_check
CHECK (status IN ('open', 'completed', 'cannot_complete'));

-- Step 3: Verify the changes
SELECT
  status,
  COUNT(*) as count
FROM service_calls
GROUP BY status
ORDER BY status;

-- You should now only see 'open', 'completed', and/or 'cannot_complete' in the results
