import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Field from '../components/form/Field';
import { Select, TextInput, Textarea } from '../components/form/inputs';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { deleteTheory, updateTheory } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../lib/categories';
import { useTheory } from '../lib/hooks';
import { parseYoutubeId } from '../lib/youtube';
import type { CategorySlug } from '../lib/types';
import { SUMMARY_MAX } from './submit/wizardState';

export default function EditTheoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: meProfile, isConfigured } = useAuth();
  const navigate = useNavigate();
  const { data: theory, loading } = useTheory(id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategorySlug | ''>('');
  const [summary, setSummary] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!theory) return;
    setTitle(theory.title);
    setCategory(theory.category);
    setSummary(theory.summary);
    setYoutubeUrl(theory.youtubeId ?? '');
  }, [theory]);

  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted">
        Editing requires Supabase to be configured.
      </main>
    );
  }
  if (!user) return <Navigate to={`/login?next=/theory/${id}/edit`} replace />;

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted">
        Loading…
      </main>
    );
  }
  if (!theory) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted">
        Theory not found.
      </main>
    );
  }

  // RLS will block non-owners at the DB level too. Gate the UI by username.
  const isOwner = meProfile?.username === theory.submittedBy;
  if (meProfile && !isOwner) {
    return <Navigate to={`/theory/${id}`} replace />;
  }

  const ytId = parseYoutubeId(youtubeUrl);
  const ytShowError = youtubeUrl.trim().length > 0 && !ytId;

  function validate(): string | null {
    if (title.trim().length < 6) return 'Title must be at least 6 characters.';
    if (!category) return 'Pick a category.';
    if (summary.trim().length < 30) return 'Summary should be at least 30 characters.';
    if (summary.length > SUMMARY_MAX) return `Summary must be ${SUMMARY_MAX} characters or fewer.`;
    return null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) return setError(err);
    setBusy(true);
    try {
      await updateTheory(id!, {
        title: title.trim(),
        summary: summary.trim(),
        category_slug: category as CategorySlug,
        youtube_id: ytId,
      });
      navigate(`/theory/${id}`);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Update failed.');
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      await deleteTheory(id!);
      navigate('/');
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Delete failed.');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link to={`/theory/${id}`} className="text-xs font-medium text-muted hover:text-brand">
          ← Back to theory
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Edit theory
        </h1>
      </div>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-xl ring-1 ring-line bg-white p-5">
        <Field label="Title" required>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required />
        </Field>

        <Field label="Category" required>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategorySlug)}
          >
            <option value="">— select —</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Summary" required hint={`${summary.length} / ${SUMMARY_MAX}`}>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, SUMMARY_MAX))}
          />
        </Field>

        <Field
          label="YouTube link"
          hint="Optional"
          error={ytShowError ? "That doesn't look like a valid YouTube URL." : undefined}
        >
          <TextInput value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
        </Field>

        {ytId && (
          <div className="rounded-lg ring-1 ring-line bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Preview</p>
            <YouTubeEmbed videoId={ytId} title="Preview" />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {theory.status === 'accepted' ? (
            <span
              className="text-xs text-muted"
              title="Accepted theories can't be deleted by the owner — file a takedown request instead."
            >
              Delete unavailable —{' '}
              <Link
                to={`/takedowns/new?theory=${id}`}
                className="text-brand hover:underline"
              >
                file a takedown
              </Link>
            </span>
          ) : !confirmDel ? (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              disabled={busy}
              className="text-sm font-medium text-score-bad hover:underline"
            >
              Delete theory
            </button>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-xs text-score-bad font-medium">Permanently delete?</span>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-md bg-score-bad px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                disabled={busy}
                className="text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
            </span>
          )}

          <div className="flex items-center gap-3">
            <Link to={`/theory/${id}`} className="text-sm text-slate-600 hover:text-ink">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
