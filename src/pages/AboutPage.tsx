import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-10">
        <p className="text-xs font-mono-num uppercase tracking-widest text-muted">
          {t.about.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          {t.about.title}
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.about.intro}</p>
      </div>

      <Section title={t.about.scoring.title}>
        <p>{t.about.scoring.body}</p>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <Bullet color="#C0392B">{t.about.scoring.bullets.false}</Bullet>
          <Bullet color="#9CA3AF">{t.about.scoring.bullets.undet}</Bullet>
          <Bullet color="#1F8A4C">{t.about.scoring.bullets.true}</Bullet>
        </ul>
        <p className="mt-3">{t.about.scoring.after}</p>
      </Section>

      <Section title={t.about.evidence.title}>
        <p>{t.about.evidence.body}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {t.about.evidence.list.map((row, i) => (
            <li key={i}>
              <strong>{row.strong}</strong> {row.text}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.about.rules.title}>
        <p>{t.about.rules.body}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {t.about.rules.list.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section title={t.about.transparency.title}>
        <p>
          {t.about.transparency.pre}{' '}
          <Link to="/takedowns" className="text-brand hover:underline">
            {t.about.transparency.linkText}
          </Link>
          {t.about.transparency.post}
        </p>
      </Section>

      <Section title={t.about.involvement.title}>
        <p>
          {t.about.involvement.pre}{' '}
          <Link to="/submit" className="text-brand hover:underline">
            {t.about.involvement.linkText}
          </Link>
          {t.about.involvement.post}
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
