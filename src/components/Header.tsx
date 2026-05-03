import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group shrink-0 whitespace-nowrap">
          <span
            aria-hidden
            className="grid place-items-center h-7 w-7 rounded-md text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: '#185FA5' }}
          >
            C
          </span>
          <span className="font-semibold tracking-tight text-ink">
            Conspira
          </span>
          <span className="ml-2 hidden lg:inline text-[11px] font-mono-num uppercase tracking-widest text-muted">
            Evidence first
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search theories…"
            className="w-full rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50"
          />
        </form>

        <nav className="flex items-center gap-1 shrink-0">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              'text-sm px-3 py-1.5 rounded-md transition-colors ' +
              (isActive
                ? 'text-ink bg-slate-100'
                : 'text-slate-700 hover:text-ink hover:bg-slate-100')
            }
          >
            Browse
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              'hidden sm:inline text-sm px-3 py-1.5 rounded-md transition-colors ' +
              (isActive
                ? 'text-ink bg-slate-100'
                : 'text-slate-700 hover:text-ink hover:bg-slate-100')
            }
          >
            About
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                'text-sm px-3 py-1.5 rounded-md transition-colors ' +
                (isActive
                  ? 'text-brand bg-brand/10'
                  : 'text-slate-700 hover:text-ink hover:bg-slate-100')
              }
            >
              Admin
            </NavLink>
          )}

          <Link
            to="/submit"
            className="ml-1 inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Submit
          </Link>

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <Link
                to="/me"
                className="hidden sm:inline text-xs text-muted hover:text-brand"
              >
                @{profile?.username ?? '…'}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-slate-700 hover:text-ink px-2 py-1.5 rounded-md hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-1 text-sm text-slate-700 hover:text-ink px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
