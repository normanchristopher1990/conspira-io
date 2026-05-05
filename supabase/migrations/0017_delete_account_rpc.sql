-- Conspira.io — self-service account deletion.
--
-- Users can't delete from auth.users directly (no GRANT). This RPC runs
-- with SECURITY DEFINER (postgres role) so the row can be removed.
-- Cascading FKs on profiles + favorites + etc. handle child rows.

set check_function_bodies = off;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- Private data first (favorites — explicit cleanup so it's visible in audit).
  delete from public.theory_favorites where user_id = uid;

  -- Cascade: deleting the auth.users row removes the linked profiles row
  -- (profiles.id references auth.users on delete cascade) and any other
  -- tables that FK back to it.
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
