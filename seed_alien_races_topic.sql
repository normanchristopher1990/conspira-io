-- Create "Alien Races" topic under UFO & Extraterrestrial,
-- and link the 5 alien-species theories from the bulk import.

begin;

-- 1) Create the topic
insert into public.topics (slug, category_slug, name_en, name_de, description_en, description_de)
values (
  'alien-races',
  'ufo-extraterrestrial',
  'Alien Races',
  'Alien-Spezies',
  'Specific extraterrestrial species that appear in conspiracy lore.',
  'Spezifische außerirdische Spezies, die in Verschwörungsmythen vorkommen.'
)
on conflict (category_slug, slug) do nothing;

-- 2) Link the 5 alien-race theories to the topic
insert into public.theory_topics (theory_id, topic_id)
select
  t.id,
  (select id from public.topics where slug = 'alien-races' and category_slug = 'ufo-extraterrestrial')
from public.theories t
where t.title in (
  'Greys',
  'Nordics',
  'Pleiadier',
  'Mantis-Wesen',
  'Annunaki / Sitchin-These'
)
on conflict do nothing;

commit;

-- Verify (optional — runs after commit)
select t.title, top.name_en
from public.theory_topics tt
join public.theories t on t.id = tt.theory_id
join public.topics top on top.id = tt.topic_id
where top.slug = 'alien-races';
