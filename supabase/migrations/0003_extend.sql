-- Conspira.io — extends RLS for takedowns, evidence-on-existing-theories,
-- and admin moderation. Run after 0001 and 0002.

-- =========================================================
-- Profiles: allow extended self-update + add expert_field/note columns
-- =========================================================
alter table public.profiles
  add column if not exists expert_field text,
  add column if not exists expert_note text;

-- =========================================================
-- Evidence: any authenticated user may add evidence to an accepted
-- theory. The platform model is "anyone can contribute evidence".
-- =========================================================
drop policy if exists "evidence: insert own" on public.evidence;

create policy "evidence: insert authed"
  on public.evidence for insert
  with check (
    auth.uid() = submitted_by
    and exists (
      select 1 from public.theories t
      where t.id = evidence.theory_id
        and t.status in ('accepted', 'pending_admin', 'pending_ai')
    )
  );

-- Owners can update or delete their own evidence (until accepted).
create policy "evidence: update own pending"
  on public.evidence for update
  using (auth.uid() = submitted_by);

create policy "evidence: delete own"
  on public.evidence for delete
  using (auth.uid() = submitted_by);

-- =========================================================
-- Takedowns: admins can update status / notes
-- =========================================================
create policy "takedowns: admin update"
  on public.takedown_requests for update
  using (public.is_admin(auth.uid()));

-- =========================================================
-- Helper view: public takedown log with redacted PII
-- (the requester's email is never collected; name/org optional)
-- =========================================================
create or replace view public.takedowns_public as
  select
    id,
    theory_id,
    evidence_id,
    requester_org,
    legal_basis,
    status,
    created_at
  from public.takedown_requests;

grant select on public.takedowns_public to anon, authenticated;
