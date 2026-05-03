import { useEffect, useState } from 'react';
import CategoryFilter from '../components/CategoryFilter';
import SortBar from '../components/SortBar';
import TheoryCard from '../components/TheoryCard';
import { listTheoriesPage } from '../lib/api';
import { useI18n } from '../lib/i18n';
import type { CategorySlug, SortKey, Theory } from '../lib/types';

const PAGE_SIZE = 12;

export default function HomePage() {
  const { t } = useI18n();
  const [category, setCategory] = useState<CategorySlug | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [items, setItems] = useState<Theory[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <section className="space-y-4">
        <CategoryFilter selected={category} onChange={setCategory} />
        <SortBar value={sort} onChange={setSort} count={total} />
      </section>

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
    </main>
  );
}
