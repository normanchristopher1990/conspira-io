import Field from '../../components/form/Field';
import FileUpload from '../../components/form/FileUpload';
import { Checkbox, Select, TextInput, Textarea } from '../../components/form/inputs';
import { EVIDENCE_TYPE_META } from '../../lib/evidenceTypes';
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
  const update = (id: string, patch: Partial<EvidenceDraft>) =>
    onChange(items.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) =>
    onChange(items.length > 1 ? items.filter((e) => e.id !== id) : items);
  const add = () => onChange([...items, emptyEvidence()]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        At least one piece of evidence is required. Each one is independently scored 0–5
        based on its type and verifiability.
      </p>

      {items.map((e, i) => (
        <EvidenceCard
          key={e.id}
          index={i}
          total={items.length}
          item={e}
          onChange={(patch) => update(e.id, patch)}
          onRemove={() => remove(e.id)}
        />
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-line bg-white py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand/5 transition-colors"
      >
        + Add another piece of evidence
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
}: {
  index: number;
  total: number;
  item: EvidenceDraft;
  onChange: (patch: Partial<EvidenceDraft>) => void;
  onRemove: () => void;
}) {
  const setInvolvement = (patch: Partial<Involvement>) =>
    onChange({ involvement: { ...item.involvement, ...patch } });

  const meta = item.type ? EVIDENCE_TYPE_META[item.type] : null;

  return (
    <div className="rounded-xl ring-1 ring-line bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          Evidence #{index + 1}
        </h3>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted hover:text-score-bad"
          >
            Remove
          </button>
        )}
      </div>

      <Field label="Evidence type" required>
        <Select
          value={item.type}
          onChange={(e) => onChange({ type: e.target.value as EvidenceType })}
        >
          <option value="">— select a type —</option>
          {EVIDENCE_TYPE_OPTIONS.map((t) => {
            const m = EVIDENCE_TYPE_META[t];
            return (
              <option key={t} value={t}>
                {m.label} (max {m.ceiling}/5)
              </option>
            );
          })}
        </Select>
        {meta && (
          <p className="mt-1.5 text-xs text-muted">
            <span className="font-mono-num text-ink">Ceiling {meta.ceiling}/5</span> —{' '}
            {meta.reason}
          </p>
        )}
      </Field>

      <Field label="Title" required>
        <TextInput
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Senate Select Committee Report on MKUltra (1977)"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Source" required hint="Issuing body, journal, publisher">
          <TextInput
            value={item.source}
            onChange={(e) => onChange({ source: e.target.value })}
            placeholder="US Senate, 95th Congress"
          />
        </Field>
        <Field label="Link to source" hint="Either a link or an upload is required">
          <TextInput
            value={item.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://..."
            type="url"
          />
        </Field>
      </div>

      <Field label="Or upload the file directly">
        <FileUpload
          value={item.uploadedFile}
          onChange={(uploadedFile) => onChange({ uploadedFile })}
        />
      </Field>

      <Field label="Description" required hint="What does it show? Why does it matter?">
        <Textarea
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Summarise the contents and how they relate to the theory."
        />
      </Field>

      <fieldset className="rounded-lg border border-line p-4">
        <legend className="px-2 text-xs font-medium uppercase tracking-widest text-muted">
          Your involvement
        </legend>
        <p className="text-xs text-slate-500">
          Optional. Each declaration increases the evidential weight if verified.
          Knowingly false declarations result in a permanent ban.
        </p>

        <div className="mt-3 grid gap-2">
          <Checkbox
            label="I was directly involved in this"
            checked={item.involvement.directlyInvolved}
            onChange={(e) => setInvolvement({ directlyInvolved: e.target.checked })}
          />
          {item.involvement.directlyInvolved && (
            <NestedInput
              placeholder="Describe your role"
              value={item.involvement.directlyInvolvedDetail}
              onChange={(v) => setInvolvement({ directlyInvolvedDetail: v })}
            />
          )}

          <Checkbox
            label="I have insider knowledge"
            checked={item.involvement.insiderKnowledge}
            onChange={(e) => setInvolvement({ insiderKnowledge: e.target.checked })}
          />
          {item.involvement.insiderKnowledge && (
            <NestedInput
              placeholder="Position / organisation (optional)"
              value={item.involvement.insiderKnowledgeDetail}
              onChange={(v) => setInvolvement({ insiderKnowledgeDetail: v })}
            />
          )}

          <Checkbox
            label="I risk my career by submitting this"
            checked={item.involvement.careerRisk}
            onChange={(e) => setInvolvement({ careerRisk: e.target.checked })}
          />
          {item.involvement.careerRisk && (
            <NestedInput
              placeholder="Current position (optional)"
              value={item.involvement.careerRiskDetail}
              onChange={(v) => setInvolvement({ careerRiskDetail: v })}
            />
          )}

          <Checkbox
            label="I risk my professional licence"
            checked={item.involvement.licenseRisk}
            onChange={(e) => setInvolvement({ licenseRisk: e.target.checked })}
          />
          {item.involvement.licenseRisk && (
            <NestedInput
              placeholder="Licence type (e.g. ATPL, medical, bar)"
              value={item.involvement.licenseRiskDetail}
              onChange={(v) => setInvolvement({ licenseRiskDetail: v })}
            />
          )}

          <Checkbox
            label="I risk legal consequences"
            checked={item.involvement.legalRisk}
            onChange={(e) => setInvolvement({ legalRisk: e.target.checked })}
          />
          {item.involvement.legalRisk && (
            <NestedInput
              placeholder="Description of the legal risk (optional)"
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
