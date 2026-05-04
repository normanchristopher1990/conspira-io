import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 h-20 flex items-center justify-between gap-3">
        <Link
          to="/"
          aria-label={t.header.conspiraHome}
          className="flex items-center gap-2 group shrink-0 whitespace-nowrap"
        >
          <img
            src="/logo.svg"
            alt=""
            aria-hidden
            className="h-16 w-16 sm:h-14 sm:w-14 shrink-0"
          />
          <span className="font-semibold tracking-tight text-ink text-2xl sm:text-xl">
            Conspira
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />

          {user ? (
            <>
              <Link
                to="/me"
                className="hidden sm:inline text-xs text-muted hover:text-brand"
              >
                {profile?.username ?? '…'}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:inline text-xs text-slate-700 hover:text-ink px-2 py-1.5 rounded-md hover:bg-slate-100"
              >
                {t.header.signOut}
              </button>

              <Link
                to="/me"
                aria-label={t.header.yourProfile}
                className="sm:hidden grid place-items-center h-9 w-9 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-600"
              >
                {(profile?.username ?? 'u').charAt(0).toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline text-sm text-slate-700 hover:text-ink px-3 py-1.5 rounded-md hover:bg-slate-100"
              >
                {t.header.signIn}
              </Link>

              <Link
                to="/login"
                aria-label={t.header.signIn}
                className="sm:hidden grid place-items-center h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100"
              >
                <PersonIcon />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5" />
    </svg>
  );
}
