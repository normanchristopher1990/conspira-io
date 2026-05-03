-- Conspira.io — discussion comments on accepted theories.
-- Comments are intentionally separate from the score system: they have no
-- upvotes, no thread depth, no influence on the theory's score.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  theory_id uuid not null references public.theories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_theory_idx
  on public.comments (theory_id, created_at);

alter table public.comments enable row level security;

-- Public read for comments on accepted theories.
create policy "comments: public read on accepted"
  on public.comments for select
  using (
    exists (
      select 1 from public.theories t
      where t.id = comments.theory_id and t.status = 'accepted'
    )
  );

-- Authed users can post on accepted theories only.
create policy "comments: authed insert"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.theories t
      where t.id = comments.theory_id and t.status = 'accepted'
    )
  );

-- Owners can edit / delete their own comments.
create policy "comments: own update"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "comments: own delete"
  on public.comments for delete
  using (auth.uid() = author_id);

-- Admins can read everything and remove anything.
create policy "comments: admin read all"
  on public.comments for select
  using (public.is_admin(auth.uid()));

create policy "comments: admin delete"
  on public.comments for delete
  using (public.is_admin(auth.uid()));
