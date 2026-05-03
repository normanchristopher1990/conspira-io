-- Conspira.io — once a theory is accepted, the owner can no longer delete it.
-- Use the public takedown register (which is logged) instead.
-- Admins retain full delete via the admin policies.

drop policy if exists "theories: delete own" on public.theories;

create policy "theories: delete own pending"
  on public.theories for delete
  using (auth.uid() = submitted_by and status <> 'accepted');
