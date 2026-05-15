import { useState } from 'react';
import { triggerReview, type AiReview } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

type Props = {
  review: AiReview | null;
  theoryId: string;
  onRefresh: () => void;
};

const THEMATIC_COLOR: Record<AiReview['thematic'], string> = {
  supporting: '#1F8A4C',
  contradicting: '#C0392B',
  mixed: '#9CA3AF',
  neutral: '#9CA3AF',
};

export default function AiReviewPanel({ review, theoryId, onRefresh }: Props) {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runReview() {
    setError(null);
    setBusy(true);
    try {
      await triggerReview(theoryId);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.aiReview.runFailed);
    } finally {
      setBusy(false);
    }
  }

  // Empty state — no review yet. Hide entirely from non-admins.
  if (!review) {
    if (!isAdmin) return null;
    return (
      <section className="mt-6 rounded-xl ring-1 ring-dashed ring-line bg-white p-5">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            {t.aiReview.heading}
          </h2>
          <span className="text-[11px] font-mono-num text-muted">
            {t.aiReview.adminOnlyHint}
          </span>
        </header>
        <p className="mt-2 text-sm text-slate-600">{t.aiReview.empty}</p>
        {error && (
          <p className="mt-2 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={runReview}
          disabled={busy}
          className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? t.aiReview.running : t.aiReview.runButton}
        </button>
      </section>
    );
  }

  const themeColor = THEMATIC_COLOR[review.thematic];
  const themeLabel = t.aiReview.thematic[review.thematic];

  return (
    <section className="mt-6 rounded-xl ring-1 ring-line bg-white p-5">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            {t.aiReview.heading}
          </h2>
          <span className="text-[11px] font-mono-num text-muted">
            {review.model}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-mono-num text-muted">
            {new Date(review.reviewed_at).toLocaleString()}
          </span>
          {isAdmin && (
            <button
              type="button"
              onClick={runReview}
              disabled={busy}
              className="text-[11px] font-medium text-brand hover:underline disabled:opacity-60"
            >
              {busy ? t.aiReview.running : t.aiReview.rerun}
            </button>
          )}
        </div>
      </header>

      {error && (
        <p className="mt-2 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
          {error}
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-baseline">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            {t.aiReview.suggestedScore}
          </p>
          <p className="font-mono-num text-3xl font-bold text-ink">
            {review.suggested_score}
            <span className="text-base text-muted font-normal">/9</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            {t.aiReview.thematicAlignment}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: themeColor }}
            />
            <span style={{ color: themeColor }}>{themeLabel}</span>
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
            {t.aiReview.reasoning}
          </p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {review.reasoning}
          </p>
        </div>
      )}

      {review.evidence_concerns.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">
            {t.aiReview.flags}
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
