-- Conspira.io — owner update/delete on theories, full-text search.
-- Run after 0003_extend.sql.

-- =========================================================
-- Theories: owners can edit / delete their own (until accepted)
-- =========================================================
create policy "theories: update own"
  on public.theories for update
  using (auth.uid() = submitted_by);

create policy "theories: delete own"
  on public.theories for delete
  using (auth.uid() = submitted_by);

-- =========================================================
-- Full-text search on theories
-- =========================================================
alter table public.theories
  add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B')
  ) stored;

create index if not exists theories_search_idx
  on public.theories using gin (search_tsv);
