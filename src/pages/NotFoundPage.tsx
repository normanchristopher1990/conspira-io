import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="font-mono-num text-xs uppercase tracking-widest text-muted">
        {t.notFound.eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">{t.notFound.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{t.notFound.body}</p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        {t.notFound.backHome}
      </Link>
    </main>
  );
}
