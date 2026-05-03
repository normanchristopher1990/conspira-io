import { Link } from 'react-router-dom';

// Configure these once you have accounts set up.
// Set them via Vite env vars (VITE_PATREON_URL, VITE_DONATE_URL, VITE_SUBSCRIBE_URL)
// or just edit the literals below.
const PATREON_URL = import.meta.env.VITE_PATREON_URL ?? '';
const DONATE_URL = import.meta.env.VITE_DONATE_URL ?? '';
const SUBSCRIBE_URL = import.meta.env.VITE_SUBSCRIBE_URL ?? '';

export default function SupportPage() {
  const anyConfigured = PATREON_URL || DONATE_URL || SUBSCRIBE_URL;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-10">
        <p className="text-xs font-mono-num uppercase tracking-widest text-muted">Support</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Support Conspira.io
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Conspira.io stays free and behind no paywall. To keep it that way and
          keep ads selective and minimal, we accept voluntary support. Three
          ways:
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Tier
          title="One-time donation"
          desc="Small or large — every contribution covers hosting and AI review costs."
          cta="Donate"
          url={DONATE_URL}
        />
        <Tier
          title="Patreon"
          desc="Monthly support. Recurring contributions help us plan."
          cta="Become a patron"
          url={PATREON_URL}
        />
        <Tier
          title="Subscription"
          desc="Ad-free experience and early access to new theories. Coming with Phase 3."
          cta="Subscribe"
          url={SUBSCRIBE_URL}
        />
      </div>

      {!anyConfigured && (
        <p className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Owner note — set <code>VITE_PATREON_URL</code>, <code>VITE_DONATE_URL</code>,
          and/or <code>VITE_SUBSCRIBE_URL</code> in <code>.env.local</code> to
          activate the buttons.
        </p>
      )}

      <section className="mt-10 rounded-xl ring-1 ring-line bg-white p-5 text-sm text-slate-700">
        <h2 className="text-base font-semibold text-ink">Where the money goes</h2>
        <ul className="mt-3 space-y-1">
          <li>· Server hosting (Vercel + Supabase)</li>
          <li>· Anthropic API usage for the automated review pass</li>
          <li>· Storage for uploaded evidence files</li>
          <li>· Domain renewal</li>
          <li>· No salary — this is a volunteer project</li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          Per the concept doc&apos;s monetisation policy: no pharma, no
          government, and no weapons advertisers will be accepted on this
          platform.{' '}
          <Link to="/about" className="text-brand hover:underline">
            About
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
  url,
}: {
  title: string;
  desc: string;
  cta: string;
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
          Not configured yet
        </span>
      )}
    </div>
  );
}
