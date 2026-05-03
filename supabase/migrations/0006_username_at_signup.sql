-- Conspira.io — let users pick a username at signup.
-- Replaces handle_new_user so it reads raw_user_meta_data.username when set.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  picked text;
  proposed text;
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

  -- 2) Fallback: derive from email (legacy + OAuth signups with no metadata).
  proposed := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if proposed is null or length(proposed) < 3 then
    proposed := 'user_' || substr(new.id::text, 1, 8);
  end if;

  candidate := proposed;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := proposed || n::text;
  end loop;

  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;
