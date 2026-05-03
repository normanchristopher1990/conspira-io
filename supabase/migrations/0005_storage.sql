-- Conspira.io — Storage bucket for evidence file uploads.
-- Run after 0004 (and after Storage is enabled in your Supabase project).

-- =========================================================
-- Bucket: evidence
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  true,
  20 * 1024 * 1024,  -- 20 MB
  array[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/webm',
    'text/plain', 'text/markdown', 'text/html'
  ]
)
on conflict (id) do nothing;

-- Public read — uploads are linked to evidence rows that are themselves
-- gated by the theory's accepted status; treat the bucket like a CDN.
create policy "evidence: public read"
  on storage.objects for select
  using (bucket_id = 'evidence');

-- Authenticated users can upload, but only into their own UID folder.
-- Path scheme: <auth.uid()>/<uuid>.<ext>
create policy "evidence: authed upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners can delete their own uploads (e.g. before submitting).
create policy "evidence: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
