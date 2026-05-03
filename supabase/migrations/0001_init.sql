-- Conspira.io initial schema
-- Run via: supabase db push  (after `supabase init` in project root)
-- Or paste into the Supabase SQL editor in the dashboard.

set check_function_bodies = off;

-- =========================================================
-- Reference: categories
-- =========================================================
create table if not exists public.categories (
  slug text primary key,
  label text not null,
  hue text not null
);

insert into public.categories (slug, label, hue) values
  ('politics-government',     'Politics & Government',                '#1F4E8A'),
  ('science-technology',      'Science & Technology',                 '#0E7490'),
  ('health-medicine',         'Health & Medicine',                    '#0F766E'),
  ('military-intelligence',   'Military & Intelligence',              '#3F3F46'),
  ('surveillance-privacy',    'Surveillance & Privacy',               '#4338CA'),
  ('economy-finance',         'Economy & Finance',                    '#B45309'),
  ('history-archaeology',     'History & Archaeology',                '#92400E'),
  ('astronomy-space',         'Astronomy & Space',                    '#1E1B4B'),
  ('energy-environment',      'Energy & Environment',                 '#15803D'),
  ('media-propaganda',        'Media & Propaganda',                   '#9F1239'),
  ('secret-societies',        'Secret Societies',                     '#581C87'),
  ('ufo-extraterrestrial',    'UFO & Extraterrestrial',               '#155E75'),
  ('pharma-vaccines',         'Pharma & Vaccines',                    '#0369A1'),
  ('religion-ancient',        'Religion & Ancient Civilisations',     '#7C2D12')
on conflict (slug) do nothing;

-- =========================================================
-- Profiles (extends auth.users)
-- =========================================================
create type public.expert_level as enum ('none', 'self_declared', 'plausible', 'probable', 'verified');
create type public.user_rank as enum (
  'rekrut', 'soldat', 'korporal', 'sergeant', 'leutnant', 'hauptmann', 'major', 'oberst', 'general'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  real_name text,
  expert_level public.expert_level not null default 'none',
  badges text[] not null default '{}',
  rank public.user_rank not null default 'rekrut',
  accepted_count integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
-- The username defaults to the local part of the email; users can change it later.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proposed text;
  candidate text;
  n integer := 0;
begin
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

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- Theories
-- =========================================================
create type public.theory_status as enum ('draft', 'pending_ai', 'pending_admin', 'accepted', 'rejected');

create table if not exists public.theories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  summary text not null check (char_length(summary) <= 500),
  category_slug text not null references public.categories(slug),
  youtube_id text,
  status public.theory_status not null default 'pending_ai',
  score smallint not null default 5 check (score between 1 and 9),
  evidence_count integer not null default 0,
  independent_sources integer not null default 0,
  submitted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists theories_category_idx on public.theories (category_slug);
create index if not exists theories_score_idx on public.theories (score desc);
create index if not exists theories_created_idx on public.theories (created_at desc);

-- =========================================================
-- Evidence
-- =========================================================
create type public.evidence_type as enum (
  'reproducible-experiment',
  'peer-reviewed-paper',
  'witness-with-risk',
  'witness-without-risk',
  'government-document',
  'declassified-military',
  'video-with-metadata',
  'verified-image',
  'video-without-metadata',
  'unverified'
);

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  theory_id uuid not null references public.theories(id) on delete cascade,
  type public.evidence_type not null,
  title text not null,
  source text not null,
  url text,
  storage_path text,
  description text not null,
  score smallint not null default 0 check (score between 0 and 5),
  involvement jsonb not null default '{}'::jsonb,
  submitted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists evidence_theory_idx on public.evidence (theory_id);
create index if not exists evidence_score_idx on public.evidence (score desc);

-- =========================================================
-- Public takedown log (per concept §10.3 — all requests logged)
-- =========================================================
create type public.takedown_status as enum ('received', 'declined', 'accepted');

create table if not exists public.takedown_requests (
  id uuid primary key default gen_random_uuid(),
  theory_id uuid references public.theories(id) on delete set null,
  evidence_id uuid references public.evidence(id) on delete set null,
  requester_name text,
  requester_org text,
  legal_basis text,
  status public.takedown_status not null default 'received',
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.theories enable row level security;
alter table public.evidence enable row level security;
alter table public.takedown_requests enable row level security;

-- Public read of accepted content
create policy "theories: public read accepted"
  on public.theories for select
  using (status = 'accepted');

create policy "evidence: public read on accepted theories"
  on public.evidence for select
  using (
    exists (
      select 1 from public.theories t
      where t.id = evidence.theory_id and t.status = 'accepted'
    )
  );

create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Authenticated users can insert their own submissions
create policy "theories: insert own"
  on public.theories for insert
  with check (auth.uid() = submitted_by);

create policy "evidence: insert own"
  on public.evidence for insert
  with check (auth.uid() = submitted_by);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Takedowns are public-log: anyone can submit, anyone can read
create policy "takedowns: anyone insert"
  on public.takedown_requests for insert
  with check (true);

create policy "takedowns: public read"
  on public.takedown_requests for select
  using (true);

-- =========================================================
-- updated_at trigger
-- =========================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_theories_touch on public.theories;
create trigger trg_theories_touch
  before update on public.theories
  for each row execute procedure public.touch_updated_at();

-- =========================================================
-- Admin policies
-- =========================================================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

create policy "theories: admin read all"
  on public.theories for select
  using (public.is_admin(auth.uid()));

create policy "theories: admin update status"
  on public.theories for update
  using (public.is_admin(auth.uid()));

create policy "evidence: admin read all"
  on public.evidence for select
  using (public.is_admin(auth.uid()));
