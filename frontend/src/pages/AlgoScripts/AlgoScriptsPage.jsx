import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { formatINRCompact } from '../../utils/formatCurrency';
import { apiPost, apiPut, apiDelete } from '../../api/client';

export default function AlgoScriptsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const { data: scripts, refetch } = useFetch('/algo-scripts', []);

  const handleSave = async (formData) => {
    try {
      if (editingScript) await apiPut(`/algo-scripts/${editingScript.id}`, formData);
      else await apiPost('/algo-scripts', formData);
      refetch();
      setShowForm(false);
      setEditingScript(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this script?')) {
      try { await apiDelete(`/algo-scripts/${id}`); refetch(); }
      catch (err) { alert('Error: ' + err.message); }
    }
  };

  const list = scripts || [];
  const active = list.filter((s) => s.is_active !== false);
  const best = [...list].sort((a, b) => (b.backtest_win_rate || 0) - (a.backtest_win_rate || 0))[0];
  const totalPnl = list.reduce((sum, s) => sum + (s.backtest_total_pnl || 0), 0);
  const isPositive = totalPnl >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Stats header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-low p-4 border border-outline-variant rounded-lg">
          <p className="text-on-surface-variant font-mono-label text-mono-label uppercase mb-1">Total Strategies</p>
          <div className="flex items-end gap-2">
            <span className="font-display text-display text-on-surface">{String(list.length).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-4 border border-outline-variant rounded-lg">
          <p className="text-on-surface-variant font-mono-label text-mono-label uppercase mb-1">Active Scripts</p>
          <div className="flex items-end gap-2">
            <span className="font-display text-display text-on-surface">{String(active.length).padStart(2, '0')}</span>
            <span className="text-on-surface-variant text-body-sm mb-2">/ {String(list.length - active.length).padStart(2, '0')} paused</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-4 border border-outline-variant rounded-lg">
          <p className="text-on-surface-variant font-mono-label text-mono-label uppercase mb-1">Best Performer</p>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-primary truncate">{best?.script_name || '—'}</span>
            <span className="text-on-surface-variant text-body-sm">{best?.backtest_win_rate ? `${best.backtest_win_rate.toFixed(1)}% Win Rate` : 'No data'}</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-4 border border-outline-variant rounded-lg">
          <p className="text-on-surface-variant font-mono-label text-mono-label uppercase mb-1">Total Algo P&amp;L</p>
          <div className="flex items-end gap-2">
            <span className={`font-display text-display ${isPositive ? 'text-primary' : 'text-secondary'}`}>
              {totalPnl > 0 ? '+' : ''}{formatINRCompact(totalPnl)}
            </span>
            <span className={`material-symbols-outlined mb-2 ${isPositive ? 'text-primary' : 'text-secondary'}`}>
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-headline-md font-headline-md text-on-surface">Script Inventory</h2>
          <button
            onClick={() => { setEditingScript(null); setShowForm(true); }}
            className="bg-primary px-3 py-1.5 rounded text-on-primary font-bold text-table-data flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add New Script
          </button>
        </div>

        {list.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-12 text-center text-on-surface-variant">
            No strategies yet. Create your first script.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {list.map((s) => (
              <ScriptCard
                key={s.id}
                script={s}
                onEdit={() => { setEditingScript(s); setShowForm(true); }}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ScriptFormModal
          script={editingScript}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingScript(null); }}
        />
      )}
    </div>
  );
}

