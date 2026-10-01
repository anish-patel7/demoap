import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { formatINR, formatINRCompact } from '../../utils/formatCurrency';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Legend,
} from 'recharts';
import { getChartColors } from '../../utils/chartColors';

export default function AnalyticsPage() {
  const colors = getChartColors();
  const [accountId, setAccountId] = useState('all');
  const { data: accounts } = useFetch('/accounts', []);
  const { data: d, loading } = useFetch(`/dashboard?account_id=${accountId}`, [accountId]);

  if (loading || !d) {
    return <div className="flex items-center justify-center h-96 text-on-surface-variant">Loading analytics…</div>;
  }

  const instrumentData = Object.entries(d.pnlByInstrument || {}).map(([name, pnl]) => ({ name, pnl }));
  const setupData = Object.entries(d.pnlBySetup || {}).map(([name, pnl]) => ({ name, pnl }));
  const winRateData = Object.entries(d.winRateBySetup || {}).map(([name, s]) => ({
    name, wins: s.wins, losses: s.losses, breakeven: s.breakeven || 0, winPct: s.winPct,
  }));
  const pieData = setupData.filter((s) => s.pnl !== 0).map((s) => ({ name: s.name, value: Math.abs(s.pnl) }));

  const kpis = [
    { label: 'Total Trades', value: d.totalTrades },
    { label: 'Win Rate', value: `${d.winPct?.toFixed(1) ?? '—'}%`, color: 'text-primary' },
    { label: 'Profit Factor', value: d.profitFactor?.toFixed(2) ?? '—' },
    { label: 'Expectancy', value: formatINRCompact(d.expectancy) },
    { label: 'Avg Win', value: formatINRCompact(d.avgWin), color: 'text-primary' },
    { label: 'Avg Loss', value: formatINRCompact(d.avgLoss), color: 'text-secondary' },
    { label: 'Max Drawdown', value: d.maxDrawdown?.pct != null ? `-${Math.abs(d.maxDrawdown.pct).toFixed(1)}%` : '—', color: 'text-secondary' },
    { label: 'Net P&L', value: formatINRCompact(d.netReturnAmount), color: (d.netReturnAmount ?? 0) >= 0 ? 'text-primary' : 'text-secondary' },
  ];

  const tip = {
    contentStyle: { backgroundColor: '#171f33', border: `1px solid ${colors.gridLine}`, borderRadius: '4px' },
    labelStyle: { color: colors.text },
  };

  return (
    <div className="p-gutter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-display text-on-surface">Trade Analytics</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Performance breakdown by setup, instrument and outcome</p>
        </div>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="form-select">
          <option value="all">All Accounts</option>
          {accounts?.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
        </select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bento-card p-3 rounded-lg">
            <div className="font-mono-label text-[10px] text-on-surface-variant uppercase">{k.label}</div>
            <div className={`font-headline-md text-headline-md mt-1 ${k.color || 'text-on-surface'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P&L by Instrument */}
        <ChartCard title="P&L by Instrument">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={instrumentData} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={colors.gridLine} horizontal={false} opacity={0.3} />
              <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 10 }} stroke={colors.gridLine} tickFormatter={(v) => formatINRCompact(v)} />
              <YAxis type="category" dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 11 }} stroke={colors.gridLine} width={90} />
              <Tooltip {...tip} formatter={(v) => formatINR(v)} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {instrumentData.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#4edea3' : '#ffb2b7'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* P&L by Setup (pie) */}
        <ChartCard title="P&L Contribution by Setup">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((e, i) => <Cell key={i} fill={colors.categories[i % colors.categories.length]} />)}
              </Pie>
              <Tooltip {...tip} formatter={(v) => formatINR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Win rate by setup (stacked) */}
        <ChartCard title="Wins / Losses by Setup">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={winRateData} margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={colors.gridLine} vertical={false} opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 10 }} stroke={colors.gridLine} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 10 }} stroke={colors.gridLine} allowDecimals={false} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="wins" stackId="a" fill="#4edea3" isAnimationActive={false} />
              <Bar dataKey="losses" stackId="a" fill="#ffb2b7" isAnimationActive={false} />
              <Bar dataKey="breakeven" stackId="a" fill="#86948a" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Equity curve */}
        <ChartCard title="Equity Curve">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={d.equityCurve || []}>
              <defs>
                <linearGradient id="anEq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4edea3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke={colors.gridLine} vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: colors.textSecondary, fontSize: 10 }} stroke={colors.gridLine} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 10 }} stroke={colors.gridLine} tickFormatter={(v) => formatINRCompact(v)} />
              <Tooltip {...tip} formatter={(v) => formatINR(v)} />
              <Area type="monotone" dataKey="cumulativePnl" stroke="#4edea3" strokeWidth={2} fill="url(#anEq)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Setup performance table */}
      <div className="card">
        <div className="card-header"><h3 className="text-headline-md text-on-surface">Setup Performance</h3></div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Setup</th>
                <th className="text-right">Wins</th>
                <th className="text-right">Losses</th>
                <th className="text-right">Win %</th>
                <th className="text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {winRateData.map((s) => {
                const pnl = d.pnlBySetup?.[s.name] ?? 0;
                return (
                  <tr key={s.name}>
                    <td className="font-semibold text-on-surface">{s.name}</td>
                    <td className="text-right font-mono text-primary">{s.wins}</td>
                    <td className="text-right font-mono text-secondary">{s.losses}</td>
                    <td className="text-right font-mono text-on-surface">{s.winPct?.toFixed(0)}%</td>
                    <td className={`text-right font-mono font-bold ${pnl >= 0 ? 'text-primary' : 'text-secondary'}`}>{formatINR(pnl)}</td>
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

function ChartCard({ title, children }) {
  return (
    <div className="card">
      <div className="card-header"><h3 className="text-headline-md text-on-surface">{title}</h3></div>
      {children}
    </div>
  );
}
