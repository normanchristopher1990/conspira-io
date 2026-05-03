import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

const PATREON_URL = import.meta.env.VITE_PATREON_URL ?? '';
const DONATE_URL = import.meta.env.VITE_DONATE_URL ?? '';
const SUBSCRIBE_URL = import.meta.env.VITE_SUBSCRIBE_URL ?? '';

export default function SupportPage() {
  const { t } = useI18n();
  const anyConfigured = PATREON_URL || DONATE_URL || SUBSCRIBE_URL;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-10">
        <p className="text-xs font-mono-num uppercase tracking-widest text-muted">{t.support.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{t.support.title}</h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.support.intro}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Tier
          title={t.support.tiers.donate.title}
          desc={t.support.tiers.donate.desc}
          cta={t.support.tiers.donate.cta}
          notConfigured={t.support.notConfigured}
          url={DONATE_URL}
        />
        <Tier
          title={t.support.tiers.patreon.title}
          desc={t.support.tiers.patreon.desc}
          cta={t.support.tiers.patreon.cta}
          notConfigured={t.support.notConfigured}
          url={PATREON_URL}
        />
        <Tier
          title={t.support.tiers.subscribe.title}
          desc={t.support.tiers.subscribe.desc}
          cta={t.support.tiers.subscribe.cta}
          notConfigured={t.support.notConfigured}
          url={SUBSCRIBE_URL}
        />
      </div>

      {!anyConfigured && (
        <p className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Owner note — set <code>VITE_PATREON_URL</code>, <code>VITE_DONATE_URL</code>, and/or{' '}
          <code>VITE_SUBSCRIBE_URL</code> in <code>.env.local</code> to activate the buttons.
        </p>
      )}

      <section className="mt-10 rounded-xl ring-1 ring-line bg-white p-5 text-sm text-slate-700">
        <h2 className="text-base font-semibold text-ink">{t.support.where.title}</h2>
        <ul className="mt-3 space-y-1">
          {t.support.where.list.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          {t.support.where.footer}{' '}
          <Link to="/about" className="text-brand hover:underline">
            {t.support.where.aboutLink}
          </Link>
        </p>
      </section>
    </main>
  );
}

function Tier({
  title,
  desc,
  cta,
  notConfigured,
  url,
}: {
  title: string;
  desc: string;
  cta: string;
  notConfigured: string;
  url: string;
}) {
  return (
    <div className="rounded-xl ring-1 ring-line bg-white p-5 flex flex-col">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">{desc}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {cta}
        </a>
      ) : (
        <span className="mt-4 inline-flex justify-center rounded-md border border-dashed border-line bg-slate-50 px-4 py-2 text-sm text-muted">
          {notConfigured}
        </span>
      )}
    </div>
  );
}
