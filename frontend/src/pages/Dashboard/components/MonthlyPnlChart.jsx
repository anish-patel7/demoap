import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getChartColors } from '../../../utils/chartColors';

export default function MonthlyPnlChart({ data }) {
  const colors = getChartColors();
  const chartData = data
    ? Object.entries(data).slice(0, 12).map(([name, value]) => ({ name: name.substring(0, 3).toUpperCase(), pnl: value }))
    : [];

  return (
    <div className="bento-card rounded-lg p-5 flex flex-col h-[280px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline-md text-headline-md text-on-surface">Monthly Performance</h3>
        <div className="text-body-sm font-mono-label text-on-surface-variant">FY 2023-24</div>
      </div>
      <div className="flex-1">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant text-body-sm">No monthly data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={colors.gridLine} vertical={false} opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ backgroundColor: '#171f33', border: `1px solid ${colors.gridLine}`, borderRadius: '4px', padding: '8px 12px' }}
                labelStyle={{ color: colors.text }}
              />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#4edea3' : '#ffb2b7'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
