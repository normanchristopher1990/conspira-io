import Field from '../../components/form/Field';
import { Select, TextInput, Textarea } from '../../components/form/inputs';
import PixabayImagePicker from '../../components/PixabayImagePicker';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import { CATEGORIES } from '../../lib/categories';
import { useI18n } from '../../lib/i18n';
import { parseYoutubeId } from '../../lib/youtube';
import { SUMMARY_MAX, type WizardState } from './wizardState';

type Props = {
  value: WizardState['basics'];
  onChange: (next: WizardState['basics']) => void;
};

export default function Step1Basics({ value, onChange }: Props) {
  const { t } = useI18n();
  const set = <K extends keyof WizardState['basics']>(k: K, v: WizardState['basics'][K]) =>
    onChange({ ...value, [k]: v });

  const ytId = parseYoutubeId(value.youtubeUrl);
  const ytShowError = value.youtubeUrl.trim().length > 0 && !ytId;

  return (
    <div className="space-y-5">
      <Field label={t.submit.step1.titleLabel} required hint={t.submit.step1.titleHint}>
        <TextInput
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t.submit.step1.titlePlaceholder}
          maxLength={140}
        />
      </Field>

      <Field label={t.submit.step1.categoryLabel} required>
        <Select
          value={value.category}
          onChange={(e) =>
            set('category', e.target.value as WizardState['basics']['category'])
          }
        >
          <option value="">{t.submit.step1.categoryPlaceholder}</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {t.category[c.slug]}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={t.submit.step1.summaryLabel}
        required
        hint={`${value.summary.length} / ${SUMMARY_MAX}`}
      >
        <Textarea
          value={value.summary}
          onChange={(e) => set('summary', e.target.value.slice(0, SUMMARY_MAX))}
          placeholder={t.submit.step1.summaryPlaceholder}
        />
      </Field>

      <Field
        label={t.submit.step1.youtubeLabel}
        hint={t.submit.step1.youtubeHint}
        error={ytShowError ? t.submit.step1.youtubeError : undefined}
      >
        <TextInput
          value={value.youtubeUrl}
          onChange={(e) => set('youtubeUrl', e.target.value)}
          placeholder={t.submit.step1.youtubePlaceholder}
        />
      </Field>

      {ytId && (
        <div className="rounded-lg ring-1 ring-line bg-slate-50 p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-2">
            {t.submit.step1.preview}
          </p>
          <YouTubeEmbed videoId={ytId} title={t.submit.step1.preview} />
        </div>
      )}

      <Field
        label={t.submit.step1.imageLabel}
        hint={t.submit.step1.imageHint}
      >
        <PixabayImagePicker
          value={value.imageUrl}
          onChange={(url) => set('imageUrl', url)}
          seedQuery={value.title}
        />
      </Field>
    </div>
  );
}
