import { Link } from 'react-router-dom';
import { useRealtimeTable, useTakedownsPublic } from '../lib/hooks';
import type { Takedown } from '../lib/api';

const STATUS_COLOR: Record<Takedown['status'], string> = {
  received: '#9CA3AF',
  declined: '#C0392B',
  accepted: '#1F8A4C',
};

export default function TakedownsPage() {
  const { data, loading, error, refetch } = useTakedownsPublic();
  useRealtimeTable('takedown_requests', refetch);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <div className="pt-6 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-mono-num uppercase tracking-widest text-muted">
            Public log
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Takedown requests
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            All takedown requests are publicly logged regardless of outcome —
            including the ones we decline. Requests without a specific legal
            basis are documented and declined by default. Names of individuals
            are not displayed; organisations and the legal basis are.
          </p>
        </div>
        <Link
          to="/takedowns/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Submit a request
        </Link>
      </div>

      <section className="mt-6">
        {error ? (
          <ErrorBox message={error.message} />
        ) : loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (data ?? []).length === 0 ? (
          <EmptyBox />
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-muted">
                <tr>
                  <Th>Date</Th>
                  <Th>Target</Th>
                  <Th>Organisation</Th>
                  <Th>Legal basis</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((t) => (
                  <tr key={t.id}>
                    <Td mono>
                      {new Date(t.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Td>
                    <Td>
                      {t.theory_id ? (
                        <Link
                          to={`/theory/${t.theory_id}`}
                          className="text-brand hover:underline"
                        >
                          theory
                        </Link>
                      ) : t.evidence_id ? (
                        <span>evidence</span>
                      ) : (
                        <span className="text-muted">platform</span>
                      )}
                    </Td>
                    <Td>{t.requester_org || <span className="text-muted">—</span>}</Td>
                    <Td>
                      <span className="line-clamp-2 text-slate-700">
                        {t.legal_basis || (
                          <span className="text-muted">No legal basis given</span>
                        )}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: STATUS_COLOR[t.status] }}
                      >
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR[t.status] }}
                        />
                        {t.status}
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
function EmptyBox() {
  return (
    <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
      No takedown requests received yet.
    </div>
  );
}
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-score-bad/30 bg-score-bad/5 p-6 text-sm text-score-bad">
      {message}
    </div>
  );
}
