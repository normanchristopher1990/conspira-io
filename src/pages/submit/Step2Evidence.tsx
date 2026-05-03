import Field from '../../components/form/Field';
import FileUpload from '../../components/form/FileUpload';
import { Checkbox, Select, TextInput, Textarea } from '../../components/form/inputs';
import { EVIDENCE_TYPE_META } from '../../lib/evidenceTypes';
import { useI18n, type Strings } from '../../lib/i18n';
import type { EvidenceType } from '../../lib/types';
import {
  emptyEvidence,
  type EvidenceDraft,
  type Involvement,
} from './wizardState';

type Props = {
  items: EvidenceDraft[];
  onChange: (next: EvidenceDraft[]) => void;
};

const EVIDENCE_TYPE_OPTIONS: EvidenceType[] = [
  'reproducible-experiment',
  'peer-reviewed-paper',
  'witness-with-risk',
  'witness-without-risk',
  'government-document',
  'declassified-military',
  'video-with-metadata',
  'verified-image',
  'video-without-metadata',
  'unverified',
];

export default function Step2Evidence({ items, onChange }: Props) {
  const { t } = useI18n();
  const update = (id: string, patch: Partial<EvidenceDraft>) =>
    onChange(items.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) =>
    onChange(items.length > 1 ? items.filter((e) => e.id !== id) : items);
  const add = () => onChange([...items, emptyEvidence()]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{t.submit.step2.intro}</p>

      {items.map((e, i) => (
        <EvidenceCard
          key={e.id}
          index={i}
          total={items.length}
          item={e}
          onChange={(patch) => update(e.id, patch)}
          onRemove={() => remove(e.id)}
          t={t}
        />
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-line bg-white py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand/5 transition-colors"
      >
        {t.submit.step2.addAnother}
      </button>
    </div>
  );
}

function EvidenceCard({
  index,
  total,
  item,
  onChange,
  onRemove,
  t,
}: {
  index: number;
  total: number;
  item: EvidenceDraft;
  onChange: (patch: Partial<EvidenceDraft>) => void;
  onRemove: () => void;
  t: Strings;
}) {
  const setInvolvement = (patch: Partial<Involvement>) =>
    onChange({ involvement: { ...item.involvement, ...patch } });

  const meta = item.type ? EVIDENCE_TYPE_META[item.type] : null;
  const typeT = item.type ? t.evidenceType[item.type] : null;

  return (
    <div className="rounded-xl ring-1 ring-line bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {t.submit.step2.indexHeader(index + 1)}
        </h3>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted hover:text-score-bad"
          >
            {t.submit.step2.remove}
          </button>
        )}
      </div>

      <Field label={t.submit.step2.typeLabel} required>
        <Select
          value={item.type}
          onChange={(e) => onChange({ type: e.target.value as EvidenceType })}
        >
          <option value="">{t.submit.step2.typePlaceholder}</option>
          {EVIDENCE_TYPE_OPTIONS.map((tp) => {
            const m = EVIDENCE_TYPE_META[tp];
            return (
              <option key={tp} value={tp}>
                {t.evidenceType[tp].label} ({t.evidenceType.ceilingMax(m.ceiling)})
              </option>
            );
          })}
        </Select>
        {meta && typeT && (
          <p className="mt-1.5 text-xs text-muted">
            <span className="font-mono-num text-ink">
              {t.evidenceType.ceiling(meta.ceiling)}
            </span>{' '}
            — {typeT.reason}
          </p>
        )}
      </Field>

      <Field label={t.submit.step2.titleLabel} required>
        <TextInput
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t.submit.step2.titlePlaceholder}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t.submit.step2.sourceLabel} required hint={t.submit.step2.sourceHint}>
          <TextInput
            value={item.source}
            onChange={(e) => onChange({ source: e.target.value })}
            placeholder={t.submit.step2.sourcePlaceholder}
          />
        </Field>
        <Field label={t.submit.step2.urlLabel} hint={t.submit.step2.urlHint}>
          <TextInput
            value={item.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder={t.submit.step2.urlPlaceholder}
            type="url"
          />
        </Field>
      </div>

      <Field label={t.submit.step2.uploadLabel}>
        <FileUpload
          value={item.uploadedFile}
          onChange={(uploadedFile) => onChange({ uploadedFile })}
        />
      </Field>

      <Field label={t.submit.step2.descriptionLabel} required hint={t.submit.step2.descriptionHint}>
        <Textarea
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>

      <fieldset className="rounded-lg border border-line p-4">
        <legend className="px-2 text-xs font-medium uppercase tracking-widest text-muted">
          {t.submit.step2.involvementLegend}
        </legend>
        <p className="text-xs text-slate-500">{t.submit.step2.involvementIntro}</p>

        <div className="mt-3 grid gap-2">
          <Checkbox
            label={t.submit.step2.directlyInvolved}
            checked={item.involvement.directlyInvolved}
            onChange={(e) => setInvolvement({ directlyInvolved: e.target.checked })}
          />
          {item.involvement.directlyInvolved && (
            <NestedInput
              placeholder={t.submit.step2.directlyInvolvedDetail}
              value={item.involvement.directlyInvolvedDetail}
              onChange={(v) => setInvolvement({ directlyInvolvedDetail: v })}
            />
          )}

          <Checkbox
            label={t.submit.step2.insiderKnowledge}
            checked={item.involvement.insiderKnowledge}
            onChange={(e) => setInvolvement({ insiderKnowledge: e.target.checked })}
          />
          {item.involvement.insiderKnowledge && (
            <NestedInput
              placeholder={t.submit.step2.insiderKnowledgeDetail}
              value={item.involvement.insiderKnowledgeDetail}
              onChange={(v) => setInvolvement({ insiderKnowledgeDetail: v })}
            />
          )}

          <Checkbox
            label={t.submit.step2.careerRisk}
            checked={item.involvement.careerRisk}
            onChange={(e) => setInvolvement({ careerRisk: e.target.checked })}
          />
          {item.involvement.careerRisk && (
            <NestedInput
              placeholder={t.submit.step2.careerRiskDetail}
              value={item.involvement.careerRiskDetail}
              onChange={(v) => setInvolvement({ careerRiskDetail: v })}
            />
          )}

          <Checkbox
            label={t.submit.step2.licenseRisk}
            checked={item.involvement.licenseRisk}
            onChange={(e) => setInvolvement({ licenseRisk: e.target.checked })}
          />
          {item.involvement.licenseRisk && (
            <NestedInput
              placeholder={t.submit.step2.licenseRiskDetail}
              value={item.involvement.licenseRiskDetail}
              onChange={(v) => setInvolvement({ licenseRiskDetail: v })}
            />
          )}

          <Checkbox
            label={t.submit.step2.legalRisk}
            checked={item.involvement.legalRisk}
            onChange={(e) => setInvolvement({ legalRisk: e.target.checked })}
          />
          {item.involvement.legalRisk && (
            <NestedInput
              placeholder={t.submit.step2.legalRiskDetail}
              value={item.involvement.legalRiskDetail}
              onChange={(v) => setInvolvement({ legalRiskDetail: v })}
            />
          )}
        </div>
      </fieldset>
    </div>
  );
}

function NestedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="ml-7">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
