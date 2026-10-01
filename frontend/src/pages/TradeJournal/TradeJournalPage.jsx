import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useAccount } from '../../context/AccountContext';
import { apiPost, apiPut, apiPatch, apiDelete, API_BASE, handleResponse } from '../../api/client';
import TradeForm from './TradeForm';
import TradeTable from './TradeTable';
import CsvImportModal from './CsvImportModal';
import StrategyManagerModal from './StrategyManagerModal';

export default function TradeJournalPage() {
  const { selectedAccountId } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [filters, setFilters] = useState({ status: '', setup: '', ticker: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: trades, loading, error, refetch } = useFetch(
    `/trades?account_id=${selectedAccountId}`,
    [selectedAccountId]
  );
  const { data: setups, refetch: refetchSetups } = useFetch('/trade-setups', []);
  const { data: accounts } = useFetch('/accounts', []);

  const norm = (s) => (s || '').toUpperCase();
  const filteredTrades = (trades || []).filter((t) => {
    if (filters.status && norm(t.status) !== filters.status) return false;
    if (filters.setup && t.trade_setup !== filters.setup) return false;
    if (filters.ticker && !t.ticker?.toUpperCase().includes(filters.ticker.toUpperCase())) return false;
    return true;
  });

  const handleSaveTrade = async (tradeData) => {
    try {
      if (editingTrade) await apiPut(`/trades/${editingTrade.id}`, tradeData);
      else await apiPost('/trades', tradeData);
      refetch();
      setShowForm(false);
      setEditingTrade(null);
    } catch (err) {
      alert('Error saving trade: ' + err.message);
    }
  };

  const handleCloseTrade = async (tradeId, exitData) => {
    try {
      await apiPatch(`/trades/${tradeId}/close`, exitData);
      refetch();
    } catch (err) {
      alert('Error closing trade: ' + err.message);
    }
  };

  const handleDeleteTrade = async (tradeId) => {
    if (confirm('Delete this trade?')) {
      try {
        await apiDelete(`/trades/${tradeId}`);
        refetch();
      } catch (err) {
        alert('Error deleting trade: ' + err.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected trades?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => apiDelete(`/trades/${id}`)));
      setSelectedIds([]);
      refetch();
    } catch (err) {
      alert('Error deleting trades: ' + err.message);
    }
  };

  const handleImportCsv = async (csvContent) => {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const response = await fetch(`${API_BASE}/trades/import-csv`, { method: 'POST', body: blob });
      const result = await handleResponse(response);
      alert(`Imported ${result.imported} trades, skipped ${result.skipped}`);
      refetch();
      setShowImportModal(false);
    } catch (err) {
      alert('Error importing CSV: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters & Actions Bar */}
      <section className="p-4 bg-surface-container-low border-b border-outline-variant">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <FilterField label="Ticker">
              <input
                type="text"
                value={filters.ticker}
                onChange={(e) => setFilters({ ...filters, ticker: e.target.value })}
                placeholder="Search ticker"
                className="bg-surface-container-high border border-outline-variant rounded py-1.5 px-3 text-body-sm focus:ring-1 focus:ring-primary h-[34px] w-40 text-on-surface placeholder:text-on-surface-variant"
              />
            </FilterField>
            <FilterField label="Status">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-surface-container-high border border-outline-variant rounded py-1 pl-2 pr-8 text-body-sm focus:ring-1 focus:ring-primary h-[34px] text-on-surface"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </FilterField>
            <FilterField label="Strategy">
              <div className="flex items-center gap-1">
                <select
                  value={filters.setup}
                  onChange={(e) => setFilters({ ...filters, setup: e.target.value })}
                  className="bg-surface-container-high border border-outline-variant rounded py-1 pl-2 pr-8 text-body-sm focus:ring-1 focus:ring-primary h-[34px] text-on-surface"
                >
                  <option value="">Any Strategy</option>
                  {setups?.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowStrategies(true)}
                  title="Manage strategies"
                  className="h-[34px] w-[34px] flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </button>
              </div>
            </FilterField>
            <button
              onClick={() => setFilters({ status: '', setup: '', ticker: '' })}
              className="px-3 py-1.5 text-primary-fixed-dim text-body-sm flex items-center gap-1 hover:bg-primary/10 rounded h-[34px]"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span> Clear
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setEditingTrade(null); setShowForm(true); }}
              className="bg-primary-container text-on-primary-container text-body-sm font-bold px-4 py-2 rounded flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span> Add Trade
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-surface-variant/30 border border-outline-variant text-on-surface-variant text-body-sm px-3 py-2 rounded flex items-center gap-2 hover:bg-surface-variant/50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span> Import
            </button>
            <button
              className="bg-surface-variant/30 border border-outline-variant text-on-surface-variant text-body-sm px-3 py-2 rounded flex items-center gap-2 hover:bg-surface-variant/50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span> Export
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className="text-error border border-error/30 text-body-sm px-3 py-2 rounded flex items-center gap-2 hover:bg-error/10 transition-colors sm:ml-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span> Bulk Delete
              {selectedIds.length > 0 && ` (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-96 text-on-surface-variant">Loading trades...</div>
        ) : error ? (
          <div className="p-6"><div className="alert-error">{error}</div></div>
        ) : (
          <TradeTable
            trades={filteredTrades}
            selectedIds={selectedIds}
            onToggleSelect={(id) =>
              setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
            onToggleAll={(checked) => setSelectedIds(checked ? filteredTrades.map((t) => t.id) : [])}
            onEdit={(trade) => { setEditingTrade(trade); setShowForm(true); }}
            onClose={handleCloseTrade}
            onDelete={handleDeleteTrade}
          />
        )}
      </div>

      {showForm && (
        <TradeFormModal
          trade={editingTrade}
          onSave={handleSaveTrade}
          onCancel={() => { setShowForm(false); setEditingTrade(null); }}
          setups={setups}
          accounts={accounts}
        />
      )}
      {showImportModal && (
        <CsvImportModal onImport={handleImportCsv} onCancel={() => setShowImportModal(false)} />
      )}
      {showStrategies && (
        <StrategyManagerModal
          setups={setups || []}
          onChanged={refetchSetups}
          onClose={() => setShowStrategies(false)}
        />
      )}
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono-label text-[10px] text-on-surface-variant uppercase ml-1">{label}</label>
      {children}
    </div>
  );
}

function TradeFormModal({ trade, onSave, onCancel, setups }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar border border-outline-variant">
        <div className="sticky top-0 z-10 bg-surface-container-high border-b border-outline-variant px-4 sm:px-6 py-4 flex justify-between items-center">
          <h2 className="text-headline-md sm:text-headline-lg font-bold text-on-surface">{trade ? 'Edit Trade' : 'New Trade'}</h2>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <TradeForm initialData={trade} onSubmit={onSave} setups={setups} onCancel={onCancel} />
        </div>
      </div>
    </div>
  );
}
