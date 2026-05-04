import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Field from '../../components/form/Field';
import { Select, TextInput, Textarea } from '../../components/form/inputs';
import { createSeedTheory } from '../../lib/api';
import { CATEGORIES } from '../../lib/categories';
import { useI18n } from '../../lib/i18n';
import type { CategorySlug } from '../../lib/types';
import { parseYoutubeId } from '../../lib/youtube';
import { SUMMARY_MAX } from '../submit/wizardState';

export default function AdminSeedTheory() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<CategorySlug>('politics-government');
  const [youtube, setYoutube] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 5) {
      setError(t.adminSeed.titleTooShort);
      return;
    }
    if (summary.trim().length < 20) {
      setError(t.adminSeed.summaryTooShort);
      return;
    }
    setBusy(true);
    try {
      const youtubeId = youtube.trim() ? parseYoutubeId(youtube.trim()) : null;
      const { id } = await createSeedTheory({
        title: title.trim(),
        summary: summary.trim(),
        category,
        youtubeId: youtubeId || null,
      });
      navigate(`/theory/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminSeed.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="pb-16 max-w-2xl">
      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t.adminSeed.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t.adminSeed.intro}</p>
      </div>

      <form
        onSubmit={submit}
        className="mt-6 space-y-5 rounded-xl ring-1 ring-line bg-white p-5"
      >
        <Field label={t.adminSeed.titleLabel} required>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.adminSeed.titlePlaceholder}
            required
            maxLength={200}
          />
        </Field>

        <Field
          label={t.adminSeed.summaryLabel}
          required
          hint={t.adminSeed.summaryHint(summary.length, SUMMARY_MAX)}
        >
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            maxLength={SUMMARY_MAX}
            required
          />
        </Field>

        <Field label={t.adminSeed.categoryLabel} required>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategorySlug)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t.adminSeed.youtubeLabel} hint={t.adminSeed.youtubeHint}>
          <TextInput
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtu.be/…"
          />
        </Field>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">{t.adminSeed.bypass}</p>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? t.adminSeed.seeding : t.adminSeed.seed}
          </button>
        </div>
      </form>
    </section>
  );
}
