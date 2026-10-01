import { useState } from 'react';
import { apiPost, apiDelete } from '../../api/client';

export default function StrategyManagerModal({ setups, onChanged, onClose }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const add = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (setups.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('That strategy already exists');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiPost('/trade-setups', { name: trimmed });
      setName('');
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this strategy?')) return;
    try {
      await apiDelete(`/trade-setups/${id}`);
      onChanged();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar border border-outline-variant">
        <div className="bg-surface-container-high border-b border-outline-variant px-6 py-4 flex justify-between items-center">
          <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            Manage Strategies
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Add new */}
          <form onSubmit={add} className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
              placeholder="New strategy name (e.g. Breakout)"
              className="form-input flex-1 min-w-0"
            />
            <button type="submit" disabled={busy} className="btn-primary whitespace-nowrap">
              <span className="material-symbols-outlined text-[16px] align-middle">add</span> Add
            </button>
          </form>
          {error && <p className="text-secondary text-body-sm">{error}</p>}

          {/* List */}
          <div className="border border-outline-variant rounded-lg divide-y divide-outline-variant/40 max-h-72 overflow-y-auto custom-scrollbar">
            {setups.length === 0 && (
              <p className="text-center py-8 text-on-surface-variant text-body-sm">No strategies yet. Add your first above.</p>
            )}
            {setups.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-variant/20">
                <span className="text-on-surface text-body-md min-w-0 break-words">{s.name}</span>
                <button onClick={() => remove(s.id)} className="p-1 text-error hover:bg-error/10 rounded" title="Delete">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Strategies appear in the trade form and filter dropdowns.
          </p>
        </div>
      </div>
    </div>
  );
}
