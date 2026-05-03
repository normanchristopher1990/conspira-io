import { useEffect } from 'react';
import { CATEGORIES } from '../lib/categories';
import { useI18n } from '../lib/i18n';
import type { CategorySlug } from '../lib/types';

type Props = {
  open: boolean;
  selected: CategorySlug | 'all';
  onSelect: (next: CategorySlug | 'all') => void;
  onClose: () => void;
};

export default function CategoryDrawer({ open, selected, onSelect, onClose }: Props) {
  const { t } = useI18n();

  // Lock body scroll while open so the underlying feed doesn't move.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape key closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function pick(slug: CategorySlug | 'all') {
    onSelect(slug);
    onClose();
  }

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ' +
          (open ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.home.filterByCategory}
        className={
          'fixed top-0 left-0 z-50 h-full w-[82vw] max-w-[340px] bg-white shadow-2xl ' +
          'transition-transform duration-250 ease-out flex flex-col ' +
          (open ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3 shrink-0">
          <h2 className="text-sm font-semibold text-ink">
            {t.home.filterByCategory}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.home.filterClose}
            className="grid place-items-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <ul className="overflow-y-auto flex-1 py-1">
          <CategoryRow
            active={selected === 'all'}
            color="#185FA5"
            label={t.home.filterAllCategories}
            onClick={() => pick('all')}
          />
          {CATEGORIES.map((c) => (
            <CategoryRow
              key={c.slug}
              active={selected === c.slug}
              color={c.hue}
              label={t.category[c.slug]}
              onClick={() => pick(c.slug)}
            />
          ))}
        </ul>
      </aside>
    </>
  );
}

function CategoryRow({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={
          'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ' +
          (active
            ? 'bg-brand/10 text-brand font-semibold'
            : 'text-slate-700 hover:bg-slate-50')
        }
        aria-current={active ? 'true' : undefined}
      >
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="flex-1">{label}</span>
        {active && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
      </button>
    </li>
  );
}
