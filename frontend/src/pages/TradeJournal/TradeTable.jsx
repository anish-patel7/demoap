import { formatINRWithDecimal } from '../../utils/formatCurrency';

export default function TradeTable({
  trades,
  selectedIds = [],
  onToggleSelect,
  onToggleAll,
  onEdit,
  onClose,
  onDelete,
}) {
  if (!trades || trades.length === 0) {
    return <div className="text-center py-16 text-on-surface-variant">No trades found</div>;
  }

  const allChecked = trades.length > 0 && selectedIds.length === trades.length;

  return (
    <table className="w-full text-left border-collapse table-fixed">
      <thead className="sticky top-0 z-10 bg-surface-container-high">
        <tr className="border-b border-outline-variant">
          <th className="w-12 p-3 text-center">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => onToggleAll(e.target.checked)}
              className="rounded border-outline bg-transparent text-primary focus:ring-primary w-4 h-4"
            />
          </th>
          <Th className="w-32">DATE</Th>
          <Th className="w-28">TICKER</Th>
          <Th className="w-24 text-center">SIDE</Th>
          <Th className="w-20 text-right">QTY</Th>
          <Th className="w-32 text-right">ENTRY</Th>
          <Th className="w-32 text-right">EXIT</Th>
          <Th className="w-32 text-right">P&L (₹)</Th>
          <Th className="w-24 text-right">ROI (%)</Th>
          <Th className="w-28 text-center">STATUS</Th>
          <Th className="w-24 text-center">RESULT</Th>
          <Th className="w-28 text-center">ACTIONS</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {trades.map((t) => {
          const isOpen = (t.status || '').toUpperCase() === 'OPEN';
          const isLong = ['BUY', 'LONG'].includes((t.direction || '').toUpperCase());
          const pnl = isOpen ? t.unrealized_pnl : t.realized_pnl;
          const pnlColor = pnl > 0 ? 'text-primary-fixed-dim' : pnl < 0 ? 'text-error' : 'text-on-surface-variant';

          return (
            <tr key={t.id} className="text-table-data font-table-data hover:bg-surface-variant/20 transition-colors">
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(t.id)}
                  onChange={() => onToggleSelect(t.id)}
                  className="rounded border-outline bg-transparent text-primary focus:ring-primary w-4 h-4"
                />
              </td>
              <td className="p-3 text-on-surface">
                {t.entry_date} {t.entry_time && <span className="text-on-surface-variant text-[10px]">{t.entry_time}</span>}
              </td>
              <td className="p-3 font-bold text-primary">{t.ticker}</td>
              <td className="p-3 text-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLong ? 'bg-primary-container/20 text-primary' : 'bg-secondary-container/20 text-secondary'}`}>
                  {isLong ? 'BUY' : 'SELL'}
                </span>
              </td>
              <td className="p-3 text-right text-on-surface">{t.quantity}</td>
              <td className="p-3 text-right text-on-surface">{formatINRWithDecimal(t.entry_price)}</td>
              <td className="p-3 text-right text-on-surface">{t.exit_price ? formatINRWithDecimal(t.exit_price) : '—'}</td>
              <td className={`p-3 text-right ${pnlColor}`}>
                {pnl != null && pnl !== 0 ? `${pnl >= 0 ? '+' : ''}${formatINRWithDecimal(pnl)}` : '₹0.00'}
              </td>
              <td className={`p-3 text-right ${pnlColor}`}>
                {t.pnl_pct != null ? `${t.pnl_pct >= 0 ? '+' : ''}${t.pnl_pct.toFixed(2)}%` : '0.00%'}
              </td>
              <td className="p-3 text-center">
                {isOpen ? (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-on-primary font-bold">OPEN</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-surface-variant border border-outline-variant text-on-surface-variant">CLOSED</span>
                )}
              </td>
              <td className="p-3 text-center">
                {t.result === 'WIN' && <span className="text-primary-fixed-dim font-bold">WIN</span>}
                {t.result === 'LOSS' && <span className="text-error font-bold">LOSS</span>}
                {t.result === 'BREAKEVEN' && <span className="text-on-surface-variant">BE</span>}
                {!t.result && <span className="text-on-surface-variant">—</span>}
              </td>
              <td className="p-3">
                <div className="flex gap-1 justify-center">
                  <IconBtn title="Edit" onClick={() => onEdit(t)} icon="edit" className="hover:text-on-surface" />
                  {isOpen && (
                    <IconBtn
                      title="Close"
                      icon="check_circle"
                      className="text-primary hover:bg-primary/10"
                      onClick={() => {
                        const exitPrice = prompt('Exit Price?', t.entry_price);
                        if (exitPrice && !isNaN(parseFloat(exitPrice))) {
                          onClose(t.id, { exit_date: new Date().toISOString().split('T')[0], exit_price: parseFloat(exitPrice) });
                        }
                      }}
                    />
                  )}
                  <IconBtn title="Delete" icon="delete" className="text-error hover:bg-error/10" onClick={() => onDelete(t.id)} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({ children, className = '' }) {
  return <th className={`p-3 text-mono-label font-mono-label text-on-surface-variant ${className}`}>{children}</th>;
}

function IconBtn({ title, icon, onClick, className = '' }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1 rounded text-on-surface-variant transition-colors ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}
