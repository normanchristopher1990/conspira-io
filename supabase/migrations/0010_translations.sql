-- Conspira.io — auto-translated title/summary in both languages.
-- Original `title`/`summary` stay as the canonical source the submitter
-- typed. The *_en / *_de columns hold versions translated by Claude.
-- The UI falls back to the original when the language-specific version
-- is null (e.g. while translation is still running).

alter table public.theories
  add column if not exists title_en text,
  add column if not exists title_de text,
  add column if not exists summary_en text,
  add column if not exists summary_de text,
  add column if not exists translated_at timestamptz;

-- Optional: index on translated_at so the admin can see what's missing.
create index if not exists theories_untranslated_idx
  on public.theories (created_at desc)
  where translated_at is null;
