import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TheoryCard from '../components/TheoryCard';
import { searchTheories } from '../lib/api';
import { useI18n } from '../lib/i18n';
import type { Theory } from '../lib/types';

export default function SearchPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Theory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = params.get('q') ?? '';
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchTheories(q)
      .then((items) => {
        if (!cancelled) setResults(items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : t.search.failed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params, t.search.failed]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setParams({ q: query });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <div className="pt-8">
        <Link to="/" className="text-xs font-medium text-muted hover:text-brand">
          {t.search.backToFeed}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{t.search.title}</h1>
        <form onSubmit={submit} className="mt-4 flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            {t.search.submit}
          </button>
        </form>
        <p className="mt-2 text-xs text-muted">{t.search.helper}</p>
      </div>

      <section className="mt-8 grid gap-5">
        {error ? (
          <div className="rounded-xl border border-score-bad/30 bg-score-bad/5 p-6 text-sm text-score-bad">
            {error}
          </div>
        ) : loading ? (
          <p className="text-sm text-muted">{t.search.searching}</p>
        ) : !query.trim() ? (
          <p className="text-sm text-muted">{t.search.enterQuery}</p>
        ) : results.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {t.search.noResults(query)}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">
              <span className="font-mono-num text-ink">{results.length}</span>{' '}
              {t.search.resultCount(results.length).replace(/^\d+\s+/, '')}
            </p>
            {results.map((th) => (
              <TheoryCard key={th.id} theory={th} />
            ))}
          </>
        )}
      </section>
    </main>
  );
}
