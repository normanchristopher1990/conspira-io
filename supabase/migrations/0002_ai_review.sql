-- Conspira.io — AI auto-review storage + accepted_count maintenance.
-- Run after 0001_init.sql.

-- =========================================================
-- AI review payload on theories
-- =========================================================
alter table public.theories
  add column if not exists ai_review jsonb,
  add column if not exists ai_reviewed_at timestamptz;

-- Public can read AI review on accepted theories via the existing select policy.

-- =========================================================
-- Maintain profiles.accepted_count when theory status flips
-- =========================================================
create or replace function public.maintain_accepted_count()
returns trigger
language plpgsql as $$
begin
  if (tg_op = 'UPDATE') then
    if new.status = 'accepted' and old.status is distinct from 'accepted' then
      update public.profiles
         set accepted_count = accepted_count + 1
       where id = new.submitted_by;
    elsif old.status = 'accepted' and new.status is distinct from 'accepted' then
      update public.profiles
         set accepted_count = greatest(accepted_count - 1, 0)
       where id = new.submitted_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_theories_accepted_count on public.theories;
create trigger trg_theories_accepted_count
  after update on public.theories
  for each row execute procedure public.maintain_accepted_count();
