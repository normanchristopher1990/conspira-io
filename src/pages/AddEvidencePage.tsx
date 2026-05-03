import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Field from '../components/form/Field';
import FileUpload from '../components/form/FileUpload';
import { Checkbox, Select, TextInput, Textarea } from '../components/form/inputs';
import StancePicker from '../components/form/StancePicker';
import { addEvidence } from '../lib/api';
import { useAuth } from '../lib/auth';
import { EVIDENCE_TYPE_META } from '../lib/evidenceTypes';
import { useTheory } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { localizeTheory } from '../lib/localize';
import type { EvidenceType } from '../lib/types';
import {
  emptyEvidence,
  type EvidenceDraft,
  type Involvement,
} from './submit/wizardState';

const EVIDENCE_TYPE_OPTIONS: EvidenceType[] = [
  'reproducible-experiment',
  'peer-reviewed-paper',
  'witness-with-risk',
  'witness-without-risk',
  'government-document',
  'declassified-military',
  'video-with-metadata',
  'verified-image',
  'video-without-metadata',
  'unverified',
];

export default function AddEvidencePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isConfigured } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { data: theory, loading } = useTheory(id);

  const [item, setItem] = useState<EvidenceDraft>(() => emptyEvidence());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    const next = encodeURIComponent(`/theory/${id}/add-evidence`);
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">{t.addEvidence.notLoggedInTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.addEvidence.notLoggedInBody}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            to={`/register?next=${next}`}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {t.addEvidence.register}
          </Link>
          <Link
            to={`/login?next=${next}`}
            className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300"
          >
            {t.addEvidence.logIn}
          </Link>
        </div>
        {!isConfigured && (
          <p className="mt-6 text-xs text-muted">{t.addEvidence.needsSupabase}</p>
        )}
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted">
        {t.addEvidence.loading}
      </main>
    );
  }
  if (!theory) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t.addEvidence.notFound}</p>
      </main>
    );
  }

  const meta = item.type ? EVIDENCE_TYPE_META[item.type] : null;
  const typeT = item.type ? t.evidenceType[item.type] : null;
  const setInvolvement = (patch: Partial<Involvement>) =>
    setItem({ ...item, involvement: { ...item.involvement, ...patch } });

  function validate(): string | null {
    if (!item.type) return t.addEvidence.typeRequired;
    if (item.title.trim().length < 4) return t.addEvidence.typeTooShort;
    if (!item.source.trim()) return t.addEvidence.sourceRequired;
    if (item.description.trim().length < 20) return t.addEvidence.descriptionMin;
    if (!item.url.trim() && !item.uploadedFile) return t.addEvidence.needsLinkOrFile;
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) return setError(err);
    setBusy(true);
    try {
      await addEvidence(user!.id, id!, {
        type: item.type as Exclude<EvidenceDraft['type'], ''>,
        title: item.title.trim(),
        source: item.source.trim(),
        url: item.url.trim() || null,
        storage_path: item.uploadedFile?.storage_path ?? null,
        description: item.description.trim(),
        stance: item.stance,
        involvement: { ...item.involvement },
      });
      navigate(`/theory/${id}`);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.addEvidence.submitFailed);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link to={`/theory/${id}`} className="text-xs font-medium text-muted hover:text-brand">
          {t.addEvidence.backToTheory}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          {t.addEvidence.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t.addEvidence.intro(
            <Link to={`/theory/${id}`} className="text-ink underline">
              {localizeTheory(theory, lang).title}
            </Link>,
          )}
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl ring-1 ring-line bg-white p-5">
        <Field label={t.submit.step2.typeLabel} required>
          <Select
            value={item.type}
            onChange={(e) => setItem({ ...item, type: e.target.value as EvidenceType })}
          >
            <option value="">{t.submit.step2.typePlaceholder}</option>
            {EVIDENCE_TYPE_OPTIONS.map((tp) => {
              const m = EVIDENCE_TYPE_META[tp];
              return (
                <option key={tp} value={tp}>
                  {t.evidenceType[tp].label} ({t.evidenceType.ceilingMax(m.ceiling)})
                </option>
              );
            })}
          </Select>
          {meta && typeT && (
            <p className="mt-1.5 text-xs text-muted">
              <span className="font-mono-num text-ink">
                {t.evidenceType.ceiling(meta.ceiling)}
              </span>{' '}
              — {typeT.reason}
            </p>
          )}
        </Field>

        <Field label={t.submit.step2.titleLabel} required>
          <TextInput
            value={item.title}
            onChange={(e) => setItem({ ...item, title: e.target.value })}
            placeholder={t.submit.step2.titlePlaceholder}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t.submit.step2.sourceLabel} required>
            <TextInput
              value={item.source}
              onChange={(e) => setItem({ ...item, source: e.target.value })}
              placeholder={t.submit.step2.sourcePlaceholder}
            />
          </Field>
          <Field label={t.submit.step2.urlLabel} hint={t.submit.step2.urlHint}>
            <TextInput
              type="url"
              value={item.url}
              onChange={(e) => setItem({ ...item, url: e.target.value })}
              placeholder={t.submit.step2.urlPlaceholder}
            />
          </Field>
        </div>

        <Field label={t.submit.step2.uploadLabel}>
          <FileUpload
            value={item.uploadedFile}
            onChange={(uploadedFile) => setItem({ ...item, uploadedFile })}
          />
        </Field>

        <Field label={t.submit.step2.descriptionLabel} required hint={t.submit.step2.descriptionHint}>
          <Textarea
            value={item.description}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
          />
        </Field>

        <Field label={t.submit.step2.stanceLabel} required hint={t.submit.step2.stanceHint}>
          <StancePicker
            value={item.stance}
            onChange={(stance) => setItem({ ...item, stance })}
          />
        </Field>

        <fieldset className="rounded-lg border border-line p-4">
          <legend className="px-2 text-xs font-medium uppercase tracking-widest text-muted">
            {t.submit.step2.involvementLegend}
          </legend>
          <p className="text-xs text-slate-500">{t.submit.step2.involvementIntro}</p>
          <div className="mt-3 grid gap-2">
            <Checkbox
              label={t.submit.step2.directlyInvolved}
              checked={item.involvement.directlyInvolved}
              onChange={(e) => setInvolvement({ directlyInvolved: e.target.checked })}
            />
            <Checkbox
              label={t.submit.step2.insiderKnowledge}
              checked={item.involvement.insiderKnowledge}
              onChange={(e) => setInvolvement({ insiderKnowledge: e.target.checked })}
            />
            <Checkbox
              label={t.submit.step2.careerRisk}
              checked={item.involvement.careerRisk}
              onChange={(e) => setInvolvement({ careerRisk: e.target.checked })}
            />
            <Checkbox
              label={t.submit.step2.licenseRisk}
              checked={item.involvement.licenseRisk}
              onChange={(e) => setInvolvement({ licenseRisk: e.target.checked })}
            />
            <Checkbox
              label={t.submit.step2.legalRisk}
              checked={item.involvement.legalRisk}
              onChange={(e) => setInvolvement({ legalRisk: e.target.checked })}
            />
          </div>
        </fieldset>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to={`/theory/${id}`} className="text-sm text-slate-600 hover:text-ink">
            {t.addEvidence.cancel}
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? t.addEvidence.submitting : t.addEvidence.submit}
          </button>
        </div>
      </form>
    </main>
  );
}
