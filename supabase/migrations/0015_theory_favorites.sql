-- Conspira.io — user favorites (private bookmarks).
-- Each user can favorite any number of theories. Favorites are PRIVATE
-- by default — only the owner sees their list. The button on a theory
-- card or detail page toggles state.

set check_function_bodies = off;

create table if not exists public.theory_favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  theory_id  uuid not null references public.theories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, theory_id)
);

create index if not exists theory_favorites_user_idx
  on public.theory_favorites (user_id, created_at desc);

create index if not exists theory_favorites_theory_idx
  on public.theory_favorites (theory_id);

-- RLS: users only see / write their own favorites.
alter table public.theory_favorites enable row level security;

drop policy if exists theory_favorites_select on public.theory_favorites;
create policy theory_favorites_select on public.theory_favorites
for select using (auth.uid() = user_id);

drop policy if exists theory_favorites_insert on public.theory_favorites;
create policy theory_favorites_insert on public.theory_favorites
for insert with check (auth.uid() = user_id);

drop policy if exists theory_favorites_delete on public.theory_favorites;
create policy theory_favorites_delete on public.theory_favorites
for delete using (auth.uid() = user_id);
