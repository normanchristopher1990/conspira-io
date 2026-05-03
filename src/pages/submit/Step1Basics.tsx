import Field from '../../components/form/Field';
import { Select, TextInput, Textarea } from '../../components/form/inputs';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import { CATEGORIES } from '../../lib/categories';
import { parseYoutubeId } from '../../lib/youtube';
import { SUMMARY_MAX, type WizardState } from './wizardState';

type Props = {
  value: WizardState['basics'];
  onChange: (next: WizardState['basics']) => void;
};

export default function Step1Basics({ value, onChange }: Props) {
  const set = <K extends keyof WizardState['basics']>(k: K, v: WizardState['basics'][K]) =>
    onChange({ ...value, [k]: v });

  const ytId = parseYoutubeId(value.youtubeUrl);
  const ytShowError = value.youtubeUrl.trim().length > 0 && !ytId;

  return (
    <div className="space-y-5">
      <Field label="Theory title" required hint="Plain, descriptive — no caps lock">
        <TextInput
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. CIA covertly funded modernist art during the Cold War"
          maxLength={140}
        />
      </Field>

      <Field label="Category" required>
        <Select
          value={value.category}
          onChange={(e) =>
            set('category', e.target.value as WizardState['basics']['category'])
          }
        >
          <option value="">— select a category —</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Summary"
        required
        hint={`${value.summary.length} / ${SUMMARY_MAX}`}
      >
        <Textarea
          value={value.summary}
          onChange={(e) => set('summary', e.target.value.slice(0, SUMMARY_MAX))}
          placeholder="What is the claim? Be neutral and factual. Save the evidence for the next step."
        />
      </Field>

      <Field
        label="YouTube link"
        hint="Optional · paste a watch URL, shorts URL, or 11-character ID"
        error={ytShowError ? "That doesn't look like a valid YouTube URL." : undefined}
      >
        <TextInput
          value={value.youtubeUrl}
          onChange={(e) => set('youtubeUrl', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </Field>

      {ytId && (
        <div className="rounded-lg ring-1 ring-line bg-slate-50 p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Preview</p>
          <YouTubeEmbed videoId={ytId} title="Preview" />
        </div>
      )}
    </div>
  );
}
