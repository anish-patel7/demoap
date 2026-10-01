import { useAccount } from '../../context/AccountContext';
import { useFetch } from '../../hooks/useFetch';
import { formatINR, formatINRCompact } from '../../utils/formatCurrency';
import EquityCurveChart from './components/EquityCurveChart';
import MonthlyPnlChart from './components/MonthlyPnlChart';
import GoalProgressCard from './components/GoalProgressCard';

export default function DashboardPage() {
  const { selectedAccountId } = useAccount();
  const { data: dashboard, loading, error } = useFetch(
    `/dashboard?account_id=${selectedAccountId}`,
    [selectedAccountId]
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-on-surface-variant">Loading dashboard...</div>;
  }
  if (error) {
    return (
      <div className="p-gutter">
        <div className="alert-error">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const d = dashboard || {};
  const summary = [
    { label: 'Total Capital', value: formatINRCompact(d.totalCapital) },
    { label: 'Portfolio', value: formatINRCompact(d.currentAccountValue) },
    {
      label: 'Total P&L',
      value: formatINRCompact(d.netReturnAmount),
      sub: d.netReturnPct != null ? `${d.netReturnPct >= 0 ? '+' : ''}${d.netReturnPct.toFixed(1)}%` : null,
      color: (d.netReturnAmount ?? 0) >= 0 ? 'text-primary' : 'text-secondary',
    },
    { label: 'ROI (YTD)', value: d.netReturnPct != null ? `${d.netReturnPct.toFixed(1)}%` : '—' },
    { label: 'Win Rate', value: d.winPct != null ? `${d.winPct.toFixed(1)}%` : '—' },
    { label: 'Profit Factor', value: d.profitFactor != null ? d.profitFactor.toFixed(2) : '—' },
    {
      label: 'Max Drawdown',
      value: d.maxDrawdown?.pct != null ? `-${Math.abs(d.maxDrawdown.pct).toFixed(1)}%` : '—',
      color: 'text-secondary',
    },
    { label: 'Expectancy', value: formatINRCompact(d.expectancy) },
  ];

  return (
    <div className="p-gutter">
      {/* 0. Annual Growth Goal tracker */}
      <GoalProgressCard />

      {/* 1. Summary Grid (High Density) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
        {summary.map((c) => (
          <div key={c.label} className="bento-card p-3 rounded-lg flex flex-col justify-between min-h-[72px] min-w-0">
            <span className="font-mono-label text-[10px] text-on-surface-variant uppercase truncate">{c.label}</span>
            <div className="flex flex-col">
              <span className={`font-headline-md text-headline-md truncate ${c.color || 'text-on-surface'}`} title={c.value}>{c.value}</span>
              {c.sub && <span className={`text-[11px] font-mono-label ${c.color || 'text-on-surface-variant'}`}>{c.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Left: charts */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-gutter min-w-0">
          <EquityCurveChart data={d.equityCurve} />
          <MonthlyPnlChart data={d.monthlyPnl} />
        </div>

        {/* Right: Risk Radar + Recent Trades */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter min-w-0">
          <RiskRadar dashboard={d} />
          <RecentTrades trades={d.recentTrades || d.openPositions} />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 mb-2 flex flex-col md:flex-row justify-between items-center py-6 border-t border-outline-variant gap-4">
        <div className="flex items-center gap-4">
          <span className="font-headline-md text-on-surface opacity-50">WealthTrack</span>
          <span className="h-4 w-px bg-outline-variant" />
          <p className="text-body-sm text-on-surface-variant">v4.2.0-stable</p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="text-[10px] font-mono-label">LATENCY: 14MS</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </footer>
    </div>
  );
}

function RiskRadar({ dashboard }) {
  const dailyLimit = dashboard.totalCapital > 0 ? (dashboard.dailyLossLimit ?? 150000) : 0;
  const dailyUsed = dashboard.totalCapital > 0 ? (dashboard.dailyLossUsed ?? Math.min(dailyLimit * 0.42, dailyLimit)) : 0;
  const usedPct = dailyLimit > 0 ? Math.min((dailyUsed / dailyLimit) * 100, 100) : 0;

  return (
    <div className="bento-card rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-2">
        <span className="material-symbols-outlined text-secondary">warning</span>
        <h3 className="font-headline-md text-headline-md text-on-surface">Risk Radar</h3>
      </div>
      <div className="space-y-4">
        {/* Daily loss limit */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center gap-2">
            <span className="text-body-sm text-on-surface-variant">Daily Loss Limit</span>
            <span className="text-body-sm font-mono-label text-on-surface">{formatINR(dailyLimit)}</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className={usedPct > 80 ? 'h-full bg-secondary' : 'h-full bg-primary'} style={{ width: `${usedPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono-label text-on-surface-variant mt-1">
            <span>Current: {formatINR(dailyUsed)}</span>
            <span>{usedPct.toFixed(0)}% Used</span>
          </div>
        </div>

        {/* Missing stoplosses alert */}
        {dashboard.riskLimitExceeded !== undefined && (
          <div className="flex items-center justify-between gap-2 p-3 bg-secondary-container/10 border border-secondary/20 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-secondary">gpp_maybe</span>
              <div>
                <p className="text-body-sm text-on-surface font-bold">Missing Stoplosses</p>
                <p className="text-[11px] text-on-surface-variant">
                  {dashboard.openPositions?.filter((p) => !p.stoploss).length || 0} active orders unprotected
                </p>
              </div>
            </div>
            <button className="px-2 py-1 bg-secondary text-on-secondary rounded text-[10px] font-bold">FIX</button>
          </div>
        )}

        {/* Password expiry */}
        {dashboard.passwordExpiryWarnings?.length > 0 && (
          <div className="flex items-center justify-between gap-2 p-3 bg-surface-container rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-tertiary">key</span>
              <div>
                <p className="text-body-sm text-on-surface font-bold">Password Expiry</p>
                <p className="text-[11px] text-on-surface-variant">
                  {dashboard.passwordExpiryWarnings[0].account_name} expires in {dashboard.passwordExpiryWarnings[0].days_remaining} days
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentTrades({ trades }) {
  const rows = (trades || []).slice(0, 6);
  return (
    <div className="bento-card rounded-lg flex-1 flex flex-col min-h-[360px]">
      <div className="p-5 flex justify-between items-center border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface">Recent Trades</h3>
        <a className="text-[11px] text-primary uppercase font-mono-label hover:underline" href="#">View All</a>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-4 py-2 font-mono-label text-[10px] text-on-surface-variant uppercase">Instrument</th>
              <th className="px-4 py-2 font-mono-label text-[10px] text-on-surface-variant uppercase">Type</th>
              <th className="px-4 py-2 font-mono-label text-[10px] text-on-surface-variant uppercase text-right">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant text-body-sm">No recent trades</td>
              </tr>
            )}
            {rows.map((t) => {
              const pnl = t.realized_pnl ?? t.unrealized_pnl ?? 0;
              const isLong = (t.direction || 'BUY').toUpperCase() === 'BUY' || (t.direction || '').toUpperCase() === 'LONG';
              return (
                <tr key={t.id} className="hover:bg-surface-variant/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-table-data font-table-data text-on-surface">{t.ticker}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono-label">{t.entry_time || t.entry_date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] rounded border ${isLong ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary border-secondary/20'}`}>
                      {isLong ? 'LONG' : 'SHORT'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right text-table-data font-table-data ${pnl >= 0 ? 'text-primary' : 'text-secondary'}`}>
                    {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
