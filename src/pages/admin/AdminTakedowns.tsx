import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setTakedownStatus, type Takedown } from '../../lib/api';
import { useRealtimeTable, useTakedownsAdmin } from '../../lib/hooks';

const STATUS_COLOR: Record<Takedown['status'], string> = {
  received: '#9CA3AF',
  declined: '#C0392B',
  accepted: '#1F8A4C',
};

export default function AdminTakedowns() {
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
      setActionError(err instanceof Error ? err.message : 'Failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="pb-16">
      <div className="mt-4 flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Takedown requests
        </h1>
        <Link
          to="/takedowns"
          className="text-xs font-medium text-brand hover:underline"
        >
          View public log →
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
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : (data ?? []).length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No takedown requests received yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {(data ?? []).map((t) => {
            const busy = busyId === t.id;
            return (
              <li
                key={t.id}
                className="rounded-xl bg-white ring-1 ring-line p-4"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">
                      <span className="font-mono-num text-slate-700">
                        {new Date(t.created_at).toLocaleString()}
                      </span>
                      {' · '}
                      <span
                        className="inline-flex items-center gap-1 font-medium"
                        style={{ color: STATUS_COLOR[t.status] }}
                      >
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR[t.status] }}
                        />
                        {t.status}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {t.theory_id ? (
                        <Link
                          to={`/theory/${t.theory_id}`}
                          className="text-brand hover:underline"
                        >
                          theory
                        </Link>
                      ) : t.evidence_id ? (
                        <span>evidence (id {t.evidence_id.slice(0, 8)})</span>
                      ) : (
                        <span className="text-muted">platform-wide</span>
                      )}
                      {t.requester_org && <> · {t.requester_org}</>}
                      {t.requester_name && (
                        <span className="text-muted"> · {t.requester_name}</span>
                      )}
                    </p>
                    {t.legal_basis ? (
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {t.legal_basis}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted italic">
                        No legal basis provided.
                      </p>
                    )}
                    {t.notes && (
                      <p className="mt-2 text-xs text-slate-500">
                        Note: {t.notes}
                      </p>
                    )}
                  </div>
                </header>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy || t.status === 'received'}
                    onClick={() => setStatus(t.id, 'received')}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-40"
                  >
                    Mark received
                  </button>
                  <button
                    type="button"
                    disabled={busy || t.status === 'declined'}
                    onClick={() => setStatus(t.id, 'declined')}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-score-bad hover:border-score-bad/40 disabled:opacity-40"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={busy || t.status === 'accepted'}
                    onClick={() => setStatus(t.id, 'accepted')}
                    className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
                  >
                    Accept
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
