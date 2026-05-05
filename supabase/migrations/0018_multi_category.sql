-- Conspira.io — multi-category support.
--
-- Each theory keeps one PRIMARY category in `theories.category_slug`
-- (drives the breadcrumb and is the "home" of the theory). Additional
-- categories live in `theory_categories` so a theory can appear under
-- several browse sections without duplicating its row.
--
-- Counts and CategoryPage listings union both: a theory appears in any
-- category it touches, primary or secondary. The HomePage `category_theory_counts`
-- view is rebuilt accordingly.

set check_function_bodies = off;

-- 1) Junction table for additional (secondary) categories.
--    Primary stays on the theories row; only "extra" memberships go here.
create table if not exists public.theory_categories (
  theory_id     uuid not null references public.theories(id) on delete cascade,
  category_slug text not null references public.categories(slug),
  primary key (theory_id, category_slug)
);

create index if not exists theory_categories_category_idx
  on public.theory_categories (category_slug);

create index if not exists theory_categories_theory_idx
  on public.theory_categories (theory_id);

-- 2) RLS — public read; submitter or admin can write.
alter table public.theory_categories enable row level security;

drop policy if exists theory_categories_select on public.theory_categories;
create policy theory_categories_select on public.theory_categories
for select using (true);

drop policy if exists theory_categories_insert on public.theory_categories;
create policy theory_categories_insert on public.theory_categories
for insert
with check (
  auth.uid() in (select submitted_by from public.theories where id = theory_id)
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists theory_categories_delete on public.theory_categories;
create policy theory_categories_delete on public.theory_categories
for delete
using (
  auth.uid() in (select submitted_by from public.theories where id = theory_id)
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- 3) Rebuild the counts view to include both primary AND secondary
--    memberships. Counts are deduplicated per category — a theory in
--    primary=astronomy AND secondary=politics counts once in each.
drop view if exists public.category_theory_counts;
create view public.category_theory_counts
with (security_invoker = true)
as
  select cat as category_slug, count(distinct theory_id)::integer as theory_count
  from (
    select id as theory_id, category_slug as cat
    from public.theories
    where status = 'accepted'
    union all
    select tc.theory_id, tc.category_slug as cat
    from public.theory_categories tc
    join public.theories th on th.id = tc.theory_id
    where th.status = 'accepted'
  ) memberships
  group by cat;

grant select on public.category_theory_counts to anon, authenticated;
