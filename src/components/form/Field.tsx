import type { ReactNode } from 'react';

type Props = {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
};

export default function Field({ label, hint, required, error, children, htmlFor }: Props) {
  return (
    <label htmlFor={htmlFor} className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">
          {label}
          {required && <span className="text-score-bad ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-score-bad">{error}</p>}
    </label>
  );
}
