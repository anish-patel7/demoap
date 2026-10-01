import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { downloadBackup, restoreBackup, apiPost } from '../../api/client';

export default function BackupMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', msg }
  const menuRef = useRef(null);
  const fileRef = useRef(null);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDownload() {
    setOpen(false);
    setBusy(true);
    try {
      const name = await downloadBackup();
      showToast('success', `Backup downloaded: ${name}`);
    } catch (err) {
      showToast('error', err.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  }

  function handleRestoreClick() {
    setOpen(false);
    fileRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    const ok = window.confirm(
      `Restore the database from "${file.name}"?\n\n` +
        'This REPLACES all current data. A safety copy of the current ' +
        'database is saved to the backups folder first.'
    );
    if (!ok) return;

    setBusy(true);
    try {
      await restoreBackup(file);
      showToast('success', 'Database restored. Reloading…');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      showToast('error', err.message || 'Restore failed');
      setBusy(false);
    }
  }

  async function handleCleanup() {
    setOpen(false);
    const ok = window.confirm(
      "WARNING: This will permanently delete all trades, accounts, algo scripts, wealth plans, and transactions.\n\n" +
      "Are you sure you want to clean up the website? (This action cannot be undone unless you have a backup)"
    );
    if (!ok) return;

    const doubleCheck = window.confirm(
      "CONFIRM AGAIN:\n" +
      "Do you really want to delete ALL data and reset the database?"
    );
    if (!doubleCheck) return;

    setBusy(true);
    try {
      await apiPost('/backup/cleanup', {});
      showToast('success', 'Database cleared successfully. Reloading…');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      showToast('error', err.message || 'Cleanup failed');
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        title="Backup & Restore"
        className="p-2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined">
          {busy ? 'hourglass_top' : 'backup'}
        </span>
      </button>

      {open && (
        <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-60 bg-surface-container-high border border-outline-variant rounded-lg shadow-xl py-1 z-50">
          <MenuItem icon="download" label="Download Backup (.db)" onClick={handleDownload} />
          <MenuItem
            icon="restore"
            label="Restore from File…"
            onClick={handleRestoreClick}
            danger
          />
          <div className="h-px bg-outline-variant my-1" />
          <MenuItem
            icon="delete_sweep"
            label="Clean Website (DEV)"
            onClick={handleCleanup}
            danger
          />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".db,application/octet-stream"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Portal to <body>: the header's backdrop-filter would otherwise become
          the containing block for this fixed-position toast. */}
      {toast && createPortal(
        <div
          className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] px-4 py-3 rounded-lg shadow-xl text-body-sm sm:max-w-sm break-words ${
            toast.type === 'success'
              ? 'bg-primary text-on-primary'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>,
        document.body
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left transition-colors hover:bg-surface-variant/50 ${
        danger ? 'text-red-500 hover:text-red-400' : 'text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}
