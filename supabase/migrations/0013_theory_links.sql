-- Conspira.io — directed containment links between theories.
--
-- A "parent" theory contains/encompasses a "child" theory. Examples:
--   Flat Earth (parent) → Stationary Weather Balloons (child)
--   Flat Earth (parent) → Fake Satellites (child)
-- A child can belong to multiple parents (e.g. NASA Lies could appear
-- under Flat Earth AND Moon Landing Hoax).
--
-- Approval flow:
--   - Same-submitter links (both theories owned by requester): auto-approved.
--   - Cross-submitter links: status='pending', admin approves in queue.
--   - Owner of the other side does not get a notification or vote — admin
--     handles all cross-user approvals to avoid the dead-owner problem.
--
-- Score model (concept §4): links are NAVIGATIONAL ONLY. They do not
-- affect any theory's score. Each theory is reviewed independently on its
-- own evidence, per platform philosophy.

set check_function_bodies = off;

-- =========================================================
-- Status enum
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'theory_link_status') then
    create type public.theory_link_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

-- =========================================================
-- Table
-- =========================================================
create table if not exists public.theory_links (
  parent_id     uuid not null references public.theories(id) on delete cascade,
  child_id      uuid not null references public.theories(id) on delete cascade,
  status        public.theory_link_status not null default 'pending',
  requested_by  uuid not null references auth.users(id) on delete cascade,
  decided_by    uuid references auth.users(id) on delete set null,
  requested_at  timestamptz not null default now(),
  decided_at    timestamptz,
  reject_reason text,
  primary key (parent_id, child_id),
  check (parent_id <> child_id)
);

create index if not exists theory_links_parent_idx on public.theory_links (parent_id);
create index if not exists theory_links_child_idx  on public.theory_links (child_id);
create index if not exists theory_links_status_idx on public.theory_links (status);
create index if not exists theory_links_requested_by_idx on public.theory_links (requested_by);

-- =========================================================
-- Auto-approve same-submitter links on insert.
-- If the requester owns both parent and child, mark approved immediately.
-- =========================================================
create or replace function public.auto_approve_self_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_owner uuid;
  child_owner  uuid;
begin
  select submitted_by into parent_owner from public.theories where id = new.parent_id;
  select submitted_by into child_owner  from public.theories where id = new.child_id;

  if parent_owner = child_owner
     and parent_owner = new.requested_by
     and new.status = 'pending' then
    new.status      := 'approved';
    new.decided_by  := new.requested_by;
    new.decided_at  := now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_approve_self_link_trigger on public.theory_links;
create trigger auto_approve_self_link_trigger
before insert on public.theory_links
for each row execute function public.auto_approve_self_link();

-- =========================================================
-- RLS
-- =========================================================
alter table public.theory_links enable row level security;

-- Read: approved links visible to everyone; pending/rejected visible to
-- requester, owners of either theory, and admins.
drop policy if exists theory_links_select on public.theory_links;
create policy theory_links_select on public.theory_links
for select
using (
  status = 'approved'
  or auth.uid() = requested_by
  or auth.uid() in (
    select submitted_by from public.theories where id in (parent_id, child_id)
  )
  or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  )
);

-- Insert: requester must be authenticated and either own one side OR be admin.
-- (Random users can't link two theories they have no relation to.)
drop policy if exists theory_links_insert on public.theory_links;
create policy theory_links_insert on public.theory_links
for insert
with check (
  auth.uid() = requested_by
  and (
    auth.uid() in (
      select submitted_by from public.theories where id in (parent_id, child_id)
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    )
  )
);

-- Update: admin only (approve / reject decisions).
drop policy if exists theory_links_update on public.theory_links;
create policy theory_links_update on public.theory_links
for update
using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Delete: requester can cancel their own pending request; admin can delete any.
drop policy if exists theory_links_delete on public.theory_links;
create policy theory_links_delete on public.theory_links
for delete
using (
  (auth.uid() = requested_by and status = 'pending')
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
