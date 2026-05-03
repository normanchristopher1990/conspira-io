import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="font-mono-num text-xs uppercase tracking-widest text-muted">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Nothing here.</h1>
      <p className="mt-2 text-sm text-slate-600">
        That page doesn’t exist. Maybe it was suppressed.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        Back to homepage
      </Link>
    </main>
  );
}
