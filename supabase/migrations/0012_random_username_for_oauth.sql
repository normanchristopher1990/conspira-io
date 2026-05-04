-- Conspira.io — random username for OAuth signups.
-- Replaces handle_new_user so OAuth signups (Google, Facebook, Apple, etc.)
-- get a random username like `user_a3f7x9c2` instead of an email-derived
-- one. This avoids leaking the user's email prefix as their public name.
-- The user can change it later in /me/edit (ProfileEditPage already
-- supports username editing with the same validation rules).
--
-- Email signups are unchanged: the username the user typed in the form
-- is still passed via auth.signUp options.data and used as-is.

set check_function_bodies = off;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  picked text;
  candidate text;
  n integer := 0;
begin
  -- 1) User explicitly picked a username at signup (via auth.signUp options.data).
  picked := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');

  if picked is not null then
    if length(picked) < 3 or length(picked) > 32 or picked !~ '^[a-zA-Z0-9_]+$' then
      raise exception 'Invalid username format';
    end if;
    if exists (select 1 from public.profiles where username = picked) then
      raise exception 'Username already taken';
    end if;
    insert into public.profiles (id, username) values (new.id, picked);
    return new;
  end if;

  -- 2) OAuth fallback: random 8-char suffix. Collisions are vanishingly
  --    rare (16^8 ≈ 4.3 billion) but we still loop just in case.
  candidate := 'user_' || substr(md5(random()::text || new.id::text), 1, 8);
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := 'user_' || substr(md5(random()::text || new.id::text || n::text), 1, 8);
  end loop;

  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;
