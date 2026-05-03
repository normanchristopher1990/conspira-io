import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CategoryDrawer from '../components/CategoryDrawer';
import CategoryFilter from '../components/CategoryFilter';
import SortBar from '../components/SortBar';
import TheoryCard from '../components/TheoryCard';
import { listTheoriesPage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n, type Strings } from '../lib/i18n';
import { RANKS, rankBadgeClasses, type RankSlug } from '../lib/ranks';
import type { CategorySlug, SortKey, Theory } from '../lib/types';

const PAGE_SIZE = 12;

export default function HomePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [category, setCategory] = useState<CategorySlug | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [items, setItems] = useState<Theory[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filterActive = category !== 'all';

  // Reset and load whenever filter / sort changes.
  useEffect(() => {
    let cancelled = false;
    setLoadingInitial(true);
    setError(null);
    listTheoriesPage({
      category: category === 'all' ? undefined : category,
      sort,
      offset: 0,
      limit: PAGE_SIZE,
    })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.total);
        setHasMore(page.hasMore);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load.');
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, sort]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await listTheoriesPage({
        category: category === 'all' ? undefined : category,
        sort,
        offset: items.length,
        limit: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more.');
    } finally {
      setLoadingMore(false);
    }
  }

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

      <HowItWorks t={t} />

      <SubmitCTA t={t} />

      <section className="space-y-4">
        {/* Desktop: pills + sort */}
        <div className="hidden md:block space-y-4">
          <CategoryFilter selected={category} onChange={setCategory} />
          <SortBar value={sort} onChange={setSort} count={total} />
        </div>

        {/* Mobile: filter button (top-right) opens the drawer */}
        <div className="md:hidden flex justify-end">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t.home.filter}
            className="relative inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-slate-300"
          >
            <FilterIcon />
            {t.home.filter}
            {filterActive && (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-bg"
              />
            )}
          </button>
        </div>
      </section>

      <CategoryDrawer
        open={drawerOpen}
        selected={category}
        onSelect={setCategory}
        onClose={() => setDrawerOpen(false)}
      />

      <section className="mt-6 grid gap-5">
        {error ? (
          <div className="rounded-xl border border-score-bad/30 bg-score-bad/5 p-6 text-sm text-score-bad">
            {t.home.failedToLoad(error)}
          </div>
        ) : loadingInitial ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-xl bg-white ring-1 ring-line shadow-card animate-pulse"
              />
            ))}
          </>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {t.home.empty}
          </div>
        ) : (
          <>
            {items.map((th) => (
              <TheoryCard key={th.id} theory={th} />
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-md border border-line bg-white px-5 py-2 text-sm font-medium text-ink hover:border-slate-300 disabled:opacity-60"
                >
                  {loadingMore ? t.home.loadingMore : t.home.loadMore(total - items.length)}
                </button>
              </div>
            )}
          </>
        )}
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

// Subset of ranks shown as a visual progression hint.
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

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-slate-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5h16l-6 8v6l-4-2v-4z" />
    </svg>
  );
}
