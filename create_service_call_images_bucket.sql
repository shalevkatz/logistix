-- Create storage bucket for service call images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-call-images', 'service-call-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload service call images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-call-images');

-- Policy: Allow public read access to service call images
CREATE POLICY "Public read access to service call images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-call-images');

-- Policy: Allow users to update their own uploads (in case they need to re-upload)
CREATE POLICY "Users can update their own service call images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-call-images' AND auth.uid() = owner);

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Users can delete their own service call images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-call-images' AND auth.uid() = owner);
