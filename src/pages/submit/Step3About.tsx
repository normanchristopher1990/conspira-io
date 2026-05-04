import Field from '../../components/form/Field';
import { TextInput, Textarea } from '../../components/form/inputs';
import { useI18n } from '../../lib/i18n';
import type { WizardState } from './wizardState';

type Props = {
  value: WizardState['author'];
  onChange: (next: WizardState['author']) => void;
};

export default function Step3About({ value, onChange }: Props) {
  const { t } = useI18n();
  const set = <K extends keyof WizardState['author']>(k: K, v: WizardState['author'][K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-5">
      <Field label={t.submit.step3.displayNameLabel} required hint={t.submit.step3.displayNameHint}>
        <TextInput
          value={value.displayName}
          onChange={(e) => set('displayName', e.target.value)}
          placeholder={t.submit.step3.displayNamePlaceholder}
          maxLength={32}
        />
      </Field>

      <Field label={t.submit.step3.realNameLabel} hint={t.submit.step3.realNameHint}>
        <TextInput
          value={value.realName}
          onChange={(e) => set('realName', e.target.value)}
          placeholder={t.submit.step3.realNamePlaceholder}
        />
      </Field>

      <div className="rounded-xl ring-1 ring-line bg-slate-50 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">{t.submit.step3.expertTitle}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.submit.step3.expertIntro(t.rank.astral.label)}
          </p>
        </div>

        <Field label={t.submit.step3.expertFieldLabel}>
          <TextInput
            value={value.expertField}
            onChange={(e) => set('expertField', e.target.value)}
            placeholder={t.submit.step3.expertFieldPlaceholder}
          />
        </Field>

        <Field label={t.submit.step3.expertNoteLabel}>
          <Textarea
            value={value.expertNote}
            onChange={(e) => set('expertNote', e.target.value)}
            placeholder={t.submit.step3.expertNotePlaceholder}
          />
        </Field>
      </div>
    </div>
  );
}
