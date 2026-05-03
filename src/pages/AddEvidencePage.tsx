import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Field from '../components/form/Field';
import FileUpload from '../components/form/FileUpload';
import { Checkbox, Select, TextInput, Textarea } from '../components/form/inputs';
import { addEvidence } from '../lib/api';
import { useAuth } from '../lib/auth';
import { EVIDENCE_TYPE_META } from '../lib/evidenceTypes';
import { useTheory } from '../lib/hooks';
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
  const navigate = useNavigate();
  const { data: theory, loading } = useTheory(id);

  const [item, setItem] = useState<EvidenceDraft>(() => emptyEvidence());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    const next = encodeURIComponent(`/theory/${id}/add-evidence`);
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">
          Please register or log in first
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You need an account to add evidence to a theory.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            to={`/register?next=${next}`}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Register
          </Link>
          <Link
            to={`/login?next=${next}`}
            className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300"
          >
            Log in
          </Link>
        </div>
        {!isConfigured && (
          <p className="mt-6 text-xs text-muted">
            Accounts are temporarily unavailable. Please try again shortly.
          </p>
        )}
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted">
        Loading theory…
      </main>
    );
  }
  if (!theory) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted">Theory not found.</p>
      </main>
    );
  }

  const meta = item.type ? EVIDENCE_TYPE_META[item.type] : null;
  const setInvolvement = (patch: Partial<Involvement>) =>
    setItem({ ...item, involvement: { ...item.involvement, ...patch } });

  function validate(): string | null {
    if (!item.type) return 'Select a type.';
    if (item.title.trim().length < 4) return 'Title is too short.';
    if (!item.source.trim()) return 'Source is required.';
    if (item.description.trim().length < 20)
      return 'Description must be at least 20 characters.';
    if (!item.url.trim() && !item.uploadedFile)
      return 'Provide either a source link or an uploaded file.';
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
        involvement: { ...item.involvement },
      });
      navigate(`/theory/${id}`);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Submission failed.');
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
          Add evidence
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          You&apos;re adding evidence to{' '}
          <Link to={`/theory/${id}`} className="text-ink underline">
            {theory.title}
          </Link>
          . The theory&apos;s score will be re-evaluated automatically.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl ring-1 ring-line bg-white p-5">
        <Field label="Evidence type" required>
          <Select
            value={item.type}
            onChange={(e) => setItem({ ...item, type: e.target.value as EvidenceType })}
          >
            <option value="">— select a type —</option>
            {EVIDENCE_TYPE_OPTIONS.map((t) => {
              const m = EVIDENCE_TYPE_META[t];
              return (
                <option key={t} value={t}>
                  {m.label} (max {m.ceiling}/5)
                </option>
              );
            })}
          </Select>
          {meta && (
            <p className="mt-1.5 text-xs text-muted">
              <span className="font-mono-num text-ink">Ceiling {meta.ceiling}/5</span> —{' '}
              {meta.reason}
            </p>
          )}
        </Field>

        <Field label="Title" required>
          <TextInput
            value={item.title}
            onChange={(e) => setItem({ ...item, title: e.target.value })}
            placeholder="e.g. CDC Final Report on the Untreated Syphilis Study (1973)"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Source" required>
            <TextInput
              value={item.source}
              onChange={(e) => setItem({ ...item, source: e.target.value })}
              placeholder="Issuing body, journal, publisher"
            />
          </Field>
          <Field label="Link to source" hint="Either link or upload required">
            <TextInput
              type="url"
              value={item.url}
              onChange={(e) => setItem({ ...item, url: e.target.value })}
              placeholder="https://..."
            />
          </Field>
        </div>

        <Field label="Or upload the file directly">
          <FileUpload
            value={item.uploadedFile}
            onChange={(uploadedFile) => setItem({ ...item, uploadedFile })}
          />
        </Field>

        <Field label="Description" required hint="What does it show? Why does it matter?">
          <Textarea
            value={item.description}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
          />
        </Field>

        <fieldset className="rounded-lg border border-line p-4">
          <legend className="px-2 text-xs font-medium uppercase tracking-widest text-muted">
            Your involvement
          </legend>
          <p className="text-xs text-slate-500">
            Optional. False declarations result in a permanent ban.
          </p>
          <div className="mt-3 grid gap-2">
            <Checkbox
              label="I was directly involved"
              checked={item.involvement.directlyInvolved}
              onChange={(e) => setInvolvement({ directlyInvolved: e.target.checked })}
            />
            <Checkbox
              label="I have insider knowledge"
              checked={item.involvement.insiderKnowledge}
              onChange={(e) => setInvolvement({ insiderKnowledge: e.target.checked })}
            />
            <Checkbox
              label="I risk my career by submitting this"
              checked={item.involvement.careerRisk}
              onChange={(e) => setInvolvement({ careerRisk: e.target.checked })}
            />
            <Checkbox
              label="I risk my professional licence"
              checked={item.involvement.licenseRisk}
              onChange={(e) => setInvolvement({ licenseRisk: e.target.checked })}
            />
            <Checkbox
              label="I risk legal consequences"
              checked={item.involvement.legalRisk}
              onChange={(e) => setInvolvement({ legalRisk: e.target.checked })}
            />
          </div>
        </fieldset>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            to={`/theory/${id}`}
            className="text-sm text-slate-600 hover:text-ink"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit evidence'}
          </button>
        </div>
      </form>
    </main>
  );
}
