import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

export default function BottomNav() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <ul className={isAdmin ? 'grid grid-cols-5' : 'grid grid-cols-4'}>
        <NavItem to="/" end label={t.nav.home} icon={<HomeIcon />} />
        <NavItem to="/search" label={t.nav.search} icon={<SearchIcon />} />
        <NavItem to="/submit" label={t.nav.submit} icon={<PlusIcon />} />
        <NavItem to="/me" label={t.nav.profile} icon={<PersonIcon />} />
        {isAdmin && (
          <NavItem to="/admin" label={t.nav.admin} icon={<ShieldIcon />} />
        )}
      </ul>
    </nav>
  );
}

function NavItem({
  to,
  end,
  label,
  icon,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors min-h-[56px] ' +
          (isActive ? 'text-brand' : 'text-slate-500 hover:text-ink')
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={
                'inline-flex h-6 w-6 items-center justify-center transition-transform ' +
                (isActive ? 'scale-110' : '')
              }
              aria-hidden
            >
              {icon}
            </span>
            <span>{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <path d="M12 3l8 3v6c0 4.5-3.2 8.4-8 9-4.8-.6-8-4.5-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
