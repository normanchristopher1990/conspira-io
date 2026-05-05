import { useEffect, useMemo, useState } from 'react';
import Field from '../../components/form/Field';
import { Select, TextInput } from '../../components/form/inputs';
import PixabayImagePicker from '../../components/PixabayImagePicker';
import {
  createTopic,
  deleteTopic,
  listAllTheoriesMinimal,
  listAllTopics,
  listTheoriesByTopic,
  setTopicTheories,
  updateTopic,
} from '../../lib/api';
import { CATEGORIES, getCategory } from '../../lib/categories';
import { useI18n } from '../../lib/i18n';
import type { CategorySlug, Topic } from '../../lib/types';

type MinimalTheory = { id: string; title: string; category: CategorySlug };

// Mobile-first admin page for managing topics.
// Tap a topic to expand its editor; long taps stay tappable on the bed
// (no fiddly hover affordances).
export default function AdminTopics() {
  const { t } = useI18n();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [allTheories, setAllTheories] = useState<MinimalTheory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<CategorySlug | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [tops, all] = await Promise.all([listAllTopics(), listAllTheoriesMinimal()]);
      setTopics(tops);
      setAllTheories(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const byCategory = useMemo(() => {
    const grouped = new Map<CategorySlug, Topic[]>();
    for (const c of CATEGORIES) grouped.set(c.slug, []);
    for (const tp of topics) grouped.get(tp.category)?.push(tp);
    return grouped;
  }, [topics]);

  if (loading) {
    return <p className="px-4 py-8 text-sm text-muted">{t.adminTopics.loading}</p>;
  }

  return (
    <div className="pt-4 pb-12 space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          {t.adminTopics.title}
        </h1>
        <p className="mt-1 text-xs text-muted">{t.adminTopics.intro}</p>
      </div>

      {error && (
        <div className="rounded-md bg-score-bad/10 px-3 py-2 text-xs text-score-bad">{error}</div>
      )}

      <div className="space-y-5">
        {CATEGORIES.map((cat) => {
          const list = byCategory.get(cat.slug) ?? [];
          const isCreatingHere = creatingFor === cat.slug;
          return (
            <section key={cat.slug} className="rounded-lg ring-1 ring-line bg-white">
              <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
                  {t.category[cat.slug]} · {list.length}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setCreatingFor((cur) => (cur === cat.slug ? null : cat.slug))
                  }
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white active:bg-brand-700"
                >
                  {isCreatingHere ? t.adminTopics.cancelNew : t.adminTopics.addNew}
                </button>
              </header>

              {isCreatingHere && (
                <div className="border-b border-line p-3">
                  <NewTopicForm
                    category={cat.slug}
                    allTheories={allTheories}
                    onCreated={() => {
                      setCreatingFor(null);
                      refresh();
                    }}
                    onCancel={() => setCreatingFor(null)}
                  />
                </div>
              )}

              {list.length === 0 ? (
                !isCreatingHere && (
                  <p className="px-3 py-4 text-xs text-muted">{t.adminTopics.empty}</p>
                )
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((tp) => (
                    <li key={tp.id}>
                      <TopicRow
                        topic={tp}
                        expanded={expandedId === tp.id}
                        onToggle={() => setExpandedId((cur) => (cur === tp.id ? null : tp.id))}
                        allTheories={allTheories}
                        onChanged={refresh}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function TopicRow({
  topic,
  expanded,
  onToggle,
  allTheories,
  onChanged,
}: {
  topic: Topic;
  expanded: boolean;
  onToggle: () => void;
  allTheories: MinimalTheory[];
  onChanged: () => void;
}) {
  const { t, lang } = useI18n();
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2 text-left active:bg-slate-50"
      >
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-line">
          {topic.imagePath && (
            <img
              src={topic.imagePath}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {lang === 'de' ? topic.nameDe : topic.nameEn}
          </p>
          <p className="font-mono-num text-[11px] text-muted">
            {topic.theoryCount} {t.adminTopics.theoriesShort}
          </p>
        </div>
        <span className="text-xs text-muted">{expanded ? '▴' : '▾'}</span>
      </button>

      {expanded && (
        <div className="border-t border-line bg-slate-50 p-3">
          <TopicEditor topic={topic} allTheories={allTheories} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
}

function NewTopicForm({
  category,
  allTheories,
  onCreated,
  onCancel,
}: {
  category: CategorySlug;
  allTheories: MinimalTheory[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [nameEn, setNameEn] = useState('');
  const [nameDe, setNameDe] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [theoryIds, setTheoryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (nameEn.trim().length < 2 || nameDe.trim().length < 2) {
      setErr(t.adminTopics.nameTooShort);
      return;
    }
    setBusy(true);
    try {
      const slug = nameEn
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const { id } = await createTopic({
        slug,
        category,
        nameEn: nameEn.trim(),
        nameDe: nameDe.trim(),
        imagePath: imageUrl.trim() || undefined,
      });
      if (theoryIds.length > 0) {
        await setTopicTheories(id, theoryIds);
      }
      onCreated();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={t.adminTopics.nameEn} required>
        <TextInput value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Alien Races" />
      </Field>
      <Field label={t.adminTopics.nameDe} required>
        <TextInput value={nameDe} onChange={(e) => setNameDe(e.target.value)} placeholder="Alien-Rassen" />
      </Field>
      <Field label={t.adminTopics.image}>
        <PixabayImagePicker value={imageUrl} onChange={setImageUrl} seedQuery={nameEn} />
      </Field>
      <Field label={t.adminTopics.theories}>
        <TheoryMultiSelect
          theories={allTheories}
          selectedIds={theoryIds}
          onChange={setTheoryIds}
          defaultCategory={category}
        />
      </Field>

      {err && <p className="rounded-md bg-score-bad/10 px-3 py-2 text-xs text-score-bad">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-60"
        >
          {busy ? t.adminTopics.saving : t.adminTopics.create}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md ring-1 ring-line bg-white px-4 py-2.5 text-sm text-ink"
        >
          {t.adminTopics.cancel}
        </button>
      </div>
    </form>
  );
}

function TopicEditor({
  topic,
  allTheories,
  onChanged,
}: {
  topic: Topic;
  allTheories: MinimalTheory[];
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const [nameEn, setNameEn] = useState(topic.nameEn);
  const [nameDe, setNameDe] = useState(topic.nameDe);
  const [imageUrl, setImageUrl] = useState(topic.imagePath ?? '');
  const [category, setCategory] = useState<CategorySlug>(topic.category);
  const [theoryIds, setTheoryIds] = useState<string[]>([]);
  const [loadingTheories, setLoadingTheories] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listTheoriesByTopic(topic.id)
      .then((ts) => setTheoryIds(ts.map((tt) => tt.id)))
      .catch(() => setTheoryIds([]))
      .finally(() => setLoadingTheories(false));
  }, [topic.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await updateTopic(topic.id, {
        category,
        nameEn: nameEn.trim(),
        nameDe: nameDe.trim(),
        imagePath: imageUrl.trim() || '',
      });
      await setTopicTheories(topic.id, theoryIds);
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setErr(null);
    setBusy(true);
    try {
      await deleteTopic(topic.id);
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Delete failed');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <Field label={t.adminTopics.category} required>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategorySlug)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.adminTopics.nameEn} required>
        <TextInput value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
      </Field>
      <Field label={t.adminTopics.nameDe} required>
        <TextInput value={nameDe} onChange={(e) => setNameDe(e.target.value)} />
      </Field>
      <Field label={t.adminTopics.image}>
        <PixabayImagePicker value={imageUrl} onChange={setImageUrl} seedQuery={nameEn} />
      </Field>
      <Field label={t.adminTopics.theories}>
        {loadingTheories ? (
          <p className="text-xs text-muted">{t.adminTopics.loading}</p>
        ) : (
          <TheoryMultiSelect
            theories={allTheories}
            selectedIds={theoryIds}
            onChange={setTheoryIds}
            defaultCategory={category}
          />
        )}
      </Field>

      {err && <p className="rounded-md bg-score-bad/10 px-3 py-2 text-xs text-score-bad">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-60"
        >
          {busy ? t.adminTopics.saving : t.adminTopics.save}
        </button>
        {confirmDel ? (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-md bg-score-bad px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t.adminTopics.confirmDelete}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="rounded-md ring-1 ring-score-bad/40 bg-white px-4 py-2.5 text-sm text-score-bad"
          >
            {t.adminTopics.delete}
          </button>
        )}
      </div>
    </form>
  );
}

function TheoryMultiSelect({
  theories,
  selectedIds,
  onChange,
  defaultCategory,
}: {
  theories: MinimalTheory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  defaultCategory?: CategorySlug;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategorySlug | 'all'>(
    defaultCategory ?? 'all',
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return theories
      .filter((th) => filterCategory === 'all' || th.category === filterCategory)
      .filter((th) => !q || th.title.toLowerCase().includes(q));
  }, [theories, filterCategory, search]);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  // Show selected first so user sees their picks even if filter changes
  const selectedTheories = theories.filter((th) => selectedSet.has(th.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.adminTopics.searchTheories}
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as CategorySlug | 'all')}
          className="rounded-md border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t.adminTopics.allCategories}</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {selectedTheories.length > 0 && (
        <div className="rounded-md ring-1 ring-line bg-white p-2">
          <p className="text-[10px] uppercase tracking-widest text-muted mb-1.5">
            {t.adminTopics.selectedCount(selectedTheories.length)}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {selectedTheories.map((th) => (
              <li key={th.id}>
                <button
                  type="button"
                  onClick={() => toggle(th.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-xs text-brand ring-1 ring-brand/20 active:bg-brand/20"
                >
                  <span className="truncate max-w-[160px]">{th.title}</span>
                  <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="max-h-72 overflow-auto rounded-md ring-1 ring-line bg-white divide-y divide-line">
        {filtered.length === 0 ? (
          <li className="px-3 py-3 text-xs text-muted">{t.adminTopics.noTheories}</li>
        ) : (
          filtered.slice(0, 200).map((th) => (
            <li key={th.id}>
              <label className="flex cursor-pointer items-start gap-3 px-3 py-2 text-sm active:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedSet.has(th.id)}
                  onChange={() => toggle(th.id)}
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink">{th.title}</span>
                  <span className="block text-[10px] uppercase tracking-wider text-muted">
                    {getCategory(th.category).label}
                  </span>
                </span>
              </label>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
