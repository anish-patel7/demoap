import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { formatINR } from '../../utils/formatCurrency';

const PERIODS = [
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('year');
  const [accountId, setAccountId] = useState('all');
  const { data: accounts } = useFetch('/accounts', []);
  const { data: trades } = useFetch(`/trades?account_id=${accountId}`, [accountId]);

  const now = new Date();
  const inPeriod = (t) => {
    const dateStr = t.exit_date || t.entry_date;
    if (!dateStr) return period === 'all';
    const dt = new Date(dateStr);
    if (period === 'month') return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    if (period === 'year') return dt.getFullYear() === now.getFullYear();
    return true;
  };

  const rows = (trades || []).filter(inPeriod);
  const closed = rows.filter((t) => (t.status || '').toUpperCase() === 'CLOSED');

  // Summary
  const netPnl = closed.reduce((s, t) => s + (t.realized_pnl || 0), 0);
  const wins = closed.filter((t) => t.result === 'WIN').length;
  const losses = closed.filter((t) => t.result === 'LOSS').length;
  const winRate = closed.length ? ((wins / closed.length) * 100).toFixed(1) : '0';

  // Group helper
  const groupBy = (key) => {
    const map = {};
    for (const t of closed) {
      const k = t[key] || '—';
      if (!map[k]) map[k] = { name: k, trades: 0, wins: 0, pnl: 0 };
      map[k].trades += 1;
      if (t.result === 'WIN') map[k].wins += 1;
      map[k].pnl += t.realized_pnl || 0;
    }
    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  };
  const bySetup = groupBy('trade_setup');
  const byInstrument = groupBy('instrument_type');

  const exportCsv = (filename, headers, dataRows) => {
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...dataRows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTrades = () =>
    exportCsv(
      `trades_${period}_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Date', 'Ticker', 'Instrument', 'Setup', 'Direction', 'Qty', 'Entry', 'Exit', 'P&L', 'Result', 'Status'],
      rows.map((t) => [
        t.exit_date || t.entry_date, t.ticker, t.instrument_type, t.trade_setup, t.direction,
        t.quantity, t.entry_price, t.exit_price ?? '', t.realized_pnl ?? t.unrealized_pnl ?? '', t.result ?? '', t.status,
      ])
    );

  const exportSummary = () =>
    exportCsv(
      `summary_by_setup_${period}.csv`,
      ['Setup', 'Trades', 'Wins', 'Win %', 'Net P&L'],
      bySetup.map((r) => [r.name, r.trades, r.wins, ((r.wins / r.trades) * 100).toFixed(1), r.pnl])
    );

  return (
    <div className="p-gutter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-display text-on-surface">Reports</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Period summaries and exports</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="form-select">
            <option value="all">All Accounts</option>
            {accounts?.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
          </select>
          <div className="flex bg-surface-container rounded-lg border border-outline-variant p-0.5">
            {PERIODS.map((p) => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded text-body-sm font-semibold transition-colors ${period === p.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Total Trades" value={rows.length} />
        <Stat label="Closed" value={closed.length} />
        <Stat label="Wins" value={wins} color="text-primary" />
        <Stat label="Losses" value={losses} color="text-secondary" />
        <Stat label="Win Rate" value={`${winRate}%`} color="text-primary" />
        <Stat label="Net P&L" value={formatINR(netPnl)} color={netPnl >= 0 ? 'text-primary' : 'text-secondary'} />
      </div>

      {/* Export actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={exportTrades} className="btn-primary text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">download</span> Export Trades CSV
        </button>
        <button onClick={exportSummary} className="btn-outline text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">table_view</span> Export Setup Summary CSV
        </button>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryTable title="By Strategy" rows={bySetup} />
        <SummaryTable title="By Instrument" rows={byInstrument} />
      </div>

      {/* Trade log */}
      <div className="card">
        <div className="card-header"><h3 className="text-headline-md text-on-surface">Trade Log ({period})</h3></div>
        <div className="overflow-x-auto custom-scrollbar max-h-96">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Ticker</th><th>Setup</th><th className="text-center">Dir</th>
                <th className="text-right">P&L</th><th className="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-on-surface-variant">No trades in this period</td></tr>}
              {rows.map((t) => {
                const pnl = t.realized_pnl ?? t.unrealized_pnl ?? 0;
                return (
                  <tr key={t.id}>
                    <td className="font-mono text-on-surface-variant">{t.exit_date || t.entry_date}</td>
                    <td className="font-semibold text-primary">{t.ticker}</td>
                    <td className="text-on-surface-variant">{t.trade_setup || '—'}</td>
                    <td className="text-center">{t.direction}</td>
                    <td className={`text-right font-mono font-bold ${pnl >= 0 ? 'text-primary' : 'text-secondary'}`}>{formatINR(pnl)}</td>
                    <td className="text-center">{t.result || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-on-surface' }) {
  return (
    <div className="bento-card p-3 rounded-lg">
      <div className="font-mono-label text-[10px] text-on-surface-variant uppercase">{label}</div>
      <div className={`font-headline-md text-headline-md mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function SummaryTable({ title, rows }) {
  return (
    <div className="card">
      <div className="card-header"><h3 className="text-headline-md text-on-surface">{title}</h3></div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{title.replace('By ', '')}</th>
              <th className="text-right">Trades</th>
              <th className="text-right">Win %</th>
              <th className="text-right">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-on-surface-variant">No data</td></tr>}
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="font-semibold text-on-surface">{r.name}</td>
                <td className="text-right font-mono text-on-surface">{r.trades}</td>
                <td className="text-right font-mono text-on-surface">{((r.wins / r.trades) * 100).toFixed(0)}%</td>
                <td className={`text-right font-mono font-bold ${r.pnl >= 0 ? 'text-primary' : 'text-secondary'}`}>{formatINR(r.pnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
