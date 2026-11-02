-- Existing private bucket; retain all ownership and internal-member policies.
-- No new tables or API grants are required.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
where id = 'record-attachments';
