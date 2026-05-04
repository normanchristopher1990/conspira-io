-- Conspira.io — three-level navigation:
--   Category (Pharma & Vaccines)
--     └─ Topic (Corona Vaccine, Tetanus Vaccine, MMR, ...)
--         └─ Theory (specific claim with evidence)
--
-- Plus admin-seeding: admin can create theories without evidence as
-- "open question" stubs that invite users to contribute evidence.
-- Per concept §7.1 normal users still need at least one piece of
-- evidence to submit; this exception is admin-only and is rendered
-- distinctly in the UI.

set check_function_bodies = off;

-- =========================================================
-- 1) is_seed flag on theories
-- =========================================================
alter table public.theories
  add column if not exists is_seed boolean not null default false;

create index if not exists theories_is_seed_idx on public.theories (is_seed);

-- =========================================================
-- 2) Topics (sub-categories, e.g. CIA / FBI / KGB under Mil-Intel)
-- =========================================================
create table if not exists public.topics (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  category_slug   text not null references public.categories(slug),
  name_en         text not null,
  name_de         text not null,
  description_en  text,
  description_de  text,
  image_path      text,                     -- /public/topic-images/<file>.jpg or similar
  theory_count    integer not null default 0, -- denormalized counter
  created_at      timestamptz not null default now(),
  unique (category_slug, slug)
);

create index if not exists topics_category_idx on public.topics (category_slug);

-- =========================================================
-- 3) theory_topics — many-to-many (a theory can belong to multiple topics)
-- =========================================================
create table if not exists public.theory_topics (
  theory_id uuid not null references public.theories(id) on delete cascade,
  topic_id  uuid not null references public.topics(id) on delete cascade,
  primary key (theory_id, topic_id)
);

create index if not exists theory_topics_topic_idx  on public.theory_topics (topic_id);
create index if not exists theory_topics_theory_idx on public.theory_topics (theory_id);

-- =========================================================
-- 4) Counter: keep topics.theory_count in sync with the join table.
--    Counts only theories with status = 'accepted'.
-- =========================================================
create or replace function public.refresh_topic_counter(t_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.topics
  set theory_count = (
    select count(*) from public.theory_topics tt
    join public.theories th on th.id = tt.theory_id
    where tt.topic_id = t_id and th.status = 'accepted'
  )
  where id = t_id;
end;
$$;

create or replace function public.theory_topics_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    perform public.refresh_topic_counter(new.topic_id);
  end if;
  if (tg_op = 'DELETE' or tg_op = 'UPDATE') then
    perform public.refresh_topic_counter(old.topic_id);
  end if;
  return null;
end;
$$;

drop trigger if exists theory_topics_count_trigger on public.theory_topics;
create trigger theory_topics_count_trigger
after insert or update or delete on public.theory_topics
for each row execute function public.theory_topics_after_change();

-- Also refresh when a theory's status changes (acceptance can in/decrease counts).
create or replace function public.theories_status_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    perform public.refresh_topic_counter(tt.topic_id)
    from public.theory_topics tt where tt.theory_id = new.id;
  end if;
  return null;
end;
$$;

drop trigger if exists theories_status_topic_count_trigger on public.theories;
create trigger theories_status_topic_count_trigger
after update on public.theories
for each row execute function public.theories_status_after_update();

-- =========================================================
-- 5) RLS
-- =========================================================
alter table public.topics         enable row level security;
alter table public.theory_topics  enable row level security;

-- Topics: public read; admin-only write.
drop policy if exists topics_select on public.topics;
create policy topics_select on public.topics
for select using (true);

drop policy if exists topics_insert on public.topics;
create policy topics_insert on public.topics
for insert
with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists topics_update on public.topics;
create policy topics_update on public.topics
for update
using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists topics_delete on public.topics;
create policy topics_delete on public.topics
for delete
using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- theory_topics: public read; submitter of theory or admin can write.
drop policy if exists theory_topics_select on public.theory_topics;
create policy theory_topics_select on public.theory_topics
for select using (true);

drop policy if exists theory_topics_insert on public.theory_topics;
create policy theory_topics_insert on public.theory_topics
for insert
with check (
  auth.uid() in (select submitted_by from public.theories where id = theory_id)
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists theory_topics_delete on public.theory_topics;
create policy theory_topics_delete on public.theory_topics
for delete
using (
  auth.uid() in (select submitted_by from public.theories where id = theory_id)
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- =========================================================
-- 6) Theory counts per CATEGORY — view used by HomePage grid
-- =========================================================
create or replace view public.category_theory_counts as
  select category_slug, count(*)::integer as theory_count
  from public.theories
  where status = 'accepted'
  group by category_slug;

-- Make it readable to all (anon + authenticated).
grant select on public.category_theory_counts to anon, authenticated;
