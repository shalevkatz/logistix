-- Add columns for service call completion tracking

-- Add a column to store which employee completed the service call
ALTER TABLE service_calls
ADD COLUMN IF NOT EXISTS completed_by_employee_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add a column to store the reason if the service call cannot be completed
ALTER TABLE service_calls
ADD COLUMN IF NOT EXISTS cannot_complete_reason text;

-- Add a column to store when the employee marked it as cannot complete
ALTER TABLE service_calls
ADD COLUMN IF NOT EXISTS cannot_complete_at timestamptz;

-- Add comments for documentation
COMMENT ON COLUMN service_calls.completed_by_employee_id IS 'ID of the employee who marked the service call as completed';
COMMENT ON COLUMN service_calls.cannot_complete_reason IS 'Reason provided by employee when they cannot complete the service call (e.g., missing part, need special tool)';
COMMENT ON COLUMN service_calls.cannot_complete_at IS 'Timestamp when the employee marked the service call as cannot complete';
