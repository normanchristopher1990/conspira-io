import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AiReviewPanel from '../components/AiReviewPanel';
import CategoryBanner from '../components/CategoryBanner';
import CommentsSection from '../components/CommentsSection';
import EvidenceRow from '../components/EvidenceRow';
import ScoreBar from '../components/ScoreBar';
import TimelineSection from '../components/TimelineSection';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { deleteTheory, incrementViews } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getCategory } from '../lib/categories';
import { useAiReview, useComments, useEvidence, useTheory } from '../lib/hooks';
import { useI18n, type Strings } from '../lib/i18n';
import { localizeTheory } from '../lib/localize';
import type { Evidence } from '../lib/types';

type Tab = 'evidence' | 'discussion' | 'timeline';
type EvidenceFilter = 'all' | 'supporting' | 'contradicting';

function applyFilter(items: Evidence[], filter: EvidenceFilter): Evidence[] {
  if (filter === 'all') return items;
  return items.filter((e) => e.stance === filter);
}

export default function TheoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: theory, loading, error } = useTheory(id);
  const { data: allEvidence } = useEvidence(id);
  const { data: aiReview, refetch: refetchAiReview } = useAiReview(id);
  const { data: comments } = useComments(id);
  const { profile: meProfile, isAdmin } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('evidence');
  const [filter, setFilter] = useState<EvidenceFilter>('all');
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const evidence = useMemo(
    () => applyFilter(allEvidence ?? [], filter),
    [allEvidence, filter],
  );

  // Bump the view counter once when the theory loads.
  useEffect(() => {
    if (id) void incrementViews(id);
  }, [id]);

  async function handleDelete() {
    if (!theory) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteTheory(theory.id);
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t.detail.deleteFailed);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-score-bad">{t.detail.failedToLoad(error.message)}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          {t.detail.backHome}
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <div className="mt-6 h-[420px] rounded-xl bg-white ring-1 ring-line shadow-card animate-pulse" />
      </main>
    );
  }

  if (!theory) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t.detail.notFound}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          {t.detail.backHome}
        </Link>
      </main>
    );
  }

  const cat = getCategory(theory.category);
  const evidenceCount = (allEvidence ?? []).length;
  const commentCount = (comments ?? []).length;
  const localized = localizeTheory(theory, lang);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <div className="pt-4 flex items-center justify-between gap-3 flex-wrap">
        <Link to="/" className="text-xs font-medium text-muted hover:text-brand">
          {t.detail.backToFeed}
        </Link>
        <div className="flex items-center gap-3">
          {meProfile?.username === theory.submittedBy && (
            <Link
              to={`/theory/${theory.id}/edit`}
              className="text-xs font-medium text-brand hover:underline"
            >
              {t.detail.editTheory}
            </Link>
          )}
          {((meProfile?.username === theory.submittedBy && theory.status !== 'accepted') ||
            isAdmin) &&
            (confirmDel ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-xs font-medium text-score-bad">
                  {t.detail.deleteConfirm}
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-md bg-score-bad px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {deleting ? t.detail.deleting : t.detail.yesDelete}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDel(false)}
                  disabled={deleting}
                  className="text-xs text-muted hover:text-ink"
                >
                  {t.detail.cancel}
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                className="text-xs font-medium text-score-bad hover:underline"
              >
                {t.detail.deleteTheory}
              </button>
            ))}
          <Link
            to={`/takedowns/new?theory=${theory.id}`}
            className="text-xs font-medium text-muted hover:text-score-bad"
          >
            {t.detail.requestTakedown}
          </Link>
        </div>
      </div>
      {deleteError && (
        <p className="mt-2 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
          {deleteError}
        </p>
      )}

      <article className="mt-3 bg-white rounded-xl shadow-card ring-1 ring-line overflow-hidden">
        <CategoryBanner category={theory.category} />

        <div className="p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1"
            style={{ color: cat.hue, borderColor: `${cat.hue}55` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: cat.hue }}
              aria-hidden
            />
            {t.category[cat.slug]}
          </span>

          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            {localized.title}
          </h1>

          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            {localized.summary}
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
            <div>
              <YouTubeEmbed videoId={theory.youtubeId} title={localized.title} />
            </div>
            <div className="rounded-lg ring-1 ring-line bg-slate-50 p-4">
              <h2 className="text-xs uppercase tracking-widest text-muted">
                {t.detail.theoryScore}
              </h2>
              <div className="mt-3">
                <ScoreBar score={theory.score} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Stat label={t.detail.evidence} value={`${theory.evidenceCount}`} />
                <Stat label={t.detail.sources} value={`${theory.independentSources}`} />
                <Stat label={t.detail.submittedBy} value={theory.submittedBy} mono={false} />
                <Stat
                  label={t.detail.submitted}
                  value={new Date(theory.submittedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                />
              </dl>
            </div>
          </div>
        </div>
      </article>

      <AiReviewPanel review={aiReview} theoryId={theory.id} onRefresh={refetchAiReview} />

      <nav className="mt-8 flex items-center gap-1 border-b border-line overflow-x-auto scroll-hide">
        <TabButton active={tab === 'evidence'} onClick={() => setTab('evidence')}>
          {t.detail.tabEvidence}{' '}
          <span className="ml-1 text-muted font-normal">({evidenceCount})</span>
        </TabButton>
        <TabButton active={tab === 'discussion'} onClick={() => setTab('discussion')}>
          {t.detail.tabDiscussion}{' '}
          <span className="ml-1 text-muted font-normal">({commentCount})</span>
        </TabButton>
        <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}>
          {t.detail.tabTimeline}
        </TabButton>
      </nav>

      <div className="mt-6">
        {tab === 'evidence' && (
          <EvidencePane
            theoryId={theory.id}
            allEvidence={allEvidence ?? []}
            evidence={evidence}
            filter={filter}
            setFilter={setFilter}
            t={t}
          />
        )}
        {tab === 'discussion' && <CommentsSection theoryId={theory.id} />}
        {tab === 'timeline' && <TimelineSection evidence={allEvidence ?? []} />}
      </div>
    </main>
  );
}

