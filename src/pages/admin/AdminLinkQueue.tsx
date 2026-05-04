import { useState } from 'react';
import { Link } from 'react-router-dom';
import { decideTheoryLink } from '../../lib/api';
import { usePendingLinkRequests, useRealtimeTable } from '../../lib/hooks';
import { useI18n } from '../../lib/i18n';
import { localizeTheory } from '../../lib/localize';

export default function AdminLinkQueue() {
  const { t, lang } = useI18n();
  const { data, loading, error, refetch } = usePendingLinkRequests();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  useRealtimeTable('theory_links', refetch);

  async function approve(parentId: string, childId: string) {
    setActionError(null);
    const key = `${parentId}:${childId}`;
    setBusyKey(key);
    try {
      await decideTheoryLink(parentId, childId, 'approved');
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.admin.actionFailed);
    } finally {
      setBusyKey(null);
    }
  }

  async function reject(parentId: string, childId: string) {
    if (!window.confirm(t.admin.linkConfirmReject)) return;
    const reason = window.prompt(t.admin.linkRejectReason) ?? undefined;
    setActionError(null);
    const key = `${parentId}:${childId}`;
    setBusyKey(key);
    try {
      await decideTheoryLink(parentId, childId, 'rejected', reason || undefined);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.admin.actionFailed);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="pb-16">
      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t.admin.linksTitle}
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
          <p className="text-sm text-score-bad">{error.message}</p>
        ) : loading ? (
          <p className="text-sm text-muted">{t.admin.queueLoading}</p>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {t.admin.linksEmpty}
          </div>
        ) : (
          (data ?? []).map((req) => {
            const key = `${req.link.parentId}:${req.link.childId}`;
            const busy = busyKey === key;
            const parentTitle = localizeTheory(req.parent, lang).title;
            const childTitle = localizeTheory(req.child, lang).title;
            return (
              <article
                key={key}
                className="bg-white rounded-xl ring-1 ring-line shadow-card p-5 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TheoryRef
                    label={t.admin.linkParent}
                    title={parentTitle}
                    score={req.parent.score}
                    href={`/theory/${req.parent.id}`}
                  />
                  <TheoryRef
                    label={t.admin.linkChild}
                    title={childTitle}
                    score={req.child.score}
                    href={`/theory/${req.child.id}`}
                  />
                </div>

                <p className="text-xs text-muted">
                  {t.admin.linkRequestedBy}: <span className="font-medium text-ink">@{req.requesterUsername}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => approve(req.link.parentId, req.link.childId)}
                    disabled={busy}
                    className="rounded-md bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {busy ? t.admin.working : t.admin.linkApprove}
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(req.link.parentId, req.link.childId)}
                    disabled={busy}
                    className="rounded-md border border-line bg-white px-4 py-1.5 text-xs font-medium text-ink hover:border-slate-300 disabled:opacity-60"
                  >
                    {t.admin.linkReject}
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

function TheoryRef({
  label,
  title,
  score,
  href,
}: {
  label: string;
  title: string;
  score: number;
  href: string;
}) {
  return (
    <div className="rounded-md border border-line bg-bg p-3">
      <p className="text-[10px] font-mono-num uppercase tracking-widest text-muted">
        {label}
      </p>
      <Link
        to={href}
        className="mt-1 block text-sm font-medium text-ink hover:text-brand line-clamp-2"
      >
        {title}
      </Link>
      <p className="mt-1 font-mono-num text-xs text-muted">{score}/9</p>
    </div>
  );
}
