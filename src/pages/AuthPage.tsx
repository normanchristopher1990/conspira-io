import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Field from '../components/form/Field';
import { TextInput } from '../components/form/inputs';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

type Mode = 'login' | 'register';

export default function AuthPage({ mode }: { mode: Mode }) {
  const { user, isConfigured, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const location = useLocation();

  if (user) {
    const next = new URLSearchParams(location.search).get('next') ?? '/';
    return <Navigate to={next} replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === 'register') {
      const trimmed = username.trim();
      if (!/^[a-zA-Z0-9_]{3,32}$/.test(trimmed)) {
        setError(t.auth.invalidUsername);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, username.trim());
        setInfo(t.auth.confirmEmail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.something);
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: 'google' | 'facebook') {
    setError(null);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.something);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {mode === 'login' ? t.auth.signInTitle : t.auth.registerTitle}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {mode === 'login' ? t.auth.signInIntro : t.auth.registerIntro}
      </p>

      {!isConfigured && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t.auth.unavailable}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'register' && (
          <Field label={t.auth.username} required hint={t.auth.usernameHint}>
            <TextInput
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.auth.usernamePlaceholder}
              minLength={3}
              maxLength={32}
              required
              disabled={!isConfigured}
            />
          </Field>
        )}

        <Field label={t.auth.email} required>
          <TextInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={!isConfigured}
          />
        </Field>

        <Field label={t.auth.password} required hint={mode === 'register' ? t.auth.passwordHint : undefined}>
          <div className="relative">
            <TextInput
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
              disabled={!isConfigured}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              title={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </Field>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">{error}</p>
        )}
        {info && (
          <p className="rounded-md bg-brand/5 px-3 py-2 text-sm text-brand">{info}</p>
        )}

        <button
          type="submit"
          disabled={busy || !isConfigured}
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? t.auth.working : mode === 'login' ? t.auth.submitSignIn : t.auth.submitRegister}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t.auth.orContinue}
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OAuthButton onClick={() => oauth('google')} disabled={!isConfigured} label={t.auth.google} />
        <OAuthButton onClick={() => oauth('facebook')} disabled={!isConfigured} label={t.auth.facebook} />
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        {mode === 'login' ? (
          <>
            {t.auth.newHere}{' '}
            <Link to="/register" className="font-medium text-brand hover:underline">
              {t.auth.createAccount}
            </Link>
          </>
        ) : (
          <>
            {t.auth.haveAccount}{' '}
            <Link to="/login" className="font-medium text-brand hover:underline">
              {t.auth.submitSignIn}
            </Link>
          </>
        )}
      </p>
    </main>
  );
}

function OAuthButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function EyeIcon() {
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
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
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.4 10.4 0 0112 5c6.5 0 10 7 10 7a17.6 17.6 0 01-3.3 4.2" />
      <path d="M6.6 6.6A17.7 17.7 0 002 12s3.5 7 10 7a10.5 10.5 0 005.4-1.6" />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" />
    </svg>
  );
}
