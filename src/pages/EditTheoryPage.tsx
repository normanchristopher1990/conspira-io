import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Field from '../components/form/Field';
import { Select, TextInput, Textarea } from '../components/form/inputs';
import RelatedTheoryPicker from '../components/RelatedTheoryPicker';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { deleteTheory, updateTheory } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../lib/categories';
import { useTheory } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { parseYoutubeId } from '../lib/youtube';
import type { CategorySlug } from '../lib/types';
import { SUMMARY_MAX } from './submit/wizardState';

export default function EditTheoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: meProfile, isConfigured } = useAuth();
  const { t } = useI18n();
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
        {t.editTheory.needsSupabase}
      </main>
    );
  }
  if (!user) return <Navigate to={`/login?next=/theory/${id}/edit`} replace />;

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted">
        {t.editTheory.loading}
      </main>
    );
  }
  if (!theory) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted">
        {t.editTheory.notFound}
      </main>
    );
  }

  const isOwner = meProfile?.username === theory.submittedBy;
  if (meProfile && !isOwner) {
    return <Navigate to={`/theory/${id}`} replace />;
  }

  const ytId = parseYoutubeId(youtubeUrl);
  const ytShowError = youtubeUrl.trim().length > 0 && !ytId;

  function validate(): string | null {
    if (title.trim().length < 6) return t.submit.validation.titleMin;
    if (!category) return t.submit.validation.categoryRequired;
    if (summary.trim().length < 30) return t.submit.validation.summaryMin;
    if (summary.length > SUMMARY_MAX) return t.submit.validation.summaryMax(SUMMARY_MAX);
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
      setError(e2 instanceof Error ? e2.message : t.detail.deleteFailed);
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
      setError(e2 instanceof Error ? e2.message : t.detail.deleteFailed);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link to={`/theory/${id}`} className="text-xs font-medium text-muted hover:text-brand">
          {t.editTheory.backToTheory}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          {t.editTheory.title}
        </h1>
      </div>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-xl ring-1 ring-line bg-white p-5">
        <Field label={t.submit.step1.titleLabel} required>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required />
        </Field>

        <Field label={t.submit.step1.categoryLabel} required>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategorySlug)}
          >
            <option value="">{t.submit.step1.categoryPlaceholder}</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {t.category[c.slug]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={t.submit.step1.summaryLabel}
          required
          hint={`${summary.length} / ${SUMMARY_MAX}`}
        >
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, SUMMARY_MAX))}
          />
        </Field>

        <Field
          label={t.submit.step1.youtubeLabel}
          hint={t.submit.step1.youtubeHint}
          error={ytShowError ? t.submit.step1.youtubeError : undefined}
        >
          <TextInput value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
        </Field>

        {ytId && (
          <div className="rounded-lg ring-1 ring-line bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-2">
              {t.submit.step1.preview}
            </p>
            <YouTubeEmbed videoId={ytId} title={t.submit.step1.preview} />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {theory.status === 'accepted' ? (
            <span
              className="text-xs text-muted"
              title={t.editTheory.deleteUnavailable}
            >
              {t.editTheory.deleteUnavailable}{' '}
              <Link
                to={`/takedowns/new?theory=${id}`}
                className="text-brand hover:underline"
              >
                {t.editTheory.fileTakedown}
              </Link>
            </span>
          ) : !confirmDel ? (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              disabled={busy}
              className="text-sm font-medium text-score-bad hover:underline"
            >
              {t.editTheory.deleteTheory}
            </button>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-xs text-score-bad font-medium">
                {t.editTheory.deleteConfirm}
              </span>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-md bg-score-bad px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                {t.editTheory.yesDelete}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                disabled={busy}
                className="text-xs text-muted hover:text-ink"
              >
                {t.editTheory.cancel}
              </button>
            </span>
          )}

          <div className="flex items-center gap-3">
            <Link to={`/theory/${id}`} className="text-sm text-slate-600 hover:text-ink">
              {t.editTheory.cancel}
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? t.editTheory.saving : t.editTheory.save}
            </button>
          </div>
        </div>
      </form>

      {id && (
        <section className="mt-8 rounded-xl ring-1 ring-line bg-white p-5">
          <RelatedTheoryPicker theoryId={id} />
        </section>
      )}
    </main>
  );
}
