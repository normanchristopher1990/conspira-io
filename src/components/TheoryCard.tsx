import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { localizeTheory } from '../lib/localize';
import type { Theory } from '../lib/types';
import FavoriteButton from './FavoriteButton';
import ScoreBar from './ScoreBar';
import YouTubeThumbnail from './YouTubeThumbnail';

type Props = {
  theory: Theory;
  favoriteIds?: Set<string>;
};

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export default function TheoryCard({ theory, favoriteIds }: Props) {
  const { t, lang } = useI18n();
  const { title, summary } = localizeTheory(theory, lang);
  const favorited = favoriteIds?.has(theory.id) ?? false;
  return (
    <article className="group bg-white rounded-xl shadow-card ring-1 ring-line overflow-hidden transition-shadow hover:shadow-md">
      <div className="bg-gradient-to-br from-brand to-brand-700 px-4 py-2 flex items-center justify-between gap-2 hover:from-brand-600 hover:to-brand-800 transition-colors">
        <Link to={`/theory/${theory.id}`} className="min-w-0 flex-1 block py-0.5">
          <h2 className="text-base sm:text-lg font-semibold leading-snug text-white truncate">
            {title}
          </h2>
        </Link>
        <FavoriteButton
          theoryId={theory.id}
          initialFavorited={favorited}
          size="sm"
        />
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-5">
        <div className="min-w-0">
          <YouTubeThumbnail videoId={theory.youtubeId} title={title} />
        </div>

        <div className="min-w-0 flex flex-col">
          <p className="text-sm leading-relaxed text-slate-600">
            {summary}
          </p>

          <div className="mt-4">
            {theory.isSeed && theory.evidenceCount === 0 ? (
              <div className="rounded-md bg-amber-50 ring-1 ring-amber-200 px-3 py-2">
                <p className="text-xs font-medium text-amber-900">
                  {t.adminSeed.awaitingEvidence}
                </p>
              </div>
            ) : (
              <ScoreBar score={theory.score} />
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <DocIcon />
              <span className="font-mono-num text-slate-700">
                {theory.evidenceCount}
              </span>
              <span>{t.card.evidence}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <EyeIcon />
              <span className="font-mono-num text-slate-700">
                {formatCount(theory.viewCount ?? 0)}
              </span>
              <span>{t.card.views}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function DocIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M3.5 2.5h6L12.5 5.5v8h-9z" strokeLinejoin="round" />
      <path d="M9.5 2.5v3h3" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}
