import { Link } from 'react-router-dom';
import type { Theory } from '../lib/types';
import CategoryBanner from './CategoryBanner';
import ScoreBar from './ScoreBar';
import YouTubeThumbnail from './YouTubeThumbnail';

type Props = { theory: Theory };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TheoryCard({ theory }: Props) {
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

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-3">
              <span className="font-mono-num">
                {theory.evidenceCount} evidence
              </span>
              <span aria-hidden>·</span>
              <span className="font-mono-num">
                {theory.independentSources} sources
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/u/${theory.submittedBy}`}
                className="text-slate-500 hover:text-brand"
              >
                @{theory.submittedBy}
              </Link>
              <span aria-hidden>·</span>
              <span className="font-mono-num">{formatDate(theory.submittedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
