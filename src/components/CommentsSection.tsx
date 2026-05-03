import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addComment, deleteComment, type Comment } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useComments, useRealtimeTable } from '../lib/hooks';
import {
  deriveRank,
  rankBadgeClasses,
  type ExpertLevel,
  type RankSlug,
} from '../lib/ranks';

type Props = { theoryId: string };

const MAX = 2000;

export default function CommentsSection({ theoryId }: Props) {
  const { user, profile, isAdmin } = useAuth();
  const { data, loading, error, refetch } = useComments(theoryId);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useRealtimeTable('comments', refetch);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!user || body.trim().length === 0) return;
    setBusy(true);
    try {
      await addComment(user.id, theoryId, body);
      setBody('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post comment.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteComment(id);
    } catch {
      // realtime + manual refetch will reconcile
    } finally {
      refetch();
    }
  }

  const comments = data ?? [];

  return (
    <section>
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Discussion{' '}
          <span className="text-muted font-normal">({comments.length})</span>
        </h2>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200">
          Discussion — does not affect score
        </span>
      </header>

      <div className="mt-4 rounded-xl ring-1 ring-line bg-white p-4">
        {user ? (
          <form onSubmit={submit}>
            <p className="text-xs text-muted">
              Commenting as{' '}
              <Link to="/me" className="font-medium text-ink hover:text-brand">
                @{profile?.username ?? 'you'}
              </Link>
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX))}
              placeholder="Add to the discussion…"
              className="mt-2 w-full min-h-[88px] resize-y rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50"
              disabled={busy}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono-num text-muted">
                {body.length} / {MAX}
              </span>
              <button
                type="submit"
                disabled={busy || body.trim().length === 0}
                className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {busy ? 'Posting…' : 'Post comment'}
              </button>
            </div>
            {submitError && (
              <p className="mt-2 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
                {submitError}
              </p>
            )}
          </form>
        ) : (
          <p className="text-sm text-slate-700">
            <Link
              to={`/login?next=/theory/${theoryId}`}
              className="font-medium text-brand hover:underline"
            >
              Log in
            </Link>{' '}
            or{' '}
            <Link
              to={`/register?next=/theory/${theoryId}`}
              className="font-medium text-brand hover:underline"
            >
              create an account
            </Link>{' '}
            to join the discussion.
          </p>
        )}
      </div>

      <div className="mt-4">
        {error ? (
          <p className="text-sm text-score-bad">
            Failed to load comments: {error.message}
          </p>
        ) : loading ? (
          <p className="text-sm text-muted">Loading discussion…</p>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
            No comments yet. Start the discussion.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                canDelete={user?.id === c.author.id || isAdmin}
                onDelete={() => remove(c.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CommentRow({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const rank = deriveRank(
    comment.author.accepted_count,
    comment.author.expert_level as ExpertLevel,
    comment.author.rank as RankSlug,
  );
  const [confirm, setConfirm] = useState(false);

  return (
    <li className="rounded-lg ring-1 ring-line bg-white p-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2">
          <Link
            to={`/u/${comment.author.username}`}
            className="text-sm font-semibold text-ink hover:text-brand"
          >
            @{comment.author.username}
          </Link>
          <span
            className={
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ' +
              rankBadgeClasses(rank.style)
            }
            title={rank.notes}
          >
            {rank.label}
          </span>
          {comment.author.is_admin && (
            <span className="text-[10px] font-mono-num text-brand">admin</span>
          )}
        </div>
        <time
          dateTime={comment.createdAt}
          className="text-xs font-mono-num text-muted"
          title={new Date(comment.createdAt).toLocaleString()}
        >
          {formatRelative(comment.createdAt)}
        </time>
      </header>
      <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {comment.body}
      </p>
      {canDelete && (
        <div className="mt-2 flex justify-end">
          {confirm ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-score-bad">Delete?</span>
              <button
                onClick={onDelete}
                className="text-xs font-semibold text-score-bad hover:underline"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="text-xs text-muted hover:text-score-bad"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = (Date.now() - then) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
