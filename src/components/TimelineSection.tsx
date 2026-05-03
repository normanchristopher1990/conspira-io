import { useMemo } from 'react';
import EvidenceRow from './EvidenceRow';
import { EVIDENCE_TYPE_META } from '../lib/evidenceTypes';
import type { Evidence } from '../lib/types';

type Props = { evidence: Evidence[] };

// Chronological story of how the evidence accumulated.
// Oldest first — the order things became publicly known.
export default function TimelineSection({ evidence }: Props) {
  const sorted = useMemo(
    () =>
      [...evidence].sort(
        (a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt),
      ),
    [evidence],
  );

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
        No evidence has been catalogued for this theory yet.
      </p>
    );
  }

  // Group by year-month so the timeline reads as a story.
  const groups = groupByMonth(sorted);

  return (
    <div className="space-y-8">
      {groups.map(([label, items]) => (
        <section key={label}>
          <header className="mb-3 flex items-center gap-3">
            <span className="font-mono-num text-xs uppercase tracking-widest text-muted">
              {label}
            </span>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="text-[11px] text-muted">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </header>
          <ol className="relative ml-3 space-y-3 border-l border-line pl-5">
            {items.map((e) => (
              <li key={e.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-bg"
                />
                <p className="mb-1 text-[11px] font-mono-num text-muted">
                  {new Date(e.submittedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {EVIDENCE_TYPE_META[e.type].short}
                </p>
                <EvidenceRow evidence={e} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function groupByMonth(items: Evidence[]): [string, Evidence[]][] {
  const map = new Map<string, Evidence[]>();
  for (const item of items) {
    const d = new Date(item.submittedAt);
    const label = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries());
}
