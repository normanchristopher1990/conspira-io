import { getCategory } from '../../lib/categories';
import { EVIDENCE_TYPE_META } from '../../lib/evidenceTypes';
import { parseYoutubeId } from '../../lib/youtube';
import type { WizardState } from './wizardState';

type Props = {
  state: WizardState;
  onJumpTo: (step: 1 | 2 | 3) => void;
};

export default function Step4Review({ state, onJumpTo }: Props) {
  const cat = state.basics.category ? getCategory(state.basics.category) : null;
  const ytId = parseYoutubeId(state.basics.youtubeUrl);

  return (
    <div className="space-y-5">
      <Section title="Theory" onEdit={() => onJumpTo(1)}>
        <Row label="Title" value={state.basics.title || '—'} />
        <Row label="Category" value={cat?.label ?? '—'} swatch={cat?.hue} />
        <Row label="YouTube" value={ytId ?? (state.basics.youtubeUrl ? 'Invalid URL' : '—')} mono />
        <div>
          <p className="text-xs text-muted">Summary</p>
          <p className="mt-1 text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {state.basics.summary || '—'}
          </p>
        </div>
      </Section>

      <Section
        title={`Evidence (${state.evidence.length})`}
        onEdit={() => onJumpTo(2)}
      >
        <ul className="space-y-3">
          {state.evidence.map((e, i) => {
            const m = e.type ? EVIDENCE_TYPE_META[e.type] : null;
            const declared = countDeclarations(e.involvement);
            return (
              <li
                key={e.id}
                className="rounded-md ring-1 ring-line p-3 bg-slate-50"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-mono-num text-muted">#{i + 1}</span>
                  <span className="text-sm font-semibold text-ink">
                    {e.title || '(untitled)'}
                  </span>
                  {m && (
                    <span className="text-[11px] text-muted">
                      · {m.short} · max {m.ceiling}/5
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {e.source || '(no source)'}
                  {e.url && (
                    <>
                      {' · '}
                      <span className="font-mono-num text-brand">{e.url}</span>
                    </>
                  )}
                </p>
                {declared > 0 && (
                  <p className="mt-1.5 text-[11px] text-brand">
                    {declared} involvement declaration{declared === 1 ? '' : 's'}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="About you" onEdit={() => onJumpTo(3)}>
        <Row label="Display name" value={state.author.displayName || '—'} />
        <Row label="Real name" value={state.author.realName || '— (anonymous)'} />
        <Row label="Expertise" value={state.author.expertField || '—'} />
        {state.author.expertNote && (
          <div>
            <p className="text-xs text-muted">Credential note</p>
            <p className="mt-1 text-sm text-ink whitespace-pre-wrap">
              {state.author.expertNote}
            </p>
          </div>
        )}
      </Section>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <p className="font-medium">Before you submit</p>
        <p className="mt-1">
          False involvement declarations result in a permanent ban. Your
          submission will be reviewed first by automated analysis, then by an
          admin. You will be notified by email when a decision is made.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl ring-1 ring-line bg-white p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          {title}
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-brand hover:underline"
        >
          Edit
        </button>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  swatch,
  mono,
}: {
  label: string;
  value: string;
  swatch?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={'text-sm text-ink flex items-center gap-2 ' + (mono ? 'font-mono-num' : '')}>
        {swatch && (
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: swatch }}
          />
        )}
        {value}
      </p>
    </div>
  );
}

function countDeclarations(i: WizardState['evidence'][number]['involvement']): number {
  return [
    i.directlyInvolved,
    i.insiderKnowledge,
    i.careerRisk,
    i.licenseRisk,
    i.legalRisk,
  ].filter(Boolean).length;
}
