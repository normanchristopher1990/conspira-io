import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TheoryTile from '../components/TheoryTile';
import { listTheoriesPage } from '../lib/api';
import { CATEGORIES, getCategory } from '../lib/categories';
import { useMyFavoriteIds, useTopicsByCategory } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import type { CategorySlug, SortKey, Theory, Topic } from '../lib/types';

const PAGE_SIZE = 12;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useI18n();

  // Validate slug against the canonical list — guards against typo URLs.
  const validSlug = CATEGORIES.find((c) => c.slug === slug)?.slug as CategorySlug | undefined;
  const category = validSlug ? getCategory(validSlug) : null;

  const { data: topics, loading: topicsLoading } = useTopicsByCategory(validSlug);
  const { data: favoriteIds } = useMyFavoriteIds();

  const [theories, setTheories] = useState<Theory[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort] = useState<SortKey>('newest');
  const [search, setSearch] = useState('');

  const filteredTheories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return theories;
    return theories.filter((th) => {
      const title = (th.titleEn ?? '').toLowerCase()
        + ' ' + (th.titleDe ?? '').toLowerCase()
        + ' ' + th.title.toLowerCase();
      const summary = (th.summaryEn ?? '').toLowerCase()
        + ' ' + (th.summaryDe ?? '').toLowerCase()
        + ' ' + th.summary.toLowerCase();
      return title.includes(q) || summary.includes(q);
    });
  }, [theories, search]);

  useEffect(() => {
    if (!validSlug) return;
    let cancelled = false;
    setLoadingInitial(true);
    setError(null);
    listTheoriesPage({ category: validSlug, sort, offset: 0, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setTheories(page.items);
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
  }, [validSlug, sort]);

  async function loadMore() {
    if (!validSlug) return;
    setLoadingMore(true);
    try {
      const page = await listTheoriesPage({
        category: validSlug,
        sort,
        offset: theories.length,
        limit: PAGE_SIZE,
      });
      setTheories((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more.');
    } finally {
      setLoadingMore(false);
    }
  }

  if (!category) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t.notFound.title}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-brand hover:underline">
          {t.notFound.backHome}
        </Link>
      </main>
    );
  }

  const hasTopics = (topics ?? []).length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <Link
        to="/"
        className="mt-6 inline-block text-xs text-muted hover:text-ink"
      >
        ← {t.categoryPage.backHome}
      </Link>

      {/* Category header — squared bottom corners so it reads as "page header"
          rather than a floating card. Visually anchors the rest of the page
          to this category. */}
      <section className="mt-3 rounded-t-xl overflow-hidden shadow-card">
        <div className="bg-gradient-to-br from-brand to-brand-700 px-5 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
            {category.label}
          </h1>
          <span className="font-mono-num text-xs text-white/70 shrink-0">
            {total} {total === 1 ? t.home.theorySingular : t.home.theoryPlural}
          </span>
        </div>
      </section>

      {/* Topics grid (only if any exist) */}
      {!topicsLoading && hasTopics && (
        <section className="mt-8">
          <h2 className="text-xs font-mono-num uppercase tracking-widest text-muted">
            {t.categoryPage.topicsHeading}
          </h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(topics ?? []).map((topic) => (
              <TopicCard key={topic.id} topic={topic} categorySlug={category.slug} lang={lang} />
            ))}
          </ul>
        </section>
      )}

      {/* All theories in this category */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xs font-mono-num uppercase tracking-widest text-muted">
            {hasTopics ? t.categoryPage.allTheories : t.categoryPage.theoriesHeading}
          </h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.categoryPage.searchPlaceholder}
            className="w-full sm:w-72 rounded-md border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div className="mt-4">
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
          ) : theories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
              {t.home.empty}
            </div>
          ) : filteredTheories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
              {t.categoryPage.searchEmpty}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredTheories.map((th) => (
                  <TheoryTile key={th.id} theory={th} favoriteIds={favoriteIds ?? undefined} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="rounded-md border border-line bg-white px-5 py-2 text-sm font-medium text-ink hover:border-slate-300 disabled:opacity-60"
                  >
                    {loadingMore ? t.home.loadingMore : t.home.loadMore(total - theories.length)}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Bottom blue strip — mirror of the header bar. Functional close
          with a back-to-categories link, rounded only at the bottom so
          it pairs visually with the header's rounded-top. */}
      <Link
        to="/"
        className="mt-8 block rounded-b-xl bg-gradient-to-br from-brand to-brand-700 px-5 py-2.5 text-xs font-medium text-white/90 hover:text-white text-center"
      >
        ← {t.categoryPage.backHome}
      </Link>
    </main>
  );
}

function TopicCard({
  topic,
  categorySlug,
  lang,
}: {
  topic: Topic;
  categorySlug: CategorySlug;
  lang: 'en' | 'de';
}) {
  const name = lang === 'de' ? topic.nameDe : topic.nameEn;
  return (
    <li>
      <Link
        to={`/category/${categorySlug}/${topic.slug}`}
        className="block rounded-lg overflow-hidden bg-white ring-1 ring-line hover:ring-slate-300 transition-shadow shadow-card"
      >
        <div
          className="relative w-full bg-slate-200"
          style={{ aspectRatio: '3 / 2' }}
        >
          {topic.imagePath ? (
            <img
              src={topic.imagePath}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-ink leading-snug">{name}</h3>
          <p className="mt-1 text-xs font-mono-num text-muted">
            {topic.theoryCount} {topic.theoryCount === 1 ? 'theory' : 'theories'}
          </p>
        </div>
      </Link>
    </li>
  );
}
