import { useState } from 'react';
import { useI18n } from '../lib/i18n';

// Pixabay search inline picker for theory submission. Returns a Pixabay
// largeImageURL when the user clicks a result. Pixabay's content license
// permits commercial use without attribution, but the API terms require
// a small "Powered by Pixabay" link somewhere on the page (we add it).
//
// Requires: VITE_PIXABAY_API_KEY env var (set in Vercel env vars).
//
// Pixabay rate-limits per IP (~100/min on the free tier) — plenty for
// per-submission searching.

const API_KEY = import.meta.env.VITE_PIXABAY_API_KEY as string | undefined;

type PixabayHit = {
  id: number;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  user: string;
  pageURL: string;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Auto-fill the search box from the theory title. */
  seedQuery?: string;
};

export default function PixabayImagePicker({ value, onChange, seedQuery }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState(seedQuery ?? '');
  const [results, setResults] = useState<PixabayHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!API_KEY) {
    return (
      <div className="rounded-md bg-amber-50 ring-1 ring-amber-200 px-3 py-2 text-xs text-amber-800">
        {t.imagePicker.notConfigured}
      </div>
    );
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const url =
        `https://pixabay.com/api/?key=${API_KEY}` +
        `&q=${encodeURIComponent(query.trim())}` +
        '&image_type=photo&orientation=horizontal&safesearch=true&per_page=12';
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Pixabay ${resp.status}`);
      const data = await resp.json();
      setResults(data.hits ?? []);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  // Show selected image with a "Change" affordance.
  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-md ring-1 ring-line bg-slate-100">
          <img
            src={value}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <a
            href="https://pixabay.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-ink"
          >
            {t.imagePicker.poweredBy}
          </a>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setResults([]);
            }}
            className="font-medium text-brand hover:underline"
          >
            {t.imagePicker.change}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.imagePicker.searchPlaceholder}
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? t.imagePicker.searching : t.imagePicker.search}
        </button>
      </form>

      {error && (
        <p className="text-xs text-score-bad">{t.imagePicker.searchFailed(error)}</p>
      )}

      {results.length > 0 && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {results.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => onChange(hit.largeImageURL)}
                className="group relative aspect-video overflow-hidden rounded-md ring-1 ring-line hover:ring-2 hover:ring-brand"
              >
                <img
                  src={hit.previewURL}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted">
            <a
              href="https://pixabay.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              {t.imagePicker.poweredBy}
            </a>
            {' · '}
            {t.imagePicker.licenseNote}
          </p>
        </>
      )}

      {results.length === 0 && !loading && !error && query && (
        <p className="text-xs text-muted">{t.imagePicker.noResults}</p>
      )}
    </div>
  );
}
