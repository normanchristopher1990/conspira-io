import { Link } from 'react-router-dom';
import { useRelatedTheories } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { localizeTheory } from '../lib/localize';
import type { RelatedTheory } from '../lib/types';
import CategoryBanner from './CategoryBanner';
import ScoreBar from './ScoreBar';

type Props = { theoryId: string };

// Public display of approved cross-links on TheoryDetailPage. Renders
// two sub-sections — children ("This theory encompasses") and parents
// ("Part of"). Hidden entirely when there are no approved links.
export default function RelatedTheoriesSection({ theoryId }: Props) {
  const { data, loading, error } = useRelatedTheories(theoryId);
  const { t } = useI18n();

  if (loading || error || !data || data.length === 0) {
    return null;
  }

  const children = data.filter((r) => r.direction === 'down');
  const parents = data.filter((r) => r.direction === 'up');

  return (
    <section className="mt-10 space-y-8">
      {children.length > 0 && (
        <Group
          heading={t.links.sectionContains}
          hint={t.links.sectionContainsHint}
          items={children}
        />
      )}
      {parents.length > 0 && (
        <Group
          heading={t.links.sectionPartOf}
          hint={t.links.sectionPartOfHint}
          items={parents}
        />
      )}
    </section>
  );
}

function Group({
  heading,
  hint,
  items,
}: {
  heading: string;
  hint: string;
  items: RelatedTheory[];
}) {
  return (
    <div>
      <h2 className="text-xs font-mono-num uppercase tracking-widest text-muted">
        {heading}
      </h2>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((r) => (
          <MiniCard key={`${r.link.parentId}:${r.link.childId}`} item={r} />
        ))}
      </ul>
    </div>
  );
}

function MiniCard({ item }: { item: RelatedTheory }) {
  const { lang } = useI18n();
  const { title } = localizeTheory(item.theory, lang);
  return (
    <li>
      <Link
        to={`/theory/${item.theory.id}`}
        className="block bg-white rounded-lg ring-1 ring-line shadow-card overflow-hidden hover:ring-slate-300 transition-shadow"
      >
        <CategoryBanner category={item.theory.category} />
        <div className="p-4">
          <h3 className="text-sm font-semibold leading-snug text-ink line-clamp-2">
            {title}
          </h3>
          <div className="mt-3">
            <ScoreBar score={item.theory.score} />
          </div>
        </div>
      </Link>
    </li>
  );
}
