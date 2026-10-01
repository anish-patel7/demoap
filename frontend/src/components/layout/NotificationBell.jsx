import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet } from '../../api/client';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ count: 0, alerts: [] });
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      setData(await apiGet('/notifications'));
    } catch {
      /* leave previous state on failure */
    }
  }, []);

  // Load on mount, then refresh every 10 minutes.
  useEffect(() => {
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function toggle() {
    if (!open) load(); // refresh when opening
    setOpen((v) => !v);
  }

  const { count, alerts } = data;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        title="Notifications"
        className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined">notifications</span>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 max-h-[70vh] overflow-y-auto bg-surface-container-high border border-outline-variant rounded-lg shadow-xl z-50">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <span className="font-bold text-on-surface">Notifications</span>
            {count > 0 && (
              <span className="text-[10px] uppercase font-mono-label text-on-surface-variant">
                {count} active
              </span>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl block mb-1 opacity-60">
                task_alt
              </span>
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {alerts.map((a, i) => (
                <li key={i} className="px-4 py-3 flex gap-3 hover:bg-surface-variant/40">
                  <span
                    className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                      a.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                    }`}
                  >
                    {a.type === 'password_expired' ? 'lock_clock' : 'key'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-on-surface">{a.title}</p>
                    <p className="text-[12px] text-on-surface-variant">{a.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
