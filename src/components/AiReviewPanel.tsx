import type { AiReview } from '../lib/api';

type Props = { review: AiReview | null };

const THEMATIC_LABEL: Record<AiReview['thematic'], { label: string; color: string }> = {
  supporting: { label: 'Neutral evidence leans supporting', color: '#1F8A4C' },
  contradicting: { label: 'Neutral evidence leans contradicting', color: '#C0392B' },
  mixed: { label: 'No clear directional alignment', color: '#9CA3AF' },
  neutral: { label: 'Insufficient neutral evidence to call', color: '#9CA3AF' },
};

export default function AiReviewPanel({ review }: Props) {
  if (!review) return null;
  const t = THEMATIC_LABEL[review.thematic];

  return (
    <section className="mt-6 rounded-xl ring-1 ring-line bg-white p-5">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            Automated review
          </h2>
          <span className="text-[11px] font-mono-num text-muted">
            {review.model}
          </span>
        </div>
        <span className="text-[11px] font-mono-num text-muted">
          {new Date(review.reviewed_at).toLocaleString()}
        </span>
      </header>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-baseline">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            Suggested score
          </p>
          <p className="font-mono-num text-3xl font-bold text-ink">
            {review.suggested_score}
            <span className="text-base text-muted font-normal">/9</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            Thematic alignment
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: t.color }}
            />
            <span style={{ color: t.color }}>{t.label}</span>
          </p>
          {review.thematic_analysis && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {review.thematic_analysis}
            </p>
          )}
        </div>
      </div>

      {review.reasoning && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">
            Reasoning (admin-only)
          </p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {review.reasoning}
          </p>
        </div>
      )}

      {review.evidence_concerns.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">
            Flags for admin
          </p>
          <ul className="mt-1 space-y-1 text-sm text-slate-700">
            {review.evidence_concerns.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-score-bad">•</span>
                <span>
                  <span className="font-mono-num text-xs text-muted">
                    {c.evidence_id.slice(0, 8)}
                  </span>{' '}
                  — {c.concern}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
