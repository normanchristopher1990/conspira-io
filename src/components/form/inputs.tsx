import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const baseInput =
  'w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-colors';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} className={baseInput + ' ' + (props.className ?? '')} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={baseInput + ' min-h-[96px] resize-y ' + (props.className ?? '')}
    />
  );
}

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode },
) {
  return (
    <div className="relative">
      <select {...props} className={baseInput + ' appearance-none pr-9 ' + (props.className ?? '')}>
        {props.children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      >
        ▾
      </span>
    </div>
  );
}

export function Checkbox({
  label,
  description,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-line bg-white p-3 hover:border-slate-300 cursor-pointer transition-colors">
      <input
        type="checkbox"
        {...rest}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
        )}
      </span>
    </label>
  );
}
