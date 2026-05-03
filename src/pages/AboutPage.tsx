import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-10">
        <p className="text-xs font-mono-num uppercase tracking-widest text-muted">
          About
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Evidence over opinion.
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Conspira is a scientific, evidence-based catalogue of alleged
          conspiracy theories. Every theory is scored on the weight of
          verifiable evidence — not opinion, not popularity, not community
          voting. Truth isn&apos;t a matter of opinion.
        </p>
      </div>

      <Section title="How scoring works">
        <p>
          Every theory gets a single 1–9 score that reflects the weight of
          evidence behind it.
        </p>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <Bullet color="#C0392B">1–4 · likely false</Bullet>
          <Bullet color="#9CA3AF">5 · undetermined</Bullet>
          <Bullet color="#1F8A4C">6–9 · likely true</Bullet>
        </ul>
        <p className="mt-3">
          The score is computed from the individual evidence pieces, weighted by
          type ceiling, source independence, and direction of the neutral
          evidence (which our automated reviewer analyses thematically).
        </p>
      </Section>

      <Section title="How evidence is scored">
        <p>
          Each piece of evidence gets a 0–5 score with a maximum determined by
          its type. Reproducible experiments can reach 5/5; unverified claims
          stay at 0/5 (archived but no impact).
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li><strong>5/5:</strong> Reproducible experiment</li>
          <li><strong>4/5:</strong> Peer-reviewed paper · verified witness with personal risk</li>
          <li><strong>3/5:</strong> Government / military document · verified image / video with metadata · witness without risk</li>
          <li><strong>2/5:</strong> Video without verifiable metadata</li>
          <li><strong>0/5:</strong> Unverified — archived only, no impact on theory score</li>
        </ul>
      </Section>

      <Section title="What we won't do">
        <p>We rely on a fixed list of ban-on-sight rules:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>No AI-generated content as evidence</li>
          <li>No deepfakes</li>
          <li>No content involving minors — instant permanent ban</li>
          <li>No targeted harassment, threats, or doxxing</li>
          <li>Three strikes for swearing, defamation, copyright issues, or intolerance</li>
        </ul>
      </Section>

      <Section title="Transparency">
        <p>
          All takedown requests are publicly logged in our{' '}
          <Link to="/takedowns" className="text-brand hover:underline">
            takedown register
          </Link>
          , including the ones we decline. Requests without a specific legal
          basis are documented and declined by default.
        </p>
      </Section>

      <Section title="Get involved">
        <p>
          Anyone can{' '}
          <Link to="/submit" className="text-brand hover:underline">
            submit a theory
          </Link>{' '}
          or add evidence to an existing one. Verified experts get a domain
          badge and start at the Leutnant rank.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function Bullet({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-md ring-1 ring-line bg-white px-3 py-2">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-ink">{children}</span>
    </li>
  );
}
