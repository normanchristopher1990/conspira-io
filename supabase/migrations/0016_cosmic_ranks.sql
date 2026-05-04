-- Conspira.io — rebrand rank system from German military to cosmic theme.
--
-- Mapping of old ranks → new ranks (preserves user progression):
--   rekrut    → zd-27
--   soldat    → orbit
--   korporal  → triad
--   sergeant  → cosmos
--   leutnant  → astral
--   hauptmann → stellar
--   major     → ultra
--   oberst    → luna
--   general   → cosmic
--   (new top tier: majestic — admin-assigned only)
--
-- Postgres enums can't be altered in-place, so we cycle through text:
--   1) Convert column to text
--   2) Drop old enum
--   3) Create new enum
--   4) Map existing data
--   5) Convert column back to new enum
--   6) Set new default

set check_function_bodies = off;

-- 1) Drop default + change column to text so we can rename values freely.
alter table public.profiles
  alter column rank drop default;

alter table public.profiles
  alter column rank type text;

-- 2) Drop old enum (no longer referenced now that column is text).
drop type if exists public.user_rank;

-- 3) Create new cosmic enum.
create type public.user_rank as enum (
  'zd-27',
  'orbit',
  'triad',
  'cosmos',
  'astral',
  'stellar',
  'ultra',
  'luna',
  'cosmic',
  'majestic'
);

-- 4) Map old values → new values (in the text column).
update public.profiles set rank = case rank
  when 'rekrut'    then 'zd-27'
  when 'soldat'    then 'orbit'
  when 'korporal'  then 'triad'
  when 'sergeant'  then 'cosmos'
  when 'leutnant'  then 'astral'
  when 'hauptmann' then 'stellar'
  when 'major'     then 'ultra'
  when 'oberst'    then 'luna'
  when 'general'   then 'cosmic'
  else 'zd-27'
end;

-- 5) Convert column back to typed enum.
alter table public.profiles
  alter column rank type public.user_rank using rank::public.user_rank;

-- 6) Set new default for fresh signups.
alter table public.profiles
  alter column rank set default 'zd-27'::public.user_rank;
