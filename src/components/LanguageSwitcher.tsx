import { useI18n, type Lang } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white p-0.5">
      <FlagButton
        active={lang === 'en'}
        onClick={() => setLang('en')}
        flag="🇺🇸"
        label={t.header.languageEnglish}
      />
      <FlagButton
        active={lang === 'de'}
        onClick={() => setLang('de')}
        flag="🇩🇪"
        label={t.header.languageGerman}
      />
    </div>
  );
}

function FlagButton({
  active,
  onClick,
  flag,
  label,
}: {
  active: boolean;
  onClick: () => void;
  flag: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={
        'h-7 w-7 grid place-items-center rounded-full text-base transition-all ' +
        (active ? 'bg-brand/10 ring-1 ring-brand/40 scale-110' : 'opacity-50 hover:opacity-100')
      }
    >
      <span aria-hidden>{flag}</span>
    </button>
  );
}

// Re-export Lang type for convenience callers
export type { Lang };
