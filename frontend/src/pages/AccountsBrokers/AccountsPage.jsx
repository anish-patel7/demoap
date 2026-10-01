import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { formatINR, formatINRCompact } from '../../utils/formatCurrency';
import { toDDMMYYYY } from '../../utils/formatDate';
import { apiPost, apiPut, apiDelete } from '../../api/client';

export default function AccountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [fundAccount, setFundAccount] = useState(null);
  const [editingTxn, setEditingTxn] = useState(null);
  const [ledgerBroker, setLedgerBroker] = useState('all');
  const { data: accounts, refetch } = useFetch('/accounts', []);
  const { data: ledger, refetch: refetchLedger } = useFetch('/fund-transactions', []);

  const handleSaveAccount = async (formData) => {
    try {
      if (editingAccount) await apiPut(`/accounts/${editingAccount.id}`, formData);
      else await apiPost('/accounts', formData);
      refetch();
      setShowForm(false);
      setEditingAccount(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveTxn = async ({ id, account_id, type, amount, txn_date, notes }) => {
    try {
      if (id) {
        await apiPut(`/fund-transactions/${id}`, { account_id, type, amount: Number(amount), txn_date, notes });
      } else {
        await apiPost('/fund-transactions', { account_id, type, amount: Number(amount), txn_date, notes });
      }
      setFundAccount(null);
      setEditingTxn(null);
      refetch();
      refetchLedger();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteTxn = async (id) => {
    if (!confirm('Delete this ledger entry? Account capital will be adjusted.')) return;
    await apiDelete(`/fund-transactions/${id}`);
    refetch();
    refetchLedger();
  };

  const handleDeleteAccount = async (id) => {
    if (confirm('Delete this account?')) {
      try {
        await apiDelete(`/accounts/${id}`);
        refetch();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  const daysUntil = (date) => {
    if (!date) return null;
    return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const list = accounts || [];
  const totalCapital = list.reduce((s, a) => s + (a.current_capital || 0), 0);
  const masters = list.filter((a) => a.is_master_account);
  const children = list.filter((a) => !a.is_master_account);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Accounts &amp; Brokers</h2>
          <p className="text-on-surface-variant text-body-md">Manage institutional connections and capital allocation across entities.</p>
        </div>
        <div className="flex gap-2">
          <HeaderBtn icon="sync" label="Refresh Feeds" />
          <HeaderBtn icon="currency_exchange" label="Transfer Funds" />
          <HeaderBtn icon="key" label="Update Password Date" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-4 rounded border border-outline-variant border-l-4 border-l-primary">
          <p className="text-on-surface-variant font-mono-label text-[10px] uppercase tracking-wider mb-1">Total Trading Capital</p>
          <p className="text-headline-md font-headline-md text-primary">{formatINR(totalCapital)}</p>
          <p className="text-[11px] text-primary/70 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span> +2.4% vs last month
          </p>
        </div>
        <StatCard label="Connected Brokers" value={list.length} note="Active" />
        <StatCard label="Master Accounts" value={masters.length} note="Primary" />
        <StatCard label="Child Accounts" value={children.length} note="Linked" />
      </div>

      {/* Account Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">grid_view</span>
            Primary Managed Accounts
          </h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded">MASTER ({masters.length})</span>
            <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold rounded">CHILD ({children.length})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              daysUntil={daysUntil}
              onEdit={() => { setEditingAccount(acc); setShowForm(true); }}
              onDelete={() => handleDeleteAccount(acc.id)}
              onFund={() => setFundAccount(acc)}
            />
          ))}

          {/* Add card */}
          <button
            onClick={() => { setEditingAccount(null); setShowForm(true); }}
            className="border-2 border-dashed border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all group min-h-[180px]"
          >
            <span className="material-symbols-outlined text-[32px] mb-2 group-hover:scale-110 transition-transform">add_circle</span>
            <p className="text-body-md font-bold">Add New Broker</p>
            <p className="text-[11px] text-center mt-1">Connect institutional or retail trading APIs</p>
          </button>
        </div>
      </section>

      {/* Detailed matrix */}
      <section className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_tree</span>
            Account Detailed Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 text-[11px] font-mono-label uppercase text-on-surface-variant tracking-wider border-b border-outline-variant">
                <th className="px-4 py-3 font-medium">Relationship</th>
                <th className="px-4 py-3 font-medium">Account Name</th>
                <th className="px-4 py-3 font-medium text-right">Starting Capital</th>
                <th className="px-4 py-3 font-medium text-right">Funds Added/Wdn</th>
                <th className="px-4 py-3 font-medium">Algo Platform</th>
                <th className="px-4 py-3 font-medium">Password Expiry</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-table-data font-table-data">
              {list.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-on-surface-variant">No accounts yet</td></tr>
              )}
              {list.map((a) => {
                const days = daysUntil(a.password_expiry_date);
                return (
                  <tr key={a.id} className="border-b border-outline-variant/30 hover:bg-surface-variant/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${a.is_master_account ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-variant text-on-surface-variant border-outline-variant'}`}>
                        {a.is_master_account ? 'MASTER' : 'CHILD'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface font-bold">{a.account_name}
                      <span className="block text-[10px] text-on-surface-variant font-mono-label uppercase">{a.broker_name}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-on-surface">{formatINR(a.starting_capital)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-primary">+{formatINRCompact(a.funds_added_total || 0)}</span>
                      {' / '}
                      <span className="text-error">-{formatINRCompact(a.funds_withdrawn_total || 0)}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{a.algo_platform || '—'}</td>
                    <td className="px-4 py-3">
                      {days != null ? (
                        <span className={days <= 7 ? 'text-error font-bold' : days <= 30 ? 'text-secondary' : 'text-on-surface-variant'}>
                          {toDDMMYYYY(a.password_expiry_date)} ({days}d)
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => { setEditingAccount(a); setShowForm(true); }} className="p-1 text-on-surface-variant hover:text-on-surface" title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteAccount(a.id)} className="p-1 text-error hover:bg-error/10 rounded" title="Delete">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Demat Ledger (broker-wise deposits & withdrawals) */}
      <DematLedger
        ledger={ledger || []}
        accounts={list}
        brokerFilter={ledgerBroker}
        onBrokerFilter={setLedgerBroker}
        onEdit={setEditingTxn}
        onDelete={handleDeleteTxn}
        onAddFund={() => setFundAccount(list[0] || null)}
      />

      {showForm && (
        <AccountFormModal
          account={editingAccount}
          onSave={handleSaveAccount}
          onCancel={() => { setShowForm(false); setEditingAccount(null); }}
        />
      )}
      {(fundAccount || editingTxn) && (
        <FundModal
          account={fundAccount}
          transaction={editingTxn}
          accounts={list}
          onSave={handleSaveTxn}
          onCancel={() => { setFundAccount(null); setEditingTxn(null); }}
        />
      )}
    </div>
  );
}

function DematLedger({ ledger, accounts, brokerFilter, onBrokerFilter, onEdit, onDelete, onAddFund }) {
  const brokers = [...new Set(accounts.map((a) => a.broker_name))];
  const filtered = brokerFilter === 'all' ? ledger : ledger.filter((t) => t.broker_name === brokerFilter);

  // Running balance per account (chronological), then displayed newest-first.
  const chrono = [...filtered].sort((a, b) => (a.txn_date < b.txn_date ? -1 : a.txn_date > b.txn_date ? 1 : a.id - b.id));
  const balByAccount = {};
  const withBalance = chrono.map((t) => {
    const delta = t.type === 'Add' ? t.amount : -t.amount;
    balByAccount[t.account_id] = (balByAccount[t.account_id] || 0) + delta;
    return { ...t, runningBalance: balByAccount[t.account_id] };
  });
  const display = withBalance.reverse();

  const totalDeposits = filtered.filter((t) => t.type === 'Add').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = filtered.filter((t) => t.type === 'Withdraw').reduce((s, t) => s + t.amount, 0);

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex flex-wrap justify-between items-center gap-3 bg-surface-container">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">receipt_long</span>
          Demat Ledger
          <span className="text-body-sm font-normal text-on-surface-variant">deposits &amp; withdrawals, broker-wise</span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-body-sm">
            <span className="text-primary font-mono-label">▲ {formatINRCompact(totalDeposits)}</span>
            <span className="text-secondary font-mono-label">▼ {formatINRCompact(totalWithdrawals)}</span>
          </div>
          <select value={brokerFilter} onChange={(e) => onBrokerFilter(e.target.value)} className="form-select text-body-sm py-1.5">
            <option value="all">All Brokers</option>
            {brokers.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={onAddFund} className="btn-primary text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add</span> Fund
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50 text-[11px] font-mono-label uppercase text-on-surface-variant tracking-wider border-b border-outline-variant">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Broker</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium text-center">Type</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Running Balance</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium text-center">—</th>
            </tr>
          </thead>
          <tbody className="text-table-data font-table-data">
            {display.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-on-surface-variant">No fund transactions yet. Click <b>Fund</b> to add a deposit or withdrawal.</td></tr>
            )}
            {display.map((t) => (
              <tr key={t.id} className="border-b border-outline-variant/30 hover:bg-surface-variant/20 transition-colors">
                <td className="px-4 py-3 font-mono-label text-on-surface-variant">{t.txn_date}</td>
                <td className="px-4 py-3 text-on-surface-variant">{t.broker_name}</td>
                <td className="px-4 py-3 font-bold text-on-surface">{t.account_name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'Add' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
                    {t.type === 'Add' ? 'DEPOSIT' : 'WITHDRAW'}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-mono-label font-bold ${t.type === 'Add' ? 'text-primary' : 'text-secondary'}`}>
                  {t.type === 'Add' ? '+' : '−'}{formatINR(t.amount)}
                </td>
                <td className="px-4 py-3 text-right font-mono-label text-on-surface">{formatINR(t.runningBalance)}</td>
                <td className="px-4 py-3 text-on-surface-variant text-body-sm">{t.notes || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onEdit(t)} className="p-1 text-primary hover:bg-primary/10 rounded" title="Edit entry">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => onDelete(t.id)} className="p-1 text-error hover:bg-error/10 rounded" title="Delete entry">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FundModal({ account, transaction, accounts, onSave, onCancel }) {
  const [accountId, setAccountId] = useState(transaction?.account_id || account?.id || accounts[0]?.id || '');
  const [type, setType] = useState(transaction?.type || 'Add');
  const [amount, setAmount] = useState(transaction?.amount || '');
  const [txnDate, setTxnDate] = useState(transaction?.txn_date || new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !accountId) return;
    setSaving(true);
    try {
      await onSave({ id: transaction?.id, account_id: Number(accountId), type, amount, txn_date: txnDate, notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl max-w-md w-full border border-outline-variant">
        <div className="bg-surface-container-high border-b border-outline-variant px-6 py-4 flex justify-between items-center">
          <h2 className="text-headline-md font-bold text-on-surface">
            {transaction ? 'Edit Fund Transaction' : 'Fund Transaction'}
          </h2>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-2">Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="form-select w-full">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_name} ({a.broker_name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-2">Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('Add')} className={`flex-1 py-2 rounded text-body-sm font-semibold border ${type === 'Add' ? 'bg-primary/15 border-primary text-primary' : 'border-outline-variant text-on-surface-variant'}`}>Deposit</button>
              <button type="button" onClick={() => setType('Withdraw')} className={`flex-1 py-2 rounded text-body-sm font-semibold border ${type === 'Withdraw' ? 'bg-secondary/15 border-secondary text-secondary' : 'border-outline-variant text-on-surface-variant'}`}>Withdraw</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-2">Amount (₹)</label>
              <input autoFocus type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input w-full" />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-2">Date</label>
              <input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} className="form-input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-2">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Bank transfer ref" className="form-input w-full" />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-outline-variant">
            <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : type === 'Add' ? 'Deposit' : 'Withdraw'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HeaderBtn({ icon, label }) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm rounded border border-outline-variant transition-colors">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ label, value, note }) {
  return (
    <div className="bg-surface-container-low p-4 rounded border border-outline-variant">
      <p className="text-on-surface-variant font-mono-label text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-headline-md font-headline-md text-on-surface">
        {String(value).padStart(2, '0')} <span className="text-body-sm font-normal text-on-surface-variant">{note}</span>
      </p>
    </div>
  );
}

function AccountCard({ account, daysUntil, onEdit, onDelete, onFund }) {
  const isMaster = Boolean(account.is_master_account);
  const riskUsed = Math.min(((account.current_capital && account.starting_capital)
    ? Math.abs(account.risk_limit_pct || 0) : 45), 100);
  const capital = account.current_capital || 0;
  const days = daysUntil(account.password_expiry_date);

  return (
    <div className={`bg-surface-container-high rounded-lg p-5 relative overflow-hidden group transition-all duration-300 ${isMaster ? 'border border-primary/40 hover:border-primary' : 'border border-outline-variant hover:border-outline'}`}>
      {isMaster && (
        <div className="absolute top-0 right-0 p-3">
          <span className="material-symbols-outlined text-primary fill-icon">star</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-surface-variant rounded flex items-center justify-center text-primary font-bold">
          {account.broker_name?.[0]?.toUpperCase() || 'B'}
        </div>
        <div>
          <h4 className="text-body-md font-bold text-on-surface">{account.account_name}</h4>
          <p className="text-[11px] font-mono-label text-on-surface-variant uppercase">BROKER: {account.broker_name}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase font-mono-label">Current Capital</p>
          <p className="text-headline-md font-mono-label text-primary">{formatINR(capital)}</p>
        </div>
        <div className="flex justify-between items-end border-t border-outline-variant pt-3">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-mono-label">Risk Limit</p>
            <div className="w-24 h-1.5 bg-surface-container rounded-full mt-1 overflow-hidden">
              <div className={riskUsed > 80 ? 'h-full bg-secondary' : 'h-full bg-primary'} style={{ width: `${riskUsed}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant uppercase font-mono-label">Status</p>
            <span className={`flex items-center gap-1 text-[11px] font-bold ${account.is_active ? 'text-primary' : 'text-secondary'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${account.is_active ? 'bg-primary animate-pulse' : 'bg-secondary'}`} />
              {account.is_active ? 'Connected' : 'Inactive'}
            </span>
          </div>
        </div>
        {days != null && days <= 30 && (
          <div className="flex items-center gap-2 text-[11px] text-secondary bg-secondary-container/10 border border-secondary/20 rounded px-2 py-1">
            <span className="material-symbols-outlined text-[14px]">key</span>
            Password expires in {days} days
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button onClick={onFund} className="flex-1 text-[11px] py-1.5 bg-primary/10 border border-primary/30 rounded text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> Fund
          </button>
          <button onClick={onEdit} className="flex-1 text-[11px] py-1.5 border border-outline-variant rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors">Edit</button>
          <button onClick={onDelete} className="px-2 text-error hover:bg-error/10 rounded transition-colors" title="Delete">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountFormModal({ account, onSave, onCancel }) {
  const [formData, setFormData] = useState(account || {
    account_name: '', broker_name: '', account_type: 'Trading', purpose: '',
    starting_capital: '', current_capital: '', risk_limit_pct: 5,
    algo_platform: '', is_master_account: true, is_active: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl max-w-lg w-full border border-outline-variant max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-surface-container-high border-b border-outline-variant px-6 py-4 flex justify-between items-center">
          <h2 className="text-headline-lg font-bold text-on-surface">{account ? 'Edit Account' : 'New Account'}</h2>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Account Name" required><input name="account_name" value={formData.account_name} onChange={handleChange} className="form-input w-full" required /></Field>
          <Field label="Broker Name" required><input name="broker_name" value={formData.broker_name} onChange={handleChange} className="form-input w-full" required /></Field>
          <Field label="Account Type">
            <select name="account_type" value={formData.account_type} onChange={handleChange} className="form-select w-full">
              <option>Trading</option><option>Demat</option><option>Investment</option>
            </select>
          </Field>
          <Field label="Purpose"><input name="purpose" value={formData.purpose} onChange={handleChange} className="form-input w-full" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starting Capital"><input type="number" name="starting_capital" value={formData.starting_capital} onChange={handleChange} className="form-input w-full" /></Field>
            <Field label="Current Capital"><input type="number" name="current_capital" value={formData.current_capital} onChange={handleChange} className="form-input w-full" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Risk Limit %"><input type="number" name="risk_limit_pct" value={formData.risk_limit_pct} onChange={handleChange} className="form-input w-full" /></Field>
            <Field label="Algo Platform"><input name="algo_platform" value={formData.algo_platform} onChange={handleChange} className="form-input w-full" /></Field>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-body-sm text-on-surface">
              <input type="checkbox" name="is_master_account" checked={formData.is_master_account} onChange={handleChange} className="w-4 h-4 accent-primary" /> Master Account
            </label>
            <label className="flex items-center gap-2 text-body-sm text-on-surface">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 accent-primary" /> Active
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant">
            <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Save Account</button>
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