function EvidencePane({
  theoryId,
  allEvidence,
  evidence,
  filter,
  setFilter,
  t,
}: {
  theoryId: string;
  allEvidence: Evidence[];
  evidence: Evidence[];
  filter: EvidenceFilter;
  setFilter: (f: EvidenceFilter) => void;
  t: Strings;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/theory/${theoryId}/add-evidence`}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-3 py-1 text-xs font-medium text-brand hover:border-brand"
          >
            {t.detail.addEvidence}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} label={t.detail.filterAll} />
          <FilterPill
            active={filter === 'supporting'}
            onClick={() => setFilter('supporting')}
            label={t.detail.filterSupporting}
            dot="#16A34A"
          />
          <FilterPill
            active={filter === 'contradicting'}
            onClick={() => setFilter('contradicting')}
            label={t.detail.filterContradicting}
            dot="#DC2626"
          />
        </div>
      </div>

      {evidence.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
          {allEvidence.length === 0 ? t.detail.noEvidenceYet : t.detail.noEvidenceMatch}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {evidence.map((e) => (
            <EvidenceRow key={e.id} evidence={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'relative -mb-px shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ' +
        (active
          ? 'text-ink border-brand'
          : 'text-muted hover:text-ink border-transparent')
      }
    >
      {children}
    </button>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className={'mt-0.5 text-ink ' + (mono ? 'font-mono-num' : 'font-medium')}>
        {value}
      </dd>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ' +
        (active
          ? 'border-brand bg-brand text-white'
          : 'border-line bg-white text-slate-700 hover:border-slate-300')
      }
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: active ? '#fff' : dot }}
          aria-hidden
        />
      )}
      {label}
    </button>
  );
}
