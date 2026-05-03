import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '../lib/categories';
import type { CategorySlug } from '../lib/types';

type Props = {
  selected: CategorySlug | 'all';
  onChange: (next: CategorySlug | 'all') => void;
};

export default function CategoryFilter({ selected, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // True when there is still content off the right edge.
  // Hides the fade when the user has scrolled to the end.
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      // Sub-pixel tolerance — `scrollWidth - scrollLeft` can lag clientWidth
      // by ≤1px due to rounding even when fully scrolled.
      const remaining = el.scrollWidth - el.scrollLeft - el.clientWidth;
      setHasMore(remaining > 2);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="-mx-4 relative">
      <div ref={scrollRef} className="px-4 overflow-x-auto scroll-hide">
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

      {/* Right-edge fade — hints at off-screen chips, hides at end of scroll. */}
      <div
        aria-hidden
        className={
          'pointer-events-none absolute inset-y-0 right-0 w-12 ' +
          'bg-gradient-to-l from-bg via-bg/80 to-transparent ' +
          'transition-opacity duration-200 ' +
          (hasMore ? 'opacity-100' : 'opacity-0')
        }
      />
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
