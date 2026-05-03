import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setTakedownStatus, type Takedown } from '../../lib/api';
import { useRealtimeTable, useTakedownsAdmin } from '../../lib/hooks';
import { useI18n } from '../../lib/i18n';

const STATUS_COLOR: Record<Takedown['status'], string> = {
  received: '#9CA3AF',
  declined: '#C0392B',
  accepted: '#1F8A4C',
};

export default function AdminTakedowns() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useTakedownsAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  useRealtimeTable('takedown_requests', refetch);

  async function setStatus(id: string, status: Takedown['status']) {
    setActionError(null);
    setBusyId(id);
    try {
      await setTakedownStatus(id, status);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.admin.failed);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="pb-16">
      <div className="mt-4 flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t.admin.takedownsTitle}
        </h1>
        <Link
          to="/takedowns"
          className="text-xs font-medium text-brand hover:underline"
        >
          {t.admin.viewPublicLog}
        </Link>
      </div>

      {actionError && (
        <p className="mt-4 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
          {actionError}
        </p>
      )}

      {error ? (
        <div className="mt-6 rounded-xl border border-score-bad/30 bg-score-bad/5 p-6 text-sm text-score-bad">
          {error.message}
        </div>
      ) : loading ? (
        <p className="mt-6 text-sm text-muted">{t.takedowns.loading}</p>
      ) : (data ?? []).length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
          {t.admin.takedownsEmpty}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {(data ?? []).map((td) => {
            const busy = busyId === td.id;
            return (
              <li key={td.id} className="rounded-xl bg-white ring-1 ring-line p-4">
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">
                      <span className="font-mono-num text-slate-700">
                        {new Date(td.created_at).toLocaleString()}
                      </span>
                      {' · '}
                      <span
                        className="inline-flex items-center gap-1 font-medium"
                        style={{ color: STATUS_COLOR[td.status] }}
                      >
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR[td.status] }}
                        />
                        {t.takedowns.statuses[td.status]}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {td.theory_id ? (
                        <Link
                          to={`/theory/${td.theory_id}`}
                          className="text-brand hover:underline"
                        >
                          {t.takedowns.targetTheory}
                        </Link>
                      ) : td.evidence_id ? (
                        <span>
                          {t.takedowns.targetEvidence} (id {td.evidence_id.slice(0, 8)})
                        </span>
                      ) : (
                        <span className="text-muted">{t.takedowns.targetPlatform}</span>
                      )}
                      {td.requester_org && <> · {td.requester_org}</>}
                      {td.requester_name && (
                        <span className="text-muted"> · {td.requester_name}</span>
                      )}
                    </p>
                    {td.legal_basis ? (
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {td.legal_basis}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted italic">
                        {t.admin.noBasis}
                      </p>
                    )}
                    {td.notes && (
                      <p className="mt-2 text-xs text-slate-500">
                        {t.admin.notePrefix} {td.notes}
                      </p>
                    )}
                  </div>
                </header>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy || td.status === 'received'}
                    onClick={() => setStatus(td.id, 'received')}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-40"
                  >
                    {t.admin.markReceived}
                  </button>
                  <button
                    type="button"
                    disabled={busy || td.status === 'declined'}
                    onClick={() => setStatus(td.id, 'declined')}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-score-bad hover:border-score-bad/40 disabled:opacity-40"
                  >
                    {t.admin.decline}
                  </button>
                  <button
                    type="button"
                    disabled={busy || td.status === 'accepted'}
                    onClick={() => setStatus(td.id, 'accepted')}
                    className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
                  >
                    {t.admin.acceptTakedown}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
