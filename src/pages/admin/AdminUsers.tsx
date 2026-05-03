import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setUserAdmin } from '../../lib/api';
import { useAllProfiles } from '../../lib/hooks';
import { useI18n } from '../../lib/i18n';

export default function AdminUsers() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useAllProfiles();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    setActionError(null);
    setBusyId(userId);
    try {
      await setUserAdmin(userId, makeAdmin);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.admin.failed);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="pb-16">
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
        {t.admin.usersTitle}
      </h1>

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
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl ring-1 ring-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-muted">
              <tr>
                <Th>{t.admin.usersHeaders.username}</Th>
                <Th>{t.admin.usersHeaders.joined}</Th>
                <Th>{t.admin.usersHeaders.rank}</Th>
                <Th>{t.admin.usersHeaders.expert}</Th>
                <Th>{t.admin.usersHeaders.accepted}</Th>
                <Th>{t.admin.usersHeaders.admin}</Th>
                <Th>{t.admin.usersHeaders.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(data ?? []).map((p) => {
                const isBusy = busyId === p.id;
                return (
                  <tr key={p.id}>
                    <Td>
                      <Link
                        to={`/u/${p.username}`}
                        className="text-ink hover:text-brand"
                      >
                        {p.username}
                      </Link>
                      {p.real_name && (
                        <span className="ml-2 text-muted">{p.real_name}</span>
                      )}
                    </Td>
                    <Td mono>
                      {new Date(p.created_at).toLocaleDateString(undefined, {
                        year: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Td>
                    <Td>{t.rank[p.rank].label}</Td>
                    <Td>
                      {p.expert_level === 'verified' ? (
                        <span className="text-brand">verified</span>
                      ) : (
                        <span className="text-muted">{p.expert_level.replace('_', ' ')}</span>
                      )}
                    </Td>
                    <Td mono>{p.accepted_count}</Td>
                    <Td>
                      {p.is_admin ? (
                        <span className="font-medium text-brand">{t.admin.usersHeaders.admin}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      {p.is_admin ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => toggleAdmin(p.id, false)}
                          className="rounded border border-line bg-white px-2 py-1 text-xs text-score-bad hover:border-score-bad/40 disabled:opacity-50"
                        >
                          {t.admin.revokeAdmin}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => toggleAdmin(p.id, true)}
                          className="rounded border border-line bg-white px-2 py-1 text-xs text-ink hover:border-slate-300 disabled:opacity-50"
                        >
                          {t.admin.makeAdmin}
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={'px-4 py-3 align-top ' + (mono ? 'font-mono-num text-xs text-slate-700' : '')}>
      {children}
    </td>
  );
}
