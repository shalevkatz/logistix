-- Add completion_photo_url column to service_calls table
ALTER TABLE service_calls
ADD COLUMN IF NOT EXISTS completion_photo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN service_calls.completion_photo_url IS 'URL to the photo taken when the service call was completed (optional)';
