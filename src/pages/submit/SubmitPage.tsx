import { useState } from 'react';
import { Link } from 'react-router-dom';
import StepIndicator from '../../components/form/StepIndicator';
import Step1Basics from './Step1Basics';
import Step2Evidence from './Step2Evidence';
import Step3About from './Step3About';
import Step4Review from './Step4Review';
import { submitTheory } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, type Strings } from '../../lib/i18n';
import { parseYoutubeId } from '../../lib/youtube';
import {
  initialState,
  validateAuthor,
  validateBasics,
  validateEvidence,
  type EvidenceDraft,
  type ValidationKey,
  type WizardState,
} from './wizardState';

type Phase = 'editing' | 'submitting' | 'submitted';

function vmsg(t: Strings, key: ValidationKey): string {
  const v = t.submit.validation;
  switch (key) {
    case 'titleMin': return v.titleMin;
    case 'categoryRequired': return v.categoryRequired;
    case 'summaryMin': return v.summaryMin;
    case 'summaryMax': return v.summaryMax(500);
    case 'evidenceMin': return v.evidenceMin;
    case 'evidenceTypeMissing': return v.evidenceTypeMissing;
    case 'evidenceTitleMissing': return v.evidenceTitleMissing;
    case 'evidenceSourceMissing': return v.evidenceSourceMissing;
    case 'evidenceDescriptionMin': return v.evidenceDescriptionMin;
    case 'evidenceLinkOrFile': return v.evidenceLinkOrFile;
    case 'displayNameMin': return v.displayNameMin;
  }
}

export default function SubmitPage() {
  const { user, isConfigured } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<WizardState>(() => initialState());
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('editing');

  const STEPS = [
    { n: 1, label: t.submit.steps.theory },
    { n: 2, label: t.submit.steps.evidence },
    { n: 3, label: t.submit.steps.about },
    { n: 4, label: t.submit.steps.review },
  ];

  function next() {
    setError(null);
    if (step === 1) {
      const err = validateBasics(state.basics);
      if (err) return setError(vmsg(t, err));
      setStep(2);
    } else if (step === 2) {
      const err = validateEvidence(state.evidence);
      if (err) return setError(vmsg(t, err));
      setStep(3);
    } else if (step === 3) {
      const err = validateAuthor(state.author);
      if (err) return setError(vmsg(t, err));
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
            image_url: state.basics.imageUrl.trim() || null,
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
              stance: e.stance,
              involvement: { ...e.involvement },
            })),
        );
      } else {
        // eslint-disable-next-line no-console
        console.log('[Conspira] submission payload (local preview)', state);
        await new Promise((r) => setTimeout(r, 400));
      }
      setPhase('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.submit.submissionFailed);
      setPhase('editing');
    }
  }

  if (phase === 'submitted') {
    return (
      <SubmittedScreen
        onReset={() => {
          setState(initialState());
          setStep(1);
          setPhase('editing');
        }}
      />
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/" className="text-xs font-medium text-muted hover:text-brand">
          {t.submit.backToFeed}
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          {t.submit.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t.submit.intro}</p>
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
        {step === 4 && <Step4Review state={state} onJumpTo={(s) => setStep(s)} />}
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
          {t.submit.back}
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            {t.submit.continue}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={phase === 'submitting'}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {phase === 'submitting' ? t.submit.submitting : t.submit.submit}
          </button>
        )}
      </div>
    </main>
  );
}

function SubmittedScreen({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div
        aria-hidden
        className="mx-auto h-14 w-14 rounded-full grid place-items-center text-white text-2xl"
        style={{ backgroundColor: '#1F8A4C' }}
      >
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-ink">{t.submit.successTitle}</h1>
      <p className="mt-2 text-sm text-slate-600">{t.submit.successBody}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {t.submit.successBackToFeed}
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300"
        >
          {t.submit.successAnother}
        </button>
      </div>
    </main>
  );
}
