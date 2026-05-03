import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

type Props = {
  children: ReactNode;
  adminOnly?: boolean;
};

export default function RequireAuth({ children, adminOnly = false }: Props) {
  const { ready, user, isAdmin, isConfigured } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t.profile.needsSupabase}</p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted">
        {t.home.loading}
      </main>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-score-bad">{t.admin.onlyAdmin}</p>
      </main>
    );
  }

  return <>{children}</>;
}
