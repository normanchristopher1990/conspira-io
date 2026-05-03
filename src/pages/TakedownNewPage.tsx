import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Field from '../components/form/Field';
import { TextInput, Textarea } from '../components/form/inputs';
import { submitTakedown } from '../lib/api';
import { useI18n } from '../lib/i18n';

export default function TakedownNewPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const presetTheory = params.get('theory');
  const presetEvidence = params.get('evidence');

  const navigate = useNavigate();
  const [requesterName, setRequesterName] = useState('');
  const [requesterOrg, setRequesterOrg] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await submitTakedown({
        theory_id: presetTheory,
        evidence_id: presetEvidence,
        requester_name: requesterName.trim() || undefined,
        requester_org: requesterOrg.trim() || undefined,
        legal_basis: legalBasis.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.takedowns.new.failed);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">{t.takedowns.new.successTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.takedowns.new.successBody}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/takedowns"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            {t.takedowns.new.viewLog}
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300"
          >
            {t.takedowns.new.back2}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/takedowns" className="text-xs font-medium text-muted hover:text-brand">
          {t.takedowns.new.back}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          {t.takedowns.new.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t.takedowns.new.intro}</p>
      </div>

      {(presetTheory || presetEvidence) && (
        <p className="mt-4 rounded-md bg-brand/5 px-3 py-2 text-xs text-brand">
          {t.takedowns.new.target}{' '}
          {presetTheory ? (
            <>
              {t.takedowns.targetTheory}{' '}
              <Link to={`/theory/${presetTheory}`} className="font-mono-num underline">
                {presetTheory.slice(0, 8)}
              </Link>
            </>
          ) : (
            <>
              {t.takedowns.targetEvidence}{' '}
              <span className="font-mono-num">{presetEvidence?.slice(0, 8)}</span>
            </>
          )}
          .
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label={t.takedowns.new.yourName} hint={t.takedowns.new.yourNameHint}>
          <TextInput
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>

        <Field label={t.takedowns.new.organisation} hint={t.takedowns.new.organisationHint}>
          <TextInput
            value={requesterOrg}
            onChange={(e) => setRequesterOrg(e.target.value)}
            placeholder="Acme Legal LLP"
          />
        </Field>

        <Field
          label={t.takedowns.new.legalBasis}
          required
          hint={t.takedowns.new.legalBasisHint}
        >
          <Textarea
            value={legalBasis}
            onChange={(e) => setLegalBasis(e.target.value)}
            placeholder={t.takedowns.new.legalBasisPlaceholder}
            required
          />
        </Field>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to="/takedowns" className="text-sm text-slate-600 hover:text-ink">
            {t.takedowns.new.cancel}
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? t.takedowns.new.submitting : t.takedowns.new.submit}
          </button>
        </div>
      </form>
    </main>
  );
}
