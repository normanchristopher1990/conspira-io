import Field from '../../components/form/Field';
import { TextInput, Textarea } from '../../components/form/inputs';
import type { WizardState } from './wizardState';

type Props = {
  value: WizardState['author'];
  onChange: (next: WizardState['author']) => void;
};

export default function Step3About({ value, onChange }: Props) {
  const set = <K extends keyof WizardState['author']>(k: K, v: WizardState['author'][K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-5">
      <Field label="Display name" required hint="Anonymous handle is fine">
        <TextInput
          value={value.displayName}
          onChange={(e) => set('displayName', e.target.value)}
          placeholder="e.g. archivist_42"
          maxLength={32}
        />
      </Field>

      <Field
        label="Real name"
        hint="Optional · increases evidential weight if verified"
      >
        <TextInput
          value={value.realName}
          onChange={(e) => set('realName', e.target.value)}
          placeholder="Jane Doe"
        />
      </Field>

      <div className="rounded-xl ring-1 ring-line bg-slate-50 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Expert credentials</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Optional. Verified experts get a domain badge and start at the
            <span className="font-medium text-ink"> Leutnant</span> rank. We
            verify with institutional email and public registers — submit those
            details after this form.
          </p>
        </div>

        <Field label="Field of expertise">
          <TextInput
            value={value.expertField}
            onChange={(e) => set('expertField', e.target.value)}
            placeholder="e.g. Aviation, Virology, Constitutional law"
          />
        </Field>

        <Field label="Brief credential note">
          <Textarea
            value={value.expertNote}
            onChange={(e) => set('expertNote', e.target.value)}
            placeholder="Role, institution, public register, ORCID, LinkedIn — anything we can verify."
          />
        </Field>
      </div>
    </div>
  );
}
