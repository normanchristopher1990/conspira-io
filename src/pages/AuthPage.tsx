import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Field from '../components/form/Field';
import { TextInput } from '../components/form/inputs';
import { useAuth } from '../lib/auth';

type Mode = 'login' | 'register';

export default function AuthPage({ mode }: { mode: Mode }) {
  const { user, isConfigured, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
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
        setError('Username must be 3–32 characters: letters, numbers, underscore.');
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, username.trim());
        setInfo('Check your email for a confirmation link to finish creating your account.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: 'google' | 'apple') {
    setError(null);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth failed.');
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {mode === 'login'
          ? 'Welcome back. Sign in to submit theories and evidence.'
          : 'Email + password is enough to start. You can add expert credentials later.'}
      </p>

      {!isConfigured && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Sign-in is temporarily unavailable. Please try again shortly.
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'register' && (
          <Field label="Username" required hint="Letters, numbers, underscore — 3–32 chars">
            <TextInput
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. truth_hunter"
              minLength={3}
              maxLength={32}
              required
              disabled={!isConfigured}
            />
          </Field>
        )}

        <Field label="Email" required>
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

        <Field label="Password" required hint={mode === 'register' ? 'At least 8 characters' : undefined}>
          <TextInput
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
            disabled={!isConfigured}
          />
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
          {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or continue with
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OAuthButton onClick={() => oauth('google')} disabled={!isConfigured} label="Google" />
        <OAuthButton onClick={() => oauth('apple')} disabled={!isConfigured} label="Apple" />
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        {mode === 'login' ? (
          <>
            New here?{' '}
            <Link to="/register" className="font-medium text-brand hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Sign in
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
