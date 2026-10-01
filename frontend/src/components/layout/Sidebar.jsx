import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProfile, initialsFrom } from '../../context/ProfileContext';
import ProfileModal from './ProfileModal';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/trades', label: 'Trade Journal', icon: 'menu_book' },
  { path: '/planner', label: 'Wealth Planner', icon: 'payments' },
  { path: '/tracker', label: 'Investment Tracker', icon: 'show_chart' },
  { path: '/accounts', label: 'Accounts & Brokers', icon: 'account_balance' },
  { path: '/algo-scripts', label: 'Algo Strategy', icon: 'smart_toy' },
];

export default function Sidebar({ open = false, onClose }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const { profile } = useProfile();
  const [editOpen, setEditOpen] = useState(false);

  // Close the mobile drawer after navigating.
  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  return (
    <>
      {/* Backdrop for the mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`flex flex-col w-[260px] flex-shrink-0 h-screen border-r border-outline-variant bg-surface-container-lowest
          fixed inset-y-0 left-0 z-[70] transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:transform-none lg:transition-none lg:z-50`}
      >
        {/* Brand */}
        <div className="p-6 flex flex-col gap-1">
          <h1 className="font-headline-lg text-headline-lg font-black text-primary">WealthTrack</h1>
          <p className="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest">
            Institutional Grade
          </p>
        </div>

        {/* New Trade CTA */}
        <div className="px-4 mb-4">
          <button className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform hover:brightness-110">
            <span className="material-symbols-outlined">add</span>
            <span className="font-mono-label">New Trade</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1 custom-scrollbar overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 group ${
                  active
                    ? 'text-primary font-bold border-r-2 border-primary bg-surface-variant/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`}
              >
                <span
                  className="material-symbols-outlined group-hover:text-primary"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="font-body-md text-body-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Settings / Support / Profile */}
        <div className="p-4 border-t border-outline-variant space-y-1">
          <button
            onClick={() => setEditOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors text-left"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md text-body-md">Settings</span>
          </button>
          <a
            className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="font-body-md text-body-md">Support</span>
          </a>

          <button
            onClick={() => setEditOpen(true)}
            title="Edit profile"
            className="w-full mt-4 flex items-center gap-3 px-4 py-2 bg-surface-container-high rounded-lg text-left hover:bg-surface-variant/60 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-primary bg-surface-variant flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {initialsFrom(profile.display_name)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-body-md text-on-surface truncate">{profile.display_name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-mono-label truncate">
                {profile.subtitle}
              </p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
              edit
            </span>
          </button>
        </div>
      </aside>

      <ProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
