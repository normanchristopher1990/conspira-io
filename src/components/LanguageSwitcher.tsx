import { useI18n, type Lang } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="inline-flex items-center gap-1.5">
      <FlagButton
        active={lang === 'en'}
        onClick={() => setLang('en')}
        flag={<FlagUS />}
        label={t.header.languageEnglish}
      />
      <FlagButton
        active={lang === 'de'}
        onClick={() => setLang('de')}
        flag={<FlagDE />}
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
  flag: React.ReactNode;
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
        'rounded-[3px] overflow-hidden transition-all shadow-sm ' +
        (active
          ? 'h-5 w-7 ring-2 ring-brand ring-offset-1 ring-offset-white'
          : 'h-4 w-6 ring-1 ring-line opacity-95 hover:opacity-100 hover:scale-105')
      }
    >
      {flag}
    </button>
  );
}

function FlagDE() {
  return (
    <svg
      viewBox="0 0 5 3"
      preserveAspectRatio="none"
      className="block h-full w-full"
      aria-hidden
    >
      <rect width="5" height="1" y="0" fill="#000000" />
      <rect width="5" height="1" y="1" fill="#DD0000" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  );
}

function FlagUS() {
  // 13 horizontal stripes, blue canton with simplified star field.
  // Stripe height = 10/13 ≈ 0.769 in a 19×10 viewBox.
  const SH = 10 / 13;
  return (
    <svg
      viewBox="0 0 19 10"
      preserveAspectRatio="none"
      className="block h-full w-full"
      aria-hidden
    >
      <rect width="19" height="10" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={i * SH} width="19" height={SH} fill="#FFFFFF" />
      ))}
      {/* Canton: 0.4 × 0.5385 of the flag */}
      <rect width={19 * 0.4} height={10 * (7 / 13)} fill="#3C3B6E" />
    </svg>
  );
}

export type { Lang };
