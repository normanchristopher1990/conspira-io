import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';

export default function AdminLayout() {
  const { t } = useI18n();
  const tabs = [
    { to: '/admin/theories', label: t.admin.tabs.theories },
    { to: '/admin/takedowns', label: t.admin.tabs.takedowns },
    { to: '/admin/users', label: t.admin.tabs.users },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="pt-6">
        <p className="text-xs font-mono-num uppercase tracking-widest text-muted">
          {t.admin.eyebrow}
        </p>
        <nav className="mt-3 flex items-center gap-1 border-b border-line">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                'relative -mb-px px-4 py-2 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'text-ink border-b-2 border-brand'
                  : 'text-muted hover:text-ink border-b-2 border-transparent')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
