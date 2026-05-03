-- Conspira.io — view counter on theories.
-- Increments via a SECURITY DEFINER function so anonymous reads can still
-- update the count without granting general UPDATE rights to the public.

alter table public.theories
  add column if not exists view_count integer not null default 0;

create or replace function public.increment_theory_views(theory_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.theories
     set view_count = view_count + 1
   where id = theory_id and status = 'accepted';
$$;

grant execute on function public.increment_theory_views(uuid) to anon, authenticated;
