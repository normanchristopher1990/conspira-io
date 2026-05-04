import { useEffect, useRef, useState } from 'react';
import {
  deleteTheoryLink,
  requestTheoryLink,
  searchTheoriesByTitle,
} from '../lib/api';
import { useOwnTheoryLinks } from '../lib/hooks';
import { useI18n, type Strings } from '../lib/i18n';
import { localizeTheory } from '../lib/localize';
import type { RelatedTheory, Theory } from '../lib/types';
import CategoryBanner from './CategoryBanner';

type Props = { theoryId: string };

// Used in EditTheoryPage. Shows the current owner's existing links in two
// sections (children + parents), with status badges (approved / pending /
// rejected) and a remove button. Two "Add" buttons open inline search
// pickers — one to add a child, one to add a parent.
export default function RelatedTheoryPicker({ theoryId }: Props) {
  const { data, loading, error, refetch } = useOwnTheoryLinks(theoryId);
  const { t, lang } = useI18n();
  const [activePicker, setActivePicker] = useState<'down' | 'up' | null>(null);

  if (error) {
    return (
      <p className="text-sm text-score-bad">{t.links.failedToLoad}</p>
    );
  }

  const children = (data ?? []).filter((r) => r.direction === 'down');
  const parents = (data ?? []).filter((r) => r.direction === 'up');

  async function handleRemove(item: RelatedTheory) {
    try {
      await deleteTheoryLink(item.link.parentId, item.link.childId);
      refetch();
    } catch {
      // best-effort; user can retry
    }
  }

  return (
    <div className="space-y-6">
      <Section
        heading={t.links.sectionContains}
        hint={t.links.sectionContainsHint}
        items={children}
        loading={loading}
        onRemove={handleRemove}
        addLabel={t.links.addContains}
        addOpen={activePicker === 'down'}
        onToggleAdd={() => setActivePicker((p) => (p === 'down' ? null : 'down'))}
        lang={lang}
        t={t}
      >
        {activePicker === 'down' && (
          <Picker
            theoryId={theoryId}
            asChild
            existing={data ?? []}
            onAdded={() => {
              setActivePicker(null);
              refetch();
            }}
            onCancel={() => setActivePicker(null)}
          />
        )}
      </Section>

      <Section
        heading={t.links.sectionPartOf}
        hint={t.links.sectionPartOfHint}
        items={parents}
        loading={loading}
        onRemove={handleRemove}
        addLabel={t.links.addPartOf}
        addOpen={activePicker === 'up'}
        onToggleAdd={() => setActivePicker((p) => (p === 'up' ? null : 'up'))}
        lang={lang}
        t={t}
      >
        {activePicker === 'up' && (
          <Picker
            theoryId={theoryId}
            asChild={false}
            existing={data ?? []}
            onAdded={() => {
              setActivePicker(null);
              refetch();
            }}
            onCancel={() => setActivePicker(null)}
          />
        )}
      </Section>
    </div>
  );
}

function Section({
  heading,
  hint,
  items,
  loading,
  onRemove,
  addLabel,
  addOpen,
  onToggleAdd,
  lang,
  t,
  children,
}: {
  heading: string;
  hint: string;
  items: RelatedTheory[];
  loading: boolean;
  onRemove: (r: RelatedTheory) => void;
  addLabel: string;
  addOpen: boolean;
  onToggleAdd: () => void;
  lang: 'en' | 'de';
  t: Strings;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-xs font-mono-num uppercase tracking-widest text-muted">
            {heading}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onToggleAdd}
          className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-slate-300"
        >
          {addOpen ? t.editTheory.cancel : addLabel}
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-muted">{t.editTheory.loading}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{t.links.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((r) => (
            <li
              key={`${r.link.parentId}:${r.link.childId}`}
              className="bg-white rounded-md ring-1 ring-line p-3 flex items-center gap-3"
            >
              <CategoryBanner category={r.theory.category} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ink truncate">
                    {localizeTheory(r.theory, lang).title}
                  </span>
                  <StatusBadge status={r.link.status} t={t} />
                </div>
                {r.link.status === 'rejected' && r.link.rejectReason && (
                  <p className="text-xs text-muted mt-0.5">
                    {t.links.rejectReason(r.link.rejectReason)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(r)}
                className="text-xs text-score-bad hover:underline shrink-0"
              >
                {r.link.status === 'pending'
                  ? t.links.cancelRequest
                  : t.links.removeLink}
              </button>
            </li>
          ))}
        </ul>
      )}

      {children}
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: 'pending' | 'approved' | 'rejected';
  t: Strings;
}) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-800">
        {t.links.pendingBadge}
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full bg-score-bad/10 ring-1 ring-score-bad/20 px-2 py-0.5 text-[10px] font-medium text-score-bad">
        {t.links.rejectedBadge}
      </span>
    );
  }
  return null;
}

// Inline search picker. `asChild=true` means we're adding a CHILD to the
// current theory (current theory becomes parent). asChild=false adds a
// PARENT (current theory becomes child).
function Picker({
  theoryId,
  asChild,
  existing,
  onAdded,
  onCancel,
}: {
  theoryId: string;
  asChild: boolean;
  existing: RelatedTheory[];
  onAdded: () => void;
  onCancel: () => void;
}) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Theory[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Exclude the current theory and any already-linked theories so we don't
  // suggest duplicates.
  const excludeIds = [theoryId, ...existing.map((r) => r.theory.id)];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchTheoriesByTitle(query, excludeIds, 8)
        .then((r) => setResults(r))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handlePick(picked: Theory) {
    setSubmitting(picked.id);
    setFeedback(null);
    try {
      const parentId = asChild ? theoryId : picked.id;
      const childId = asChild ? picked.id : theoryId;
      await requestTheoryLink(parentId, childId);
      onAdded();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Failed to link.',
      );
      setSubmitting(null);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-line bg-bg p-3 space-y-2">
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.links.pickerPlaceholder}
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      <p className="text-[11px] text-muted">{t.links.pickerHint}</p>

      {searching && (
        <p className="text-xs text-muted">{t.links.pickerSearching}</p>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-muted">{t.links.pickerNoResults}</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((th) => (
            <li key={th.id}>
              <button
                type="button"
                onClick={() => handlePick(th)}
                disabled={submitting !== null}
                className="w-full text-left rounded-md bg-white ring-1 ring-line px-3 py-2 hover:ring-slate-300 disabled:opacity-50 flex items-center gap-2"
              >
                <span className="text-sm text-ink truncate flex-1">
                  {localizeTheory(th, lang).title}
                </span>
                <span className="font-mono-num text-xs text-muted shrink-0">
                  {th.score}/9
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {feedback && (
        <p className="text-xs text-score-bad">{feedback}</p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted hover:text-ink"
        >
          {t.editTheory.cancel}
        </button>
      </div>
    </div>
  );
}
