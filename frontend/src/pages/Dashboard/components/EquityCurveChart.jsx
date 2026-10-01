import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getChartColors } from '../../../utils/chartColors';

const RANGES = ['1M', '3M', 'YTD', 'MAX'];

export default function EquityCurveChart({ data }) {
  const colors = getChartColors();
  const [range, setRange] = useState('1M');
  const chartData = data && data.length ? data : [];

  return (
    <div className="bento-card rounded-lg p-5 flex flex-col h-[400px]">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Equity Curve</h3>
          <p className="text-body-sm text-on-surface-variant">Growth of cumulative trading capital over time</p>
        </div>
        <div className="flex gap-1 bg-surface-container px-1 py-1 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[11px] font-mono-label rounded transition-colors ${
                range === r ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 min-w-0">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant text-body-sm">No equity data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4edea3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke={colors.gridLine} vertical={false} opacity={0.5} />
              <XAxis dataKey="date" tick={{ fill: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171f33', border: `1px solid ${colors.gridLine}`, borderRadius: '4px', padding: '8px 12px' }}
                labelStyle={{ color: colors.text }}
              />
              <Area type="monotone" dataKey="cumulativePnl" stroke="#4edea3" strokeWidth={2.5} fill="url(#equityGradient)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
