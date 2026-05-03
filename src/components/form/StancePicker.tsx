import { useI18n } from '../../lib/i18n';
import type { Stance } from '../../lib/types';

type Props = {
  value: Stance;
  onChange: (next: Stance) => void;
};

export default function StancePicker({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-2">
      <Option
        active={value === 'supporting'}
        onClick={() => onChange('supporting')}
        color="#16A34A"
        label={t.submit.step2.stanceSupporting}
      />
      <Option
        active={value === 'contradicting'}
        onClick={() => onChange('contradicting')}
        color="#DC2626"
        label={t.submit.step2.stanceContradicting}
      />
    </div>
  );
}

function Option({
  active,
  onClick,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ' +
        (active
          ? 'text-white border-transparent'
          : 'border-line bg-white text-slate-700 hover:border-slate-300')
      }
      style={active ? { backgroundColor: color } : undefined}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: active ? '#fff' : color }}
      />
      {label}
    </button>
  );
}