function ScriptCard({ script, onEdit, onDelete }) {
  const isActive = script.is_active !== false;
  const dd = script.backtest_drawdown;

  return (
    <div className={`bg-surface-container-low rounded-lg p-4 transition-all group cursor-pointer ${isActive ? 'border border-primary/30 hover:border-primary ring-1 ring-primary/5' : 'border border-outline-variant hover:border-on-surface-variant'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-body-lg font-bold text-on-surface group-hover:text-primary transition-colors">{script.script_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-mono-label px-1.5 py-0.5 rounded uppercase tracking-wider ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
              {isActive ? 'Active' : 'Paused'}
            </span>
            <span className="text-on-surface-variant text-mono-label text-[11px]">{script.timeframe} • {script.trade_direction}</span>
          </div>
        </div>
        <span className={`material-symbols-outlined ${isActive ? 'text-primary fill-icon' : 'text-on-surface-variant'}`}>
          {isActive ? 'play_circle' : 'pause_circle'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <MiniStat label="Win Rate" value={script.backtest_win_rate ? `${script.backtest_win_rate.toFixed(1)}%` : '—'} color="text-primary" />
        <MiniStat label="Profit Factor" value={script.backtest_profit_factor ? script.backtest_profit_factor.toFixed(2) : '—'} color="text-on-surface" />
        <MiniStat label="Max DD" value={dd ? `${dd.toFixed(1)}%` : '—'} color="text-secondary" />
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
        <span className="text-on-surface-variant text-body-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-primary">verified</span> Live matching BT
        </span>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-on-surface-variant hover:text-on-surface" title="Edit">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-error hover:bg-error/10 rounded" title="Delete">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="bg-background/50 p-2 rounded">
      <p className="text-on-surface-variant text-[10px] uppercase font-mono-label">{label}</p>
      <p className={`text-table-data font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ScriptFormModal({ script, onSave, onCancel }) {
  const predefinedTimeframes = ['1M', '3M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];
  const initialTimeframeCustom = script?.timeframe && !predefinedTimeframes.includes(script.timeframe);
  
  const [formData, setFormData] = useState(script || {
    script_name: '', trade_direction: 'LONG', timeframe: '5M',
    backtest_win_rate: '', backtest_profit_factor: '', backtest_drawdown: '', is_active: true,
  });
  const [showCustomTimeframe, setShowCustomTimeframe] = useState(initialTimeframeCustom);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      backtest_win_rate: formData.backtest_win_rate ? parseFloat(formData.backtest_win_rate) : null,
      backtest_profit_factor: formData.backtest_profit_factor ? parseFloat(formData.backtest_profit_factor) : null,
      backtest_drawdown: formData.backtest_drawdown ? parseFloat(formData.backtest_drawdown) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl max-w-md w-full border border-outline-variant">
        <div className="bg-surface-container-high border-b border-outline-variant px-6 py-4 flex justify-between items-center">
          <h2 className="text-headline-lg font-bold text-on-surface">{script ? 'Edit Script' : 'New Script'}</h2>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Script Name" required><input name="script_name" value={formData.script_name} onChange={handleChange} className="form-input w-full" required /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Direction">
              <select name="trade_direction" value={formData.trade_direction} onChange={handleChange} className="form-select w-full">
                <option value="LONG">Long</option><option value="SHORT">Short</option><option value="BOTH">Both</option>
              </select>
            </Field>
            <Field label="Timeframe">
              {showCustomTimeframe ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="timeframe"
                    value={formData.timeframe === 'Other' ? '' : formData.timeframe}
                    onChange={handleChange}
                    placeholder="e.g. 2H, 30M"
                    className="form-input w-full"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomTimeframe(false);
                      setFormData(prev => ({ ...prev, timeframe: '5M' }));
                    }}
                    className="px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-body-sm font-semibold hover:bg-surface-container-high transition-colors"
                    title="Select from list"
                  >
                    List
                  </button>
                </div>
              ) : (
                <select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setShowCustomTimeframe(true);
                      setFormData(prev => ({ ...prev, timeframe: '' }));
                    } else {
                      handleChange(e);
                    }
                  }}
                  className="form-select w-full"
                >
                  <option value="1M">1M</option>
                  <option value="3M">3M</option>
                  <option value="5M">5M</option>
                  <option value="15M">15M</option>
                  <option value="30M">30M</option>
                  <option value="1H">1H</option>
                  <option value="4H">4H</option>
                  <option value="1D">1D</option>
                  <option value="1W">1W</option>
                  <option value="Other">Other...</option>
                </select>
              )}
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Win %"><input type="number" name="backtest_win_rate" value={formData.backtest_win_rate} onChange={handleChange} className="form-input w-full" /></Field>
            <Field label="PF"><input type="number" name="backtest_profit_factor" value={formData.backtest_profit_factor} onChange={handleChange} className="form-input w-full" /></Field>
            <Field label="Max DD%"><input type="number" name="backtest_drawdown" value={formData.backtest_drawdown} onChange={handleChange} className="form-input w-full" /></Field>
          </div>
          <label className="flex items-center gap-2 text-body-sm text-on-surface">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 accent-primary" /> Active
          </label>
          <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant">
            <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Save Script</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-body-sm font-medium text-on-surface mb-2">
        {label}{required && <span className="text-secondary ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
