type Step = { n: number; label: string };

type Props = {
  current: number;
  steps: Step[];
};

export default function StepIndicator({ current, steps }: Props) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto scroll-hide">
      {steps.map((s, i) => {
        const state = s.n < current ? 'done' : s.n === current ? 'active' : 'todo';
        return (
          <li key={s.n} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div
              className={
                'h-7 w-7 grid place-items-center rounded-full text-xs font-mono-num font-bold ' +
                (state === 'done'
                  ? 'bg-brand text-white'
                  : state === 'active'
                    ? 'bg-brand/10 text-brand ring-1 ring-brand'
                    : 'bg-slate-100 text-slate-500')
              }
            >
              {state === 'done' ? '✓' : s.n}
            </div>
            <span
              className={
                'text-xs sm:text-sm font-medium hidden sm:inline ' +
                (state === 'todo' ? 'text-slate-400' : 'text-ink')
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className="mx-1 sm:mx-2 h-px w-6 sm:w-10 bg-line" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
