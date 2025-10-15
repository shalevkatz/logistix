-- Restricted update policy for employees - Only allow updating specific fields
-- This uses a trigger function to enforce field-level restrictions

-- Step 1: Create the trigger function that validates employee updates
CREATE OR REPLACE FUNCTION validate_employee_service_call_update()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  -- If user is a manager, allow all updates
  IF user_role = 'manager' THEN
    RETURN NEW;
  END IF;

  -- If user is an employee, check which fields changed
  IF user_role = 'employee' THEN
    -- Check if user is assigned to this service call
    IF NOT (auth.uid() = ANY(OLD.assigned_employee_ids)) THEN
      RAISE EXCEPTION 'You are not assigned to this service call';
    END IF;

    -- Check that only allowed fields were modified
    -- Employees can ONLY update: status, completed_at, completed_by_employee_id,
    -- cannot_complete_reason, cannot_complete_at

    IF (OLD.title IS DISTINCT FROM NEW.title) THEN
      RAISE EXCEPTION 'Employees cannot modify the title field';
    END IF;

    IF (OLD.description IS DISTINCT FROM NEW.description) THEN
      RAISE EXCEPTION 'Employees cannot modify the description field';
    END IF;

    IF (OLD.customer_name IS DISTINCT FROM NEW.customer_name) THEN
      RAISE EXCEPTION 'Employees cannot modify customer information';
    END IF;

    IF (OLD.customer_phone IS DISTINCT FROM NEW.customer_phone) THEN
      RAISE EXCEPTION 'Employees cannot modify customer phone';
    END IF;

    IF (OLD.customer_email IS DISTINCT FROM NEW.customer_email) THEN
      RAISE EXCEPTION 'Employees cannot modify customer email';
    END IF;

    IF (OLD.customer_address IS DISTINCT FROM NEW.customer_address) THEN
      RAISE EXCEPTION 'Employees cannot modify customer address';
    END IF;

    IF (OLD.priority IS DISTINCT FROM NEW.priority) THEN
      RAISE EXCEPTION 'Employees cannot modify priority';
    END IF;

    IF (OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date) THEN
      RAISE EXCEPTION 'Employees cannot modify scheduled date';
    END IF;

    IF (OLD.notes IS DISTINCT FROM NEW.notes) THEN
      RAISE EXCEPTION 'Employees cannot modify notes';
    END IF;

    IF (OLD.created_by_manager_id IS DISTINCT FROM NEW.created_by_manager_id) THEN
      RAISE EXCEPTION 'Employees cannot modify creator information';
    END IF;

    IF (OLD.assigned_employee_ids IS DISTINCT FROM NEW.assigned_employee_ids) THEN
      RAISE EXCEPTION 'Employees cannot modify assigned employees';
    END IF;

    -- All checks passed, allow the update
    RETURN NEW;
  END IF;

  -- Unknown role or not authenticated, deny
  RAISE EXCEPTION 'Unauthorized update';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS validate_employee_update_trigger ON service_calls;

CREATE TRIGGER validate_employee_update_trigger
  BEFORE UPDATE ON service_calls
  FOR EACH ROW
  EXECUTE FUNCTION validate_employee_service_call_update();

-- Step 3: Create the RLS policy (same as Option 1)
DROP POLICY IF EXISTS "service_calls_update_for_employees" ON service_calls;

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
  -- (The trigger will enforce field restrictions)
  (auth.uid() IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employee'
    AND profiles.id = ANY(service_calls.assigned_employee_ids)
  ))
);

-- Grant necessary permissions
GRANT UPDATE ON service_calls TO authenticated;

-- Comments
COMMENT ON FUNCTION validate_employee_service_call_update() IS
'Validates that employees only update allowed fields (status, completion info) on service calls';

COMMENT ON POLICY "service_calls_update_for_employees" ON service_calls IS
'Allows managers to update their service calls and employees to update service calls assigned to them. Field restrictions enforced by trigger.';
