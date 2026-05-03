-- Conspira.io — explicit "stance" on each evidence item.
-- Splits the previously-conflated "score" column into two concerns:
--   score  (0–5) — how reliable / verifiable this piece is
--   stance ('supporting' | 'contradicting') — which way it points
-- A 5/5 reproducible experiment can equally support OR refute a theory;
-- the stance field captures that direction explicitly.

-- 1. Add the column nullable so the backfill can run.
alter table public.evidence
  add column if not exists stance text;

-- 2. Backfill from the legacy score: items scored 1–2 (the previous
--    "negative impact" range) become 'contradicting'; everything else
--    is treated as 'supporting'. Submitters can still change it later.
update public.evidence
   set stance = case when score <= 2 then 'contradicting' else 'supporting' end
 where stance is null;

-- 3. Lock it in: NOT NULL with a check constraint.
alter table public.evidence
  alter column stance set not null,
  alter column stance set default 'supporting';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'evidence_stance_check'
  ) then
    alter table public.evidence
      add constraint evidence_stance_check
      check (stance in ('supporting', 'contradicting'));
  end if;
end $$;

-- 4. Index for filtering by stance within a theory.
create index if not exists evidence_theory_stance_idx
  on public.evidence (theory_id, stance);
