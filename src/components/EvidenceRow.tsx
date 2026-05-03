import type { Evidence } from '../lib/types';
import { EVIDENCE_TYPE_META, evidenceColor } from '../lib/evidenceTypes';
import { useI18n } from '../lib/i18n';
import { publicUrlForStoragePath } from '../lib/storage';

type Props = { evidence: Evidence };

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function EvidenceRow({ evidence }: Props) {
  const { t } = useI18n();
  const meta = EVIDENCE_TYPE_META[evidence.type];
  const typeT = t.evidenceType[evidence.type];
  const color = evidenceColor(evidence.score);

  return (
    <li className="bg-white rounded-lg ring-1 ring-line p-4 hover:ring-slate-300 transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 grid place-items-center h-12 w-12 rounded-md font-mono-num text-base font-bold text-white"
          style={{ backgroundColor: color }}
          aria-label={t.evidenceRow.sourceScore(evidence.score)}
          title={t.evidenceRow.scoreFive(evidence.score, meta.ceiling)}
        >
          {evidence.score}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1"
              style={{ color, borderColor: `${color}55` }}
            >
              {typeT.short}
            </span>
            <span className="text-[11px] font-mono-num text-muted">
              {t.evidenceType.ceilingMax(meta.ceiling)}
            </span>
          </div>

          <h3 className="mt-1 text-sm font-semibold text-ink leading-snug">
            <a
              href={evidence.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand transition-colors"
            >
              {evidence.title}
            </a>
          </h3>

          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            {evidence.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{evidence.source}</span>
            {evidence.url && (
              <>
                <span aria-hidden>·</span>
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-num text-brand hover:underline"
                >
                  {hostnameOf(evidence.url)}
                </a>
              </>
            )}
            {evidence.storagePath && (
              <>
                <span aria-hidden>·</span>
                <a
                  href={publicUrlForStoragePath(evidence.storagePath) ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                >
                  {t.evidenceRow.uploadedFile}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
