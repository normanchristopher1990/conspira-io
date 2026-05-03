import { CATEGORIES } from '../lib/categories';
import type { CategorySlug } from '../lib/types';

type Props = {
  selected: CategorySlug | 'all';
  onChange: (next: CategorySlug | 'all') => void;
};

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div className="-mx-4 px-4 overflow-x-auto scroll-hide">
      <div className="flex items-center gap-2 min-w-max py-1">
        <Chip
          active={selected === 'all'}
          onClick={() => onChange('all')}
          color="#185FA5"
          label="All categories"
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.slug}
            active={selected === c.slug}
            onClick={() => onChange(c.slug)}
            color={c.hue}
            label={c.label}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
        (active
          ? 'border-transparent text-white'
          : 'border-line bg-white text-slate-700 hover:border-slate-300')
      }
      style={active ? { backgroundColor: color } : undefined}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: active ? '#fff' : color }}
        aria-hidden
      />
      {label}
    </button>
  );
}
