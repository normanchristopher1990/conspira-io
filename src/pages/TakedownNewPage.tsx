import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Field from '../components/form/Field';
import { TextInput, Textarea } from '../components/form/inputs';
import { submitTakedown } from '../lib/api';

export default function TakedownNewPage() {
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
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">Request logged.</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your takedown request has been logged in the public takedown register.
          We will review it and update the status. The outcome — accepted,
          declined, or pending — will be visible to anyone.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/takedowns"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            View public log
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/takedowns" className="text-xs font-medium text-muted hover:text-brand">
          ← Public takedown log
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Submit a takedown request
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Every request is logged publicly in our register, regardless of
          outcome. Requests without a specific legal basis are documented and
          declined by default. We do not display individuals&apos; names.
        </p>
      </div>

      {(presetTheory || presetEvidence) && (
        <p className="mt-4 rounded-md bg-brand/5 px-3 py-2 text-xs text-brand">
          Targeting{' '}
          {presetTheory ? (
            <>
              theory{' '}
              <Link to={`/theory/${presetTheory}`} className="font-mono-num underline">
                {presetTheory.slice(0, 8)}
              </Link>
            </>
          ) : (
            <>
              evidence{' '}
              <span className="font-mono-num">{presetEvidence?.slice(0, 8)}</span>
            </>
          )}
          .
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Your name" hint="Optional · not displayed publicly">
          <TextInput
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>

        <Field label="Organisation / law firm" hint="Optional · displayed publicly">
          <TextInput
            value={requesterOrg}
            onChange={(e) => setRequesterOrg(e.target.value)}
            placeholder="Acme Legal LLP"
          />
        </Field>

        <Field
          label="Legal basis"
          required
          hint="Cite the specific law, jurisdiction, and reason"
        >
          <Textarea
            value={legalBasis}
            onChange={(e) => setLegalBasis(e.target.value)}
            placeholder={'e.g. UK Defamation Act 2013, s.1 — claim that X published statement Y on date Z, which is materially false because…'}
            required
          />
        </Field>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to="/takedowns" className="text-sm text-slate-600 hover:text-ink">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </form>
    </main>
  );
}
