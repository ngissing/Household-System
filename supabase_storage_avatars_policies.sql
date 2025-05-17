-- Policy: Allow public read access to 'avatars' bucket
CREATE POLICY "Allow public read access on avatars"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Policy: Allow anonymous uploads to 'avatars' bucket
CREATE POLICY "Allow anonymous insert access on avatars"
  ON storage.objects FOR INSERT
  TO anon -- Grant permission to the anonymous role
  WITH CHECK ( bucket_id = 'avatars' );

-- Policy: Allow anonymous updates/overwrites in 'avatars' bucket
-- Needed for the upsert:true option used in the code
CREATE POLICY "Allow anonymous update access on avatars"
  ON storage.objects FOR UPDATE
  TO anon -- Grant permission to the anonymous role
  USING ( bucket_id = 'avatars' );

-- Note: Deletion policies are often more restrictive.
-- If you need to allow deletion from the frontend later, add a DELETE policy.
-- Example (use with caution):
-- CREATE POLICY "Allow anonymous delete access on avatars"
--   ON storage.objects FOR DELETE
--   TO anon
--   USING ( bucket_id = 'avatars' );