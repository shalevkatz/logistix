-- Allow employees to update service calls assigned to them
-- Managers can update all their service calls

DROP POLICY IF EXISTS "service_calls_update_policy" ON service_calls;

CREATE POLICY "service_calls_update_policy"
ON service_calls
FOR UPDATE
USING (
  auth.uid()::text = ANY(assigned_employee_ids)
  OR
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'manager')
)
WITH CHECK (
  auth.uid()::text = ANY(assigned_employee_ids)
  OR
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'manager')
);
