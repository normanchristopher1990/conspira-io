import { Link } from 'react-router-dom';
import CategoryBannerCard from '../components/CategoryBannerCard';
import { CATEGORIES } from '../lib/categories';
import { useAuth } from '../lib/auth';
import { useCategoryCounts } from '../lib/hooks';
import { useI18n, type Strings } from '../lib/i18n';
import { RANKS, rankBadgeClasses, type RankSlug } from '../lib/ranks';
import type { CategorySlug } from '../lib/types';

export default function HomePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: counts } = useCategoryCounts();

  // Build a slug → count map. Categories absent from the view (no accepted
  // theories yet) default to 0.
  const countBySlug = new Map<CategorySlug, number>();
  for (const c of counts ?? []) countBySlug.set(c.category, c.count);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <section className="pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
          {t.hero.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-600">
          {t.hero.subtitle}
        </p>
      </section>

      <SubmitCTA t={t} />

      <HowItWorks t={t} />

      <section className="mt-6 space-y-3">
        <h2 className="text-xs font-mono-num uppercase tracking-widest text-muted">
          {t.home.categoriesHeading}
        </h2>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const count = countBySlug.get(cat.slug) ?? 0;
            return (
              <CategoryBannerCard
                key={cat.slug}
                category={cat}
                count={count}
                countLabel={count === 1 ? t.home.theorySingular : t.home.theoryPlural}
              />
            );
          })}
        </div>
      </section>

      {!user && <JoinRanks t={t} />}
    </main>
  );
}

function HowItWorks({ t }: { t: Strings }) {
  const steps = [
    { n: 1, title: t.home.howItWorks.step1Title, body: t.home.howItWorks.step1Body },
    { n: 2, title: t.home.howItWorks.step2Title, body: t.home.howItWorks.step2Body },
    { n: 3, title: t.home.howItWorks.step3Title, body: t.home.howItWorks.step3Body },
  ];
  return (
    <section className="mb-6">
      <h2 className="text-xs font-mono-num uppercase tracking-widest text-muted">
        {t.home.howItWorks.title}
      </h2>
      <ol className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="rounded-xl bg-white ring-1 ring-line p-4 flex gap-3"
          >
            <span
              aria-hidden
              className="grid place-items-center h-8 w-8 shrink-0 rounded-full bg-brand/10 text-brand font-mono-num font-bold text-sm"
            >
              {s.n}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink leading-snug">
                {s.title}
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SubmitCTA({ t }: { t: Strings }) {
  return (
    <section className="mb-6 rounded-xl bg-gradient-to-br from-brand to-brand-700 p-5 sm:p-6 text-white shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            {t.home.cta.title}
          </h2>
          <p className="mt-1 text-sm text-white/80 max-w-xl">
            {t.home.cta.body}
          </p>
        </div>
        <Link
          to="/submit"
          className="shrink-0 inline-flex items-center justify-center gap-1 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-white/95 transition-colors"
        >
          {t.home.cta.button} →
        </Link>
      </div>
    </section>
  );
}

const RANK_PARADE: RankSlug[] = [
  'rekrut', 'soldat', 'korporal', 'sergeant', 'leutnant', 'major', 'general',
];

function JoinRanks({ t }: { t: Strings }) {
  return (
    <section className="mt-10 rounded-xl ring-1 ring-line bg-white p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {t.home.joinRanks.title}
          </h2>
          <p className="mt-1 text-xs text-muted">{t.home.joinRanks.body}</p>
          <ul className="mt-3 flex flex-wrap items-center gap-1.5">
            {RANK_PARADE.map((slug, i) => (
              <li key={slug} className="inline-flex items-center">
                {i > 0 && (
                  <span aria-hidden className="text-muted text-xs px-1">
                    →
                  </span>
                )}
                <span
                  className={
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ' +
                    rankBadgeClasses(RANKS[slug].style)
                  }
                  title={t.rank[slug].notes}
                >
                  {t.rank[slug].label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          to="/register"
          className="shrink-0 inline-flex items-center justify-center rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {t.home.joinRanks.button}
        </Link>
      </div>
    </section>
  );
}
