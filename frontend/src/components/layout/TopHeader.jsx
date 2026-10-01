import { useLocation, Link } from 'react-router-dom';
import BackupMenu from './BackupMenu';
import NotificationBell from './NotificationBell';
import { useProfile, initialsFrom } from '../../context/ProfileContext';

function HeaderTab({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`font-mono-label text-mono-label pb-1 transition-colors ${
        active ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {label}
    </Link>
  );
}

const PAGE_TITLES = {
  '/': 'Portfolio Overview',
  '/trades': 'Journal Overview',
  '/planner': 'Wealth Planner',
  '/tracker': 'Investment Tracker',
  '/accounts': 'Accounts & Brokers',
  '/algo-scripts': 'Algo Strategy',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
};

export default function TopHeader({ onMenuClick }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'WealthTrack';
  const { profile } = useProfile();

  return (
    <header className="flex justify-between items-center gap-2 px-3 sm:px-6 h-row-standard w-full border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-40 flex-shrink-0">
      <div className="flex items-center gap-2 lg:gap-8 min-w-0">
        {/* Mobile/tablet navigation toggle */}
        <button
          type="button"
          onClick={onMenuClick}
          title="Open navigation"
          aria-label="Open navigation"
          className="lg:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="font-headline-md text-headline-md font-bold text-on-surface truncate">{title}</div>
        <nav className="hidden md:flex gap-6 flex-shrink-0">
          <HeaderTab to="/analytics" label="Analytic" active={location.pathname === '/analytics'} />
          <HeaderTab to="/reports" label="Reports" active={location.pathname === '/reports'} />
          <HeaderTab to="/" label="Portfolio" active={!['/analytics', '/reports'].includes(location.pathname)} />
        </nav>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
        {/* Search */}
        <div className="relative group hidden xl:block">
          <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant group-focus-within:text-primary">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            className="bg-surface-container-high border-none text-body-sm pl-10 pr-4 py-1.5 rounded-lg w-56 focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
            placeholder="Search (Ctrl+K)"
            type="text"
          />
        </div>

        {/* Backup & Restore */}
        <BackupMenu />

        {/* Notifications */}
        <NotificationBell />

        <div className="hidden xl:block h-6 w-px bg-outline-variant" />

        {/* Market Live indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-lg border border-outline-variant">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono-label text-[10px] uppercase text-on-surface">Market Live</span>
        </div>

        {/* Avatar */}
        <div
          title={profile.display_name}
          className="w-8 h-8 flex-shrink-0 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary font-bold text-xs"
        >
          {initialsFrom(profile.display_name)}
        </div>
      </div>
    </header>
  );
}
