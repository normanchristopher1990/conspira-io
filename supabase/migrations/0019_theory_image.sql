-- Conspira.io — per-theory custom image URL.
--
-- When set, the theory's card and detail page show this image
-- (Unsplash, Wikimedia, or AI-generated URL) instead of the
-- YouTube thumbnail / category fallback. Lets admins curate visuals
-- for top theories without needing video for every one.

set check_function_bodies = off;

alter table public.theories
  add column if not exists image_url text;
