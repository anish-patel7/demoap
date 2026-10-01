import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { apiPost, apiPut } from '../../api/client';
import { formatINR, formatINRCompact } from '../../utils/formatCurrency';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function MonthlyTrackerPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [cell, setCell] = useState(null); // { account, monthIdx }
  const [editingSip, setEditingSip] = useState(false);

  const { data: matrix, refetch } = useFetch(`/fund-transactions/matrix/${year}`, [year]);
  const { data: plan, refetch: refetchPlan } = useFetch('/wealth-plan', []);

  const plannedSip = plan?.monthly_sip ?? 15000;
  const rows = matrix?.rows || [];
  const monthlyTotals = matrix?.monthlyTotals || Array(12).fill(0);
  const grandTotal = matrix?.grandTotal || 0;
  const totalCapital = rows.reduce((s, r) => s + (r.current_capital || 0), 0);

  const handleAdd = async ({ account_id, monthIdx, amount, type }) => {
    const mm = String(monthIdx + 1).padStart(2, '0');
    const txn_date = `${year}-${mm}-15`;
    await apiPost('/fund-transactions', { account_id, type, amount: Number(amount), txn_date, notes: 'Investment tracker' });
    setCell(null);
    refetch();
  };

  const handleSaveSip = async (val) => {
    await apiPut('/wealth-plan', { monthly_sip: Number(val) });
    setEditingSip(false);
    refetchPlan();
  };

  return (
    <div className="p-container-margin flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary material-symbols-outlined">savings</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">Investment Tracker</h2>
          </div>
          <p className="text-on-surface-variant text-body-md">Log actual monthly investments per demat account — each entry updates that account's capital.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)} className="p-2 rounded border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="font-mono-label text-headline-md text-on-surface px-2">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="p-2 rounded border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard label={`INVESTED IN ${year}`} value={formatINR(grandTotal)} tone="primary" icon="trending_up" note="Net deposits this year" />
        <SummaryCard label="TOTAL DEMAT CAPITAL" value={formatINR(totalCapital)} tone="neutral" icon="account_balance" note={`${rows.length} accounts`} />
        {/* Editable planned SIP */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg">
          <p className="text-mono-label text-on-surface-variant mb-1">PLANNED MONTHLY SIP</p>
          {editingSip ? (
            <input
              autoFocus
              defaultValue={plannedSip}
              type="number"
              onBlur={(e) => handleSaveSip(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSip(e.target.value)}
              className="form-input text-headline-lg font-bold w-full py-0"
            />
          ) : (
            <button onClick={() => setEditingSip(true)} className="text-headline-lg font-bold text-on-surface flex items-center gap-2 hover:text-primary">
              {formatINR(plannedSip)}
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
            </button>
          )}
          <p className="text-[11px] font-mono-label text-on-surface-variant mt-2">Editable — not fixed</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex flex-col justify-between">
          <p className="text-mono-label text-primary font-bold">ANNUAL TARGET</p>
          <p className="text-headline-lg font-bold text-primary">{formatINRCompact(plannedSip * 12)}</p>
          <p className="text-[11px] font-mono-label text-on-surface-variant">{formatINR(plannedSip)} × 12 months</p>
        </div>
      </div>

      {/* Accounts × months grid */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left font-table-data">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant h-10">
                <th className="px-4 sticky left-0 z-20 bg-surface-container border-r border-outline-variant font-bold text-on-surface min-w-[170px]">ACCOUNT</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 border-r border-outline-variant/30 font-bold text-on-surface-variant text-center text-[11px] min-w-[76px]">{m}</th>
                ))}
                <th className="px-4 font-bold text-on-surface text-right min-w-[110px]">YEAR TOTAL</th>
                <th className="px-4 font-bold text-primary text-right min-w-[120px]">CAPITAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {rows.length === 0 && (
                <tr><td colSpan={15} className="px-4 py-10 text-center text-on-surface-variant">No accounts. Add accounts first.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.account_id} className="group hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-2 sticky left-0 z-10 bg-surface-container-lowest border-r border-outline-variant group-hover:bg-surface-container-low transition-colors">
                    <div className="font-bold text-on-surface text-[13px]">{r.account_name}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono-label uppercase">{r.broker_name}</div>
                  </td>
                  {r.months.map((val, mi) => (
                    <td
                      key={mi}
                      onClick={() => setCell({ account: r, monthIdx: mi })}
                      className={`px-2 py-2 border-r border-outline-variant/30 text-center cursor-pointer hover:bg-primary/5 ${val > 0 ? 'text-primary font-bold' : val < 0 ? 'text-secondary font-bold' : 'text-on-surface-variant/30'}`}
                      title="Click to add investment"
                    >
                      {val !== 0 ? formatINRCompact(val) : '+'}
                    </td>
                  ))}
                  <td className="px-4 py-2 font-bold text-on-surface text-right bg-surface-container/20">{formatINR(r.total)}</td>
                  <td className="px-4 py-2 font-bold text-primary text-right font-mono-label">{formatINR(r.current_capital)}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container border-t border-outline-variant font-bold">
                  <td className="px-4 py-2 sticky left-0 bg-surface-container border-r border-outline-variant text-on-surface">MONTHLY TOTAL</td>
                  {monthlyTotals.map((v, i) => (
                    <td key={i} className={`px-2 py-2 border-r border-outline-variant/30 text-center text-[11px] ${v > 0 ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {v !== 0 ? formatINRCompact(v) : '—'}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right text-primary">{formatINR(grandTotal)}</td>
                  <td className="px-4 py-2 text-right text-on-surface">{formatINR(totalCapital)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="border-t border-outline-variant bg-surface-container-low px-4 py-2 flex items-center gap-4 text-[11px] font-mono-label">
          <LegendDot color="bg-primary" label="Deposit / Invested" />
          <LegendDot color="bg-secondary" label="Withdrawal" />
          <span className="text-on-surface-variant ml-auto">Click any month cell to log an investment</span>
        </div>
      </div>

      {cell && (
        <AddInvestmentModal
          cell={cell}
          year={year}
          plannedSip={plannedSip}
          onSave={handleAdd}
          onCancel={() => setCell(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone, icon, note }) {
  const color = tone === 'primary' ? 'text-primary' : tone === 'secondary' ? 'text-secondary' : 'text-on-surface';
  const noteColor = tone === 'primary' ? 'text-primary' : 'text-on-surface-variant';
  return (
    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg">
      <p className="text-mono-label text-on-surface-variant mb-1">{label}</p>
      <p className={`text-headline-lg font-bold ${color}`}>{value}</p>
      <div className="flex items-center gap-1 mt-2">
        <span className={`material-symbols-outlined text-sm ${noteColor}`}>{icon}</span>
        <span className={`text-[11px] font-mono-label ${noteColor}`}>{note}</span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-on-surface-variant">{label}</span>
    </div>
  );
}

function AddInvestmentModal({ cell, year, plannedSip, onSave, onCancel }) {
  const [amount, setAmount] = useState(plannedSip);
  const [type, setType] = useState('Add');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await onSave({ account_id: cell.account.account_id, monthIdx: cell.monthIdx, amount, type });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl max-w-sm w-full border border-outline-variant">
        <div className="bg-surface-container-high border-b border-outline-variant px-6 py-4 flex justify-between items-center">
          <h2 className="text-headline-md font-bold text-on-surface">Log Investment</h2>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="bg-surface-container-lowest rounded p-3 text-body-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Account</span><span className="text-on-surface font-bold">{cell.account.account_name}</span></div>
            <div className="flex justify-between mt-1"><span className="text-on-surface-variant">Broker</span><span className="text-on-surface-variant">{cell.account.broker_name}</span></div>
            <div className="flex justify-between mt-1"><span className="text-on-surface-variant">Month</span><span className="text-on-surface font-mono-label">{MONTHS[cell.monthIdx]} {year}</span></div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-2">Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('Add')} className={`flex-1 py-2 rounded text-body-sm font-semibold border ${type === 'Add' ? 'bg-primary/15 border-primary text-primary' : 'border-outline-variant text-on-surface-variant'}`}>Deposit</button>
              <button type="button" onClick={() => setType('Withdraw')} className={`flex-1 py-2 rounded text-body-sm font-semibold border ${type === 'Withdraw' ? 'bg-secondary/15 border-secondary text-secondary' : 'border-outline-variant text-on-surface-variant'}`}>Withdraw</button>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-2">Amount (₹)</label>
            <input autoFocus type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input" />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-outline-variant">
            <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : `${type === 'Add' ? 'Deposit' : 'Withdraw'}`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
