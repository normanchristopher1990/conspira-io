import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import type { Theory } from '../lib/types';
import CategoryBanner from './CategoryBanner';
import ScoreBar from './ScoreBar';
import YouTubeThumbnail from './YouTubeThumbnail';

type Props = { theory: Theory };

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export default function TheoryCard({ theory }: Props) {
  const { t } = useI18n();
  return (
    <article className="group bg-white rounded-xl shadow-card ring-1 ring-line overflow-hidden transition-shadow hover:shadow-md">
      <CategoryBanner category={theory.category} />

      <div className="p-5 grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-5">
        <div className="min-w-0">
          <YouTubeThumbnail videoId={theory.youtubeId} title={theory.title} />
        </div>

        <div className="min-w-0 flex flex-col">
          <h2 className="text-lg font-semibold leading-snug text-ink">
            <Link
              to={`/theory/${theory.id}`}
              className="hover:text-brand transition-colors"
            >
              {theory.title}
            </Link>
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {theory.summary}
          </p>

          <div className="mt-4">
            <ScoreBar score={theory.score} />
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
