import type { SortKey } from '../lib/types';

type Props = {
  value: SortKey;
  onChange: (next: SortKey) => void;
  count: number;
};

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest score' },
  { key: 'lowest', label: 'Lowest score' },
  { key: 'most-evidence', label: 'Most evidence' },
];

export default function SortBar({ value, onChange, count }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted">
        <span className="font-mono-num text-ink">{count}</span>{' '}
        {count === 1 ? 'theory' : 'theories'}
      </p>

      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-xs text-muted hidden sm:inline">
          Sort by
        </label>
        <div className="relative">
          <select
            id="sort"
            value={value}
            onChange={(e) => onChange(e.target.value as SortKey)}
            className="appearance-none rounded-md border border-line bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-ink hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
          >
            ▾
          </span>
        </div>
      </div>
    </div>
  );
}
