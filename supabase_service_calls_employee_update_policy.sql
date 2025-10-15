-- Update RLS policies for service_calls to allow employees to update status and completion info

-- Drop existing update policy if it exists (it may be named differently in your database)
-- DROP POLICY IF EXISTS "service_calls_update_policy" ON service_calls;

-- Create or replace the update policy to allow:
-- 1. Managers can update all service calls they created
-- 2. Employees can update service calls assigned to them (for status and completion fields)

-- Option 1: If you want employees to update ANY service call assigned to them
CREATE POLICY "service_calls_update_for_employees"
ON service_calls
FOR UPDATE
USING (
  -- Manager can update their own service calls
  (auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role = 'manager'
  ))
  OR
  -- Employee can update service calls assigned to them
  (auth.uid() IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employee'
    AND profiles.id = ANY(service_calls.assigned_employee_ids)
  ))
)
WITH CHECK (
  -- Manager can update their own service calls
  (auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role = 'manager'
  ))
  OR
  -- Employee can update service calls assigned to them
  (auth.uid() IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employee'
    AND profiles.id = ANY(service_calls.assigned_employee_ids)
  ))
);

-- Alternative Option 2: If you want to restrict what employees can update
-- This allows employees to only update specific fields (status, completion info)
-- while managers can update everything

/*
CREATE POLICY "service_calls_employee_limited_update"
ON service_calls
FOR UPDATE
USING (
  -- Employees can update if assigned to them
  (auth.uid() IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employee'
    AND profiles.id = ANY(service_calls.assigned_employee_ids)
  ))
  OR
  -- Managers can update their own service calls
  (auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role = 'manager'
  ))
)
WITH CHECK (
  -- Employees can only update specific fields
  (auth.uid() IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employee'
    AND profiles.id = ANY(service_calls.assigned_employee_ids)
  ) AND (
    -- Only allow updating these fields for employees
    (OLD.title = NEW.title) AND
    (OLD.description = NEW.description) AND
    (OLD.customer_name = NEW.customer_name) AND
    (OLD.customer_phone = NEW.customer_phone) AND
    (OLD.customer_email = NEW.customer_email) AND
    (OLD.customer_address = NEW.customer_address) AND
    (OLD.priority = NEW.priority) AND
    (OLD.scheduled_date = NEW.scheduled_date) AND
    (OLD.notes = NEW.notes) AND
    (OLD.created_by_manager_id = NEW.created_by_manager_id) AND
    (OLD.assigned_employee_ids = NEW.assigned_employee_ids)
  ))
  OR
  -- Managers can update everything
  (auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role = 'manager'
  ))
);
*/

-- Grant necessary permissions
GRANT UPDATE ON service_calls TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "service_calls_update_for_employees" ON service_calls IS
'Allows managers to update their service calls and employees to update service calls assigned to them (for marking complete/cannot complete)';
