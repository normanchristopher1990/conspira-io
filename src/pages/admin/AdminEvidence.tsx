import { useState } from 'react';
import { Link } from 'react-router-dom';
import { triggerReview } from '../../lib/api';
import { useEvidenceNeedingReview, useRealtimeTable } from '../../lib/hooks';
import { useI18n } from '../../lib/i18n';

// Admin queue of evidence rows that still need a score. Approximates
// "unrated" as score = 0 on accepted theories — replace once CON-16 lands
// (nullable score). Re-run review fires the parent theory through Claude,
// which will write evidence_concerns back to theories.ai_review.
export default function AdminEvidence() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useEvidenceNeedingReview();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  useRealtimeTable('evidence', refetch);

  async function reReview(theoryId: string, evidenceId: string) {
    setActionError(null);
    setBusyId(evidenceId);
    try {
      await triggerReview(theoryId);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.admin.rerunFailed);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="pb-16">
      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t.admin.evidenceTitle}
        </h1>
        <button
          type="button"
          onClick={refetch}
          className="text-xs font-medium text-brand hover:underline"
        >
          {t.admin.refresh}
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-600">{t.admin.evidenceIntro}</p>

      {actionError && (
        <p className="mt-4 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
          {actionError}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {error ? (
          <div className="rounded-xl border border-score-bad/30 bg-score-bad/5 p-6 text-sm text-score-bad">
            {error.message}
          </div>
        ) : loading ? (
          <p className="text-sm text-muted">{t.admin.queueLoading}</p>
        ) : (data ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {t.admin.evidenceEmpty}
          </p>
        ) : (
          (data ?? []).map((ev) => {
            const busy = busyId === ev.id;
            return (
              <article
                key={ev.id}
                className="rounded-xl bg-white ring-1 ring-line shadow-card p-5"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {ev.type}
                    </span>
                    <span
                      className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor:
                          ev.stance === 'supporting' ? 'rgba(31,138,76,0.1)' : 'rgba(192,57,43,0.1)',
                        color: ev.stance === 'supporting' ? '#1F8A4C' : '#C0392B',
                      }}
                    >
                      {ev.stance}
                    </span>
                    <h2 className="mt-1 text-base font-semibold text-ink">{ev.title}</h2>
                    <p className="mt-0.5 text-xs text-muted">
                      <Link
                        to={`/theory/${ev.theoryId}`}
                        className="text-brand hover:underline"
                      >
                        {ev.theoryTitle}
                      </Link>
                      {' · '}
                      <span>{ev.source}</span>
                      {ev.url && (
                        <>
                          {' · '}
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-brand"
                          >
                            {t.admin.openSource} ↗
                          </a>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      <Link
                        to={`/u/${ev.submittedBy}`}
                        className="text-slate-500 hover:text-brand"
                      >
                        {ev.submittedBy}
                      </Link>{' '}
                      ·{' '}
                      <span className="font-mono-num">
                        {new Date(ev.submittedAt).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] uppercase tracking-widest text-muted">
                      {t.admin.evidenceScore}
                    </p>
                    <p className="font-mono-num text-2xl font-bold text-muted">
                      {ev.score}
                      <span className="text-sm font-normal">/5</span>
                    </p>
                    <p className="text-[11px] text-muted">{t.admin.evidenceUnrated}</p>
                  </div>
                </header>

                {ev.description && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {ev.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Link
                    to={`/theory/${ev.theoryId}`}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
                  >
                    {t.admin.openTheory}
                  </Link>
                  <button
                    type="button"
                    onClick={() => reReview(ev.theoryId, ev.id)}
                    disabled={busy}
                    className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {busy ? t.admin.working : t.admin.rerunReview}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
