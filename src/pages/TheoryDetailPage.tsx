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
import type { Evidence, EvidenceScore } from '../lib/types';

type Tab = 'evidence' | 'discussion' | 'timeline';
type EvidenceFilter = 'all' | 'positive' | 'neutral' | 'negative';

function bucket(score: EvidenceScore): EvidenceFilter {
  if (score === 0) return 'all';
  if (score <= 2) return 'negative';
  if (score === 3) return 'neutral';
  return 'positive';
}

function applyFilter(items: Evidence[], filter: EvidenceFilter): Evidence[] {
  if (filter === 'all') return items;
  return items.filter((e) => bucket(e.score) === filter);
}

export default function TheoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: theory, loading, error } = useTheory(id);
  const { data: allEvidence } = useEvidence(id);
  const { data: aiReview } = useAiReview(id);
  const { data: comments } = useComments(id);
  const { profile: meProfile, isAdmin } = useAuth();
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
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.');
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-score-bad">Failed to load theory: {error.message}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          ← Back to homepage
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
        <p className="text-sm text-muted">Theory not found.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          ← Back to homepage
        </Link>
      </main>
    );
  }

  const cat = getCategory(theory.category);
  const evidenceCount = (allEvidence ?? []).length;
  const commentCount = (comments ?? []).length;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <div className="pt-4 flex items-center justify-between gap-3 flex-wrap">
        <Link to="/" className="text-xs font-medium text-muted hover:text-brand">
          ← Back to feed
        </Link>
        <div className="flex items-center gap-3">
          {meProfile?.username === theory.submittedBy && (
            <Link
              to={`/theory/${theory.id}/edit`}
              className="text-xs font-medium text-brand hover:underline"
            >
              Edit theory
            </Link>
          )}
          {((meProfile?.username === theory.submittedBy && theory.status !== 'accepted') ||
            isAdmin) &&
            (confirmDel ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-xs font-medium text-score-bad">
                  Delete permanently?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-md bg-score-bad px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDel(false)}
                  disabled={deleting}
                  className="text-xs text-muted hover:text-ink"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                className="text-xs font-medium text-score-bad hover:underline"
              >
                Delete theory
              </button>
            ))}
          <Link
            to={`/takedowns/new?theory=${theory.id}`}
            className="text-xs font-medium text-muted hover:text-score-bad"
          >
            Request takedown
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
            {cat.label}
          </span>

          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            {theory.title}
          </h1>

          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            {theory.summary}
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
            <div>
              <YouTubeEmbed videoId={theory.youtubeId} title={theory.title} />
            </div>
            <div className="rounded-lg ring-1 ring-line bg-slate-50 p-4">
              <h2 className="text-xs uppercase tracking-widest text-muted">
                Theory score
              </h2>
              <div className="mt-3">
                <ScoreBar score={theory.score} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Stat label="Evidence" value={`${theory.evidenceCount}`} />
                <Stat label="Independent sources" value={`${theory.independentSources}`} />
                <Stat label="Submitted by" value={theory.submittedBy} mono={false} />
                <Stat
                  label="Submitted"
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

      <AiReviewPanel review={aiReview} />

      <nav className="mt-8 flex items-center gap-1 border-b border-line overflow-x-auto scroll-hide">
        <TabButton active={tab === 'evidence'} onClick={() => setTab('evidence')}>
          Evidence{' '}
          <span className="ml-1 text-muted font-normal">({evidenceCount})</span>
        </TabButton>
        <TabButton active={tab === 'discussion'} onClick={() => setTab('discussion')}>
          Discussion{' '}
          <span className="ml-1 text-muted font-normal">({commentCount})</span>
        </TabButton>
        <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}>
          Timeline
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
}: {
  theoryId: string;
  allEvidence: Evidence[];
  evidence: Evidence[];
  filter: EvidenceFilter;
  setFilter: (f: EvidenceFilter) => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/theory/${theoryId}/add-evidence`}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-3 py-1 text-xs font-medium text-brand hover:border-brand"
          >
            + Add evidence
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterPill
            active={filter === 'positive'}
            onClick={() => setFilter('positive')}
            label="Supporting"
            dot="#1F8A4C"
          />
          <FilterPill
            active={filter === 'neutral'}
            onClick={() => setFilter('neutral')}
            label="Neutral"
            dot="#9CA3AF"
          />
          <FilterPill
            active={filter === 'negative'}
            onClick={() => setFilter('negative')}
            label="Contradicting"
            dot="#C0392B"
          />
        </div>
      </div>

      {evidence.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
          {allEvidence.length === 0
            ? 'No evidence has been catalogued for this theory yet.'
            : 'No evidence matches the selected filter.'}
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
