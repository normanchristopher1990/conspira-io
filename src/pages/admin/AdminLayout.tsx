import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/admin/theories', label: 'Theory queue' },
  { to: '/admin/takedowns', label: 'Takedowns' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="pt-6">
        <p className="text-xs font-mono-num uppercase tracking-widest text-muted">
          Admin
        </p>
        <nav className="mt-3 flex items-center gap-1 border-b border-line">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                'relative -mb-px px-4 py-2 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'text-ink border-b-2 border-brand'
                  : 'text-muted hover:text-ink border-b-2 border-transparent')
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
