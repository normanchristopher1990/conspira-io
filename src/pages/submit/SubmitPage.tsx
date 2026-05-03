import { useState } from 'react';
import { Link } from 'react-router-dom';
import StepIndicator from '../../components/form/StepIndicator';
import Step1Basics from './Step1Basics';
import Step2Evidence from './Step2Evidence';
import Step3About from './Step3About';
import Step4Review from './Step4Review';
import { submitTheory } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { parseYoutubeId } from '../../lib/youtube';
import {
  initialState,
  validateAuthor,
  validateBasics,
  validateEvidence,
  type EvidenceDraft,
  type WizardState,
} from './wizardState';

const STEPS = [
  { n: 1, label: 'Theory' },
  { n: 2, label: 'Evidence' },
  { n: 3, label: 'About you' },
  { n: 4, label: 'Review' },
];

type Phase = 'editing' | 'submitting' | 'submitted';

export default function SubmitPage() {
  const { user, isConfigured } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<WizardState>(() => initialState());
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('editing');

  function next() {
    setError(null);
    if (step === 1) {
      const err = validateBasics(state.basics);
      if (err) return setError(err);
      setStep(2);
    } else if (step === 2) {
      const err = validateEvidence(state.evidence);
      if (err) return setError(err);
      setStep(3);
    } else if (step === 3) {
      const err = validateAuthor(state.author);
      if (err) return setError(err);
      setStep(4);
    }
  }

  async function submit() {
    setError(null);
    setPhase('submitting');
    try {
      if (isConfigured && user && state.basics.category) {
        await submitTheory(
          user.id,
          {
            title: state.basics.title.trim(),
            summary: state.basics.summary.trim(),
            category_slug: state.basics.category,
            youtube_id: parseYoutubeId(state.basics.youtubeUrl),
          },
          state.evidence
            .filter((e) => e.type)
            .map((e: EvidenceDraft) => ({
              type: e.type as Exclude<EvidenceDraft['type'], ''>,
              title: e.title.trim(),
              source: e.source.trim(),
              url: e.url.trim() || null,
              storage_path: e.uploadedFile?.storage_path ?? null,
              description: e.description.trim(),
              involvement: { ...e.involvement },
            })),
        );
      } else {
        // Local preview only — no Supabase or no signed-in user.
        // eslint-disable-next-line no-console
        console.log('[Conspira.io] submission payload (local preview)', state);
        await new Promise((r) => setTimeout(r, 400));
      }
      setPhase('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
      setPhase('editing');
    }
  }

  if (phase === 'submitted') {
    return <SubmittedScreen onReset={() => {
      setState(initialState());
      setStep(1);
      setPhase('editing');
    }} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/" className="text-xs font-medium text-muted hover:text-brand">
          ← Back to feed
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          Submit a theory
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Four short steps. Evidence is required — pure-text claims are rejected automatically.
        </p>
      </div>

      <div className="mt-6 sticky top-14 z-20 -mx-4 px-4 py-3 bg-bg/90 backdrop-blur border-b border-line">
        <StepIndicator current={step} steps={STEPS} />
      </div>

      <div className="mt-6">
        {step === 1 && (
          <Step1Basics
            value={state.basics}
            onChange={(basics) => setState((s) => ({ ...s, basics }))}
          />
        )}
        {step === 2 && (
          <Step2Evidence
            items={state.evidence}
            onChange={(evidence) => setState((s) => ({ ...s, evidence }))}
          />
        )}
        {step === 3 && (
          <Step3About
            value={state.author}
            onChange={(author) => setState((s) => ({ ...s, author }))}
          />
        )}
        {step === 4 && (
          <Step4Review state={state} onJumpTo={(s) => setStep(s)} />
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
          disabled={step === 1}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={phase === 'submitting'}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {phase === 'submitting' ? 'Submitting…' : 'Submit theory'}
          </button>
        )}
      </div>
    </main>
  );
}

function SubmittedScreen({ onReset }: { onReset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div
        aria-hidden
        className="mx-auto h-14 w-14 rounded-full grid place-items-center text-white text-2xl"
        style={{ backgroundColor: '#1F8A4C' }}
      >
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Submission received.</h1>
      <p className="mt-2 text-sm text-slate-600">
        Automated review usually finishes within 60 seconds. After that an admin
        will check your evidence and you’ll get an email with the decision.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Back to feed
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300"
        >
          Submit another
        </button>
      </div>
    </main>
  );
}
