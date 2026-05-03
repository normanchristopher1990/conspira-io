import { Link } from 'react-router-dom';
import { useRealtimeTable, useTakedownsPublic } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import type { Takedown } from '../lib/api';

const STATUS_COLOR: Record<Takedown['status'], string> = {
  received: '#9CA3AF',
  declined: '#C0392B',
  accepted: '#1F8A4C',
};

export default function TakedownsPage() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useTakedownsPublic();
  useRealtimeTable('takedown_requests', refetch);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <div className="pt-6 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-mono-num uppercase tracking-widest text-muted">
            {t.takedowns.publicLog}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {t.takedowns.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t.takedowns.intro}</p>
        </div>
        <Link
          to="/takedowns/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {t.takedowns.submitRequest}
        </Link>
      </div>

      <section className="mt-6">
        {error ? (
          <div className="rounded-xl border border-score-bad/30 bg-score-bad/5 p-6 text-sm text-score-bad">
            {error.message}
          </div>
        ) : loading ? (
          <p className="text-sm text-muted">{t.takedowns.loading}</p>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {t.takedowns.empty}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-muted">
                <tr>
                  <Th>{t.takedowns.headers.date}</Th>
                  <Th>{t.takedowns.headers.target}</Th>
                  <Th>{t.takedowns.headers.org}</Th>
                  <Th>{t.takedowns.headers.basis}</Th>
                  <Th>{t.takedowns.headers.status}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((td) => (
                  <tr key={td.id}>
                    <Td mono>
                      {new Date(td.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Td>
                    <Td>
                      {td.theory_id ? (
                        <Link
                          to={`/theory/${td.theory_id}`}
                          className="text-brand hover:underline"
                        >
                          {t.takedowns.targetTheory}
                        </Link>
                      ) : td.evidence_id ? (
                        <span>{t.takedowns.targetEvidence}</span>
                      ) : (
                        <span className="text-muted">{t.takedowns.targetPlatform}</span>
                      )}
                    </Td>
                    <Td>{td.requester_org || <span className="text-muted">—</span>}</Td>
                    <Td>
                      <span className="line-clamp-2 text-slate-700">
                        {td.legal_basis || (
                          <span className="text-muted">{t.takedowns.noLegalBasis}</span>
                        )}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: STATUS_COLOR[td.status] }}
                      >
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR[td.status] }}
                        />
                        {t.takedowns.statuses[td.status]}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
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
