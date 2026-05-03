import { useState } from 'react';
import { Link } from 'react-router-dom';
import ScoreBar from '../../components/ScoreBar';
import { setTheoryStatus, triggerReview } from '../../lib/api';
import { getCategory } from '../../lib/categories';
import { usePendingTheories, useRealtimeTable } from '../../lib/hooks';
import { useI18n } from '../../lib/i18n';

export default function AdminTheoriesQueue() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = usePendingTheories();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  useRealtimeTable('theories', refetch);

  async function decide(id: string, status: 'accepted' | 'rejected') {
    setActionError(null);
    setBusyId(id);
    try {
      await setTheoryStatus(id, status);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.admin.actionFailed);
    } finally {
      setBusyId(null);
    }
  }

  async function reReview(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await triggerReview(id);
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
          {t.admin.queueTitle}
        </h1>
        <button
          type="button"
          onClick={refetch}
          className="text-xs font-medium text-brand hover:underline"
        >
          {t.admin.refresh}
        </button>
      </div>

      {actionError && (
        <p className="mt-4 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
          {actionError}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {error ? (
          <ErrorBox message={error.message} />
        ) : loading ? (
          <div className="text-sm text-muted">{t.admin.queueLoading}</div>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {t.admin.queueEmpty}
          </div>
        ) : (
          (data ?? []).map((theoryRow) => {
            const cat = getCategory(theoryRow.category);
            const busy = busyId === theoryRow.id;
            return (
              <article
                key={theoryRow.id}
                className="rounded-xl bg-white ring-1 ring-line shadow-card p-5"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1"
                      style={{ color: cat.hue, borderColor: `${cat.hue}55` }}
                    >
                      {t.category[cat.slug]}
                    </span>
                    <h2 className="mt-1 text-base font-semibold text-ink">
                      <Link
                        to={`/theory/${theoryRow.id}`}
                        className="hover:text-brand transition-colors"
                      >
                        {theoryRow.title}
                      </Link>
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      <Link
                        to={`/u/${theoryRow.submittedBy}`}
                        className="text-slate-500 hover:text-brand"
                      >
                        {theoryRow.submittedBy}
                      </Link>{' '}
                      ·{' '}
                      <span className="font-mono-num">
                        {new Date(theoryRow.submittedAt).toLocaleString()}
                      </span>{' '}
                      · {theoryRow.evidenceCount} {t.card.evidence}
                    </p>
                  </div>
                  <div className="w-44 shrink-0">
                    <ScoreBar score={theoryRow.score} />
                  </div>
                </header>

                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {theoryRow.summary}
                </p>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => reReview(theoryRow.id)}
                    disabled={busy}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-60"
                  >
                    {t.admin.rerunReview}
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(theoryRow.id, 'rejected')}
                    disabled={busy}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium text-score-bad hover:border-score-bad/40 disabled:opacity-60"
                  >
                    {t.admin.reject}
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(theoryRow.id, 'accepted')}
                    disabled={busy}
                    className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {busy ? t.admin.working : t.admin.accept}
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

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-score-bad/30 bg-score-bad/5 p-6 text-sm text-score-bad">
      {message}
    </div>
  );
}
