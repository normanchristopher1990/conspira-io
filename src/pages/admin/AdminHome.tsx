import { Link } from 'react-router-dom';
import {
  useAllProfiles,
  useEvidenceNeedingReview,
  usePendingTheories,
  useRealtimeTable,
  useTakedownsAdmin,
} from '../../lib/hooks';
import { useI18n } from '../../lib/i18n';
import { localizeTheory } from '../../lib/localize';

// Admin landing page. Renders one summary card per moderation queue with a
// count, the latest three items, and a link to the dedicated queue page.
// Each card subscribes to its underlying table via realtime so the counts
// update live without manual refresh.
export default function AdminHome() {
  const { t, lang } = useI18n();
  const theories = usePendingTheories();
  const evidence = useEvidenceNeedingReview();
  const takedowns = useTakedownsAdmin();
  const profiles = useAllProfiles();

  useRealtimeTable('theories', theories.refetch);
  useRealtimeTable('evidence', evidence.refetch);
  useRealtimeTable('takedown_requests', takedowns.refetch);
  useRealtimeTable('profiles', profiles.refetch);

  // Profiles created in the last 7 days, newest first.
  const cutoffMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSignups = (profiles.data ?? [])
    .filter((p) => new Date(p.created_at).getTime() >= cutoffMs)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  const openTakedowns = (takedowns.data ?? []).filter((td) => td.status === 'received');

  return (
    <section className="pb-16">
      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t.admin.homeTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t.admin.homeIntro}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Theories queue */}
        <Card
          to="/admin/theories"
          eyebrow={t.admin.cards.theoriesEyebrow}
          title={t.admin.cards.theoriesTitle}
          count={theories.data?.length ?? 0}
          loading={theories.loading}
        >
          {(theories.data ?? []).slice(0, 3).map((th) => {
            const loc = localizeTheory(th, lang);
            return (
              <PreviewRow
                key={th.id}
                primary={loc.title}
                secondary={`${th.submittedBy} · ${new Date(th.submittedAt).toLocaleDateString()}`}
              />
            );
          })}
          {theories.data && theories.data.length === 0 && (
            <p className="text-xs text-muted italic">{t.admin.cards.empty}</p>
          )}
        </Card>

        {/* Evidence queue */}
        <Card
          to="/admin/evidence"
          eyebrow={t.admin.cards.evidenceEyebrow}
          title={t.admin.cards.evidenceTitle}
          count={evidence.data?.length ?? 0}
          loading={evidence.loading}
        >
          {(evidence.data ?? []).slice(0, 3).map((ev) => (
            <PreviewRow
              key={ev.id}
              primary={ev.title}
              secondary={`${ev.type} · ${ev.theoryTitle}`}
            />
          ))}
          {evidence.data && evidence.data.length === 0 && (
            <p className="text-xs text-muted italic">{t.admin.cards.empty}</p>
          )}
        </Card>

        {/* Open takedowns */}
        <Card
          to="/admin/takedowns"
          eyebrow={t.admin.cards.takedownsEyebrow}
          title={t.admin.cards.takedownsTitle}
          count={openTakedowns.length}
          loading={takedowns.loading}
        >
          {openTakedowns.slice(0, 3).map((td) => (
            <PreviewRow
              key={td.id}
              primary={td.legal_basis || t.admin.noBasis}
              secondary={`${td.requester_org ?? t.admin.cards.unknownRequester} · ${new Date(td.created_at).toLocaleDateString()}`}
            />
          ))}
          {openTakedowns.length === 0 && !takedowns.loading && (
            <p className="text-xs text-muted italic">{t.admin.cards.empty}</p>
          )}
        </Card>

        {/* Recent signups */}
        <Card
          to="/admin/users"
          eyebrow={t.admin.cards.signupsEyebrow}
          title={t.admin.cards.signupsTitle}
          count={recentSignups.length}
          loading={profiles.loading}
        >
          {recentSignups.slice(0, 3).map((p) => (
            <PreviewRow
              key={p.id}
              primary={p.username}
              secondary={`${t.rank[p.rank].label} · ${new Date(p.created_at).toLocaleDateString()}`}
            />
          ))}
          {recentSignups.length === 0 && !profiles.loading && (
            <p className="text-xs text-muted italic">{t.admin.cards.empty}</p>
          )}
        </Card>
      </div>
    </section>
  );
}

type CardProps = {
  to: string;
  eyebrow: string;
  title: string;
  count: number;
  loading: boolean;
  children?: React.ReactNode;
};

function Card({ to, eyebrow, title, count, loading, children }: CardProps) {
  return (
    <Link
      to={to}
      className="block rounded-xl bg-white ring-1 ring-line shadow-card p-5 transition-colors hover:ring-brand/40"
    >
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-mono-num uppercase tracking-widest text-muted">
          {eyebrow}
        </p>
        <span className="font-mono-num text-3xl font-bold text-ink">
          {loading ? '…' : count}
        </span>
      </header>
      <h2 className="mt-1 text-base font-semibold text-ink">{title}</h2>
      <div className="mt-3 space-y-1.5 min-h-[60px]">{children}</div>
      <span className="mt-3 inline-block text-xs font-medium text-brand hover:underline">
        View all →
      </span>
    </Link>
  );
}

function PreviewRow({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="truncate">
      <span className="text-sm text-ink">{primary}</span>
      <span className="text-xs text-muted"> · {secondary}</span>
    </div>
  );
}
